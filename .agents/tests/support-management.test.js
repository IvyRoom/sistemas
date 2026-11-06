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

async function loadScheduler(client) {
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
    submitCompanyCard: () => { throw new Error('Unexpected card registration'); },
  });
  const fields = fs.readFileSync(path.join(root, 'modules/card-fields.js'), 'utf8');
  vm.runInContext(fields.replace(/export /gu, ''), context);
  const source = fs.readFileSync(path.join(root, 'scheduler/main.js'), 'utf8');
  await vm.runInContext(`(async () => { ${source.replace(/^import .*;\r?\n/gmu, '')} })()`, context);
  return { elements, introduction, footer,
    async click(id) { for (const callback of elements.get(id).listeners.click || []) await callback({}); } };
}

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
