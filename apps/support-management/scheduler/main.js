import { createSupportClient, LOGIN_PATH, submitCompanyCard } from '../modules/client.js';
import { getCardDetails, formatCardNumber, formatCardholder, formatPostalCode, formatSecurityCode, formatStreetNumber, normalizeText, validateCardFields } from '../modules/card-fields.js';
import { createAppointments } from '../modules/appointments.js';

const client = createSupportClient();
const message = document.getElementById('scheduler-message');
const form = document.getElementById('card-form');
const editor = document.getElementById('card-editor');
const edit = document.getElementById('edit-card');
const save = document.getElementById('save-card');
const cancel = document.getElementById('cancel-card');
const retrySync = document.getElementById('retry-card-sync');
const introduction = document.querySelector('.intro');
const footer = document.querySelector('.checkout-footer');
const cardInputs = Object.fromEntries([
  ['number', 'number'], ['holderName', 'holder-name'], ['expMonth', 'exp-month'],
  ['expYear', 'exp-year'], ['cvv', 'cvv']
].map(([key, id]) => [key, document.getElementById(id)]));
const addressInputs = ['line-1', 'street-number', 'line-2', 'neighborhood', 'city', 'state', 'zip-code']
  .map((id) => document.getElementById(id));
const formatters = new Map();
let publicKey;
let administrator = false;
let busy = false;
let leaving = false;
let reviewRequired = false;
let hasCard = false;
let workbookSyncPending = false;
let initialized = false;
let activeTab = 'appointments';
let cardLoaded = false;
let cardLoading;
let cardSnapshot;
let sessionTimer;
const appointments = createAppointments({ client, onAuthFailure: authFailure, isCurrent: () => !leaving });
const tabs = ['appointments', 'card'];

async function selectTab(name, { calendar } = {}) {
  activeTab = name;
  document.getElementById('header-title').textContent = name === 'card' ? 'Cadastro de Cartão' : 'Agendamento: Atendimentos Consultivos';
  for (const tab of tabs) {
    const selected = tab === name;
    const button = document.getElementById(`${tab}-tab`);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    document.getElementById(`${tab}-panel`).hidden = !selected;
  }
  if (name !== 'card') clearCard();
  if (!initialized) return;
  if (name === 'card') await loadCard();
  else await appointments.load(calendar);
}

for (const [index, tab] of tabs.entries()) {
  const button = document.getElementById(`${tab}-tab`);
  button.addEventListener('click', () => selectTab(tab));
  button.addEventListener('keydown', (event) => {
    const target = event.key === 'ArrowDown' ? (index + 1) % tabs.length
      : event.key === 'ArrowUp' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    document.getElementById(`${tabs[target]}-tab`).focus();
    void selectTab(tabs[target]);
  });
}

const currentYear = new Date().getFullYear();
for (let year = currentYear; year <= currentYear + 20; year++) {
  const option = document.createElement('option');
  option.value = String(year);
  option.textContent = String(year).slice(-2);
  document.getElementById('exp-year').append(option);
}

function showFieldError(input, text = '') {
  input.setCustomValidity(text);
  input.setAttribute('aria-invalid', String(Boolean(text)));
  const error = document.getElementById(`${input.id}-error`);
  if (error) {
    error.textContent = text;
    error.hidden = !text;
  }
}

function updateCardPreview() {
  const details = getCardDetails(cardInputs.number.value);
  const badge = document.getElementById('card-brand');
  const status = document.getElementById('card-brand-status');
  badge.dataset.brand = details.brand;
  badge.hidden = status.hidden = !details.label;
  if (badge.textContent !== details.label) badge.textContent = status.textContent = details.label;
  cardInputs.cvv.maxLength = details.codeSize;
  cardInputs.cvv.pattern = details.brand === 'unknown' ? '[0-9]{3,4}' : `[0-9]{${details.codeSize}}`;
  cardInputs.cvv.value = formatSecurityCode(cardInputs.cvv.value, details);
  if (cardInputs.cvv.value || cardInputs.cvv.getAttribute('aria-invalid') === 'true') showFieldError(cardInputs.cvv, cardErrors().cvv);
}

function bindFormatter(input, formatter, afterInput = () => {}) {
  formatters.set(input, formatter);
  function apply(value = input.value, caret = input.selectionStart) {
    const formatted = formatter(value).slice(0, input.maxLength > 0 ? input.maxLength : undefined);
    const position = caret === null ? null : Math.min(formatter(value.slice(0, caret)).length, formatted.length);
    if (input.value !== formatted) {
      input.value = formatted;
      if (position !== null) input.setSelectionRange(position, position);
    }
    showFieldError(input);
    afterInput();
  }
  input.addEventListener('input', (event) => { if (!event.isComposing) apply(); });
  input.addEventListener('compositionend', () => apply());
  input.addEventListener('paste', (event) => {
    if (!event.clipboardData) return;
    event.preventDefault();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const text = event.clipboardData.getData('text');
    apply(input.value.slice(0, start) + text + input.value.slice(end), start + text.length);
  });
}

function cardErrors() {
  return validateCardFields(Object.fromEntries(Object.entries(cardInputs).map(([key, input]) => [key, input.value])));
}

function validateAddress(input) {
  const value = normalizeText(input.value);
  const error = input.required && !value ? 'Preencha este campo.'
    : input.id === 'zip-code' && value.replace(/\D/gu, '').length !== 8 ? 'Informe um CEP com 8 dígitos.' : '';
  showFieldError(input, error);
}

bindFormatter(cardInputs.number, formatCardNumber, updateCardPreview);
bindFormatter(cardInputs.holderName, formatCardholder);
bindFormatter(cardInputs.cvv, (value) => formatSecurityCode(value, getCardDetails(cardInputs.number.value)));
for (const [key, input] of Object.entries(cardInputs)) {
  const validate = () => {
    if (key === 'holderName') input.value = normalizeText(input.value);
    const errors = cardErrors();
    if (key === 'expMonth' || key === 'expYear') {
      for (const expiry of ['expMonth', 'expYear']) {
        const field = cardInputs[expiry];
        if (expiry === key || field.value || field.getAttribute('aria-invalid') === 'true') showFieldError(field, errors[expiry]);
      }
    } else showFieldError(input, errors[key]);
  };
  input.addEventListener('blur', validate);
  if (input.tagName === 'SELECT') input.addEventListener('change', validate);
}
for (const input of addressInputs) {
  if (input.tagName !== 'SELECT') {
    const formatter = input.id === 'zip-code' ? formatPostalCode : input.id === 'street-number' ? formatStreetNumber
      : (value) => String(value).replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ');
    bindFormatter(input, formatter);
  } else input.addEventListener('change', () => validateAddress(input));
  input.addEventListener('blur', () => { input.value = normalizeText(input.value); validateAddress(input); });
}

function clearCard() {
  form.reset();
  for (const input of [...Object.values(cardInputs), ...addressInputs]) showFieldError(input);
  updateCardPreview();
}
window.addEventListener('pagehide', clearCard);
window.addEventListener('pagehide', () => globalThis.clearInterval?.(sessionTimer));

function authFailure(error) {
  if (error.status !== 401) return false;
  leaving = true;
  client.clearSession?.();
  globalThis.clearInterval?.(sessionTimer);
  clearCard();
  window.location.replace(LOGIN_PATH);
  return true;
}

function handleReviewRequired(error) {
  if (error.code !== 'support_management.card_review_required') return false;
  reviewRequired = true;
  edit.hidden = true;
  retrySync.hidden = true;
  editor.hidden = true;
  clearCard();
  message.textContent = 'O cadastro precisa ser conferido no Pagar.me antes de uma nova tentativa. Entre em contato com o suporte.';
  return true;
}

function closeEditor() {
  clearCard();
  editor.hidden = hasCard;
  edit.setAttribute('aria-expanded', 'false');
  if (hasCard) edit.focus();
  else document.getElementById('number').focus();
}

function renderCard(card, syncPending = false, verificationRequired = false) {
  hasCard = Boolean(card);
  workbookSyncPending = syncPending;
  introduction.textContent = card
    ? 'O cartão de crédito corporativo cadastrado abaixo será utilizado para a contratação dos atendimentos consultivos.'
    : 'Cadastre abaixo o cartão de crédito corporativo que será utilizado para a contratação dos atendimentos consultivos.';
  footer.hidden = hasCard;
  editor.hidden = !administrator || hasCard || reviewRequired;
  document.getElementById('card-summary').hidden = !card;
  document.getElementById('empty-card').hidden = Boolean(card) || administrator;
  if (card) {
    document.getElementById('card-number').textContent = `${card.brand} •••• ${card.lastFour}`;
    document.getElementById('card-expiry').textContent = `Validade: ${String(card.expMonth).padStart(2, '0')}/${card.expYear}`;
  }
  edit.hidden = !administrator || !card || syncPending;
  retrySync.hidden = !administrator || !syncPending;
  message.textContent = verificationRequired ? 'O cartão precisa ser validado novamente. Cadastre-o abaixo.'
    : syncPending ? 'O cartão foi cadastrado, mas a sincronização com BD - USUÁRIOS está pendente.' : '';
  cancel.hidden = !card;
  save.textContent = card ? 'Salvar cartão' : 'Cadastrar cartão';
}

document.getElementById('logout').addEventListener('click', async () => {
  leaving = true;
  clearCard();
  try { await client.logout(); }
  catch { /* Local session cleanup also applies when the connection fails. */ }
  finally { window.location.replace(LOGIN_PATH); }
});

edit.addEventListener('click', () => {
  if (!administrator || busy || reviewRequired || workbookSyncPending) return;
  editor.hidden = false;
  edit.setAttribute('aria-expanded', 'true');
  cardInputs.number.focus();
});
cancel.addEventListener('click', closeEditor);

retrySync.addEventListener('click', async () => {
  if (!administrator || busy || !workbookSyncPending) return;
  busy = true;
  retrySync.disabled = true;
  message.textContent = 'Sincronizando cadastro...';
  try {
    const result = await client.syncCard();
    if (!leaving) {
      cardSnapshot = undefined;
      renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired));
      appointments.invalidate?.();
    }
  } catch (error) {
    if (leaving || authFailure(error) || handleReviewRequired(error)) return;
    if (error.code === 'support_management.card_verification_required') {
      try {
        const result = await client.card();
        if (!leaving) renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired));
      } catch (refreshError) {
        if (!leaving && !authFailure(refreshError) && !handleReviewRequired(refreshError)) {
          message.textContent = 'Não foi possível carregar o cadastro de cartão. Atualize a página para tentar novamente.';
        }
      }
      return;
    }
    if (error.status === 403) {
      administrator = false;
      retrySync.hidden = true;
    }
    message.textContent = 'Não foi possível sincronizar o cartão com BD - USUÁRIOS. Tente novamente.';
  } finally {
    busy = false;
    retrySync.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!administrator || busy || leaving || reviewRequired || workbookSyncPending) return;
  for (const [input, formatter] of formatters) input.value = normalizeText(formatter(input.value));
  updateCardPreview();
  const errors = cardErrors();
  for (const [key, input] of Object.entries(cardInputs)) showFieldError(input, errors[key]);
  addressInputs.forEach(validateAddress);
  if (!form.reportValidity()) {
    message.textContent = 'Confira os campos indicados.';
    return;
  }
  busy = true;
  save.disabled = true;
  cancel.disabled = true;
  edit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  message.textContent = 'Salvando cartão...';
  const data = new FormData(form);
  const card = Object.fromEntries(['holderName', 'number', 'expMonth', 'expYear', 'cvv'].map((key) => [key, data.get(key)]));
  const billingAddress = {
    line_1: `${data.get('streetNumber').trim()}, ${data.get('line1').trim()}, ${data.get('neighborhood').trim()}`,
    ...(data.get('line2').trim() ? { line_2: data.get('line2').trim() } : {}),
    zip_code: data.get('zipCode').replace(/\D/g, ''),
    city: data.get('city').trim(),
    state: data.get('state'),
    country: 'BR'
  };
  clearCard();
  try {
    const result = await submitCompanyCard({ publicKey, card, billingAddress, client, clear: clearCard, isCurrent: () => !leaving });
    if (leaving) return;
    cardSnapshot = undefined;
    renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired));
    appointments.invalidate?.();
    closeEditor();
  } catch (error) {
    if (leaving || authFailure(error) || handleReviewRequired(error)) return;
    if (error.status === 403) {
      administrator = false;
      edit.hidden = true;
      editor.hidden = true;
      message.textContent = 'Somente administradores podem alterar o cartão.';
    } else if (error.code === 'support_management.card_verification_failed') {
      message.textContent = 'O cartão não foi aprovado na validação do Pagar.me. Confira os dados ou utilize outro cartão.';
    } else if (error.status === 409) {
      message.textContent = 'Já existe um cadastro em andamento. Aguarde e atualize a página antes de tentar novamente.';
    } else {
      message.textContent = 'Não foi possível confirmar o cadastro. Atualize a página para consultar o cartão antes de tentar novamente.';
    }
  } finally {
    for (const key of Object.keys(card)) card[key] = '';
    for (const key of Array.from(data.keys())) data.delete(key);
    busy = false;
    save.disabled = false;
    cancel.disabled = false;
    edit.disabled = false;
    form.setAttribute('aria-busy', 'false');
  }
});

function loadCard() {
  if (cardLoaded && cardSnapshot === undefined) return Promise.resolve();
  if (cardLoading) return cardLoading;
  cardLoading = Promise.resolve().then(async () => {
    try {
      let result = cardSnapshot ?? await client.card();
      cardSnapshot = undefined;
      if (result.workbookSyncPending && !result.verificationRequired && administrator) {
        try { result = await client.syncCard(); }
        catch (error) {
          if (error.status === 401 || error.code === 'support_management.card_review_required') throw error;
          if (error.status === 403) administrator = false;
          if (error.code === 'support_management.card_verification_required') result = await client.card();
        }
      }
      if (leaving) return;
      renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired));
      document.getElementById('member-notice').hidden = administrator;
      cardLoaded = true;
    } catch (error) {
      if (!leaving && !authFailure(error) && !handleReviewRequired(error)) message.textContent = 'Não foi possível carregar o cadastro de cartão. Atualize a página para tentar novamente.';
    } finally {
      cardLoading = undefined;
    }
  });
  return cardLoading;
}

async function initializeSession(result, { fromCache = false } = {}) {
  const config = result.config || await client.config();
  if (config.environment !== undefined && config.environment !== 'sandbox') throw new Error('sandbox_unavailable');
  if (!/^pk_test_[A-Za-z0-9_-]+$/u.test(config.publicKey || '')) throw new Error('sandbox_unavailable');
  publicKey = config.publicKey;
  const { user } = result;
  document.getElementById('header-user-name').textContent = user.name || '';
  globalThis.clearInterval?.(sessionTimer);
  if (Number.isFinite(result.expiresAt)) {
    const updateSessionTime = () => {
      if (leaving) return;
      const remaining = Math.max(0, Math.floor((result.expiresAt - Date.now()) / 1000));
      const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
      const minutes = String(Math.floor(remaining % 3600 / 60)).padStart(2, '0');
      const seconds = String(remaining % 60).padStart(2, '0');
      document.getElementById('header-session-time').textContent = `Tempo Sessão: ${hours}:${minutes}:${seconds}`;
      if (!remaining) authFailure({ status: 401 });
    };
    updateSessionTime();
    if (leaving) return;
    if (typeof globalThis.setInterval === 'function') sessionTimer = globalThis.setInterval(updateSessionTime, 1000);
  }
  administrator = user.role === 'Administrador';
  if (result.card !== undefined) cardSnapshot = result.card;
  else if (!fromCache) {
    cardSnapshot = undefined;
    cardLoaded = false;
  }
  if (result.calendar === undefined && !fromCache) appointments.invalidate?.();
  initialized = true;
  document.getElementById('member-notice').hidden = administrator;
  await selectTab(activeTab, { calendar: result.calendar });
}

try {
  let cached = client.bootstrap?.();
  if (cached?.context) {
    try { await initializeSession(cached.context, { fromCache: true }); }
    catch {
      client.discardBootstrap?.();
      cached = null;
      cardSnapshot = undefined;
      cardLoaded = false;
      initialized = false;
      appointments.invalidate?.();
    }
  }
  if (!leaving && (!cached?.context || cached.refresh)) {
    const current = await client.session();
    if (!leaving) await initializeSession(current);
  }
} catch (error) {
  if (!authFailure(error)) document.getElementById(activeTab === 'card' ? 'scheduler-message' : 'appointments-message').textContent = 'Não foi possível carregar a ferramenta. Atualize a página para tentar novamente.';
}
