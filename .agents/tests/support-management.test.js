'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

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

test('only token and billing address reach the company backend, followed by clearing', async () => {
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
  assert.deepEqual(JSON.parse(calls[0].options.body), { token: 'token_example', billingAddress: address });
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
  assert.match(elements.get('login-message').textContent, /E-mail ou senha inválidos/u);
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

async function loadScheduler(client, { activateCard = true, appointmentController } = {}) {
  const elements = new Map();
  function element(tagName, attributes = '') {
    const attribute = (name) => attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, 'u'))?.[1] ?? null;
    return {
      id: attribute('id') || '', tagName: tagName.toUpperCase(), value: '', textContent: '',
      hidden: /(?:^|\s)hidden(?:\s|$)/u.test(attributes), disabled: false,
      required: /(?:^|\s)required(?:\s|$)/u.test(attributes), maxLength: Number(attribute('maxlength') ?? -1),
      selectionStart: null, dataset: {}, listeners: {}, attributes: {},
      addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name] ?? attribute(name); },
      setCustomValidity(value) { this.validationMessage = value; },
      append() {}, focus() { this.focused = true; },
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
  elements.get('card-form').reset = () => {
    for (const node of elements.values()) if (['INPUT', 'SELECT'].includes(node.tagName)) node.value = '';
  };
  const context = vm.createContext({
    document: { getElementById: (id) => elements.get(id) || null,
      querySelector: (selector) => selector === '.intro' ? introduction : footer,
      createElement: (tagName) => element(tagName) },
    window: { addEventListener() {}, location: { replace() { throw new Error('Unexpected navigation'); } } },
    createSupportClient: () => client, LOGIN_PATH: '/support-management/login/',
    createAppointments: () => appointmentController || ({ load: async () => {} }),
    submitCompanyCard: () => { throw new Error('Unexpected card registration'); },
  });
  const fields = fs.readFileSync(path.join(root, 'modules/card-fields.js'), 'utf8');
  vm.runInContext(fields.replace(/export /gu, ''), context);
  const source = fs.readFileSync(path.join(root, 'scheduler/main.js'), 'utf8');
  await vm.runInContext(`(async () => { ${source.replace(/^import .*;\r?\n/gmu, '')} })()`, context);
  if (activateCard) for (const callback of elements.get('card-tab').listeners.click || []) await callback({});
  return { elements, introduction, footer,
    async click(id) { for (const callback of elements.get(id).listeners.click || []) await callback({}); } };
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
  assert.equal(elements.get('header-title').textContent, 'Cadastro de Cartão');
  assert.equal(elements.get('appointments-panel').hidden, true);
  assert.equal(elements.get('card-panel').hidden, false);
  assert.equal(elements.get('card-tab').attributes['aria-selected'], 'true');
  await click('appointments-tab');
  assert.equal(elements.get('header-title').textContent, 'Agendamento: Atendimentos Consultivos');
  await click('card-tab');
  assert.equal(reads, 1);
});

const pendingCompanyCard = {
  card: { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030 }, workbookSyncPending: true,
};

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
    card: { card: { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030, number: 'excluded', cvv: 'excluded' } }
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
  assert.equal(nextPage.bootstrap().refresh, true, 'A reload must revalidate the displayed cache with the server');
  values.set('supportManagementToken', 'another-user');
  assert.equal(nextPage.bootstrap(), null);
  assert.equal(values.has('supportManagementContext'), false);
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
    card: async () => { cardReads++; return { card: { brand: 'Visa', lastFour: '0010', expMonth: 12, expYear: 2030 } }; },
  }, { appointmentController });
  assert.equal(calendarReads, 1, 'A missing fresh calendar must retry its route instead of retaining the old gate');
  assert.equal(cardReads, 1, 'A missing fresh card must not consume the old null wallet snapshot');
  assert.equal(elements.get('card-summary').hidden, false);
  assert.match(elements.get('card-number').textContent, /0010/u);
});
