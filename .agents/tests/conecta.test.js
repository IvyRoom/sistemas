'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    '..',
    'apps',
    'referrals-management',
    'referral-form',
    'main.js',
  ),
  'utf8',
);

function createClassList() {
  const classes = new Set();

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
  clipboardImplementation = async () => {},
  clipboardIsAvailable = true,
  fetchImplementation = async () => ({
    ok: true,
    json: async () => ({}),
  }),
  hostname = 'machadogestao.com',
  reducedMotion = false,
  returningVisitor = false,
  search = '?ncr=Ana%20Silva&eb=Empresa%20Exemplo',
  storageGetError = null,
  storageSetError = null,
} = {}) {
  const alerts = [];
  const clearedTimeouts = [];
  const clipboardWrites = [];
  const consoleErrors = [];
  const fetchCalls = [];
  const promptCalls = [];
  const scrollCalls = [];
  const storageWrites = [];
  const timeoutCalls = [];
  let nextTimeoutId = 1;

  function createElement(name, { hidden = false, textContent = '', value = '' } = {}) {
    const attributes = new Map();
    const listeners = new Map();

    return {
      classList: createClassList(),
      disabled: false,
      focusCount: 0,
      hidden,
      name,
      scrollIntoViewCalls: [],
      textContent,
      validationMessage: '',
      value,
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      dispatch(type, event = {}) {
        const listener = listeners.get(type);
        assert.ok(listener, `Missing ${type} listener for ${name}`);
        return listener(event);
      },
      focus() {
        this.focusCount += 1;
      },
      getAttribute(attributeName) {
        return attributes.get(attributeName) ?? null;
      },
      getBoundingClientRect() {
        return { top: 40 };
      },
      querySelector() {
        return null;
      },
      scrollIntoView(options) {
        this.scrollIntoViewCalls.push(options);
      },
      setAttribute(attributeName, attributeValue) {
        attributes.set(attributeName, String(attributeValue));
      },
      setCustomValidity(message) {
        this.validationMessage = message;
      },
    };
  }

  const body = createElement('body');
  const aboutToggle = createElement('about toggle');
  const recommendToggle = createElement('recommend toggle');
  const aboutSection = createElement('about section');
  const recommendSection = createElement('recommend section');
  aboutSection.querySelector = (selector) => selector === '.section-toggle' ? aboutToggle : null;
  recommendSection.querySelector = (selector) => selector === '.section-toggle' ? recommendToggle : null;

  const form = createElement('recommendation form');
  const invalidLinkNotice = createElement('invalid link notice', { hidden: true });
  const submitButton = createElement('submit button', { textContent: 'CADASTRAR' });
  const newRecommendationButton = createElement('new recommendation button');
  const successCompanyName = createElement('success company');
  const formSuccess = createElement('form success');
  const copyStatus = createElement('copy status');
  const recommenderName = createElement('recommender name');
  const benefitedCompany = createElement('benefited company');
  const recommendedCompany = createElement('recommended company');
  const recommendedProfessional = createElement('recommended professional');
  const recommendedWhatsapp = createElement('recommended WhatsApp');

  const ids = new Map([
    ['section-about', aboutSection],
    ['section-recommend', recommendSection],
    ['recommender-name', recommenderName],
    ['benefited-company', benefitedCompany],
    ['recommended-company', recommendedCompany],
    ['recommended-professional', recommendedProfessional],
    ['recommended-whatsapp', recommendedWhatsapp],
  ]);

  form.reportValidityCalls = 0;
  form.reportValidity = () => {
    form.reportValidityCalls += 1;
    return [recommendedCompany, recommendedProfessional, recommendedWhatsapp]
      .every((field) => field.value.trim() !== '' && field.validationMessage === '');
  };

  const copyLinks = [
    'https://www.instagram.com/machado.gestao/',
    'https://machadogestao.com/',
  ];
  const copyLinkButtons = copyLinks.map((href, index) => {
    const button = createElement(`copy button ${index + 1}`);
    button.closest = (selector) => {
      assert.equal(selector, 'li');
      return {
        querySelector(anchorSelector) {
          assert.equal(anchorSelector, 'a');
          return { href };
        },
      };
    };
    return button;
  });

  const selectors = new Map([
    ['.form', form],
    ['.invalid-link-notice', invalidLinkNotice],
    ['.submit-button', submitButton],
    ['.new-recommendation-button', newRecommendationButton],
    ['.success-company', successCompanyName],
    ['.form-success', formSuccess],
    ['.copy-status', copyStatus],
  ]);

  const location = {
    hostname,
    search,
  };
  const mediaQuery = (query) => {
    assert.equal(query, '(prefers-reduced-motion: reduce)');
    return { matches: reducedMotion };
  };
  const window = {
    alert(message) {
      alerts.push(message);
    },
    location,
    matchMedia: mediaQuery,
    prompt(...args) {
      promptCalls.push(args);
    },
    scrollTo(options) {
      scrollCalls.push(options);
    },
    scrollY: 100,
  };

  const navigator = clipboardIsAvailable
    ? {
      clipboard: {
        async writeText(value) {
          clipboardWrites.push(value);
          return clipboardImplementation(value);
        },
      },
    }
    : {};

  const sandbox = {
    AbortController,
    URLSearchParams,
    alert: window.alert,
    clearTimeout(timeoutId) {
      clearedTimeouts.push(timeoutId);
    },
    console: {
      error(...args) {
        consoleErrors.push(args);
      },
    },
    document: {
      body,
      getElementById(id) {
        const element = ids.get(id);
        assert.ok(element, `Unexpected element id: ${id}`);
        return element;
      },
      querySelector(selector) {
        const element = selectors.get(selector);
        assert.ok(element, `Unexpected selector: ${selector}`);
        return element;
      },
      querySelectorAll(selector) {
        if (selector === '.accordion-section') return [aboutSection, recommendSection];
        if (selector === '.copy-link-button') return copyLinkButtons;
        assert.fail(`Unexpected selector list: ${selector}`);
      },
    },
    async fetch(url, options) {
      fetchCalls.push({ options, url });
      return fetchImplementation(url, options);
    },
    localStorage: {
      getItem(key) {
        assert.equal(key, 'conecta-returning-visitor');
        if (storageGetError) throw storageGetError;
        return returningVisitor ? '1' : null;
      },
      setItem(key, value) {
        if (storageSetError) throw storageSetError;
        storageWrites.push([key, value]);
      },
    },
    location,
    matchMedia: mediaQuery,
    navigator,
    setTimeout(callback, delay) {
      const timeoutId = nextTimeoutId;
      nextTimeoutId += 1;
      timeoutCalls.push({ callback, delay, timeoutId });
      return timeoutId;
    },
    window,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(source, context);

  function fillValidRecommendation() {
    recommendedCompany.value = 'Empresa Recomendada';
    recommendedProfessional.value = 'Bruno Souza';
    recommendedWhatsapp.value = '+55 41 99679-9092';
  }

  function read(expression) {
    return vm.runInContext(expression, context);
  }

  function submitThroughButton() {
    if (submitButton.disabled) return { defaultPrevented: false, dispatched: false };
    let defaultPrevented = false;
    form.dispatch('submit', {
      preventDefault() {
        defaultPrevented = true;
      },
    });
    return { defaultPrevented, dispatched: true };
  }

  return {
    aboutSection,
    aboutToggle,
    alerts,
    benefitedCompany,
    body,
    clearedTimeouts,
    clipboardWrites,
    consoleErrors,
    context,
    copyLinkButtons,
    copyStatus,
    fetchCalls,
    fillValidRecommendation,
    form,
    formSuccess,
    invalidLinkNotice,
    newRecommendationButton,
    promptCalls,
    read,
    recommendSection,
    recommendToggle,
    recommendedCompany,
    recommendedProfessional,
    recommendedWhatsapp,
    recommenderName,
    scrollCalls,
    storageWrites,
    submitButton,
    submitThroughButton,
    successCompanyName,
    timeoutCalls,
  };
}

async function settleAsyncWork() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

const legacyWhatsappCases = [
  ['mask full number', 'maskWhatsapp', '5541996799092', '+55 41 99679-9092'],
  ['mask is idempotent', 'maskWhatsapp', '+55 41 99679-9092', '+55 41 99679-9092'],
  ['mask country code only', 'maskWhatsapp', '55', '+55'],
  ['mask up to area code', 'maskWhatsapp', '5541', '+55 41'],
  ['mask partial subscriber', 'maskWhatsapp', '554199679', '+55 41 99679'],
  ['mask caps overflow digits', 'maskWhatsapp', '55419967990921111', '+55 41 99679-9092'],
  ['mask strips non-digits', 'maskWhatsapp', 'ab(55)41 c', '+55 41'],
  ['mask empty stays empty', 'maskWhatsapp', '', ''],
  ['complete number is valid', 'isCompleteWhatsapp', '+55 41 99679-9092', true],
  ['8-digit subscriber is invalid', 'isCompleteWhatsapp', '+55 41 9967-9092', false],
  ['missing plus sign is invalid', 'isCompleteWhatsapp', '55 41 99679-9092', false],
  ['missing area code is invalid', 'isCompleteWhatsapp', '+55 99679-9092', false],
  ['empty is invalid', 'isCompleteWhatsapp', '', false],
];

for (const [name, functionName, input, expected] of legacyWhatsappCases) {
  test(`WhatsApp: ${name}`, () => {
    const harness = createHarness();
    assert.equal(harness.read(functionName)(input), expected);
  });
}

test('personalized ncr/eb parameters are decoded, trimmed, and displayed', () => {
  const harness = createHarness({
    search: '?ncr=%20Ana+M%C3%A1rcia%20&eb=%20A%26B+Consultoria%20',
  });

  assert.equal(harness.recommenderName.value, 'Ana Márcia');
  assert.equal(harness.benefitedCompany.value, 'A&B Consultoria');
  assert.equal(harness.form.hidden, false);
  assert.equal(harness.invalidLinkNotice.hidden, true);
});

test('missing or blank personalized parameters expose only the invalid-link failure', async (t) => {
  const cases = [
    ['both missing', ''],
    ['ncr missing', '?eb=Empresa'],
    ['eb missing', '?ncr=Ana'],
    ['ncr blank', '?ncr=%20&eb=Empresa'],
    ['eb blank', '?ncr=Ana&eb=%20'],
  ];

  for (const [name, search] of cases) {
    await t.test(name, () => {
      const harness = createHarness({ search });
      assert.equal(harness.form.hidden, true);
      assert.equal(harness.invalidLinkNotice.hidden, false);
      assert.equal(harness.fetchCalls.length, 0);
    });
  }
});

test('first visitors open About, record the visit, and keep Recommend collapsed', () => {
  const harness = createHarness({ returningVisitor: false });

  assert.equal(harness.aboutSection.classList.contains('is-open'), true);
  assert.equal(harness.recommendSection.classList.contains('is-open'), false);
  assert.equal(harness.aboutToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.recommendToggle.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(harness.storageWrites, [['conecta-returning-visitor', '1']]);
});

test('returning visitors open Recommend and keep About collapsed', () => {
  const harness = createHarness({ returningVisitor: true });

  assert.equal(harness.aboutSection.classList.contains('is-open'), false);
  assert.equal(harness.recommendSection.classList.contains('is-open'), true);
  assert.equal(harness.aboutToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.recommendToggle.getAttribute('aria-expanded'), 'true');
});

test('unavailable visitor storage leaves the first-visit section state functional', () => {
  const harness = createHarness({
    storageGetError: new Error('read denied'),
    storageSetError: new Error('write denied'),
  });

  assert.equal(harness.aboutSection.classList.contains('is-open'), true);
  assert.equal(harness.recommendSection.classList.contains('is-open'), false);
  assert.deepEqual(harness.storageWrites, []);
});

test('WhatsApp input masks live, clears stale errors, and blocks incomplete submissions', () => {
  const harness = createHarness();
  harness.fillValidRecommendation();
  harness.recommendedWhatsapp.validationMessage = 'stale error';
  harness.recommendedWhatsapp.value = '55419967';

  harness.recommendedWhatsapp.dispatch('input');

  assert.equal(harness.recommendedWhatsapp.value, '+55 41 9967');
  assert.equal(harness.recommendedWhatsapp.validationMessage, '');
  const submission = harness.submitThroughButton();
  assert.equal(submission.dispatched, true);
  assert.equal(submission.defaultPrevented, true);
  assert.equal(harness.form.reportValidityCalls, 1);
  assert.equal(
    harness.recommendedWhatsapp.validationMessage,
    'Informe o WhatsApp no formato +XX XX XXXXX-XXXX, incluindo o código do país e o DDD.',
  );
  assert.equal(harness.fetchCalls.length, 0);
});

test('production submission uses the exact endpoint and trimmed payload', async () => {
  const harness = createHarness({
    hostname: 'machadogestao.com',
    search: '?ncr=%20Ana+Silva%20&eb=%20Empresa+Beneficiada%20',
  });
  harness.recommendedCompany.value = '  Empresa Recomendada  ';
  harness.recommendedProfessional.value = '  Bruno Souza  ';
  harness.recommendedWhatsapp.value = '  +55 41 99679-9092  ';

  await harness.read('submitForm')();

  assert.equal(harness.fetchCalls.length, 1);
  const [{ options, url }] = harness.fetchCalls;
  assert.equal(
    url,
    'https://plataforma-backend-v3.azurewebsites.net/conecta/processa-recomendacao',
  );
  assert.equal(options.method, 'POST');
  assert.deepEqual({ ...options.headers }, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(options.body), {
    recommenderFullName: 'Ana Silva',
    benefitedCompany: 'Empresa Beneficiada',
    recommendedCompany: 'Empresa Recomendada',
    recommendedProfessional: 'Bruno Souza',
    recommendedWhatsapp: '+55 41 99679-9092',
  });
  assert.equal(options.signal.aborted, false);
  assert.equal(harness.timeoutCalls[0].delay, 60000);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test('localhost source previews post only to the localhost Conecta stub', async (t) => {
  for (const hostname of ['localhost', '127.0.0.1']) {
    await t.test(hostname, async () => {
      const harness = createHarness({ hostname });
      harness.fillValidRecommendation();

      await harness.read('submitForm')();

      assert.equal(harness.fetchCalls.length, 1);
      assert.equal(
        harness.fetchCalls[0].url,
        'http://localhost:3000/conecta/processa-recomendacao',
      );
    });
  }
});

test('the disabled submit control prevents a second user submission while pending', async () => {
  let resolveResponse;
  const pendingResponse = new Promise((resolve) => {
    resolveResponse = resolve;
  });
  const harness = createHarness({
    fetchImplementation: () => pendingResponse,
  });
  harness.fillValidRecommendation();

  const firstSubmission = harness.submitThroughButton();
  const duplicateSubmission = harness.submitThroughButton();

  assert.equal(firstSubmission.dispatched, true);
  assert.equal(firstSubmission.defaultPrevented, true);
  assert.equal(duplicateSubmission.dispatched, false);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.submitButton.disabled, true);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'true');
  assert.equal(harness.submitButton.textContent, 'Enviando…');
  assert.equal(harness.body.classList.contains('is-submitting'), true);

  resolveResponse({ ok: true, json: async () => ({}) });
  await settleAsyncWork();

  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.submitButton.disabled, false);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'false');
  assert.equal(harness.submitButton.textContent, 'CADASTRAR');
  assert.equal(harness.body.classList.contains('is-submitting'), false);
});

test('known server errors map exactly and restore the completed form', async (t) => {
  const messages = {
    Erro_014: 'Erro_014: dados inválidos ou incompletos.\nRevise o preenchimento e tente novamente.',
    Erro_015: 'Erro_015: falha de comunicação com a base de dados de recomendações.\nTente novamente.',
    Erro_016: 'Erro_016: recomendante não encontrado.\nUtilize o link personalizado que você recebeu por e-mail.',
    Erro_017: 'Erro_017: falha ao atualizar a base de dados de recomendações.\nTente novamente.',
    Erro_018: 'Erro_018: falha ao enviar os e-mails de confirmação.\nTente novamente.',
  };

  for (const [errorCode, expectedMessage] of Object.entries(messages)) {
    await t.test(errorCode, async () => {
      const harness = createHarness({
        fetchImplementation: async () => ({
          ok: false,
          json: async () => ({ error: errorCode }),
        }),
      });
      harness.fillValidRecommendation();

      await harness.read('submitForm')();

      assert.deepEqual(harness.alerts, [expectedMessage]);
      assert.equal(harness.form.classList.contains('form--submitted'), false);
      assert.equal(harness.recommendedCompany.value, 'Empresa Recomendada');
      assert.equal(harness.recommendedProfessional.value, 'Bruno Souza');
      assert.equal(harness.recommendedWhatsapp.value, '+55 41 99679-9092');
      assert.equal(harness.submitButton.disabled, false);
      assert.equal(harness.submitButton.getAttribute('aria-busy'), 'false');
      assert.equal(harness.submitButton.textContent, 'CADASTRAR');
      assert.equal(harness.body.classList.contains('is-submitting'), false);
      assert.equal(harness.consoleErrors.length, 1);
      assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
    });
  }
});

test('unknown failures use the communication fallback and restore controls', async () => {
  const harness = createHarness({
    fetchImplementation: async () => {
      throw new Error('offline');
    },
  });
  harness.fillValidRecommendation();

  await harness.read('submitForm')();

  assert.deepEqual(harness.alerts, [
    'Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.',
  ]);
  assert.equal(harness.form.classList.contains('form--submitted'), false);
  assert.equal(harness.submitButton.disabled, false);
  assert.equal(harness.submitButton.textContent, 'CADASTRAR');
  assert.equal(harness.body.classList.contains('is-submitting'), false);
});

test('submission timeout aborts the request and restores controls', async () => {
  const harness = createHarness({
    fetchImplementation: async (_url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }),
  });
  harness.fillValidRecommendation();
  const submission = harness.read('submitForm')();

  assert.equal(harness.timeoutCalls.length, 1);
  assert.equal(harness.timeoutCalls[0].delay, 60000);
  harness.timeoutCalls[0].callback();
  await submission;

  assert.equal(harness.fetchCalls[0].options.signal.aborted, true);
  assert.deepEqual(harness.alerts, [
    'Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.',
  ]);
  assert.equal(harness.submitButton.disabled, false);
  assert.equal(harness.submitButton.getAttribute('aria-busy'), 'false');
  assert.equal(harness.submitButton.textContent, 'CADASTRAR');
  assert.equal(harness.body.classList.contains('is-submitting'), false);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test('successful submission presents the company and reset clears only recommendation fields', async () => {
  const harness = createHarness();
  harness.fillValidRecommendation();

  await harness.read('submitForm')();

  assert.deepEqual(harness.alerts, []);
  assert.equal(harness.successCompanyName.textContent, 'Empresa Recomendada');
  assert.equal(harness.form.classList.contains('form--submitted'), true);
  assert.deepEqual(harness.formSuccess.scrollIntoViewCalls.map((options) => ({ ...options })), [
    { block: 'center', behavior: 'smooth' },
  ]);

  harness.newRecommendationButton.dispatch('click');

  assert.equal(harness.recommendedCompany.value, '');
  assert.equal(harness.recommendedProfessional.value, '');
  assert.equal(harness.recommendedWhatsapp.value, '');
  assert.equal(harness.recommenderName.value, 'Ana Silva');
  assert.equal(harness.benefitedCompany.value, 'Empresa Exemplo');
  assert.equal(harness.form.classList.contains('form--submitted'), false);
  assert.equal(harness.recommendedCompany.focusCount, 1);
});

test('reduced-motion preference disables smooth accordion and success scrolling', async () => {
  const harness = createHarness({ reducedMotion: true });
  harness.fillValidRecommendation();

  harness.recommendToggle.dispatch('click');

  assert.equal(harness.recommendSection.classList.contains('is-open'), true);
  assert.equal(harness.aboutSection.classList.contains('is-open'), false);
  assert.deepEqual(
    harness.scrollCalls.map((options) => ({ ...options })),
    [{ top: 130, behavior: 'auto' }],
  );

  await harness.read('submitForm')();

  assert.deepEqual(harness.formSuccess.scrollIntoViewCalls.map((options) => ({ ...options })), [
    { block: 'center', behavior: 'auto' },
  ]);
});

test('copy writes the exact URL, announces success, and resets its feedback', async () => {
  const harness = createHarness();
  const copiedButton = harness.copyLinkButtons[1];

  await copiedButton.dispatch('click');

  assert.deepEqual(harness.clipboardWrites, ['https://machadogestao.com/']);
  assert.equal(copiedButton.classList.contains('is-copied'), true);
  assert.equal(harness.copyStatus.textContent, 'Link copiado!');
  const feedbackTimeout = harness.timeoutCalls.find(({ delay }) => delay === 2000);
  assert.ok(feedbackTimeout);

  feedbackTimeout.callback();

  assert.equal(copiedButton.classList.contains('is-copied'), false);
  assert.equal(harness.copyStatus.textContent, '');
});

test('copy rejection opens the exact manual fallback without false success', async () => {
  const harness = createHarness({
    clipboardImplementation: async () => {
      throw new Error('denied');
    },
  });
  const fallbackButton = harness.copyLinkButtons[0];

  await fallbackButton.dispatch('click');

  assert.deepEqual(harness.promptCalls, [[
    'Não foi possível copiar automaticamente. Copie o link:',
    'https://www.instagram.com/machado.gestao/',
  ]]);
  assert.equal(fallbackButton.classList.contains('is-copied'), false);
  assert.equal(harness.copyStatus.textContent, '');
  assert.equal(harness.consoleErrors.length, 1);
});

test('missing Clipboard API uses the same manual copy fallback', async () => {
  const harness = createHarness({ clipboardIsAvailable: false });
  const fallbackButton = harness.copyLinkButtons[1];

  await fallbackButton.dispatch('click');

  assert.deepEqual(harness.promptCalls, [[
    'Não foi possível copiar automaticamente. Copie o link:',
    'https://machadogestao.com/',
  ]]);
  assert.equal(fallbackButton.classList.contains('is-copied'), false);
});
