import { createSupportClient, LOGIN_PATH, submitCompanyCard } from '../modules/client.js';

const client = createSupportClient();
const message = document.getElementById('scheduler-message');
const form = document.getElementById('card-form');
const editor = document.getElementById('card-editor');
const edit = document.getElementById('edit-card');
const save = document.getElementById('save-card');
const cancel = document.getElementById('cancel-card');
let publicKey;
let administrator = false;
let busy = false;
let leaving = false;
let reviewRequired = false;
let hasCard = false;

const currentYear = new Date().getFullYear();
for (let year = currentYear; year <= currentYear + 20; year++) {
  const option = document.createElement('option');
  option.value = String(year);
  option.textContent = String(year).slice(-2);
  document.getElementById('exp-year').append(option);
}

function clearCard() { form.reset(); }
window.addEventListener('pagehide', clearCard);

function authFailure(error) {
  if (error.status !== 401) return false;
  clearCard();
  window.location.replace(LOGIN_PATH);
  return true;
}

function handleReviewRequired(error) {
  if (error.code !== 'support_management.card_review_required') return false;
  reviewRequired = true;
  edit.hidden = true;
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

function renderCard(card) {
  hasCard = Boolean(card);
  document.getElementById('card-summary').hidden = !card;
  document.getElementById('empty-card').hidden = Boolean(card) || administrator;
  if (card) {
    document.getElementById('card-number').textContent = `${card.brand} •••• ${card.lastFour}`;
    document.getElementById('card-expiry').textContent = `Validade: ${String(card.expMonth).padStart(2, '0')}/${card.expYear}`;
  }
  edit.hidden = !administrator || !card;
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
  if (!administrator || busy || reviewRequired) return;
  editor.hidden = false;
  edit.setAttribute('aria-expanded', 'true');
  document.getElementById('editor-title').focus();
});
cancel.addEventListener('click', closeEditor);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!administrator || busy || leaving || reviewRequired) return;
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
    renderCard(result.card);
    closeEditor();
    message.textContent = 'Cartão cadastrado para sua empresa.';
  } catch (error) {
    if (leaving || authFailure(error) || handleReviewRequired(error)) return;
    if (error.status === 403) {
      administrator = false;
      edit.hidden = true;
      editor.hidden = true;
      message.textContent = 'Somente administradores podem alterar o cartão.';
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

try {
  const config = await client.config();
  publicKey = config.publicKey;
  const { user } = await client.session();
  administrator = user.role === 'Administrador';
  const { card } = await client.card();
  renderCard(card);
  editor.hidden = !administrator || Boolean(card);
  document.getElementById('member-notice').hidden = administrator;
  message.textContent = '';
} catch (error) {
  if (!authFailure(error) && !handleReviewRequired(error)) message.textContent = 'Não foi possível carregar o cadastro de cartão. Atualize a página para tentar novamente.';
}
