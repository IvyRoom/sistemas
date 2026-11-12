import { BACKEND_ORIGIN } from '../../shared/backend-origin.js';

export const TOKEN_KEY = 'supportManagementToken';
const CONTEXT_KEY = 'supportManagementContext';
export const LOGIN_PATH = '/atendimentos/login/';
export const SCHEDULER_PATH = '/atendimentos/agendamento/';

function runtimeEnvironment(location) {
  if (location?.protocol === 'http:' && location.hostname === '127.0.0.1') return 'sandbox';
  if (location?.origin === 'https://machadogestao.com') return 'production';
  throw new Error('support_unavailable');
}

export function validateSupportConfig(config, location = globalThis.location) {
  const environment = runtimeEnvironment(location);
  const keyPattern = environment === 'production' ? /^pk_(?!test_)[A-Za-z0-9_-]+$/u : /^pk_test_[A-Za-z0-9_-]+$/u;
  if (config?.environment !== environment || typeof config.publicKey !== 'string'
    || !keyPattern.test(config.publicKey)) throw new Error('support_unavailable');
  return config;
}

export function createSupportClient({ fetch: transport = globalThis.fetch, storage = globalThis.sessionStorage, location = globalThis.location } = {}) {
  function endpoint(path) {
    const origin = runtimeEnvironment(location) === 'production' ? BACKEND_ORIGIN : '';
    return `${origin}/atendimentos/api${path}`;
  }
  function clearSession() {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(CONTEXT_KEY);
  }

  function rememberContext(result, fromLogin = false) {
    const token = storage.getItem(TOKEN_KEY);
    if (!token || !Number.isFinite(result?.expiresAt) || result.expiresAt <= Date.now()) return;
    const safeCard = result.card?.card;
    const context = {
      user: result.user && { name: result.user.name, company: result.user.company, role: result.user.role, email: result.user.email, bookingAllowed: result.user.bookingAllowed === true },
      expiresAt: result.expiresAt,
      config: result.config && { environment: result.config.environment, publicKey: result.config.publicKey },
      calendar: result.calendar,
      ...(result.user?.role === 'Administrador' && Array.isArray(result.permissions?.employees) ? { permissions: {
        saveMode: 'explicit',
        employees: result.permissions.employees.map(({ email, name, allowed, active }) => ({ email, name, allowed: allowed === true, active: active === true }))
      } } : {}),
      card: result.card && { card: safeCard ? { brand: safeCard.brand, lastFour: safeCard.lastFour, expMonth: safeCard.expMonth, expYear: safeCard.expYear } : null,
        verificationRequired: Boolean(result.card.verificationRequired), workbookSyncPending: Boolean(result.card.workbookSyncPending),
        cardDeletionPending: Boolean(result.card.cardDeletionPending),
        ...(/^[a-f0-9]{64}$/u.test(result.card.cardRevision || '') ? { cardRevision: result.card.cardRevision } : {}) }
    };
    try { storage.setItem(CONTEXT_KEY, JSON.stringify({ token, context, fromLogin, savedAt: Date.now() })); }
    catch { storage.removeItem(CONTEXT_KEY); }
  }

  function bootstrap() {
    try {
      const saved = JSON.parse(storage.getItem(CONTEXT_KEY) || 'null');
      const context = saved?.context;
      if (!saved || saved.token !== storage.getItem(TOKEN_KEY) || !Number.isFinite(context?.expiresAt) || context.expiresAt <= Date.now()
        || typeof context.user?.name !== 'string' || typeof context.user?.role !== 'string') {
        storage.removeItem(CONTEXT_KEY);
        return null;
      }
      validateSupportConfig(context.config, location);
      const stalePermissions = context.permissions && context.permissions.saveMode !== 'explicit';
      if (stalePermissions) delete context.permissions;
      const refresh = Boolean(stalePermissions) || !saved.fromLogin || Date.now() - saved.savedAt > 60000;
      saved.fromLogin = false;
      storage.setItem(CONTEXT_KEY, JSON.stringify(saved));
      return { context: saved.context, refresh };
    } catch {
      storage.removeItem(CONTEXT_KEY);
      return null;
    }
  }

  async function request(path, { method = 'GET', body, timeoutMs = 20000 } = {}) {
    const token = storage.getItem(TOKEN_KEY);
    const response = await transport(endpoint(path), {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
      const error = new Error('support_request_failed');
      error.status = response.status;
      try { error.code = (await response.json()).error; }
      catch { /* An unavailable service may return a non-JSON error. */ }
      if (response.status === 401) clearSession();
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    async config() {
      const config = await request('/config');
      return validateSupportConfig(config, location);
    },
    async login(email, password) {
      const result = await request('/login', { method: 'POST', body: { email, password } });
      if (typeof result.token !== 'string' || !result.token) throw new Error('session_unavailable');
      storage.setItem(TOKEN_KEY, result.token);
      storage.removeItem(CONTEXT_KEY);
      rememberContext(result, true);
      return result;
    },
    async session() {
      const result = await request('/session');
      rememberContext(result);
      return result;
    },
    bootstrap,
    discardBootstrap: () => storage.removeItem(CONTEXT_KEY),
    clearSession,
    calendar: () => request('/calendar'),
    async reserveDate(reservation) {
      const result = await request('/reservations', { method: 'POST', body: reservation, timeoutMs: 120000 });
      storage.removeItem(CONTEXT_KEY);
      return result;
    },
    card: () => request('/card'),
    permissions: () => request('/permissions'),
    async updatePermissions(employees) {
      storage.removeItem(CONTEXT_KEY);
      return request('/permissions', { method: 'PATCH', body: { employees } });
    },
    async deleteCard(expectedCardRevision) {
      if (typeof expectedCardRevision !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedCardRevision)) throw new Error('card_revision_required');
      storage.removeItem(CONTEXT_KEY);
      return request('/card', { method: 'DELETE', body: { expectedCardRevision }, timeoutMs: 120000 });
    },
    async saveCard(token) {
      const result = await request('/card', { method: 'PUT', body: { token }, timeoutMs: 120000 });
      storage.removeItem(CONTEXT_KEY);
      return result;
    },
    async syncCard() {
      const result = await request('/card/sync', { method: 'POST', timeoutMs: 120000 });
      storage.removeItem(CONTEXT_KEY);
      return result;
    },
    async logout() {
      const token = storage.getItem(TOKEN_KEY);
      clearSession();
      if (!token) return;
      const response = await transport(endpoint('/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        keepalive: true,
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        const error = new Error('support_request_failed');
        error.status = response.status;
        try { error.code = (await response.json()).error; }
        catch { /* An unavailable service may return a non-JSON error. */ }
        throw error;
      }
    }
  };
}

export async function tokenizeCard(publicKey, card, transport = globalThis.fetch, config = { environment: 'sandbox', publicKey }) {
  validateSupportConfig(config);
  if (config.publicKey !== publicKey) throw new Error('support_unavailable');
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

export async function submitCompanyCard({ publicKey, config, card, client, transport, clear, isCurrent = () => true }) {
  try {
    const token = await tokenizeCard(publicKey, card, transport, config);
    if (!isCurrent()) throw new Error('session_ended');
    return await client.saveCard(token);
  } finally {
    clear();
  }
}
