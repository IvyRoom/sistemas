export const TOKEN_KEY = 'supportManagementToken';
export const LOGIN_PATH = '/support-management/login/';
export const SCHEDULER_PATH = '/support-management/scheduler/';

export function createSupportClient({ fetch: transport = globalThis.fetch, storage = globalThis.sessionStorage } = {}) {
  async function request(path, { method = 'GET', body } = {}) {
    const token = storage.getItem(TOKEN_KEY);
    const response = await transport(`/support-management/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) {
      const error = new Error('support_request_failed');
      error.status = response.status;
      try { error.code = (await response.json()).error; }
      catch { /* An unavailable service may return a non-JSON error. */ }
      if (response.status === 401) storage.removeItem(TOKEN_KEY);
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    async config() {
      const config = await request('/config');
      if (config.environment !== 'sandbox' || !/^pk_test_[A-Za-z0-9_-]+$/.test(config.publicKey)) throw new Error('sandbox_unavailable');
      return config;
    },
    async login(email, password) {
      const result = await request('/login', { method: 'POST', body: { email, password } });
      if (typeof result.token !== 'string' || !result.token) throw new Error('session_unavailable');
      storage.setItem(TOKEN_KEY, result.token);
      return result;
    },
    session: () => request('/session'),
    card: () => request('/card'),
    saveCard: (token, billingAddress) => request('/card', { method: 'PUT', body: { token, billingAddress } }),
    async logout() {
      try { await request('/logout', { method: 'POST' }); }
      finally { storage.removeItem(TOKEN_KEY); }
    }
  };
}

export async function tokenizeCard(publicKey, card, transport = globalThis.fetch) {
  if (!/^pk_test_[A-Za-z0-9_-]+$/.test(publicKey)) throw new Error('sandbox_unavailable');
  const response = await transport(`https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ type: 'card', card: {
      holder_name: card.holderName.trim(),
      number: card.number.replace(/\s/g, ''),
      exp_month: Number(card.expMonth),
      exp_year: Number(card.expYear),
      cvv: card.cvv
    } })
  });
  if (!response.ok) throw new Error('card_tokenization_failed');
  const result = await response.json();
  if (typeof result.id !== 'string' || !/^token_[A-Za-z0-9]+$/.test(result.id)) throw new Error('card_tokenization_failed');
  return result.id;
}

export async function submitCompanyCard({ publicKey, card, billingAddress, client, transport, clear, isCurrent = () => true }) {
  try {
    const token = await tokenizeCard(publicKey, card, transport);
    if (!isCurrent()) throw new Error('session_ended');
    return await client.saveCard(token, billingAddress);
  } finally {
    clear();
  }
}
