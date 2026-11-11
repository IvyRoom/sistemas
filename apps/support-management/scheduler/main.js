import { createSupportClient, LOGIN_PATH, submitCompanyCard } from '../modules/client.js';
import { getCardDetails, formatCardNumber, formatCardholder, formatSecurityCode, normalizeText, validateCardFields } from '../modules/card-fields.js';
import { createAppointments } from '../modules/appointments.js';

const client = createSupportClient();
const message = document.getElementById('scheduler-message');
const form = document.getElementById('card-form');
const editor = document.getElementById('card-editor');
const removeCard = document.getElementById('edit-card');
const save = document.getElementById('save-card');
const cancel = document.getElementById('cancel-card');
const retrySync = document.getElementById('retry-card-sync');
const deleteDialog = document.getElementById('delete-card-dialog');
const confirmDelete = document.getElementById('confirm-delete-card');
const cancelDelete = document.getElementById('cancel-delete-card');
const deleteMessage = document.getElementById('delete-card-message');
const introduction = document.querySelector('.intro');
const footer = document.querySelector('.checkout-footer');
const permissionsPanel = document.getElementById('permissions-panel');
const permissionsList = document.getElementById('permissions-list');
const permissionsMessage = document.getElementById('permissions-message');
const savePermissions = document.getElementById('save-permissions');
const cardInputs = Object.fromEntries([
  ['number', 'number'], ['holderName', 'holder-name'], ['expMonth', 'exp-month'],
  ['expYear', 'exp-year'], ['cvv', 'cvv']
].map(([key, id]) => [key, document.getElementById(id)]));
const formatters = new Map();
let publicKey;
let administrator = false;
let busy = false;
let leaving = false;
let reviewRequired = false;
let hasCard = false;
let workbookSyncPending = false;
let cardDeletionPending = false;
let cardRevision;
let initialized = false;
let activeTab = 'appointments';
let cardLoaded = false;
let cardLoading;
let cardSnapshot;
let sessionTimer;
let permissionsLoaded = false;
let permissionsLoading;
let permissionsSnapshot;
let permissionsBusy = false;
let permissionInputs = [];
let permissionsVersion = 0;
let permissionsDirty = false;
let permissionsRefreshRequired = false;
let permissionEmployees = [];
const appointments = createAppointments({ client, onAuthFailure: authFailure, isCurrent: () => !leaving });
const tabs = ['appointments', 'card'];

async function selectTab(name, { calendar } = {}) {
  activeTab = name;
  document.getElementById('header-title').textContent = name === 'card' ? 'Configurações da Conta PJ' : 'Agendamento: Atendimentos Consultivos';
  for (const tab of tabs) {
    const selected = tab === name;
    const button = document.getElementById(`${tab}-tab`);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    document.getElementById(`${tab}-panel`).hidden = !selected;
  }
  if (name !== 'card') clearCard();
  if (!initialized) return;
  if (name === 'card') await Promise.all([loadCard(), loadPermissions()]);
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
  document.getElementById('card-preview-number').textContent = cardInputs.number.value || '•••• •••• •••• ••••';
  document.getElementById('card-preview-holder').textContent = cardInputs.holderName.value.toLocaleUpperCase('pt-BR') || 'NOME DO TITULAR';
  document.getElementById('card-preview-expiry').textContent = `${String(cardInputs.expMonth.value || 'MM').padStart(2, '0')}/${cardInputs.expYear.value ? String(cardInputs.expYear.value).slice(-2) : 'AA'}`;
  document.getElementById('card-preview-cvv').textContent = 'CVV ***';
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

bindFormatter(cardInputs.number, formatCardNumber, updateCardPreview);
bindFormatter(cardInputs.holderName, formatCardholder, updateCardPreview);
bindFormatter(cardInputs.cvv, (value) => formatSecurityCode(value, getCardDetails(cardInputs.number.value)), updateCardPreview);
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
    updateCardPreview();
  };
  input.addEventListener('blur', validate);
  if (input.tagName === 'SELECT') input.addEventListener('change', validate);
}
function clearCard() {
  form.reset();
  for (const input of Object.values(cardInputs)) showFieldError(input);
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
  removeCard.hidden = true;
  retrySync.hidden = true;
  editor.hidden = true;
  clearCard();
  message.textContent = 'O cadastro precisa ser conferido no Pagar.me antes de uma nova tentativa. Entre em contato com o suporte.';
  return true;
}

function closeEditor() {
  clearCard();
  editor.hidden = !administrator || hasCard || cardDeletionPending || reviewRequired;
  if (hasCard) removeCard.focus();
  else if (!editor.hidden) document.getElementById('number').focus();
}

function renderCard(card, syncPending = false, verificationRequired = false, deletionPending = false, revision) {
  hasCard = Boolean(card);
  workbookSyncPending = syncPending;
  cardDeletionPending = deletionPending;
  cardRevision = typeof revision === 'string' && /^[a-f0-9]{64}$/u.test(revision) ? revision : undefined;
  introduction.textContent = 'Cadastre aqui o cartão de crédito corporativo que será utilizado para a contratação dos atendimentos consultivos:';
  footer.hidden = hasCard || cardDeletionPending;
  editor.hidden = !administrator || hasCard || cardDeletionPending || reviewRequired;
  document.getElementById('card-summary').hidden = !card && !(administrator && cardDeletionPending);
  document.getElementById('card-title').textContent = cardDeletionPending ? 'Exclusão pendente' : 'Cartão cadastrado';
  document.getElementById('empty-card').hidden = Boolean(card) || administrator;
  if (card) {
    document.getElementById('card-number').textContent = `${card.brand} •••• ${card.lastFour}`;
    document.getElementById('card-expiry').textContent = `Validade: ${String(card.expMonth).padStart(2, '0')}/${card.expYear}`;
  } else {
    document.getElementById('card-number').textContent = cardDeletionPending && administrator ? 'Exclusão do cartão pendente.' : '';
    document.getElementById('card-expiry').textContent = '';
  }
  removeCard.hidden = !administrator || (!card && !cardDeletionPending) || !cardRevision || reviewRequired;
  retrySync.hidden = !administrator || !syncPending || cardDeletionPending;
  message.textContent = cardDeletionPending && administrator ? 'A exclusão do cartão está pendente. Tente excluí-lo novamente.'
    : verificationRequired ? 'O cartão precisa ser validado novamente. Cadastre-o abaixo.'
    : syncPending ? 'O cartão foi cadastrado, mas a sincronização com BD - USUÁRIOS está pendente.' : '';
  cancel.hidden = !card;
  save.textContent = card ? 'Salvar cartão' : 'Cadastrar Cartão';
}

document.getElementById('logout').addEventListener('click', async () => {
  leaving = true;
  clearCard();
  try { await client.logout(); }
  catch { /* Local session cleanup also applies when the connection fails. */ }
  finally { window.location.replace(LOGIN_PATH); }
});

function dismissDelete() {
  if (busy) return;
  deleteDialog.close();
  removeCard.focus({ preventScroll: true });
}

removeCard.addEventListener('click', () => {
  if (!administrator || busy || leaving || reviewRequired || !cardRevision || (!hasCard && !cardDeletionPending)) return;
  clearCard();
  deleteMessage.textContent = '';
  deleteDialog.showModal();
  cancelDelete.focus({ preventScroll: true });
});
cancelDelete.addEventListener('click', dismissDelete);
deleteDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  dismissDelete();
});
deleteDialog.addEventListener('click', (event) => {
  if (event.target !== deleteDialog) return;
  const bounds = deleteDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismissDelete();
});
confirmDelete.addEventListener('click', async () => {
  if (!administrator || busy || leaving || reviewRequired || !cardRevision || !deleteDialog.open || (!hasCard && !cardDeletionPending)) return;
  busy = true;
  removeCard.disabled = confirmDelete.disabled = cancelDelete.disabled = true;
  deleteDialog.setAttribute('aria-busy', 'true');
  message.textContent = deleteMessage.textContent = 'Excluindo cartão...';
  appointments.invalidate?.();
  try {
    const result = await client.deleteCard(cardRevision);
    if (leaving) return;
    if (result?.card !== null || result.cardDeletionPending) throw new Error('card_deletion_unconfirmed');
    client.discardBootstrap?.();
    cardSnapshot = undefined;
    cardLoaded = true;
    clearCard();
    renderCard(null);
    deleteDialog.close();
    await appointments.load();
    if (!leaving) {
      message.textContent = '';
      cardInputs.number.focus({ preventScroll: true });
    }
  } catch (error) {
    if (leaving || authFailure(error)) return;
    if (error.status === 403) {
      administrator = false;
      removeCard.hidden = true;
      editor.hidden = true;
      document.getElementById('card-summary').hidden = !hasCard;
      document.getElementById('empty-card').hidden = hasCard;
      document.getElementById('member-notice').hidden = false;
      deleteDialog.close();
      message.textContent = 'Somente administradores podem excluir o cartão.';
    } else if (error.code === 'support_management.card_changed') {
      cardLoaded = false;
      cardSnapshot = undefined;
      message.textContent = deleteMessage.textContent = 'O cartão cadastrado mudou. Atualize a página antes de tentar novamente.';
    } else {
      message.textContent = deleteMessage.textContent = 'Não foi possível confirmar a exclusão do cartão. Tente novamente.';
    }
  } finally {
    busy = false;
    removeCard.disabled = confirmDelete.disabled = cancelDelete.disabled = false;
    deleteDialog.setAttribute('aria-busy', 'false');
  }
});
cancel.addEventListener('click', closeEditor);

retrySync.addEventListener('click', async () => {
  if (!administrator || busy || cardDeletionPending || !workbookSyncPending) return;
  busy = true;
  retrySync.disabled = true;
  message.textContent = 'Sincronizando cadastro...';
  try {
    const result = await client.syncCard();
    if (!leaving) {
      cardSnapshot = undefined;
      renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired), Boolean(result.cardDeletionPending), result.cardRevision);
      appointments.invalidate?.();
    }
  } catch (error) {
    if (leaving || authFailure(error) || handleReviewRequired(error)) return;
    if (error.code === 'support_management.card_verification_required') {
      try {
        const result = await client.card();
        if (!leaving) renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired), Boolean(result.cardDeletionPending), result.cardRevision);
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
  if (!administrator || busy || leaving || reviewRequired || workbookSyncPending || hasCard || cardDeletionPending) return;
  for (const [input, formatter] of formatters) input.value = normalizeText(formatter(input.value));
  updateCardPreview();
  const errors = cardErrors();
  for (const [key, input] of Object.entries(cardInputs)) showFieldError(input, errors[key]);
  if (!form.reportValidity()) {
    message.textContent = 'Confira os campos indicados.';
    return;
  }
  busy = true;
  save.disabled = true;
  cancel.disabled = true;
  removeCard.disabled = true;
  form.setAttribute('aria-busy', 'true');
  message.textContent = 'Salvando cartão...';
  const data = new FormData(form);
  const card = Object.fromEntries(['holderName', 'number', 'expMonth', 'expYear', 'cvv'].map((key) => [key, data.get(key)]));
  clearCard();
  try {
    const result = await submitCompanyCard({ publicKey, card, client, clear: clearCard, isCurrent: () => !leaving });
    if (leaving) return;
    cardSnapshot = undefined;
    renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired), Boolean(result.cardDeletionPending), result.cardRevision);
    appointments.invalidate?.();
    closeEditor();
  } catch (error) {
    if (leaving || authFailure(error) || handleReviewRequired(error)) return;
    if (error.status === 403) {
      administrator = false;
      removeCard.hidden = true;
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
    removeCard.disabled = false;
    form.setAttribute('aria-busy', 'false');
  }
});

function updatePermissionControls() {
  for (const input of permissionInputs) input.disabled = !administrator || permissionsBusy || permissionsRefreshRequired || input.dataset.active !== 'true';
  savePermissions.disabled = !administrator || permissionsBusy || permissionsRefreshRequired || !permissionsLoaded || !permissionEmployees.some(employee => employee.active);
  savePermissions.setAttribute('aria-busy', String(permissionsBusy));
}

function renderPermissions(result) {
  if (!Array.isArray(result?.employees) || result.employees.some((employee) => typeof employee.email !== 'string'
    || typeof employee.name !== 'string' || typeof employee.allowed !== 'boolean' || typeof employee.active !== 'boolean')
    || new Set(result.employees.map(employee => employee.email)).size !== result.employees.length) throw new Error('permissions_unavailable');
  permissionEmployees = result.employees.map(employee => ({ ...employee }));
  permissionsRefreshRequired = false;
  permissionsDirty = false;
  permissionInputs = [];
  const rows = permissionEmployees.map((employee) => {
    const row = document.createElement('label');
    row.className = 'permission-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = employee.allowed;
    checkbox.dataset.active = String(employee.active);
    checkbox.dataset.email = employee.email;
    const name = document.createElement('span');
    name.textContent = employee.name;
    row.append(checkbox, name);
    permissionInputs.push(checkbox);
    checkbox.addEventListener('change', () => {
      if (!administrator || permissionsBusy || permissionsRefreshRequired || leaving || !employee.active) { checkbox.checked = employee.allowed; return; }
      permissionsVersion++;
      permissionsDirty = permissionInputs.some(input => input.checked !== permissionEmployees.find(person => person.email === input.dataset.email).allowed);
      permissionsMessage.textContent = '';
    });
    return row;
  });
  permissionsList.replaceChildren(...rows);
  permissionsLoaded = true;
  updatePermissionControls();
}

savePermissions.addEventListener('click', async () => {
  if (!administrator || permissionsBusy || leaving || !permissionsLoaded || savePermissions.disabled) return;
  const selected = permissionInputs.filter(input => input.dataset.active === 'true')
    .map(input => ({ email: input.dataset.email, allowed: input.checked }));
  let restoreFocus = document.activeElement === savePermissions;
  const trackFocus = (event) => { if (event.target !== savePermissions) restoreFocus = false; };
  permissionsBusy = true;
  permissionsVersion++;
  updatePermissionControls();
  document.addEventListener('focusin', trackFocus);
  permissionsMessage.textContent = 'Salvando...';
  appointments.invalidate?.();
  client.discardBootstrap?.();
  try {
    const updated = await client.updatePermissions(selected);
    if (leaving) return;
    renderPermissions(updated);
    permissionsMessage.textContent = 'Salvo.';
  } catch (error) {
    if (leaving || authFailure(error)) return;
    if (error.status === 403) {
      administrator = false;
      permissionsDirty = false;
      permissionsPanel.hidden = true;
      removeCard.hidden = retrySync.hidden = editor.hidden = true;
    } else if (error.code === 'support_management.employee_not_found') {
      permissionsRefreshRequired = true;
      permissionsMessage.textContent = 'A lista de colaboradores mudou. Atualize a página antes de salvar novamente.';
    } else permissionsMessage.textContent = 'Não foi possível confirmar o salvamento. Tente novamente.';
  } finally {
    appointments.invalidate?.();
    client.discardBootstrap?.();
    document.removeEventListener('focusin', trackFocus);
    permissionsBusy = false;
    updatePermissionControls();
    if (restoreFocus && !leaving && administrator && activeTab === 'card' && !permissionsPanel.hidden && !savePermissions.disabled) {
      savePermissions.focus({ preventScroll: true });
    }
  }
});

function loadPermissions() {
  permissionsPanel.hidden = !administrator;
  if (!administrator || permissionsDirty || permissionsBusy || (permissionsLoaded && permissionsSnapshot === undefined)) return Promise.resolve();
  if (permissionsLoading) return permissionsLoading;
  permissionsLoading = Promise.resolve().then(async () => {
    try {
      const result = permissionsSnapshot ?? await client.permissions();
      permissionsSnapshot = undefined;
      if (leaving || !administrator) return;
      renderPermissions(result);
      permissionsMessage.textContent = '';
      permissionsLoaded = true;
    } catch (error) {
      if (leaving || authFailure(error)) return;
      if (error.status === 403) {
        administrator = false;
        permissionsPanel.hidden = true;
        removeCard.hidden = retrySync.hidden = editor.hidden = true;
      }
      else permissionsMessage.textContent = 'Não foi possível carregar as permissões. Atualize a página para tentar novamente.';
    } finally {
      permissionsLoading = undefined;
      updatePermissionControls();
    }
  });
  return permissionsLoading;
}

function loadCard() {
  if (cardLoaded && cardSnapshot === undefined) return Promise.resolve();
  if (cardLoading) return cardLoading;
  cardLoading = Promise.resolve().then(async () => {
    try {
      let result = cardSnapshot ?? await client.card();
      cardSnapshot = undefined;
      if ((result.card || result.cardDeletionPending) && !/^[a-f0-9]{64}$/u.test(result.cardRevision || '')) {
        result = await client.card();
        if (!/^[a-f0-9]{64}$/u.test(result.cardRevision || '') && (result.card || result.cardDeletionPending)) throw new Error('card_revision_unavailable');
      }
      if (result.workbookSyncPending && !result.verificationRequired && !result.cardDeletionPending && administrator) {
        try { result = await client.syncCard(); }
        catch (error) {
          if (error.status === 401 || error.code === 'support_management.card_review_required') throw error;
          if (error.status === 403) administrator = false;
          if (error.code === 'support_management.card_verification_required') result = await client.card();
        }
      }
      if (leaving) return;
      renderCard(result.card, Boolean(result.workbookSyncPending), Boolean(result.verificationRequired), Boolean(result.cardDeletionPending), result.cardRevision);
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
    const enforceSessionExpiry = () => {
      if (leaving) return;
      if (Date.now() >= result.expiresAt) authFailure({ status: 401 });
    };
    enforceSessionExpiry();
    if (leaving) return;
    if (typeof globalThis.setInterval === 'function') sessionTimer = globalThis.setInterval(enforceSessionExpiry, 1000);
  }
  administrator = user.role === 'Administrador';
  permissionsPanel.hidden = !administrator;
  if (!administrator) {
    permissionsDirty = false;
    removeCard.hidden = retrySync.hidden = editor.hidden = true;
  }
  updatePermissionControls();
  if (!permissionsDirty && !permissionsBusy && result.permissions !== undefined) permissionsSnapshot = result.permissions;
  else if (!fromCache && !permissionsDirty && !permissionsBusy) {
    permissionsSnapshot = undefined;
    permissionsLoaded = false;
  }
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
    const permissionsAtRead = permissionsVersion;
    const current = await client.session();
    if (permissionsDirty || permissionsBusy || permissionsAtRead !== permissionsVersion) {
      delete current.permissions;
      delete current.calendar;
      client.discardBootstrap?.();
    }
    if (!leaving) await initializeSession(current);
  }
} catch (error) {
  if (!authFailure(error)) document.getElementById(activeTab === 'card' ? 'scheduler-message' : 'appointments-message').textContent = 'Não foi possível carregar a ferramenta. Atualize a página para tentar novamente.';
}
