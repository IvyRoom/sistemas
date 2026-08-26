'use strict';

// Behavioral harness for apps/client-intake/main.js. Run with:
// node --test .agents/tests/formulario.test.js
// The production script is evaluated with its exact shared-origin import bound
// against a small, deterministic DOM.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadBackendOrigin() {
  const moduleSource = fs.readFileSync(
    path.join(__dirname, '..', '..', 'apps', 'shared', 'backend-origin.js'),
    'utf8',
  );
  const executableModuleSource = moduleSource.replace(
    'export const BACKEND_ORIGIN =',
    'globalThis.BACKEND_ORIGIN =',
  );
  assert.notEqual(executableModuleSource, moduleSource, 'Missing BACKEND_ORIGIN export');
  const context = vm.createContext({});
  vm.runInContext(executableModuleSource, context, {
    filename: 'apps/shared/backend-origin.js',
  });
  assert.equal(typeof context.BACKEND_ORIGIN, 'string');
  return context.BACKEND_ORIGIN;
}

const BACKEND_ORIGIN = loadBackendOrigin();
const applicationSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'apps', 'client-intake', 'main.js'),
  'utf8',
);
const backendOriginImport = "import { BACKEND_ORIGIN } from '../shared/backend-origin.js';";
const source = applicationSource.replace(backendOriginImport, '');
assert.notEqual(source, applicationSource, 'Missing exact shared backend-origin import');

const ADDRESS_SUFFIXES = [
  'postal-code',
  'street',
  'number',
  'address-complement',
  'neighborhood',
  'city',
  'state',
];

const PERSON_SUFFIXES = [
  'full-name',
  'cpf',
  'role',
  'area-code',
  'whatsapp',
  'email',
  'email-confirm',
];

function createClassList(initialNames = []) {
  const classes = new Set(initialNames);

  return {
    add(...names) {
      names.forEach((name) => classes.add(name));
    },
    contains(name) {
      return classes.has(name);
    },
    remove(...names) {
      names.forEach((name) => classes.delete(name));
    },
    toggle(name, force) {
      if (force === undefined) {
        if (classes.has(name)) {
          classes.delete(name);
          return false;
        }
        classes.add(name);
        return true;
      }

      if (force) classes.add(name);
      else classes.delete(name);
      return force;
    },
  };
}

function createHarness({
  fetchImplementation = async () => ({ ok: true, json: async () => ({}) }),
  hostname = 'machadogestao.com',
  innerWidth = 1440,
} = {}) {
  const staticElements = new Map();
  const windowListeners = new Map();
  const fetchCalls = [];
  const alerts = [];
  const consoleErrors = [];
  const timeoutCalls = [];
  const clearedTimeouts = [];
  let nextTimeoutId = 1;

  class FakeElement {
    constructor({ classes = [], id = '', kind = '', tagName = 'DIV' } = {}) {
      this._id = id;
      this._innerHTML = '';
      this._kind = kind;
      this._descendants = [];
      this.attributes = new Map();
      this.checked = false;
      this.children = [];
      this.classList = createClassList(classes);
      this.dataset = {};
      this.disabled = false;
      this.firstElementChild = null;
      this.hidden = false;
      this.listeners = new Map();
      this.name = id;
      this.parentElement = null;
      this.tagName = tagName;
      this.textContent = '';
      this.validationMessage = '';
      this.value = '';
    }

    get id() {
      return this._id;
    }

    set id(value) {
      this._id = String(value);
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set innerHTML(value) {
      this._innerHTML = String(value);
      if (this._kind !== 'wrapper') return;

      const match = this._innerHTML.match(/data-participant-index="(\d+)"/);
      this.firstElementChild = createParticipant(match ? Number(match[1]) : 1);
    }

    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }

    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    closest(selector) {
      let current = this;
      while (current) {
        if (selector.startsWith('.') && current.classList.contains(selector.slice(1))) return current;
        current = current.parentElement;
      }
      return null;
    }

    getAttribute(name) {
      if (name === 'id') return this.id || null;
      if (name === 'name') return this.name || null;
      return this.attributes.get(name) ?? null;
    }

    querySelector(selector) {
      return querySelectorAll(this, selector)[0] || null;
    }

    querySelectorAll(selector) {
      return querySelectorAll(this, selector);
    }

    remove() {
      if (!this.parentElement) return;
      const position = this.parentElement.children.indexOf(this);
      if (position !== -1) this.parentElement.children.splice(position, 1);
      this.parentElement = null;
    }

    setAttribute(name, value) {
      const stringValue = String(value);
      if (name === 'id') this.id = stringValue;
      else if (name === 'name') this.name = stringValue;
      else this.attributes.set(name, stringValue);
    }

    setCustomValidity(message) {
      this.validationMessage = String(message);
    }
  }

  function createParticipant(index) {
    const participant = new FakeElement({ classes: ['participant'], kind: 'participant' });
    participant.dataset.participantIndex = String(index);

    const title = new FakeElement({ classes: ['participant-title'], kind: 'participant-title' });
    title.textContent = `Participante ${index}`;
    title.parentElement = participant;

    const fields = PERSON_SUFFIXES.map((suffix) => {
      const field = new FakeElement({
        classes: ['text-input'],
        id: `participant-${index}-${suffix}`,
        kind: 'form-control',
        tagName: 'INPUT',
      });
      field.parentElement = participant;
      return field;
    });

    const warning = new FakeElement({
      classes: ['email-mismatch-warning'],
      id: `participant-${index}-email-warning`,
      kind: 'warning',
      tagName: 'P',
    });
    warning.hidden = true;
    warning.parentElement = participant;

    const deleteButton = new FakeElement({
      classes: ['delete-participant-button'],
      kind: 'delete-participant-button',
      tagName: 'BUTTON',
    });
    deleteButton.parentElement = participant;

    participant._title = title;
    participant._deleteButton = deleteButton;
    participant._descendants = [title, ...fields, warning, deleteButton];
    participant.children = participant._descendants;
    return participant;
  }

  const form = new FakeElement({ classes: ['form'], kind: 'form', tagName: 'FORM' });
  const participantsList = new FakeElement({
    classes: ['participants-list'],
    kind: 'participants-list',
  });
  const participantTemplate = new FakeElement({
    id: 'participant-template',
    kind: 'template',
    tagName: 'TEMPLATE',
  });
  participantTemplate.innerHTML = '<div class="participant" data-participant-index="__INDEX__"></div>';
  const addParticipantButton = new FakeElement({
    classes: ['add-participant-button'],
    kind: 'add-participant-button',
    tagName: 'BUTTON',
  });
  const submitButton = new FakeElement({
    classes: ['submit-button'],
    kind: 'submit-button',
    tagName: 'BUTTON',
  });
  submitButton.textContent = 'Cadastrar Informacoes';

  function registerFormControl(id, { checkbox = false, select = false } = {}) {
    const classes = checkbox ? [] : [select ? 'select-input' : 'text-input'];
    const element = new FakeElement({
      classes,
      id,
      kind: 'form-control',
      tagName: select ? 'SELECT' : 'INPUT',
    });
    staticElements.set(id, element);
    return element;
  }

  registerFormControl('company-legal-name');
  registerFormControl('company-cnpj');
  for (const prefix of ['company', 'shipping']) {
    for (const suffix of ADDRESS_SUFFIXES) {
      registerFormControl(`${prefix}-${suffix}`, { select: suffix === 'state' });
    }
    registerFormControl(`${prefix}-no-number`, { checkbox: true });
  }
  registerFormControl('use-company-address', { checkbox: true });

  for (const prefix of ['legal-rep', 'admin-assistant']) {
    for (const suffix of PERSON_SUFFIXES) registerFormControl(`${prefix}-${suffix}`);
    const warning = new FakeElement({
      classes: ['email-mismatch-warning'],
      id: `${prefix}-email-warning`,
      kind: 'warning',
      tagName: 'P',
    });
    warning.hidden = true;
    staticElements.set(warning.id, warning);
  }

  staticElements.set(participantTemplate.id, participantTemplate);

  function participantDescendants() {
    return participantsList.children.flatMap((participant) => participant._descendants);
  }

  function allFormControls() {
    return [
      ...[...staticElements.values()].filter((element) => element._kind === 'form-control'),
      ...participantDescendants().filter((element) => element._kind === 'form-control'),
    ];
  }

  function querySelectorAll(element, selector) {
    if (element === participantsList) {
      if (selector === '.participant') return [...participantsList.children];
      const suffixMatch = selector.match(/^\[id\$="(.+)"\]$/);
      if (suffixMatch) {
        return participantDescendants().filter((candidate) => candidate.id.endsWith(suffixMatch[1]));
      }
      return [];
    }

    if (element === form) {
      if (selector === 'input') {
        return allFormControls().filter((candidate) => candidate.tagName === 'INPUT');
      }
      if (selector === '.text-input') {
        return allFormControls().filter((candidate) => candidate.classList.contains('text-input'));
      }
      if (selector === '[id$="-cpf"], [id$="-cnpj"]') {
        return allFormControls().filter(
          (candidate) => candidate.id.endsWith('-cpf') || candidate.id.endsWith('-cnpj'),
        );
      }
      return [];
    }

    if (element._kind === 'participant') {
      if (selector === '.participant-title') return [element._title];
      if (selector === '.delete-participant-button') return [element._deleteButton];
      if (selector === '[id]') return element._descendants.filter((candidate) => candidate.id);
      if (selector === '[name]') return element._descendants.filter((candidate) => candidate.name);
      if (selector === '[for]') return [];
    }

    return [];
  }

  function getElementById(id) {
    if (staticElements.has(id)) return staticElements.get(id);
    return participantDescendants().find((element) => element.id === id) || null;
  }

  form.reportValidity = () => allFormControls().every((element) => element.validationMessage === '');

  const initialHref = hostname === 'localhost' || hostname === '127.0.0.1'
    ? `http://${hostname}/clientes/formulario/`
    : `https://${hostname}/clientes/formulario/`;
  const location = { hostname, href: initialHref };
  const window = {
    innerWidth,
    location,
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(listener);
    },
    alert(message) {
      alerts.push(message);
    },
  };

  const document = {
    createElement(tagName) {
      return new FakeElement({ kind: 'wrapper', tagName: tagName.toUpperCase() });
    },
    getElementById,
    querySelector(selector) {
      if (selector === '.form') return form;
      if (selector === '.participants-list') return participantsList;
      if (selector === '.add-participant-button') return addParticipantButton;
      if (selector === '.submit-button') return submitButton;
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  const sandbox = {
    AbortController,
    BACKEND_ORIGIN,
    HTMLElement: FakeElement,
    HTMLInputElement: FakeElement,
    clearTimeout(timeoutId) {
      clearedTimeouts.push(timeoutId);
    },
    console: {
      error(...args) {
        consoleErrors.push(args);
      },
    },
    document,
    fetch(url, options) {
      fetchCalls.push({ options, url });
      return fetchImplementation(url, options);
    },
    location,
    setTimeout(callback, delay) {
      const timeoutId = nextTimeoutId;
      nextTimeoutId += 1;
      timeoutCalls.push({ callback, delay, timeoutId });
      return timeoutId;
    },
    window,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(source, context, { filename: 'apps/client-intake/main.js' });

  function dispatch(target, type, eventTarget = target) {
    let defaultPrevented = false;
    const event = {
      target: eventTarget,
      preventDefault() {
        defaultPrevented = true;
      },
    };
    const results = (target.listeners.get(type) || []).map((listener) => listener(event));
    return {
      event,
      results,
      get defaultPrevented() {
        return defaultPrevented;
      },
    };
  }

  function element(id) {
    const found = getElementById(id);
    assert.ok(found, `Missing harness element #${id}`);
    return found;
  }

  function fillPerson(prefix, {
    areaCode = '41',
    cpf = '529.982.247-25',
    email = `${prefix}@example.com`,
    fullName = 'Pessoa Exemplo',
    role = 'Diretor',
    whatsapp = '99999-9999',
  } = {}) {
    element(`${prefix}-full-name`).value = fullName;
    element(`${prefix}-cpf`).value = cpf;
    element(`${prefix}-role`).value = role;
    element(`${prefix}-area-code`).value = areaCode;
    element(`${prefix}-whatsapp`).value = whatsapp;
    element(`${prefix}-email`).value = email;
    element(`${prefix}-email-confirm`).value = email;
  }

  function fillValidForm() {
    element('company-legal-name').value = 'Empresa Exemplo LTDA';
    element('company-cnpj').value = '11.222.333/0001-81';
    for (const prefix of ['company', 'shipping']) {
      element(`${prefix}-postal-code`).value = '80010-000';
      element(`${prefix}-street`).value = 'R. Exemplo';
      element(`${prefix}-number`).value = '10';
      element(`${prefix}-address-complement`).value = '';
      element(`${prefix}-neighborhood`).value = 'Centro';
      element(`${prefix}-city`).value = 'Curitiba';
      element(`${prefix}-state`).value = 'PR';
    }
    fillPerson('legal-rep', { email: 'legal@example.com' });
    fillPerson('admin-assistant', {
      cpf: '111.444.777-35',
      email: 'admin@example.com',
    });
    fillPerson('participant-1', { email: 'participant-1@example.com' });
  }

  function userSubmit() {
    if (submitButton.disabled) return { suppressed: true };
    return { ...dispatch(form, 'submit'), suppressed: false };
  }

  return {
    addParticipantButton,
    alerts,
    clearedTimeouts,
    consoleErrors,
    context,
    dispatchChange(id) {
      return dispatch(element(id), 'change');
    },
    dispatchFocusout(id) {
      return dispatch(form, 'focusout', element(id));
    },
    dispatchInput(id) {
      return dispatch(form, 'input', element(id));
    },
    dispatchParticipantClick(target) {
      return dispatch(participantsList, 'click', target);
    },
    dispatchResize() {
      for (const listener of windowListeners.get('resize') || []) listener();
    },
    element,
    fetchCalls,
    fillPerson,
    fillValidForm,
    form,
    initialHref,
    participants() {
      return participantsList.querySelectorAll('.participant');
    },
    participantsList,
    submitButton,
    timeoutCalls,
    userSubmit,
    window,
  };
}

async function settleAsyncWork() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test('legacy client-intake cases remain named node:test coverage', async (t) => {
  const harness = createHarness();
  const helpers = vm.runInContext(
    '({ enforceDeviceGate, isValidCpf, isValidCnpj, maskCpf, maskCnpj, maskCep, normalizeStreet, toTitleCase })',
    harness.context,
  );

  const cases = [
    ['device gate destination', () => {
      harness.window.innerWidth = 1024;
      helpers.enforceDeviceGate();
      return harness.window.location.href;
    }, '/plataforma/aviso-dispositivo/'],
    ['CPF valid 529.982.247-25', () => helpers.isValidCpf('529.982.247-25'), true],
    ['CPF valid 111.444.777-35', () => helpers.isValidCpf('111.444.777-35'), true],
    ['CPF invalid check digit', () => helpers.isValidCpf('529.982.247-26'), false],
    ['CPF repeated digits', () => helpers.isValidCpf('111.111.111-11'), false],
    ['CPF too short', () => helpers.isValidCpf('123'), false],
    ['CNPJ valid 11.222.333/0001-81', () => helpers.isValidCnpj('11.222.333/0001-81'), true],
    ['CNPJ valid 33.000.167/0001-01', () => helpers.isValidCnpj('33.000.167/0001-01'), true],
    ['CNPJ invalid check digit', () => helpers.isValidCnpj('11.222.333/0001-82'), false],
    ['CNPJ repeated digits', () => helpers.isValidCnpj('00.000.000/0000-00'), false],
    ['CNPJ alphanumeric valid (Receita example)', () => helpers.isValidCnpj('12.ABC.345/01DE-35'), true],
    ['CNPJ alphanumeric tampered', () => helpers.isValidCnpj('12.ABC.345/01DE-36'), false],
    ['CNPJ letters in check-digit slots', () => helpers.isValidCnpj('12.ABC.345/01DE-AB'), false],
    ['maskCpf', () => helpers.maskCpf('52998224725'), '529.982.247-25'],
    ['maskCnpj numeric', () => helpers.maskCnpj('11222333000181'), '11.222.333/0001-81'],
    ['maskCnpj alphanumeric lowercase', () => helpers.maskCnpj('12abc34501de35'), '12.ABC.345/01DE-35'],
    ['maskCnpj partial', () => helpers.maskCnpj('11222'), '11.222'],
    ['maskCep', () => helpers.maskCep('80010000'), '80010-000'],
    ['normalizeStreet abbreviates', () => helpers.normalizeStreet('rua xv de novembro'), 'R. Xv de Novembro'],
    ['normalizeStreet avenida', () => helpers.normalizeStreet('avenida sete de setembro'), 'Av. Sete de Setembro'],
    ['toTitleCase connectors', () => helpers.toTitleCase('joão da silva'), 'João da Silva'],
  ];

  for (const [name, actual, expected] of cases) {
    await t.test(name, () => assert.equal(actual(), expected));
  }
});

test('device gate redirects at 1024 and leaves the 1025 form available', () => {
  const atBoundary = createHarness({ innerWidth: 1024 });
  assert.equal(atBoundary.window.location.href, '/plataforma/aviso-dispositivo/');

  const aboveBoundary = createHarness({ innerWidth: 1025 });
  assert.equal(aboveBoundary.window.location.href, aboveBoundary.initialHref);

  aboveBoundary.window.innerWidth = 1024;
  aboveBoundary.dispatchResize();
  assert.equal(aboveBoundary.window.location.href, '/plataforma/aviso-dispositivo/');
});

test('localhost, loopback, preview, and production pages use the same production endpoint', async () => {
  const hostnames = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    'feature-preview.azurestaticapps.net',
    'machadogestao.com',
  ];

  for (const hostname of hostnames) {
    const harness = createHarness({ hostname });
    await vm.runInContext('submitForm()', harness.context);
    assert.equal(harness.fetchCalls.length, 1, hostname);
    assert.equal(
      harness.fetchCalls[0].url,
      `${BACKEND_ORIGIN}/clientes/processa-formulario`,
      hostname,
    );
  }
});

test('input and focusout handlers mask, normalize, and validate edited fields', () => {
  const harness = createHarness();
  harness.element('company-cnpj').value = '12abc34501de35';
  harness.element('company-postal-code').value = '80010000';
  harness.element('legal-rep-cpf').value = '52998224726';
  harness.element('legal-rep-whatsapp').value = '999999999';
  harness.element('company-city').value = 'curitiba123';

  for (const id of [
    'company-cnpj',
    'company-postal-code',
    'legal-rep-cpf',
    'legal-rep-whatsapp',
    'company-city',
  ]) {
    harness.dispatchInput(id);
  }

  assert.equal(harness.element('company-cnpj').value, '12.ABC.345/01DE-35');
  assert.equal(harness.element('company-postal-code').value, '80010-000');
  assert.equal(harness.element('legal-rep-cpf').value, '529.982.247-26');
  assert.equal(harness.element('legal-rep-whatsapp').value, '99999-9999');
  assert.equal(harness.element('company-city').value, 'curitiba');

  harness.element('company-legal-name').value = '  ACME   COMERCIO  ';
  harness.element('company-street').value = ' avenida   sete de setembro ';
  harness.element('legal-rep-full-name').value = '  ana   da silva ';
  harness.element('legal-rep-role').value = '  CEO   de vendas ';
  harness.element('legal-rep-email').value = ' ANA @EXAMPLE.COM ';
  harness.element('legal-rep-email-confirm').value = 'outra@example.com';

  for (const id of [
    'company-legal-name',
    'company-street',
    'legal-rep-full-name',
    'legal-rep-role',
    'legal-rep-email',
    'legal-rep-email-confirm',
    'legal-rep-cpf',
  ]) {
    harness.dispatchFocusout(id);
  }

  assert.equal(harness.element('company-legal-name').value, 'ACME COMERCIO');
  assert.equal(harness.element('company-street').value, 'Av. Sete de Setembro');
  assert.equal(harness.element('legal-rep-full-name').value, 'Ana da Silva');
  assert.equal(harness.element('legal-rep-role').value, 'CEO de Vendas');
  assert.equal(harness.element('legal-rep-email').value, 'ana@example.com');
  assert.equal(harness.element('legal-rep-email-confirm').validationMessage, 'E-mails diferentes.');
  assert.equal(harness.element('legal-rep-email-warning').hidden, false);
  assert.match(harness.element('legal-rep-cpf').validationMessage, /^CPF/);

  harness.element('legal-rep-email-confirm').value = 'ana@example.com';
  harness.dispatchInput('legal-rep-email-confirm');
  assert.equal(harness.element('legal-rep-email-confirm').validationMessage, '');
  assert.equal(harness.element('legal-rep-email-warning').hidden, true);
});

test('company-address controls copy, follow, clear, and restore shipping fields', () => {
  const harness = createHarness();
  const companyValues = {
    'postal-code': '80010-000',
    street: 'R. Inicial',
    number: '42',
    'address-complement': 'Sala 3',
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
  };

  for (const [suffix, value] of Object.entries(companyValues)) {
    harness.element(`company-${suffix}`).value = value;
  }

  harness.element('shipping-no-number').checked = true;
  harness.element('use-company-address').checked = true;
  harness.dispatchChange('use-company-address');

  for (const [suffix, value] of Object.entries(companyValues)) {
    assert.equal(harness.element(`shipping-${suffix}`).value, value, suffix);
    assert.equal(harness.element(`shipping-${suffix}`).disabled, true, suffix);
  }
  assert.equal(harness.element('shipping-no-number').checked, false);
  assert.equal(harness.element('shipping-no-number').disabled, true);

  harness.element('company-street').value = 'avenida nova';
  harness.dispatchInput('company-street');
  assert.equal(harness.element('shipping-street').value, 'avenida nova');

  harness.element('use-company-address').checked = false;
  harness.dispatchChange('use-company-address');
  for (const suffix of ADDRESS_SUFFIXES) {
    assert.equal(harness.element(`shipping-${suffix}`).value, '', suffix);
    assert.equal(harness.element(`shipping-${suffix}`).disabled, false, suffix);
  }
  assert.equal(harness.element('shipping-no-number').disabled, false);

  harness.element('company-number').value = '42';
  harness.element('company-no-number').checked = true;
  harness.dispatchChange('company-no-number');
  assert.equal(harness.element('company-number').value, 'S/N');
  assert.equal(harness.element('company-number').disabled, true);

  harness.element('company-no-number').checked = false;
  harness.dispatchChange('company-no-number');
  assert.equal(harness.element('company-number').value, '');
  assert.equal(harness.element('company-number').disabled, false);
});

test('participants add, delete, renumber, and stop at the supported maximum', () => {
  const harness = createHarness();
  assert.equal(harness.participants().length, 1);
  assert.equal(harness.participants()[0]._deleteButton.hidden, true);

  harness.addParticipantButton.listeners.get('click')[0]();
  assert.equal(harness.participants().length, 2);
  assert.equal(harness.participants()[0]._deleteButton.hidden, false);
  assert.equal(harness.participants()[1]._deleteButton.hidden, false);

  const originalSecond = harness.participants()[1];
  originalSecond.querySelector('[id]').value = 'preserved';
  harness.dispatchParticipantClick(harness.participants()[0]._deleteButton);

  assert.equal(harness.participants().length, 1);
  assert.equal(harness.participants()[0], originalSecond);
  assert.equal(originalSecond.dataset.participantIndex, '1');
  assert.equal(originalSecond._title.textContent, 'Participante 1');
  assert.ok(originalSecond.querySelectorAll('[id]').every((element) => !element.id.startsWith('participant-2-')));
  assert.ok(originalSecond.querySelectorAll('[name]').every((element) => !element.name.startsWith('participant-2-')));
  assert.equal(originalSecond._deleteButton.hidden, true);

  harness.dispatchParticipantClick(originalSecond._deleteButton);
  assert.equal(harness.participants().length, 1);

  while (harness.participants().length < 25) harness.addParticipantButton.listeners.get('click')[0]();
  assert.equal(harness.participants().length, 25);
  assert.equal(harness.addParticipantButton.disabled, true);
  harness.addParticipantButton.listeners.get('click')[0]();
  assert.equal(harness.participants().length, 25);
});

test('normalized submission keeps the exact nested company, address, person, and participant payload', async () => {
  const harness = createHarness();
  harness.element('company-legal-name').value = '  ACME   LTDA  ';
  harness.element('company-cnpj').value = '11222333000181';
  harness.dispatchInput('company-cnpj');

  const companyValues = {
    'postal-code': '80010000',
    street: ' avenida   sete de setembro ',
    number: '42',
    'address-complement': ' sala   azul ',
    neighborhood: ' centro ',
    city: ' curitiba2 ',
    state: 'PR',
  };
  for (const [suffix, value] of Object.entries(companyValues)) {
    harness.element(`company-${suffix}`).value = value;
  }
  harness.dispatchInput('company-postal-code');
  harness.dispatchInput('company-city');
  harness.element('use-company-address').checked = true;
  harness.dispatchChange('use-company-address');

  harness.fillPerson('legal-rep', {
    cpf: '52998224725',
    email: ' ANA@EXAMPLE.COM ',
    fullName: '  ana   da silva ',
    role: ' CEO de vendas ',
    whatsapp: '999999999',
  });
  harness.fillPerson('admin-assistant', {
    cpf: '11144477735',
    email: ' FINANCEIRO@EXAMPLE.COM ',
    fullName: '  bia   dos santos ',
    role: ' CFO ',
    whatsapp: '988887777',
  });
  for (const prefix of ['legal-rep', 'admin-assistant']) {
    for (const suffix of ['cpf', 'area-code', 'whatsapp']) harness.dispatchInput(`${prefix}-${suffix}`);
  }

  harness.fillPerson('participant-1', {
    cpf: '52998224725',
    email: ' BRUNO@EXAMPLE.COM ',
    fullName: '  bruno   dos santos ',
    role: ' CEO ',
    whatsapp: '977776666',
  });
  harness.addParticipantButton.listeners.get('click')[0]();
  harness.fillPerson('participant-2', {
    cpf: '11144477735',
    email: ' CARLA@EXAMPLE.COM ',
    fullName: '  carla   de souza ',
    role: ' COO ',
    whatsapp: '966665555',
  });
  for (const index of [1, 2]) {
    for (const suffix of ['cpf', 'area-code', 'whatsapp']) {
      harness.dispatchInput(`participant-${index}-${suffix}`);
    }
  }

  const submission = harness.userSubmit();
  assert.equal(submission.suppressed, false);
  assert.equal(submission.defaultPrevented, true);
  await settleAsyncWork();

  assert.equal(harness.fetchCalls.length, 1);
  assert.deepEqual(JSON.parse(harness.fetchCalls[0].options.body), {
    company: {
      legalName: 'ACME LTDA',
      cnpj: '11.222.333/0001-81',
      address: {
        postalCode: '80010-000',
        street: 'Av. Sete de Setembro',
        number: '42',
        complement: 'Sala Azul',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
      },
    },
    shippingAddress: {
      useCompanyAddress: true,
      postalCode: '80010-000',
      street: 'Av. Sete de Setembro',
      number: '42',
      complement: 'Sala Azul',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
    },
    legalRepresentative: {
      fullName: 'Ana da Silva',
      cpf: '529.982.247-25',
      role: 'CEO de Vendas',
      areaCode: '41',
      whatsapp: '99999-9999',
      email: 'ana@example.com',
    },
    adminAssistant: {
      fullName: 'Bia dos Santos',
      cpf: '111.444.777-35',
      role: 'CFO',
      areaCode: '41',
      whatsapp: '98888-7777',
      email: 'financeiro@example.com',
    },
    participants: [
      {
        fullName: 'Bruno dos Santos',
        cpf: '529.982.247-25',
        role: 'CEO',
        areaCode: '41',
        whatsapp: '97777-6666',
        email: 'bruno@example.com',
      },
      {
        fullName: 'Carla de Souza',
        cpf: '111.444.777-35',
        role: 'COO',
        areaCode: '41',
        whatsapp: '96666-5555',
        email: 'carla@example.com',
      },
    ],
  });
});

test('email mismatches and duplicate participant CPF and email values block submission', () => {
  const mismatched = createHarness();
  mismatched.fillValidForm();
  mismatched.element('admin-assistant-email-confirm').value = 'different@example.com';
  const mismatchSubmission = mismatched.userSubmit();

  assert.equal(mismatchSubmission.defaultPrevented, true);
  assert.equal(mismatched.fetchCalls.length, 0);
  assert.equal(mismatched.element('admin-assistant-email-confirm').validationMessage, 'E-mails diferentes.');
  assert.equal(mismatched.element('admin-assistant-email-warning').hidden, false);

  const duplicated = createHarness();
  duplicated.fillValidForm();
  duplicated.addParticipantButton.listeners.get('click')[0]();
  duplicated.fillPerson('participant-2', {
    cpf: '529.982.247-25',
    email: ' PARTICIPANT-1@EXAMPLE.COM ',
  });
  const duplicateSubmission = duplicated.userSubmit();

  assert.equal(duplicateSubmission.defaultPrevented, true);
  assert.equal(duplicated.fetchCalls.length, 0);
  assert.equal(
    duplicated.element('participant-2-cpf').validationMessage,
    'CPF repetido em outro participante.',
  );
  assert.equal(
    duplicated.element('participant-2-email').validationMessage,
    'E-mail repetido em outro participante.',
  );
});

test('pending submission disables its initiating control and prevents a duplicate user submit', async () => {
  let resolveFetch;
  const harness = createHarness({
    fetchImplementation: () => new Promise((resolve) => {
      resolveFetch = resolve;
    }),
  });
  harness.fillValidForm();

  const firstSubmission = harness.userSubmit();
  const duplicateSubmission = harness.userSubmit();

  assert.equal(firstSubmission.defaultPrevented, true);
  assert.equal(duplicateSubmission.suppressed, true);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.submitButton.disabled, true);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'true');
  assert.equal(harness.form.classList.contains('is-submitting'), true);
  assert.equal(harness.submitButton.classList.contains('is-submitting'), true);

  resolveFetch({ ok: true, json: async () => ({}) });
  await settleAsyncWork();
  assert.equal(harness.form.classList.contains('form--submitted'), true);
});

test('60-second timeout aborts the request and restores the completed form', async () => {
  const harness = createHarness({
    fetchImplementation: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    }),
  });
  harness.fillValidForm();
  const originalLabel = harness.submitButton.textContent;

  const submission = harness.userSubmit();
  assert.equal(submission.defaultPrevented, true);
  assert.equal(harness.timeoutCalls.length, 1);
  assert.equal(harness.timeoutCalls[0].delay, 60000);

  harness.timeoutCalls[0].callback();
  await settleAsyncWork();

  assert.equal(harness.fetchCalls[0].options.signal.aborted, true);
  assert.equal(harness.submitButton.disabled, false);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'false');
  assert.equal(harness.submitButton.textContent, originalLabel);
  assert.equal(harness.form.classList.contains('is-submitting'), false);
  assert.equal(harness.form.classList.contains('form--submitted'), false);
  assert.equal(harness.consoleErrors.length, 1);
  assert.match(harness.alerts[0], /^Erro_000:/);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test('known server errors restore controls and preserve normalized user data', async () => {
  const harness = createHarness({
    fetchImplementation: async () => ({
      ok: false,
      json: async () => ({ error: 'Erro_013' }),
    }),
  });
  harness.fillValidForm();
  harness.element('company-legal-name').value = 'Empresa Preservada';
  const payloadBefore = JSON.parse(
    vm.runInContext('JSON.stringify(collectFormData())', harness.context),
  );
  const originalLabel = harness.submitButton.textContent;

  const submission = harness.userSubmit();
  assert.equal(submission.defaultPrevented, true);
  await settleAsyncWork();

  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.submitButton.disabled, false);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'false');
  assert.equal(harness.submitButton.textContent, originalLabel);
  assert.equal(harness.submitButton.classList.contains('is-submitting'), false);
  assert.equal(harness.form.classList.contains('is-submitting'), false);
  assert.equal(harness.form.classList.contains('form--submitted'), false);
  const payloadAfter = JSON.parse(
    vm.runInContext('JSON.stringify(collectFormData())', harness.context),
  );
  assert.deepEqual(payloadAfter, payloadBefore);
  assert.equal(harness.consoleErrors.length, 1);
  assert.match(harness.alerts[0], /^Erro_013:/);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test('accepted submission enters the submitted state and remains locked against resubmission', async () => {
  const harness = createHarness();
  harness.fillValidForm();

  const submission = harness.userSubmit();
  assert.equal(submission.defaultPrevented, true);
  await settleAsyncWork();

  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.alerts.length, 0);
  assert.equal(harness.form.classList.contains('is-submitting'), false);
  assert.equal(harness.form.classList.contains('form--submitted'), true);
  assert.equal(harness.submitButton.disabled, true);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'true');
  assert.equal(harness.submitButton.classList.contains('is-submitting'), true);
  assert.match(harness.submitButton.textContent, /^Enviando/);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
  assert.equal(harness.userSubmit().suppressed, true);
  assert.equal(harness.fetchCalls.length, 1);
});
