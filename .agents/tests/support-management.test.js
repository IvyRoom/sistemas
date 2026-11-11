'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const CARD_REVISION = 'a'.repeat(64);

function loadClient(transport = async () => ({ ok: true, json: async () => ({}) })) {
  const values = new Map();
  const source = fs.readFileSync(path.join(__dirname, '../../apps/support-management/modules/client.js'), 'utf8');
  const context = vm.createContext({ AbortSignal, fetch: transport, sessionStorage: {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  } });
  vm.runInContext(source.replace(/export /g, '') + '\nglobalThis.api = { createSupportClient, tokenizeCard, submitCompanyCard };', context);
  return { ...context.api, values };
}

const testCard = { holderName: ' TEST HOLDER ', number: '4000 0000 0000 0010', expMonth: '12', expYear: '2030', cvv: '123', secret: 'excluded' };

test('card data goes directly to Pagar.me without a bearer or secret key', async () => {
  const requests = [];
  const { tokenizeCard } = loadClient();
  const token = await tokenizeCard('pk_test_example', testCard, async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ id: 'token_example' }) };
  });
  assert.equal(token, 'token_example');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.pagar.me/core/v5/tokens?appId=pk_test_example');
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].options.headers)), { 'Content-Type': 'application/json' });
  assert.equal(requests[0].options.credentials, 'omit');
  assert.deepEqual(JSON.parse(requests[0].options.body), { type: 'card', card: {
    holder_name: 'TEST HOLDER', number: '4000000000000010', exp_month: 12, exp_year: 2030, cvv: '123'
  } });
});

test('production or malformed keys prevent all card network requests', async () => {
  const { tokenizeCard } = loadClient();
  for (const key of ['pk_live_example', 'sk_test_example', '', 'pk_test_x&other=value']) {
    await assert.rejects(tokenizeCard(key, testCard, () => { throw new Error('network should not be called'); }), /sandbox_unavailable/);
  }
});

test('only the token reaches the company backend, followed by clearing', async () => {
  const calls = [];
  const { createSupportClient, submitCompanyCard, values } = loadClient(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ card: { brand: 'Visa', lastFour: '0010' } }) };
  });
  values.set('supportManagementToken', 'session-example');
  let cleared = 0;
  const address = { line_1: '123, Test, Centro', zip_code: '01001000', city: 'Test', state: 'SP', country: 'BR' };
  await submitCompanyCard({ publicKey: 'pk_test_example', card: testCard, billingAddress: address,
    client: createSupportClient(),
    transport: async () => ({ ok: true, json: async () => ({ id: 'token_example' }) }),
    clear: () => { cleared++; }
  });
  assert.equal(cleared, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/support-management/api/card');
  assert.equal(calls[0].options.method, 'PUT');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer session-example');
  assert.deepEqual(JSON.parse(calls[0].options.body), { token: 'token_example' });
  assert.deepEqual([...values.entries()], [['supportManagementToken', 'session-example']]);
});

test('card form clears on tokenization rejection, malformed response, and backend failure', async () => {
  for (const failure of ['tokenization', 'malformed', 'backend']) {
    const { submitCompanyCard } = loadClient();
    let cleared = 0;
    let backendCalls = 0;
    await assert.rejects(submitCompanyCard({
      publicKey: 'pk_test_example', card: testCard, billingAddress: {},
      transport: async () => ({ ok: failure !== 'tokenization', json: async () => ({ id: failure === 'malformed' ? 'bad' : 'token_example' }) }),
      client: { saveCard: async () => { backendCalls++; throw new Error('backend unavailable'); } },
      clear: () => { cleared++; }
    }));
    assert.equal(cleared, 1, failure);
    assert.equal(backendCalls, failure === 'backend' ? 1 : 0, failure);
  }
});

test('expired sessions clear locally and failed logout also clears the session', async () => {
  const { createSupportClient, values } = loadClient(async () => ({ ok: false, status: 401 }));
  const client = createSupportClient();
  values.set('supportManagementToken', 'expired');
  await assert.rejects(client.session(), (error) => error.status === 401);
  assert.equal(values.size, 0);
  values.set('supportManagementToken', 'expired');
  await assert.rejects(client.logout());
  assert.equal(values.size, 0);
});

for (const outcome of [204, 401, 503, 'network']) {
  test(`logout clears local credentials before its request and preserves a new login after late ${outcome}`, async () => {
    let finish;
    const requests = [];
    const revocation = new Promise((resolve, reject) => {
      finish = () => outcome === 'network' ? reject(new Error('synthetic network failure'))
        : resolve({ ok: outcome === 204, status: outcome,
          json: async () => ({ error: outcome === 401 ? 'support_management.session_expired' : 'support_management.session_unavailable' }) });
    });
    const { createSupportClient, values } = loadClient(async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith('/logout')) return revocation;
      assert.ok(url.endsWith('/login'));
      return { ok: true, json: async () => ({ token: 'replacement-session', expiresAt: Date.now() + 60000,
        user: { name: 'Replacement', role: 'Usuário' }, config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' } }) };
    });
    values.set('supportManagementToken', 'previous-session');
    values.set('supportManagementContext', 'previous-context');
    const client = createSupportClient();
    const logout = client.logout().then(() => null, error => error);
    assert.equal(values.size, 0, 'Local logout cannot wait for remote revocation');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/support-management/api/logout');
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer previous-session');
    assert.equal(requests[0].options.keepalive, true);
    assert.equal(requests[0].options.credentials, 'omit');
    assert.equal(requests[0].options.cache, 'no-store');
    assert.equal(requests[0].options.body, undefined);
    await client.login('replacement@example.test', 'synthetic-password');
    const replacement = [...values.entries()];
    assert.ok(values.has('supportManagementContext'));
    finish();
    const error = await logout;
    if (outcome === 204) assert.equal(error, null);
    else if (typeof outcome === 'number') {
      assert.equal(error.status, outcome);
      assert.equal(error.code, outcome === 401 ? 'support_management.session_expired' : 'support_management.session_unavailable');
    } else assert.match(error.message, /synthetic network failure/u);
    assert.deepEqual([...values.entries()], replacement, 'Old logout settlement must never clear the replacement session');
  });
}

test('logout without a local token clears stale context without sending a revocation request', async () => {
  const { createSupportClient, values } = loadClient(() => { throw new Error('Unexpected request'); });
  values.set('supportManagementContext', 'stale-context');
  await createSupportClient().logout();
  assert.equal(values.size, 0);
});

test('configuration fails closed unless both environment and public key are test-only', async () => {
  for (const config of [{ environment: 'production', publicKey: 'pk_test_example' }, { environment: 'sandbox', publicKey: 'pk_live_example' }]) {
    const { createSupportClient } = loadClient(async () => ({ ok: true, json: async () => config }));
    await assert.rejects(createSupportClient().config(), /sandbox_unavailable/);
  }
});

test('workbook synchronization sends only the current authorization to its dedicated route', async () => {
  const calls = [];
  const { createSupportClient, values } = loadClient(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ card: { lastFour: '0010' } }) };
  });
  values.set('supportManagementToken', 'session-example');
  await createSupportClient().syncCard();
  assert.equal(calls[0].url, '/support-management/api/card/sync');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer session-example');
  assert.equal(calls[0].options.body, undefined);
});

test('card deletion sends only authorization and its opaque expected revision and discards stale card/calendar context', async () => {
  for (const accepted of [true, false]) {
    const requests = [];
    const { createSupportClient, values } = loadClient(async (url, options) => {
      requests.push({ url, options });
      return { ok: accepted, status: accepted ? 200 : 503,
        json: async () => accepted ? { card: null } : { error: 'support_management.card_delete_failed' } };
    });
    values.set('supportManagementToken', 'session-example');
    values.set('supportManagementContext', 'old-card-and-calendar-context');
    const deletion = createSupportClient().deleteCard(CARD_REVISION);
    if (accepted) assert.equal((await deletion).card, null);
    else await assert.rejects(deletion, error => error.code === 'support_management.card_delete_failed');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/support-management/api/card');
    assert.equal(requests[0].options.method, 'DELETE');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer session-example');
    assert.deepEqual(JSON.parse(requests[0].options.body), { expectedCardRevision: CARD_REVISION });
    assert.equal(values.has('supportManagementContext'), false);
    assert.equal(values.get('supportManagementToken'), 'session-example');
  }
});

test('a missing or malformed card revision prevents deletion HTTP requests', async () => {
  let requests = 0;
  const { createSupportClient } = loadClient(async () => { requests++; throw new Error('Unexpected request'); });
  for (const revision of [undefined, null, '', 'card_private', 'a'.repeat(63), 'A'.repeat(64)]) {
    await assert.rejects(createSupportClient().deleteCard(revision), /card_revision_required/u);
  }
  assert.equal(requests, 0);
});

test('calendar reads and date reservations use the current session and send only the selected quote and request ID', async () => {
  const calls = [];
  const { createSupportClient, values } = loadClient(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({}) };
  });
  values.set('supportManagementToken', 'session-example');
  const client = createSupportClient();
  await client.calendar();
  const reservation = { date: '2026-11-10', priceCents: 50000, requestId: '00000000-0000-4000-8000-000000000001' };
  await client.reserveDate(reservation);
  assert.equal(calls[0].url, '/support-management/api/calendar');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].options.body, undefined);
  assert.equal(calls[1].url, '/support-management/api/reservations');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), reservation);
  assert.ok(calls.every(({ options }) => options.headers.Authorization === 'Bearer session-example'));
});

async function loadLogin(client) {
  const elements = new Map();
  const element = () => ({ value: '', disabled: false, hidden: false, textContent: '', attributes: {}, listeners: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    focus() { this.focused = true; }
  });
  for (const id of ['login-form', 'login-submit', 'login-progress', 'login-message', 'email', 'password']) elements.set(id, element());
  const body = element();
  const listeners = {};
  const context = vm.createContext({ document: { body, getElementById: (id) => elements.get(id) },
    window: { addEventListener(name, callback) { listeners[name] = callback; }, location: { assign() { throw new Error('Unexpected navigation'); } } },
    createSupportClient: () => client, SCHEDULER_PATH: '/support-management/scheduler/'
  });
  const source = fs.readFileSync(path.join(__dirname, '../../apps/support-management/login/main.js'), 'utf8');
  await vm.runInContext(`(async () => { ${source.replace(/^import .*;\r?\n/u, '')} })()`, context);
  elements.get('email').value = 'admin@example.test';
  elements.get('password').value = 'synthetic-password';
  return { elements, body, listeners };
}

test('login replaces the button while pending, prevents duplicate requests and restores it after rejection', async () => {
  let rejectLogin;
  let calls = 0;
  const pendingLogin = new Promise((resolve, reject) => { rejectLogin = reject; });
  const { elements, body } = await loadLogin({ config: async () => ({}), login: () => { calls++; return pendingLogin; } });
  const submission = elements.get('login-form').listeners.submit({ preventDefault() {} });
  assert.equal(body.attributes['aria-busy'], 'true');
  assert.equal(elements.get('login-form').attributes['aria-busy'], 'true');
  assert.equal(elements.get('login-submit').disabled, true);
  assert.equal(elements.get('login-submit').hidden, true);
  assert.equal(elements.get('login-progress').hidden, false);
  assert.equal(elements.get('login-message').textContent, '');
  await elements.get('login-form').listeners.submit({ preventDefault() {} });
  assert.equal(calls, 1);
  rejectLogin({ status: 401 });
  await submission;
  assert.equal(body.attributes['aria-busy'], 'false');
  assert.equal(elements.get('login-form').attributes['aria-busy'], 'false');
  assert.equal(elements.get('login-submit').disabled, false);
  assert.equal(elements.get('login-submit').hidden, false);
  assert.equal(elements.get('login-progress').hidden, true);
  assert.equal(elements.get('password').value, '');
  assert.equal(elements.get('password').focused, true);
  assert.equal(elements.get('login-message').textContent, 'E-mail ou senha inválidos.');
});

test('leaving the login clears its password and pending presentation', async () => {
  let rejectLogin;
  const pendingLogin = new Promise((resolve, reject) => { rejectLogin = reject; });
  const { elements, body, listeners } = await loadLogin({ config: async () => ({}), login: () => pendingLogin });
  const submission = elements.get('login-form').listeners.submit({ preventDefault() {} });
  listeners.pagehide();
  assert.equal(elements.get('password').value, '');
  assert.equal(elements.get('login-submit').hidden, false);
  assert.equal(elements.get('login-submit').disabled, false);
  assert.equal(elements.get('login-progress').hidden, true);
  assert.equal(elements.get('login-form').attributes['aria-busy'], 'false');
  assert.equal(body.attributes['aria-busy'], 'false');
  rejectLogin({ status: 503 });
  await submission;
});

async function loadScheduler(client, { activateCard = true, appointmentController, runtime = {} } = {}) {
  const elements = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const document = { activeElement: null,
    addEventListener(name, callback) { const handlers = documentListeners.get(name) || new Set(); handlers.add(callback); documentListeners.set(name, handlers); },
    removeEventListener(name, callback) { documentListeners.get(name)?.delete(callback); },
  };
  function element(tagName, attributes = '') {
    const attribute = (name) => attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, 'u'))?.[1] ?? null;
    return {
      id: attribute('id') || '', tagName: tagName.toUpperCase(), value: '', textContent: '',
      hidden: /(?:^|\s)hidden(?:\s|$)/u.test(attributes), disabled: false,
      required: /(?:^|\s)required(?:\s|$)/u.test(attributes), maxLength: Number(attribute('maxlength') ?? -1),
      selectionStart: null, dataset: {}, listeners: {}, attributes: {},
      open: false, checked: false, children: [],
      addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name] ?? attribute(name); },
      setCustomValidity(value) { this.validationMessage = value; },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      focus(options) {
        this.focused = true; this.focusOptions = options; document.activeElement = this;
        for (const callback of documentListeners.get('focusin') || []) callback({ target: this });
      },
      showModal() { this.open = true; },
      close() { this.open = false; },
      getBoundingClientRect() { return { left: 10, top: 10, right: 300, bottom: 300 }; },
    };
  }
  const root = path.join(__dirname, '../../apps/support-management');
  const html = fs.readFileSync(path.join(root, 'scheduler/index.html'), 'utf8');
  for (const [, tagName, attributes] of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="[^"]+"[^>]*)>/gu)) {
    const node = element(tagName, attributes);
    elements.set(node.id, node);
  }
  const introduction = element('p');
  const footer = element('footer');
  document.body = element('body');
  elements.get('save-permissions').textContent = html.match(/id="save-permissions"[^>]*>([^<]+)<\/button>/u)?.[1] || '';
  elements.get('permissions-pending').textContent = html.match(/id="permissions-pending"[^>]*>([^<]+)<\/p>/u)?.[1] || '';
  elements.get('card-form').reset = () => {
    for (const node of elements.values()) if (['INPUT', 'SELECT'].includes(node.tagName)) node.value = '';
  };
  elements.get('card-form').reportValidity = () => ![...elements.values()].some(node =>
    ['INPUT', 'SELECT'].includes(node.tagName) && !node.disabled && (node.validationMessage || (node.required && !node.value)));
  Object.assign(document, { getElementById: (id) => elements.get(id) || null,
      querySelector: (selector) => selector === '.intro' ? introduction : footer,
      createElement: (tagName) => element(tagName) });
  const context = vm.createContext({ document,
    window: { addEventListener(name, callback) { const handlers = windowListeners.get(name) || []; handlers.push(callback); windowListeners.set(name, handlers); }, location: { replace: runtime.navigate || (() => { throw new Error('Unexpected navigation'); }) } },
    createSupportClient: () => ({ permissions: async () => ({ employees: [] }), ...client }), LOGIN_PATH: '/support-management/login/',
    createAppointments: () => appointmentController || ({ load: async () => {} }),
    submitCompanyCard: runtime.submitCompanyCard || (() => { throw new Error('Unexpected card registration'); }),
    FormData: class {
      constructor() {
        this.values = new Map([...elements.values()].filter(node => ['INPUT', 'SELECT'].includes(node.tagName)
          && node.getAttribute('name') && !node.disabled).map(node => [node.getAttribute('name'), node.value]));
        runtime.onFormData?.(this);
      }
      get(key) { return this.values.get(key) ?? null; }
      keys() { return this.values.keys(); }
      delete(key) { this.values.delete(key); }
    },
    ...(runtime.now ? { Date: class extends Date { static now() { return runtime.now(); } } } : {}),
    ...(runtime.setInterval ? { setInterval: runtime.setInterval, clearInterval: runtime.clearInterval } : {}),
  });
  const fields = fs.readFileSync(path.join(root, 'modules/card-fields.js'), 'utf8');
  vm.runInContext(fields.replace(/export /gu, ''), context);
  const source = fs.readFileSync(path.join(root, 'scheduler/main.js'), 'utf8');
  const initializing = vm.runInContext(`(async () => { ${source.replace(/^import .*;\r?\n/gmu, '')} })()`, context);
  if (runtime.duringInitialization) await runtime.duringInitialization({ elements, document });
  await initializing;
  if (activateCard) for (const callback of elements.get('card-tab').listeners.click || []) await callback({});
  return { elements, introduction, footer, document,
    dispatchWindow(name) { for (const callback of windowListeners.get(name) || []) callback(); },
    async dispatchDocument(name, event = {}) { for (const callback of documentListeners.get(name) || []) await callback(event); },
    async click(id, event = {}) { for (const callback of elements.get(id).listeners.click || []) await callback(event); },
    async dispatch(id, name, event = {}) { for (const callback of elements.get(id).listeners[name] || []) await callback(event); } };
}

test('Agendamento is the default tab and card data loads only on the first card-tab activation', async () => {
  let reads = 0;
  const { elements, click } = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => { reads++; return { card: null }; },
  }, { activateCard: false });
  assert.equal(reads, 0);
  assert.equal(elements.get('header-title').textContent, 'Agendamento: Atendimentos Consultivos');
  assert.equal(elements.get('appointments-panel').hidden, false);
  assert.equal(elements.get('card-panel').hidden, true);
  await click('card-tab');
  assert.equal(reads, 1);
  assert.equal(elements.get('header-title').textContent, 'Configurações da Conta PJ');
  assert.equal(elements.get('appointments-panel').hidden, true);
  assert.equal(elements.get('card-panel').hidden, false);
  assert.equal(elements.get('card-tab').attributes['aria-selected'], 'true');
  await click('appointments-tab');
  assert.equal(elements.get('header-title').textContent, 'Agendamento: Atendimentos Consultivos');
  await click('card-tab');
  assert.equal(reads, 1);
});

for (const role of ['Administrador', 'Usuário']) {
  test(`administrator sidebar tools and keyboard access match the authenticated role: ${role}`, async () => {
    let cardReads = 0;
    let permissionReads = 0;
    const calendar = { paymentMethodRegistered: true, canBook: true };
    const calendars = [];
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }),
      session: async () => ({ user: { role }, calendar }),
      card: async () => { cardReads++; return { card: null }; },
      permissions: async () => { permissionReads++; return { employees: [] }; },
    }, { activateCard: false, appointmentController: { load: async value => { calendars.push(value); } },
      runtime: { duringInitialization: ({ elements }) => {
        assert.equal(elements.get('admin-tools-divider').hidden, true, 'Administrator controls stay hidden until the role is known');
        assert.equal(elements.get('card-tab').hidden, true);
      } } });
    const admin = role === 'Administrador';
    assert.equal(f.elements.get('admin-tools-divider').hidden, !admin);
    assert.equal(f.elements.get('card-tab').hidden, !admin);
    assert.equal(f.elements.get('appointments-panel').hidden, false);
    assert.deepEqual(calendars, [calendar], 'Role filtering must retain the supplied booking data');
    assert.equal(cardReads, 0);
    assert.equal(permissionReads, 0);
    for (const [key, adminTarget] of [['ArrowDown', 'card'], ['ArrowUp', 'appointments'], ['End', 'card'], ['Home', 'appointments']]) {
      const currentTab = f.elements.get('card-tab').attributes['aria-selected'] === 'true' ? 'card' : 'appointments';
      let prevented = false;
      await f.dispatch(`${currentTab}-tab`, 'keydown', { key, preventDefault() { prevented = true; } });
      await new Promise(resolve => setImmediate(resolve));
      const target = admin ? adminTarget : 'appointments';
      assert.equal(prevented, true);
      assert.equal(f.document.activeElement, f.elements.get(`${target}-tab`));
      assert.equal(f.elements.get(`${target}-tab`).attributes['aria-selected'], 'true');
      assert.equal(f.elements.get(`${target}-panel`).hidden, false);
    }
    if (!admin) {
      await f.click('card-tab');
      await f.dispatch('card-tab', 'keydown', { key: 'End', preventDefault() { throw new Error('A hidden tab cannot handle navigation'); } });
      assert.equal(f.elements.get('card-panel').hidden, true);
      assert.equal(f.elements.get('appointments-panel').hidden, false);
      assert.equal(f.elements.get('header-title').textContent, 'Agendamento: Atendimentos Consultivos');
    }
    assert.equal(cardReads, admin ? 1 : 0);
    assert.equal(permissionReads, admin ? 1 : 0);
  });
}

for (const deniedRead of ['card', 'permissions']) {
  test(`administrator access denied by ${deniedRead} hides its sidebar tools and returns to Agendamento`, async () => {
    let reads = 0;
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => { reads++; if (deniedRead === 'card') throw { status: 403 }; return { card: null }; },
      permissions: async () => { reads++; if (deniedRead === 'permissions') throw { status: 403 }; return { employees: [] }; },
    });
    for (const id of ['admin-tools-divider', 'card-tab', 'card-panel', 'permissions-panel']) assert.equal(f.elements.get(id).hidden, true);
    assert.equal(f.elements.get('appointments-panel').hidden, false);
    assert.equal(f.elements.get('appointments-tab').attributes['aria-selected'], 'true');
    assert.equal(f.document.activeElement, f.elements.get('appointments-tab'));
    const previousReads = reads;
    await f.click('card-tab');
    assert.equal(reads, previousReads);
    assert.equal(f.elements.get('card-panel').hidden, true);
  });
}

test('the session expires in the background without displaying a countdown', async () => {
  let now = Date.now();
  const expiresAt = now + 3600000;
  let timer;
  let clearedSessions = 0;
  const stopped = [];
  const navigations = [];
  const { elements } = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ expiresAt, user: { name: 'Nome Completo', role: 'Administrador' } }),
    clearSession() { clearedSessions++; },
  }, { activateCard: false, runtime: {
    now: () => now,
    setInterval(callback, delay) { assert.equal(delay, 1000); timer = callback; return 'expiry-timer'; },
    clearInterval(id) { stopped.push(id); },
    navigate(destination) { navigations.push(destination); },
  } });
  assert.equal(elements.has('header-session-time'), false);
  assert.equal(elements.get('header-user-name').textContent, 'Nome Completo');
  now = expiresAt - 1;
  timer();
  assert.equal(clearedSessions, 0);
  assert.equal(navigations.length, 0);
  now = expiresAt;
  timer();
  assert.equal(clearedSessions, 1);
  assert.deepEqual(navigations, ['/support-management/login/']);
  assert.ok(stopped.includes('expiry-timer'));
  timer();
  assert.equal(clearedSessions, 1, 'An expired session must redirect only once');
});

const pendingCompanyCard = {
  card: { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030 }, workbookSyncPending: true, cardRevision: CARD_REVISION,
};

const registeredCompanyCard = { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030 };

for (const dismissal of ['cancel', 'escape', 'tab']) {
  test(`inline card deletion defaults to Cancelar and ${dismissal} makes no deletion request`, async () => {
    let deletions = 0;
    const { elements, document, click, dispatchDocument } = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }),
      session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }),
      deleteCard: async () => { deletions++; return { card: null }; },
    });
    elements.get('number').value = 'temporary card field';
    elements.get('cvv').value = '123';
    await click('edit-card');
    assert.equal(elements.get('card-delete-actions').hidden, false);
    assert.equal(elements.get('edit-card').hidden, true);
    assert.equal(elements.get('edit-card').attributes['aria-expanded'], 'true');
    assert.equal(document.activeElement, elements.get('cancel-delete-card'));
    assert.equal(elements.get('number').value, '');
    assert.equal(elements.get('cvv').value, '');
    assert.equal(elements.get('card-editor').hidden, true);
    assert.equal(deletions, 0);
    if (dismissal === 'cancel') await click('cancel-delete-card');
    else if (dismissal === 'escape') {
      let prevented = false;
      await dispatchDocument('keydown', { key: 'Escape', preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    } else await click('appointments-tab');
    assert.equal(elements.get('card-delete-actions').hidden, true);
    assert.equal(elements.get('edit-card').hidden, false);
    assert.equal(elements.get('edit-card').attributes['aria-expanded'], 'false');
    if (dismissal !== 'tab') assert.equal(document.activeElement, elements.get('edit-card'));
    assert.equal(elements.get('card-summary').hidden, false);
    await click('confirm-delete-card');
    assert.equal(deletions, 0);
  });
}

test('confirmed deletion removes the masked summary, restores the original form and refreshes the authoritative appointment gate', async () => {
  let deletions = 0;
  let discarded = 0;
  let invalidated = 0;
  let freshCalendars = 0;
  let cached = true;
  let paymentRegistered = true;
  const appointmentController = {
    invalidate() { invalidated++; cached = false; },
    async load(result) {
      if (result) paymentRegistered = result.paymentMethodRegistered;
      else if (!cached) { freshCalendars++; paymentRegistered = false; cached = true; }
    },
  };
  const context = { user: { role: 'Administrador' }, config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' },
    card: { card: registeredCompanyCard, cardRevision: CARD_REVISION }, calendar: { paymentMethodRegistered: true } };
  const { elements, footer, introduction, click } = await loadScheduler({
    bootstrap: () => ({ context, refresh: false }),
    discardBootstrap() { discarded++; },
    deleteCard: async (revision) => { assert.equal(revision, CARD_REVISION); deletions++; return { card: null }; },
    card: async () => { throw new Error('The deleted wallet must not be read from an old bootstrap'); },
  }, { appointmentController });
  await click('edit-card');
  await click('confirm-delete-card');
  assert.equal(deletions, 1);
  assert.equal(discarded, 1);
  assert.equal(invalidated, 1);
  assert.equal(freshCalendars, 1);
  assert.equal(paymentRegistered, false);
  assert.equal(elements.get('card-delete-actions').hidden, true);
  assert.equal(elements.get('card-delete-actions').attributes['aria-busy'], 'false');
  assert.equal(elements.get('card-summary').hidden, true);
  assert.equal(elements.get('card-number').textContent, '');
  assert.equal(elements.get('card-expiry').textContent, '');
  assert.equal(elements.get('edit-card').hidden, true);
  assert.equal(elements.get('card-editor').hidden, false);
  assert.equal(elements.get('save-card').textContent, 'Cadastrar Cartão');
  assert.equal(footer.hidden, false);
  assert.match(introduction.textContent, /^Cadastre aqui/u);
  assert.equal(elements.get('scheduler-message').textContent, '');
  await click('appointments-tab');
  await click('card-tab');
  assert.equal(elements.get('card-editor').hidden, false, 'Tab navigation cannot resurrect a stale registered card');
});

test('failed or unconfirmed deletions retain the masked summary and allow a safe retry without showing the registration form', async () => {
  for (const failure of ['network', 'malformed', 'pending']) {
    let attempts = 0;
    const revisions = [];
    const { elements, click } = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }),
      session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }),
      deleteCard: async (revision) => {
        revisions.push(revision);
        if (++attempts > 1) return { card: null };
        if (failure === 'network') throw { status: 503, code: 'support_management.card_delete_failed' };
        return failure === 'pending' ? { card: null, cardDeletionPending: true } : {};
      },
    });
    await click('edit-card');
    await click('confirm-delete-card');
    assert.equal(elements.get('card-summary').hidden, false);
    assert.match(elements.get('card-number').textContent, /0010/u);
    assert.equal(elements.get('edit-card').hidden, true);
    assert.equal(elements.get('edit-card').disabled, false);
    assert.equal(elements.get('card-editor').hidden, true);
    assert.equal(elements.get('card-delete-actions').hidden, false);
    assert.equal(elements.get('card-delete-actions').attributes['aria-busy'], 'false');
    assert.match(elements.get('scheduler-message').textContent, /Não foi possível confirmar/u);
    await click('cancel-delete-card');
    await click('edit-card');
    await click('confirm-delete-card');
    assert.equal(attempts, 2);
    assert.deepEqual(revisions, [CARD_REVISION, CARD_REVISION]);
    assert.equal(elements.get('card-summary').hidden, true);
    assert.equal(elements.get('card-editor').hidden, false);
  }
});

test('a pending deletion gives only administrators a trash retry and blocks registration until deletion succeeds', async () => {
  for (const role of ['Administrador', 'Usuário']) {
    let deletions = 0;
    const { elements, click, dispatch } = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }),
      session: async () => ({ user: { role } }),
      card: async () => ({ card: null, cardDeletionPending: true, cardRevision: CARD_REVISION }),
      deleteCard: async () => { deletions++; return { card: null }; },
    });
    assert.equal(elements.get('card-editor').hidden, true);
    assert.equal(elements.get('edit-card').hidden, role !== 'Administrador');
    assert.equal(elements.get('card-summary').hidden, role !== 'Administrador');
    assert.equal(elements.get('card-panel').hidden, role !== 'Administrador');
    await dispatch('card-form', 'submit', { preventDefault() {} });
    await click('edit-card');
    assert.equal(elements.get('card-delete-actions').hidden, role !== 'Administrador');
    await click('confirm-delete-card');
    assert.equal(deletions, role === 'Administrador' ? 1 : 0);
    assert.equal(elements.get('card-editor').hidden, role !== 'Administrador');
  }
});

test('members cannot reveal the deletion action or submit deletion for a registered card', async () => {
  let deletions = 0;
  const { elements, click } = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ user: { role: 'Usuário' } }),
    card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }),
    deleteCard: async () => { deletions++; },
  });
  assert.equal(elements.get('edit-card').hidden, true);
  await click('edit-card');
  await click('confirm-delete-card');
  assert.equal(elements.get('card-delete-actions').hidden, true);
  assert.equal(deletions, 0);
});

test('an administrator can delete a verified registered card whose workbook synchronization is pending', async () => {
  let deletions = 0;
  const { elements, click } = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => pendingCompanyCard,
    syncCard: async () => { throw { status: 503, code: 'support_management.workbook_sync_failed' }; },
    deleteCard: async () => { deletions++; return { card: null }; },
  });
  assert.equal(elements.get('retry-card-sync').hidden, false);
  assert.equal(elements.get('edit-card').hidden, false);
  await click('edit-card');
  assert.equal(elements.get('card-delete-actions').hidden, false);
  await click('confirm-delete-card');
  assert.equal(deletions, 1);
  assert.equal(elements.get('retry-card-sync').hidden, true);
  assert.equal(elements.get('card-summary').hidden, true);
  assert.equal(elements.get('card-editor').hidden, false);
});

test('an in-flight card deletion prevents duplicate submissions and dismissal', async () => {
  let resolveDelete;
  let deletions = 0;
  const { elements, click, dispatchDocument } = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }),
    deleteCard: () => { deletions++; return new Promise(resolve => { resolveDelete = resolve; }); },
  });
  await click('edit-card');
  const pending = click('confirm-delete-card');
  await click('confirm-delete-card');
  await click('cancel-delete-card');
  await dispatchDocument('keydown', { key: 'Escape', preventDefault() {} });
  assert.equal(deletions, 1);
  assert.equal(elements.get('card-delete-actions').hidden, false);
  assert.equal(elements.get('card-delete-actions').attributes['aria-busy'], 'true');
  assert.equal(elements.get('cancel-delete-card').disabled, true);
  resolveDelete({ card: null });
  await pending;
  assert.equal(elements.get('card-delete-actions').hidden, true);
  assert.equal(elements.get('card-delete-actions').attributes['aria-busy'], 'false');
  assert.equal(elements.get('card-editor').hidden, false);
});

for (const status of [401, 403]) {
  test(`card deletion clears its wait state and hides actions after authorization failure ${status}`, async () => {
    let failDelete;
    const navigations = [];
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }), clearSession() {},
      deleteCard: () => new Promise((resolve, reject) => { failDelete = reject; }),
    }, { runtime: { navigate: path => navigations.push(path) } });
    await f.click('edit-card');
    const pending = f.click('confirm-delete-card');
    assert.equal(f.elements.get('card-delete-actions').attributes['aria-busy'], 'true');
    failDelete({ status });
    await pending;
    assert.equal(f.elements.get('card-delete-actions').attributes['aria-busy'], 'false');
    assert.equal(f.elements.get('card-delete-actions').hidden, true);
    assert.equal(f.elements.get('confirm-delete-card').disabled, false);
    assert.equal(f.elements.get('cancel-delete-card').disabled, false);
    assert.deepEqual(navigations, status === 401 ? ['/support-management/login/'] : []);
  });
}

test('leaving the page hides pending deletion controls immediately and settlement clears their wait state', async () => {
  let finishDelete;
  let deletions = 0;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }),
    deleteCard: () => { deletions++; return new Promise(resolve => { finishDelete = resolve; }); },
  });
  await f.click('edit-card');
  const pending = f.click('confirm-delete-card');
  assert.equal(f.elements.get('card-delete-actions').attributes['aria-busy'], 'true');
  f.dispatchWindow('pagehide');
  assert.equal(f.elements.get('card-delete-actions').hidden, true);
  await f.click('confirm-delete-card');
  assert.equal(deletions, 1);
  finishDelete({ card: null });
  await pending;
  assert.equal(f.elements.get('card-delete-actions').attributes['aria-busy'], 'false');
  assert.equal(f.elements.get('card-delete-actions').hidden, true);
});

for (const phase of ['startup', 'retry']) {
  for (const reason of ['card_verification_required', 'card_review_required']) {
    test(`${phase} synchronization handles ${reason} without leaving stale sync-only controls`, async () => {
      let reads = 0;
      let synchronizations = 0;
      const client = {
        config: async () => ({ publicKey: 'pk_test_synthetic' }),
        session: async () => ({ user: { role: 'Administrador' } }),
        card: async () => ++reads === 1 ? pendingCompanyCard : { card: null, verificationRequired: true },
        async syncCard() {
          synchronizations++;
          if (phase === 'retry' && synchronizations === 1) {
            throw { status: 503, code: 'support_management.workbook_sync_failed' };
          }
          throw { status: 409, code: `support_management.${reason}` };
        },
      };
      const { elements, footer, click } = await loadScheduler(client);
      if (phase === 'retry') {
        assert.equal(elements.get('card-summary').hidden, false);
        assert.equal(elements.get('retry-card-sync').hidden, false);
        await click('retry-card-sync');
      }
      assert.equal(synchronizations, phase === 'retry' ? 2 : 1);
      assert.equal(elements.get('retry-card-sync').hidden, true);
      assert.equal(elements.get('edit-card').hidden, true);
      if (reason === 'card_verification_required') {
        assert.equal(reads, 2, 'Reverification must refresh the authoritative card snapshot');
        assert.equal(elements.get('card-summary').hidden, true);
        assert.equal(elements.get('card-editor').hidden, false);
        assert.equal(footer.hidden, false);
        assert.match(elements.get('scheduler-message').textContent, /validado novamente/u);
      } else {
        assert.equal(reads, 1, 'An ambiguous operation must remain blocked for review');
        assert.equal(elements.get('card-editor').hidden, true);
        assert.match(elements.get('scheduler-message').textContent, /conferido no Pagar\.me/u);
      }
    });
  }
}


test('the login bootstrap is bound to the token, renders once without a fresh session read and caches only safe card details', async () => {
  let calls = 0;
  const result = { token: 'session-example', expiresAt: Date.now() + 60000,
    user: { name: 'User', company: 'Company', role: 'Usuário', email: 'user@example.test', password: 'excluded' },
    config: { environment: 'sandbox', publicKey: 'pk_test_example' },
    calendar: { days: [], today: '2026-11-09', paymentMethodRegistered: true },
    card: { card: { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030, number: 'excluded', cvv: 'excluded' }, cardRevision: CARD_REVISION }
  };
  const { createSupportClient, values } = loadClient(async () => { calls++; return { ok: true, json: async () => result }; });
  const first = createSupportClient();
  await first.login('user@example.test', 'password');
  const nextPage = createSupportClient();
  const saved = nextPage.bootstrap();
  assert.equal(calls, 1);
  assert.equal(saved.refresh, false);
  assert.equal(saved.context.user.name, 'User');
  assert.equal(saved.context.user.password, undefined);
  assert.equal(saved.context.card.card.number, undefined);
  assert.equal(saved.context.card.card.cvv, undefined);
  assert.equal(saved.context.card.cardRevision, CARD_REVISION);
  assert.equal(nextPage.bootstrap().refresh, true, 'A reload must revalidate the displayed cache with the server');
  values.set('supportManagementToken', 'another-user');
  assert.equal(nextPage.bootstrap(), null);
  assert.equal(values.has('supportManagementContext'), false);
});

test('a pending deletion bootstrap keeps only its public status so a reload cannot reopen registration', async () => {
  const { createSupportClient } = loadClient(async () => ({ ok: true, json: async () => ({
    token: 'session-example', expiresAt: Date.now() + 60000,
    user: { name: 'Admin', role: 'Administrador' },
    config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' },
    card: { card: null, cardDeletionPending: true, cardRevision: CARD_REVISION, providerCardId: 'excluded', cvv: 'excluded' },
  }) }));
  const client = createSupportClient();
  await client.login('admin@example.test', 'synthetic-password');
  const saved = client.bootstrap().context.card;
  assert.equal(saved.card, null);
  assert.equal(saved.cardDeletionPending, true);
  assert.equal(saved.cardRevision, CARD_REVISION);
  assert.equal(saved.providerCardId, undefined);
  assert.equal(saved.cvv, undefined);
});

test('expired or malformed bootstrap caches are discarded and logout removes the cached context', async () => {
  const { createSupportClient, values } = loadClient(async () => ({ ok: true, status: 204 }));
  const client = createSupportClient();
  values.set('supportManagementToken', 'session-example');
  for (const record of ['{malformed', JSON.stringify({ token: 'session-example', context: { expiresAt: Date.now() - 1 } })]) {
    values.set('supportManagementContext', record);
    assert.equal(client.bootstrap(), null);
    assert.equal(values.has('supportManagementContext'), false);
  }
  values.set('supportManagementContext', 'cached-context');
  await client.logout();
  assert.equal(values.size, 0);
});

test('scheduler starts from the login bootstrap and does not repeat config, session or card reads on its first tabs', async () => {
  const calls = [];
  const context = { user: { name: 'User', role: 'Administrador' }, config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' },
    card: { card: null }, calendar: { days: [], today: '2026-11-09', paymentMethodRegistered: false } };
  const { elements, click } = await loadScheduler({
    bootstrap: () => ({ context, refresh: false }),
    config: async () => { throw new Error('Repeated config read'); },
    session: async () => { throw new Error('Repeated session read'); },
    card: async () => { calls.push('card'); return { card: null }; },
  }, { activateCard: false });
  assert.equal(elements.get('appointments-panel').hidden, false);
  assert.equal(elements.get('header-user-name').textContent, 'User');
  await click('card-tab');
  await click('appointments-tab');
  await click('card-tab');
  assert.deepEqual(calls, []);
});


test('incompatible cached contexts are discarded without losing the current authorization token', () => {
  const { createSupportClient, values } = loadClient();
  values.set('supportManagementToken', 'session-example');
  const valid = { user: { name: 'User', role: 'Administrador' }, expiresAt: Date.now() + 60000,
    config: { environment: 'sandbox', publicKey: 'pk_test_example' } };
  for (const context of [
    { ...valid, user: undefined },
    { ...valid, config: undefined },
    { ...valid, config: { environment: 'sandbox', publicKey: 'sk_test_example' } },
  ]) {
    values.set('supportManagementContext', JSON.stringify({ token: 'session-example', context, fromLogin: true }));
    assert.equal(createSupportClient().bootstrap(), null);
    assert.equal(values.has('supportManagementContext'), false);
    assert.equal(values.get('supportManagementToken'), 'session-example');
  }
});

test('successful card registration, synchronization and reservations invalidate persisted bootstrap snapshots', async () => {
  const { createSupportClient, values } = loadClient(async () => ({ ok: true, json: async () => ({}) }));
  const client = createSupportClient();
  values.set('supportManagementToken', 'session-example');
  for (const mutate of [() => client.saveCard('token_example', {}), () => client.syncCard(),
    () => client.reserveDate({ date: '2026-11-10', priceCents: 50000, requestId: 'example', acknowledged: true })]) {
    values.set('supportManagementContext', 'old-card-and-calendar-context');
    await mutate();
    assert.equal(values.has('supportManagementContext'), false);
    assert.equal(values.get('supportManagementToken'), 'session-example');
  }
});

test('an unusable cached bootstrap falls back to the current server session instead of trapping reloads', async () => {
  let freshReads = 0;
  let discarded = 0;
  const { elements } = await loadScheduler({
    bootstrap: () => ({ context: { config: { environment: 'production', publicKey: 'pk_live_bad' } }, refresh: false }),
    discardBootstrap() { discarded++; },
    session: async () => { freshReads++; return { user: { name: 'Current User', role: 'Usuário' }, config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' } }; },
  }, { activateCard: false });
  assert.equal(discarded, 1);
  assert.equal(freshReads, 1);
  assert.equal(elements.get('header-user-name').textContent, 'Current User');
  assert.equal(elements.get('appointments-panel').hidden, false);
});

test('an incomplete fresh bootstrap invalidates old calendar and card snapshots so route reads retry', async () => {
  let loaded = false;
  let calendarReads = 0;
  let cardReads = 0;
  const context = { user: { name: 'User', role: 'Administrador' }, config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' },
    card: { card: null }, calendar: { days: [], today: '2026-11-09', paymentMethodRegistered: false } };
  const appointmentController = {
    async load(result) {
      if (result) loaded = true;
      else if (!loaded) { calendarReads++; loaded = true; }
    },
    invalidate() { loaded = false; },
  };
  const { elements } = await loadScheduler({
    bootstrap: () => ({ context, refresh: true }),
    session: async () => ({ user: context.user, config: context.config }),
    card: async () => { cardReads++; return { card: { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030 }, cardRevision: CARD_REVISION }; },
  }, { appointmentController });
  assert.equal(calendarReads, 1, 'A missing fresh calendar must retry its route instead of retaining the old gate');
  assert.equal(cardReads, 1, 'A missing fresh card must not consume the old null wallet snapshot');
  assert.equal(elements.get('card-summary').hidden, false);
  assert.match(elements.get('card-number').textContent, /0010/u);
});

test('a pre-revision login bootstrap refreshes its card before enabling deletion', async () => {
  let reads = 0;
  const revisions = [];
  const context = { user: { name: 'Admin', role: 'Administrador' },
    config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' }, card: { card: registeredCompanyCard } };
  const { elements, click } = await loadScheduler({
    bootstrap: () => ({ context, refresh: false }),
    card: async () => { reads++; return { card: registeredCompanyCard, cardRevision: CARD_REVISION }; },
    deleteCard: async (revision) => { revisions.push(revision); return { card: null }; },
  });
  assert.equal(reads, 1);
  assert.equal(elements.get('edit-card').hidden, false);
  await click('edit-card');
  await click('confirm-delete-card');
  assert.deepEqual(revisions, [CARD_REVISION]);
});

test('a stale deletion keeps its original revision until the replacement card is loaded and explicitly confirmed', async () => {
  const replacementRevision = 'b'.repeat(64);
  const revisions = [];
  let reads = 0;
  const { elements, click } = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ++reads === 1 ? { card: registeredCompanyCard, cardRevision: CARD_REVISION }
      : { card: { ...registeredCompanyCard, lastFour: '2222' }, cardRevision: replacementRevision },
    deleteCard: async (revision) => {
      revisions.push(revision);
      if (revision === CARD_REVISION) throw { status: 409, code: 'support_management.card_changed' };
      return { card: null };
    },
  });
  await click('edit-card');
  await click('confirm-delete-card');
  await click('confirm-delete-card');
  assert.deepEqual(revisions, [CARD_REVISION, CARD_REVISION]);
  assert.match(elements.get('scheduler-message').textContent, /cartão cadastrado mudou/u);
  assert.match(elements.get('card-number').textContent, /0010/u);
  await click('cancel-delete-card');
  await click('card-tab');
  assert.match(elements.get('card-number').textContent, /2222/u);
  await click('edit-card');
  await click('confirm-delete-card');
  assert.deepEqual(revisions, [CARD_REVISION, CARD_REVISION, replacementRevision]);
  assert.equal(elements.get('card-summary').hidden, true);
});

test('permission requests use only the current authorization and the selected employee flag', async () => {
  const requests = [];
  const { createSupportClient, values } = loadClient(async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ employees: [] }) };
  });
  values.set('supportManagementToken', 'session-example');
  values.set('supportManagementContext', 'old-context');
  const client = createSupportClient();
  await client.permissions();
  await client.updatePermissions([{ email: 'colleague@example.test', allowed: true }]);
  assert.equal(requests[0].url, '/support-management/api/permissions');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(requests[1].options.body), { employees: [{ email: 'colleague@example.test', allowed: true }] });
  assert.ok(requests.every(({ options }) => options.headers.Authorization === 'Bearer session-example'));
  assert.equal(values.has('supportManagementContext'), false);
});

const employees = [
  { email: 'admin@example.test', name: 'Administradora', allowed: false, active: true },
  { email: 'colleague@example.test', name: '<Colega>', allowed: false, active: true },
  { email: 'inactive@example.test', name: 'Inativo', allowed: false, active: false },
];

async function changePermission(f, index = 0, checked) {
  const checkbox = f.elements.get('permissions-list').children[index].children[0];
  checkbox.checked = checked ?? !checkbox.checked;
  for (const callback of checkbox.listeners.change || []) await callback();
  return checkbox;
}

test('checkbox edits reveal Salvar and pending feedback until an explicit successful save', async () => {
  let reads = 0;
  let finish;
  let invalidated = 0;
  const writes = [];
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }),
    session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }),
    permissions: async () => { reads++; return { employees }; },
    updatePermissions: selected => { writes.push(JSON.parse(JSON.stringify(selected))); return new Promise(resolve => { finish = resolve; }); },
  }, { appointmentController: { load: async () => {}, invalidate: () => { invalidated++; } } });
  const list = f.elements.get('permissions-list');
  assert.equal(reads, 1);
  assert.equal(list.children[1].children[1].textContent, '<Colega>');
  assert.equal(list.children[1].children[1].children.length, 0);
  assert.equal(list.children[2].children[0].disabled, true);
  assert.equal(f.elements.get('save-permissions').textContent, 'Salvar');
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  assert.equal(f.elements.get('permissions-pending').textContent, 'Salvamento pendente.');
  const checkbox = list.children[1].children[0];
  checkbox.checked = true;
  await checkbox.listeners.change[0]();
  assert.deepEqual(writes, []);
  assert.equal(checkbox.disabled, false);
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('save-permissions').disabled, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  await f.click('appointments-tab');
  await f.click('card-tab');
  assert.equal(list.children[1].children[0], checkbox, 'Tab revisits must retain the unsaved draft');
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  const pending = f.click('save-permissions');
  assert.ok(list.children.every(row => row.children[0].disabled));
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.document.body.attributes['aria-busy'], 'true');
  assert.equal(f.elements.get('save-permissions').attributes['aria-busy'], 'true');
  assert.equal(f.elements.get('save-permissions').textContent, 'Salvar');
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  assert.equal(f.elements.get('permissions-message').textContent, '');
  await f.click('save-permissions');
  assert.deepEqual(writes, [[{ email: 'admin@example.test', allowed: false }, { email: 'colleague@example.test', allowed: true }]]);
  finish({ employees: employees.map(employee => ({ ...employee, allowed: employee.email === 'colleague@example.test' })) });
  await pending;
  assert.equal(list.children[1].children[0].checked, true);
  assert.equal(list.children[0].children[0].disabled, false);
  assert.equal(list.children[2].children[0].disabled, true);
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  assert.equal(f.document.body.attributes['aria-busy'], 'false');
  assert.equal(f.elements.get('save-permissions').attributes['aria-busy'], 'false');
  assert.equal(f.elements.get('save-permissions').textContent, 'Salvar');
  assert.equal(f.elements.get('permissions-message').textContent, '');
  assert.equal(reads, 1, 'Saving must not add a redundant permissions GET');
  assert.ok(invalidated >= 1);
  await changePermission(f, 1, false);
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  await changePermission(f, 1, true);
  assert.equal(f.elements.get('save-permissions').hidden, true, 'Dirty state must compare with the latest saved permissions');
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  assert.equal(writes.length, 1);
});

test('unchanged permission defaults keep Salvar hidden and never make a save request', async () => {
  const allSelected = employees.map(employee => ({ ...employee, allowed: employee.active }));
  const writes = [];
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => ({ employees: allSelected }),
    updatePermissions: async selected => { writes.push(JSON.parse(JSON.stringify(selected))); return { employees: allSelected }; },
  });
  assert.ok(f.elements.get('permissions-list').children.slice(0, 2).every(row => row.children[0].checked));
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  await f.click('save-permissions');
  assert.deepEqual(writes, []);
});

test('reverting every changed permission hides Salvar and pending feedback without a request', async () => {
  const writes = [];
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => ({ employees }),
    updatePermissions: async selected => { writes.push(selected); return { employees }; },
  });
  await changePermission(f, 0, true);
  await changePermission(f, 1, true);
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  await changePermission(f, 0, false);
  assert.equal(f.elements.get('save-permissions').hidden, false, 'Another employee still has an unsaved change');
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  await changePermission(f, 1, false);
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  await f.click('save-permissions');
  assert.deepEqual(writes, []);
});

test('leaving the scheduler clears its permission wait presentation while the pending write stays guarded', async () => {
  let finish;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => ({ employees }),
    updatePermissions: () => new Promise(resolve => { finish = resolve; }),
  });
  await changePermission(f);
  const pending = f.click('save-permissions');
  assert.equal(f.document.body.attributes['aria-busy'], 'true');
  f.dispatchWindow('pagehide');
  assert.equal(f.document.body.attributes['aria-busy'], 'false');
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  finish({ employees });
  await pending;
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  assert.equal(f.document.body.attributes['aria-busy'], 'false');
  assert.equal(f.elements.get('permissions-message').textContent, '');
});

for (const status of [401, 403]) {
  test(`permission Save clears wait state after authorization failure ${status}`, async () => {
    const navigations = [];
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => ({ card: null }), permissions: async () => ({ employees }),
      updatePermissions: async () => { throw { status }; },
    }, { runtime: { navigate: path => navigations.push(path) } });
    await changePermission(f);
    await f.click('save-permissions');
    assert.equal(f.document.body.attributes['aria-busy'], 'false');
    assert.equal(f.elements.get('save-permissions').attributes['aria-busy'], 'false');
    assert.equal(f.elements.get('save-permissions').textContent, 'Salvar');
    assert.equal(f.elements.get('permissions-message').textContent, '');
    if (status === 403) {
      assert.equal(f.elements.get('save-permissions').hidden, true);
      assert.equal(f.elements.get('permissions-pending').hidden, true);
      for (const id of ['admin-tools-divider', 'card-tab', 'card-panel']) assert.equal(f.elements.get(id).hidden, true);
      assert.equal(f.elements.get('appointments-panel').hidden, false);
    }
    assert.deepEqual(navigations, status === 401 ? ['/support-management/login/'] : []);
  });
}

test('failed Save preserves the selected draft for an idempotent retry without claiming success or doing extra reads', async () => {
  let reads = 0;
  let writes = 0;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => { reads++; return { employees }; },
    updatePermissions: async () => { if (++writes === 1) throw { status: 503 }; return { employees: employees.map(employee => ({ ...employee, allowed: employee.email === 'admin@example.test' })) }; },
  });
  const list = f.elements.get('permissions-list');
  const checkbox = list.children[0].children[0];
  checkbox.checked = true;
  await checkbox.listeners.change[0]();
  f.elements.get('save-permissions').focus();
  await f.click('save-permissions');
  assert.equal(list.children[0].children[0].checked, true);
  assert.equal(list.children[0].children[0].disabled, false);
  assert.match(f.elements.get('permissions-message').textContent, /Não foi possível confirmar/u);
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('save-permissions').disabled, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  assert.equal(f.document.activeElement, f.elements.get('save-permissions'), 'A failed save retains the visible retry control');
  assert.equal(f.document.body.attributes['aria-busy'], 'false');
  assert.equal(reads, 1);
  await f.click('save-permissions');
  assert.equal(writes, 2);
  assert.equal(f.elements.get('permissions-message').textContent, '');
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
});

test('reverting the draft after a failed save clears pending feedback without a retry', async () => {
  let writes = 0;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => ({ employees }),
    updatePermissions: async () => { writes++; throw { status: 503 }; },
  });
  await changePermission(f, 0, true);
  await f.click('save-permissions');
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  await changePermission(f, 0, false);
  assert.equal(f.elements.get('save-permissions').hidden, true);
  assert.equal(f.elements.get('permissions-pending').hidden, true);
  assert.equal(f.elements.get('permissions-message').textContent, '');
  await f.click('save-permissions');
  assert.equal(writes, 1);
});

test('members never request or display employee permissions', async () => {
  let reads = 0;
  let cardReads = 0;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Usuário' } }),
    card: async () => { cardReads++; return { card: null }; }, permissions: async () => { reads++; return { employees }; },
  });
  assert.equal(reads, 0);
  assert.equal(cardReads, 0);
  for (const id of ['admin-tools-divider', 'card-tab', 'card-panel', 'permissions-panel']) assert.equal(f.elements.get(id).hidden, true);
  assert.equal(f.elements.get('appointments-panel').hidden, false);
});

test('the card representation mirrors temporary entry but masks the CVV and clears with a tab change', async () => {
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }),
  });
  f.elements.get('number').value = '4000000000000010';
  await f.dispatch('number', 'input', {});
  f.elements.get('holder-name').value = 'test holder';
  await f.dispatch('holder-name', 'input', {});
  f.elements.get('exp-month').value = '12';
  f.elements.get('exp-year').value = '2030';
  await f.dispatch('exp-month', 'change', {});
  f.elements.get('cvv').value = '123';
  await f.dispatch('cvv', 'input', {});
  assert.equal(f.elements.get('card-preview-number').textContent, '4000 0000 0000 0010');
  assert.equal(f.elements.get('card-preview-holder').textContent, 'TEST HOLDER');
  assert.equal(f.elements.get('card-preview-expiry').textContent, '12/30');
  assert.equal(f.elements.get('card-preview-cvv').textContent, 'CVV ***');
  await f.click('appointments-tab');
  assert.equal(f.elements.get('card-preview-number').textContent, '•••• •••• •••• ••••');
  assert.equal(f.elements.get('card-preview-holder').textContent, 'NOME DO TITULAR');
  assert.equal(f.elements.get('card-preview-expiry').textContent, 'MM/AA');
  assert.equal(f.elements.get('cvv').value, '');
});

test('CVV typing clears prior feedback and preview updates do not validate an unfinished code', async () => {
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }),
  });
  f.elements.get('number').value = '4000000000000010';
  await f.dispatch('number', 'input', {});
  for (const value of ['1', '12']) {
    f.elements.get('cvv').value = value;
    await f.dispatch('cvv', 'input', {});
    assert.equal(f.elements.get('cvv-error').hidden, true);
    assert.equal(f.elements.get('cvv').validationMessage, '');
  }
  await f.dispatch('holder-name', 'input', {});
  await f.dispatch('exp-month', 'change', {});
  assert.equal(f.elements.get('cvv-error').hidden, true);
  await f.dispatch('cvv', 'blur', {});
  assert.equal(f.elements.get('cvv-error').textContent, 'Informe o código de segurança válido.');
  assert.equal(f.elements.get('cvv-error').hidden, false);
  f.elements.get('cvv').value = '1';
  await f.dispatch('cvv', 'input', {});
  assert.equal(f.elements.get('cvv-error').hidden, true);
  await f.dispatch('card-form', 'submit', { preventDefault() {} });
  assert.equal(f.elements.get('cvv-error').hidden, false, 'Submitting must still identify an incomplete code');
  f.elements.get('cvv').value = '123';
  await f.dispatch('cvv', 'input', {});
  await f.dispatch('cvv', 'blur', {});
  assert.equal(f.elements.get('cvv-error').hidden, true);
});

const cardFieldIds = ['number', 'holder-name', 'exp-month', 'exp-year', 'cvv'];
const cardFieldValues = ['4000 0000 0000 0010', 'TEST HOLDER', '12', '2030', '123'];

async function fillCard(f) {
  for (const [index, id] of cardFieldIds.entries()) {
    f.elements.get(id).value = cardFieldValues[index];
    await f.dispatch(id, ['exp-month', 'exp-year'].includes(id) ? 'change' : 'input', {});
  }
}

function assertCardCleared(f) {
  for (const id of cardFieldIds) assert.equal(f.elements.get(id).value, '');
  assert.equal(f.elements.get('card-preview-number').textContent, '•••• •••• •••• ••••');
  assert.equal(f.elements.get('card-preview-holder').textContent, 'NOME DO TITULAR');
  assert.equal(f.elements.get('card-preview-expiry').textContent, 'MM/AA');
  assert.equal(f.elements.get('card-preview-cvv').textContent, 'CVV ***');
}

for (const mutation of ['registration', 'synchronization']) {
  test(`successful card ${mutation} preloads a fresh calendar without blocking card controls`, async () => {
    const { submitCompanyCard } = loadClient();
    let initialized = false;
    let finishCalendar;
    let prefetch;
    let reads = 0;
    let invalidations = 0;
    let syncs = 0;
    const result = { card: registeredCompanyCard, cardRevision: CARD_REVISION };
    const appointmentController = {
      invalidate() { if (initialized) invalidations++; },
      load() {
        if (!initialized) return Promise.resolve();
        if (!prefetch) {
          reads++;
          prefetch = new Promise(resolve => { finishCalendar = resolve; });
        }
        return prefetch;
      },
    };
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => mutation === 'synchronization' ? pendingCompanyCard : { card: null },
      saveCard: async () => result,
      syncCard: async () => {
        if (++syncs === 1) throw { status: 503, code: 'support_management.workbook_sync_failed' };
        return result;
      },
    }, { appointmentController, runtime: { submitCompanyCard: args => submitCompanyCard({ ...args,
      transport: async () => ({ ok: true, json: async () => ({ id: 'token_example' }) }) }) } });
    initialized = true;
    if (mutation === 'registration') await fillCard(f);
    let settled = false;
    const saving = (mutation === 'registration' ? f.dispatch('card-form', 'submit', { preventDefault() {} })
      : f.click('retry-card-sync')).then(() => { settled = true; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(settled, true, 'Card controls cannot await the calendar network request');
    assert.equal(invalidations, 1);
    assert.equal(reads, 1);
    assert.equal(f.elements.get('save-card').disabled, false);
    assert.equal(f.elements.get('retry-card-sync').disabled, false);
    assert.notEqual(f.elements.get('card-form').attributes['aria-busy'], 'true');
    assert.equal(f.elements.get('card-summary').hidden, false);
    const tab = f.click('appointments-tab');
    assert.equal(f.elements.get('appointments-panel').hidden, false);
    assert.equal(reads, 1, 'Tab access shares the prefetched calendar request');
    finishCalendar();
    await Promise.all([saving, tab]);
  });
}

for (const role of ['Administrador', 'Usuário']) {
  test(`a session refresh started before card registration cannot restore its old missing-card context: ${role}`, async () => {
    let finishSession;
    let sessionStarted;
    let registered = false;
    let paymentRegistered;
    let prefetches = 0;
    const started = new Promise(resolve => { sessionStarted = resolve; });
    const initial = { user: { name: 'Admin', role: 'Administrador' }, config: { publicKey: 'pk_test_synthetic' },
      card: { card: null }, calendar: { paymentMethodRegistered: false } };
    const f = await loadScheduler({
      bootstrap: () => ({ context: initial, refresh: true }),
      session: () => { sessionStarted(); return new Promise(resolve => { finishSession = resolve; }); },
      card: async () => registered ? { card: registeredCompanyCard, cardRevision: CARD_REVISION } : { card: null },
    }, { activateCard: false, appointmentController: {
      invalidate() {},
      async load(result) {
        if (result) paymentRegistered = result.paymentMethodRegistered;
        else if (registered) { prefetches++; paymentRegistered = true; }
      },
    }, runtime: {
      submitCompanyCard: async ({ clear }) => {
        registered = true;
        clear();
        return { card: registeredCompanyCard, cardRevision: CARD_REVISION };
      },
      duringInitialization: async ({ elements }) => {
        await started;
        for (const callback of elements.get('card-tab').listeners.click) await callback({});
        for (const [index, id] of cardFieldIds.entries()) {
          elements.get(id).value = cardFieldValues[index];
          const event = ['exp-month', 'exp-year'].includes(id) ? 'change' : 'input';
          for (const callback of elements.get(id).listeners[event]) await callback({});
        }
        for (const callback of elements.get('card-form').listeners.submit) await callback({ preventDefault() {} });
        assert.equal(paymentRegistered, true);
        finishSession({ ...initial, user: { name: 'Current user', role } });
      },
    } });
    assert.equal(paymentRegistered, true, 'An older session payload cannot reinstate a missing-card calendar');
    assert.ok(prefetches >= 1);
    assert.equal(f.elements.get('header-user-name').textContent, 'Current user', 'Fresh identity must still apply');
    if (role === 'Administrador') {
      assert.equal(f.elements.get('card-summary').hidden, false);
      assert.match(f.elements.get('card-number').textContent, /0010/u);
      assert.equal(f.elements.get('card-editor').hidden, true);
    } else {
      assert.equal(f.elements.get('card-tab').hidden, true);
      assert.equal(f.elements.get('card-panel').hidden, true);
      assert.equal(f.elements.get('appointments-panel').hidden, false);
    }
  });
}

for (const failed of [false, true]) {
  test(`scheduler logout clears its card and navigates before ${failed ? 'failed' : 'successful'} revocation finishes`, async () => {
    let finish;
    let revocations = 0;
    const navigations = [];
    const stopped = [];
    const revocation = new Promise((resolve, reject) => {
      finish = () => failed ? reject(new Error('synthetic connection failure')) : resolve({ ok: true, status: 204 });
    });
    const { createSupportClient, values } = loadClient(async (url, options) => {
      if (url.endsWith('/logout')) {
        revocations++;
        assert.equal(options.headers.Authorization, 'Bearer session-example');
        assert.equal(options.keepalive, true);
        return revocation;
      }
      if (url.endsWith('/session')) return { ok: true, json: async () => ({ expiresAt: Date.now() + 60000,
        user: { name: 'Admin', role: 'Administrador' }, config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' } }) };
      if (url.endsWith('/card')) return { ok: true, json: async () => ({ card: null }) };
      if (url.endsWith('/permissions')) return { ok: true, json: async () => ({ employees: [] }) };
      throw new Error('Unexpected synthetic request');
    });
    values.set('supportManagementToken', 'session-example');
    const f = await loadScheduler(createSupportClient(), { runtime: {
      navigate: (target) => navigations.push(target), setInterval: () => 'session-timer', clearInterval: (timer) => stopped.push(timer),
    } });
    await fillCard(f);
    assert.ok(values.has('supportManagementContext'));
    const clicked = f.click('logout');
    assert.deepEqual(navigations, ['/support-management/login/'], 'Navigation must happen in the click handler without awaiting the server');
    assert.equal(values.size, 0);
    assertCardCleared(f);
    assert.ok(stopped.includes('session-timer'));
    await clicked;
    await f.click('logout');
    assert.equal(revocations, 1);
    assert.equal(navigations.length, 1);
    finish();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(values.size, 0);
    assert.equal(navigations.length, 1);
  });
}

for (const phase of ['tokenization', 'backend']) {
  for (const accepted of [true, false]) {
    test(`card fields stay visible and locked during ${phase}, then clear on ${accepted ? 'success' : 'failure'}`, async () => {
      const { submitCompanyCard } = loadClient();
      let finish;
      let submittedCard;
      let submittedData;
      let tokenizations = 0;
      let registrations = 0;
      const pendingPhase = new Promise((resolve, reject) => {
        finish = () => accepted ? resolve(phase === 'tokenization'
          ? { ok: true, json: async () => ({ id: 'token_example' }) }
          : { card: registeredCompanyCard, cardRevision: CARD_REVISION }) : reject({ status: 503 });
      });
      const f = await loadScheduler({
        config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
        card: async () => ({ card: null }),
        saveCard: async (token) => {
          registrations++;
          assert.equal(token, 'token_example');
          return phase === 'backend' ? pendingPhase : { card: registeredCompanyCard, cardRevision: CARD_REVISION };
        },
      }, { runtime: {
        onFormData(data) { submittedData = data; },
        submitCompanyCard: (args) => {
          submittedCard = args.card;
          return submitCompanyCard({ ...args, transport: async (url, options) => {
            tokenizations++;
            assert.equal(JSON.parse(options.body).card.number, '4000000000000010');
            assert.equal(JSON.parse(options.body).card.cvv, '123');
            return phase === 'tokenization' ? pendingPhase : { ok: true, json: async () => ({ id: 'token_example' }) };
          } });
        },
      } });
      await fillCard(f);
      const pending = f.dispatch('card-form', 'submit', { preventDefault() {} });
      await new Promise(resolve => setImmediate(resolve));
      for (const [index, id] of cardFieldIds.entries()) {
        assert.equal(f.elements.get(id).value, cardFieldValues[index]);
        assert.equal(f.elements.get(id).disabled, true);
      }
      assert.equal(submittedData.get('cvv'), '123', 'Values must be captured before controls are disabled');
      assert.equal(f.elements.get('card-preview-number').textContent, cardFieldValues[0]);
      assert.equal(f.elements.get('card-preview-holder').textContent, cardFieldValues[1]);
      assert.equal(f.elements.get('card-preview-expiry').textContent, '12/30');
      assert.equal(f.elements.get('card-preview-cvv').textContent, 'CVV ***');
      assert.equal(f.elements.get('card-form').attributes['aria-busy'], 'true');
      assert.equal(f.elements.get('save-card').disabled, true);
      await f.dispatch('card-form', 'submit', { preventDefault() {} });
      assert.equal(tokenizations, 1);
      assert.equal(registrations, phase === 'backend' ? 1 : 0);
      finish();
      await pending;
      assertCardCleared(f);
      assert.ok(Object.values(submittedCard).every(value => value === ''));
      assert.deepEqual([...submittedData.keys()], []);
      for (const id of cardFieldIds) assert.equal(f.elements.get(id).disabled, false);
      assert.equal(f.elements.get('save-card').disabled, false);
      assert.equal(f.elements.get('card-form').attributes['aria-busy'], 'false');
      assert.equal(f.elements.get('card-summary').hidden, !accepted);
    });
  }
}

for (const departure of ['tab', 'pagehide', 'logout', 'expiry', 'downgrade']) {
  test(`pending card data is cleared on ${departure} before the request settles`, async () => {
    const { submitCompanyCard } = loadClient();
    let finish;
    let submittedCard;
    let submittedData;
    let registrations = 0;
    let now = 1000;
    let timer;
    const pendingToken = new Promise(resolve => { finish = resolve; });
    const navigations = [];
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }),
      session: async () => ({ user: { role: 'Administrador' }, expiresAt: 2000 }),
      card: async () => ({ card: null }), logout: async () => {}, clearSession() {},
      permissions: async () => ({ employees }), updatePermissions: async () => { throw { status: 403 }; },
      saveCard: async () => { registrations++; return { card: registeredCompanyCard, cardRevision: CARD_REVISION }; },
    }, { runtime: {
      now: () => now, setInterval: (callback) => { timer = callback; return 1; }, clearInterval() {},
      navigate: (target) => navigations.push(target), onFormData: (data) => { submittedData = data; },
      submitCompanyCard: (args) => { submittedCard = args.card; return submitCompanyCard({ ...args, transport: () => pendingToken }); },
    } });
    await fillCard(f);
    const pending = f.dispatch('card-form', 'submit', { preventDefault() {} });
    if (departure === 'tab') await f.click('appointments-tab');
    else if (departure === 'pagehide') f.dispatchWindow('pagehide');
    else if (departure === 'logout') await f.click('logout');
    else if (departure === 'downgrade') { await changePermission(f); await f.click('save-permissions'); }
    else { now = 2000; timer(); }
    assertCardCleared(f);
    assert.ok(Object.values(submittedCard).every(value => value === ''));
    assert.deepEqual([...submittedData.keys()], []);
    if (departure === 'logout' || departure === 'expiry') assert.deepEqual(navigations, ['/support-management/login/']);
    finish({ ok: true, json: async () => ({ id: 'token_example' }) });
    await pending;
    assertCardCleared(f);
    if (departure === 'downgrade') {
      assert.equal(registrations, 0, 'Losing administrator access during tokenization must not submit a card registration');
      assert.equal(f.elements.get('card-panel').hidden, true);
    }
  });
}

test('administrator bootstrap caches only safe employee flags alongside booking authorization', async () => {
  const { createSupportClient } = loadClient(async () => ({ ok: true, json: async () => ({
    token: 'session-example', expiresAt: Date.now() + 60000,
    user: { name: 'Admin', role: 'Administrador', bookingAllowed: true },
    config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' },
    calendar: { canBook: true },
    permissions: { employees: employees.map(employee => ({ ...employee, password: 'PRIVATE', providerId: 'PRIVATE' })) },
  }) }));
  const client = createSupportClient();
  await client.login('admin@example.test', 'synthetic-password');
  const context = client.bootstrap().context;
  assert.equal(context.user.bookingAllowed, true);
  assert.equal(context.calendar.canBook, true);
  assert.deepEqual(JSON.parse(JSON.stringify(context.permissions.employees)), employees);
});

test('a permissions bootstrap renders immediately without an extra employee read on tab revisits', async () => {
  let reads = 0;
  const f = await loadScheduler({
    bootstrap: () => ({ context: { user: { role: 'Administrador' }, config: { publicKey: 'pk_test_synthetic' },
      card: { card: null }, permissions: { employees } }, refresh: false }),
    permissions: async () => { reads++; throw new Error('Unexpected repeat read'); },
  });
  assert.equal(f.elements.get('permissions-list').children.length, 3);
  await f.click('appointments-tab');
  await f.click('card-tab');
  assert.equal(reads, 0);
});

test('an administrator losing access during permission editing cannot retain active account mutation controls', async () => {
  let deletions = 0;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: registeredCompanyCard, cardRevision: CARD_REVISION }),
    permissions: async () => ({ employees }), updatePermissions: async () => { throw { status: 403 }; },
    deleteCard: async () => { deletions++; return { card: null }; },
  });
  const checkbox = f.elements.get('permissions-list').children[0].children[0];
  checkbox.checked = true;
  await checkbox.listeners.change[0]();
  await f.click('edit-card');
  assert.equal(f.elements.get('card-delete-actions').hidden, false);
  await f.click('save-permissions');
  for (const id of ['permissions-panel', 'edit-card', 'card-editor', 'retry-card-sync', 'card-delete-actions', 'admin-tools-divider', 'card-tab', 'card-panel']) assert.equal(f.elements.get(id).hidden, true);
  assert.equal(f.elements.get('appointments-panel').hidden, false);
  assert.equal(checkbox.disabled, true);
  await f.click('confirm-delete-card');
  assert.equal(deletions, 0);
});

for (const destination of ['save-button', 'other-control', 'other-tab']) {
  test(`permission Save restores focus only when the user has not moved away: ${destination}`, async () => {
    let finish;
    const f = await loadScheduler({
      config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
      card: async () => ({ card: null }), permissions: async () => ({ employees }),
      updatePermissions: () => new Promise(resolve => { finish = resolve; }),
    });
    const checkbox = f.elements.get('permissions-list').children[1].children[0];
    checkbox.checked = true;
    await checkbox.listeners.change[0]();
    const save = f.elements.get('save-permissions');
    save.focus();
    const pending = f.click('save-permissions');
    f.document.activeElement = { tagName: 'BODY' };
    let expected;
    if (destination === 'other-control') {
      expected = f.elements.get('number'); expected.focus();
    } else if (destination === 'other-tab') {
      expected = f.elements.get('appointments-tab'); expected.focus(); await f.click('appointments-tab');
    }
    finish({ employees: employees.map(employee => ({ ...employee, allowed: employee.email === 'colleague@example.test' })) });
    await pending;
    if (destination === 'save-button') {
      const editedCheckbox = f.elements.get('permissions-list').children[1].children[0];
      assert.equal(f.document.activeElement, editedCheckbox);
      assert.equal(editedCheckbox.focusOptions.preventScroll, true);
      assert.equal(editedCheckbox.disabled, false);
      assert.equal(save.hidden, true);
    } else assert.equal(f.document.activeElement, expected);
  });
}


test('old autosave permission caches are refreshed before the explicit Save flow can use them', () => {
  const { createSupportClient, values } = loadClient();
  values.set('supportManagementToken', 'session-example');
  values.set('supportManagementContext', JSON.stringify({ token: 'session-example', fromLogin: true, savedAt: Date.now(), context: {
    user: { name: 'Admin', role: 'Administrador' }, expiresAt: Date.now() + 60000,
    config: { environment: 'sandbox', publicKey: 'pk_test_synthetic' }, permissions: { employees },
  } }));
  const cached = createSupportClient().bootstrap();
  assert.equal(cached.refresh, true);
  assert.equal(cached.context.permissions, undefined);
});

for (const role of ['Administrador', 'Usuário']) {
  test(`background session refresh preserves an unsaved permission draft unless access is removed: ${role}`, async () => {
    let finish;
    let entered;
    const started = new Promise(resolve => { entered = resolve; });
    const initial = { user: { name: 'Admin', role: 'Administrador' }, config: { publicKey: 'pk_test_synthetic' },
      card: { card: null }, permissions: { employees } };
    const f = await loadScheduler({
      bootstrap: () => ({ context: initial, refresh: true }),
      session: () => { entered(); return new Promise(resolve => { finish = resolve; }); },
      card: async () => ({ card: null }), permissions: async () => ({ employees }),
    }, { runtime: { duringInitialization: async ({ elements }) => {
      await started;
      for (const callback of elements.get('card-tab').listeners.click) await callback({});
      const checkbox = elements.get('permissions-list').children[0].children[0];
      checkbox.checked = true;
      await checkbox.listeners.change[0]();
      finish({ ...initial, user: { name: 'Admin', role }, permissions: { employees: employees.map(employee => ({ ...employee, allowed: false })) } });
    } } });
    if (role === 'Administrador') {
      assert.equal(f.elements.get('permissions-list').children[0].children[0].checked, true);
      assert.equal(f.elements.get('admin-tools-divider').hidden, false);
      assert.equal(f.elements.get('card-tab').hidden, false);
    }
    else {
      assert.equal(f.elements.get('permissions-panel').hidden, true);
      assert.equal(f.elements.get('save-permissions').disabled, true);
      for (const id of ['admin-tools-divider', 'card-tab', 'card-panel']) assert.equal(f.elements.get(id).hidden, true);
      assert.equal(f.elements.get('appointments-panel').hidden, false);
      assert.equal(f.document.activeElement, f.elements.get('appointments-tab'));
    }
  });
}


test('a stale employee list requires a refresh instead of replaying an obsolete permission batch', async () => {
  let writes = 0;
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => ({ employees }),
    updatePermissions: async () => { writes++; throw { status: 404, code: 'support_management.employee_not_found' }; },
  });
  await changePermission(f);
  await f.click('save-permissions');
  assert.match(f.elements.get('permissions-message').textContent, /Atualize a página/u);
  assert.equal(f.elements.get('save-permissions').disabled, true);
  assert.equal(f.elements.get('save-permissions').hidden, false);
  assert.equal(f.elements.get('permissions-pending').hidden, false);
  assert.ok(f.elements.get('permissions-list').children.every(row => row.children[0].disabled));
  await f.click('save-permissions');
  assert.equal(writes, 1);
});


test('Save completion invalidates a calendar loaded while the permission request was pending without adding an automatic read', async () => {
  let finish;
  const events = [];
  const f = await loadScheduler({
    config: async () => ({ publicKey: 'pk_test_synthetic' }), session: async () => ({ user: { role: 'Administrador' } }),
    card: async () => ({ card: null }), permissions: async () => ({ employees }),
    updatePermissions: () => { events.push('save-pending'); return new Promise(resolve => { finish = resolve; }); },
  }, { appointmentController: { load: async () => { events.push('calendar-read'); }, invalidate: () => { events.push('invalidate'); } } });
  await changePermission(f);
  events.length = 0;
  const pending = f.click('save-permissions');
  await f.click('appointments-tab');
  assert.deepEqual(events, ['invalidate', 'save-pending', 'calendar-read']);
  finish({ employees });
  await pending;
  assert.deepEqual(events, ['invalidate', 'save-pending', 'calendar-read', 'invalidate']);
});
