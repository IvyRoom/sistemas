'use strict';

const MIN_VIEWPORT_WIDTH = 1024;
const DEVICE_WARNING_URL = '../plataforma_v2/aviso-dispositivo';
const SUBMIT_ENDPOINT = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/clientes/processa-formulario'
  : 'https://plataforma-backend-v3.azurewebsites.net/clientes/processa-formulario';
const SUBMIT_TIMEOUT_MS = 60000;
const MAX_PARTICIPANTS = 25;

const form = document.querySelector('.form');
const participantsList = document.querySelector('.participants-list');
const participantTemplate = document.getElementById('participant-template');
const addParticipantButton = document.querySelector('.add-participant-button');
const submitButton = document.querySelector('.submit-button');
const useCompanyAddressCheckbox = document.getElementById('use-company-address');

const ADDRESS_FIELD_PAIRS = [
  ['company-postal-code', 'shipping-postal-code'],
  ['company-street', 'shipping-street'],
  ['company-number', 'shipping-number'],
  ['company-address-complement', 'shipping-address-complement'],
  ['company-neighborhood', 'shipping-neighborhood'],
  ['company-city', 'shipping-city'],
  ['company-state', 'shipping-state'],
];

const STATIC_EMAIL_BASES = ['legal-rep', 'admin-assistant'];

const SUBMIT_ERROR_FALLBACK = 'Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.';
const SUBMIT_ERROR_MESSAGES = {
  Erro_001: 'Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente.',
  Erro_008: 'Erro_008: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.',
  Erro_010: 'Erro_010: falha ao atualizar a base de dados de clientes.\nTente novamente.',
  Erro_011: 'Erro_011: falha de comunicação com a base de dados de clientes.\nTente novamente.',
  Erro_012: 'Erro_012: falha ao enviar a notificação por e-mail.\nTente novamente.',
  Erro_013: 'Erro_013: dados inválidos ou incompletos.\nRevise o preenchimento e tente novamente.',
};

function enforceDeviceGate() {
  if (window.innerWidth <= MIN_VIEWPORT_WIDTH) {
    window.location.href = DEVICE_WARNING_URL;
  }
}

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

// CNPJs issued from Jul/2026 on may be alphanumeric: 12 alphanumerics + 2 numeric check digits.
function cnpjChars(value) {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
}

function maskCnpj(value) {
  const c = cnpjChars(value);
  let masked = c.slice(0, 2);
  if (c.length > 2) masked += `.${c.slice(2, 5)}`;
  if (c.length > 5) masked += `.${c.slice(5, 8)}`;
  if (c.length > 8) masked += `/${c.slice(8, 12)}`;
  if (c.length > 12) masked += `-${c.slice(12, 14)}`;
  return masked;
}

function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function maskCep(value) {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, d.length - 4)}-${d.slice(d.length - 4)}`;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function isValidCpf(value) {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(d[length])) return false;
  }
  return true;
}

const CNPJ_CHECK_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function isValidCnpj(value) {
  const c = cnpjChars(value);
  if (c.length !== 14 || !/^\d{2}$/.test(c.slice(12)) || /^(.)\1{13}$/.test(c)) return false;
  for (const length of [12, 13]) {
    const weights = CNPJ_CHECK_WEIGHTS.slice(13 - length);
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (c.charCodeAt(i) - 48) * weights[i];
    const check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (check !== Number(c[length])) return false;
  }
  return true;
}

function maskForField(input) {
  const id = input.id;
  if (id.endsWith('-no-number')) return null;
  if (id.endsWith('-cnpj')) return maskCnpj;
  if (id.endsWith('-cpf')) return maskCpf;
  if (id.endsWith('-postal-code')) return maskCep;
  if (id.endsWith('-whatsapp')) return maskPhone;
  if (id.endsWith('-area-code') || id.endsWith('-number')) return onlyDigits;
  return null;
}

function applyMask(input) {
  const mask = maskForField(input);
  if (mask) input.value = mask(input.value);
}

function emailBaseFromId(id) {
  return id.replace(/-email(-confirm)?$/, '');
}

function validateEmailPair(base) {
  const email = document.getElementById(`${base}-email`);
  const confirm = document.getElementById(`${base}-email-confirm`);
  const warning = document.getElementById(`${base}-email-warning`);
  if (!email || !confirm) return true;

  const mismatch = confirm.value !== '' && email.value !== confirm.value;
  if (warning) warning.hidden = !mismatch;
  confirm.setCustomValidity(mismatch ? 'E-mails diferentes.' : '');
  return !mismatch;
}

function clearEmailWarning(base) {
  const confirm = document.getElementById(`${base}-email-confirm`);
  const warning = document.getElementById(`${base}-email-warning`);
  if (warning) warning.hidden = true;
  if (confirm) confirm.setCustomValidity('');
}

function validateAllEmailPairs() {
  const bases = [...STATIC_EMAIL_BASES];
  participantsList.querySelectorAll('.participant').forEach((participant) => {
    bases.push(`participant-${participant.dataset.participantIndex}`);
  });
  return bases.map(validateEmailPair).every(Boolean);
}

function isCompanyAddressSource(id) {
  return ADDRESS_FIELD_PAIRS.some(([companyId]) => companyId === id);
}

function documentValidityMessage(input) {
  if (input.value === '') return '';
  if (input.id.endsWith('-cnpj')) return isValidCnpj(input.value) ? '' : 'CNPJ inválido.';
  return isValidCpf(input.value) ? '' : 'CPF inválido.';
}

function validateDocumentField(input) {
  input.setCustomValidity(documentValidityMessage(input));
}

function validateAllDocumentFields() {
  form.querySelectorAll('[id$="-cpf"], [id$="-cnpj"]').forEach(validateDocumentField);
}

function flagDuplicateParticipantFields(fieldSuffix, canonicalize, message) {
  const seen = new Set();
  participantsList.querySelectorAll(`[id$="${fieldSuffix}"]`).forEach((input) => {
    const value = canonicalize(input.value);
    if (value !== '' && seen.has(value)) input.setCustomValidity(message);
    seen.add(value);
  });
}

function syncShippingAddress() {
  const useCompany = useCompanyAddressCheckbox.checked;
  ADDRESS_FIELD_PAIRS.forEach(([companyId, shippingId]) => {
    const companyField = document.getElementById(companyId);
    const shippingField = document.getElementById(shippingId);
    shippingField.value = useCompany ? companyField.value : '';
    shippingField.disabled = useCompany;
  });
  const shippingNoNumber = document.getElementById('shipping-no-number');
  shippingNoNumber.checked = false;
  shippingNoNumber.disabled = useCompany;
}

function applyNoNumber(checkbox, numberInput) {
  numberInput.disabled = checkbox.checked;
  numberInput.value = checkbox.checked ? 'S/N' : '';
}

const TITLE_CASE_CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

const STREET_PREFIXES = new Map([
  ['rua', 'R.'], ['r', 'R.'],
  ['avenida', 'Av.'], ['av', 'Av.'],
  ['alameda', 'Al.'], ['al', 'Al.'],
  ['travessa', 'Tv.'], ['tv', 'Tv.'],
  ['praca', 'Pç.'], ['praça', 'Pç.'], ['pc', 'Pç.'], ['pç', 'Pç.'],
  ['rodovia', 'Rod.'], ['rod', 'Rod.'],
  ['estrada', 'Estr.'], ['estr', 'Estr.'],
  ['largo', 'Lgo.'], ['lgo', 'Lgo.'],
]);

function collapseSpaces(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function titleCaseWord(word, lowercaseConnector, preserveAcronyms) {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (lowercaseConnector && TITLE_CASE_CONNECTORS.has(lower)) return lower;
  if (preserveAcronyms && word.length <= 3 && /^\p{Lu}+$/u.test(word)) return word;
  return lower.replace(/(^|[-'’])(.)/gu, (match, separator, char) => separator + char.toUpperCase());
}

function toTitleCase(value, { preserveAcronyms = false, capitalizeFirst = true } = {}) {
  return collapseSpaces(value)
    .split(' ')
    .map((word, index) => titleCaseWord(word, !(index === 0 && capitalizeFirst), preserveAcronyms))
    .join(' ');
}

function normalizeStreet(value) {
  const words = collapseSpaces(value).split(' ');
  const firstKey = words[0].toLowerCase().replace(/\.$/, '');
  let abbreviation = 'R.';
  let nameWords = words;
  if (STREET_PREFIXES.has(firstKey)) {
    abbreviation = STREET_PREFIXES.get(firstKey);
    nameWords = words.slice(1);
  }
  const name = toTitleCase(nameWords.join(' '), { capitalizeFirst: false });
  return name ? `${abbreviation} ${name}` : abbreviation;
}

function normalizeField(input) {
  const id = input.id;
  if (!input.value.trim()) {
    input.value = '';
    return;
  }
  if (id.endsWith('-email') || id.endsWith('-email-confirm')) {
    input.value = input.value.replace(/\s+/g, '').toLowerCase();
  } else if (id.endsWith('-legal-name')) {
    input.value = collapseSpaces(input.value);
  } else if (id.endsWith('-street')) {
    input.value = normalizeStreet(input.value);
  } else if (id.endsWith('-role')) {
    input.value = toTitleCase(input.value, { preserveAcronyms: true });
  } else if (
    id.endsWith('-full-name') ||
    id.endsWith('-neighborhood') ||
    id.endsWith('-city') ||
    id.endsWith('-address-complement')
  ) {
    input.value = toTitleCase(input.value);
  }
}

function normalizeAllFields() {
  form.querySelectorAll('input').forEach(normalizeField);
}

function addParticipant() {
  if (participantsList.querySelectorAll('.participant').length >= MAX_PARTICIPANTS) return;
  const index = participantsList.querySelectorAll('.participant').length + 1;
  const markup = participantTemplate.innerHTML.replaceAll('__INDEX__', String(index));
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup.trim();
  participantsList.appendChild(wrapper.firstElementChild);
  updateParticipantControls();
}

function renumberParticipants() {
  participantsList.querySelectorAll('.participant').forEach((participant, position) => {
    const index = position + 1;
    const prefix = new RegExp('^participant-\\d+-');
    const replacement = `participant-${index}-`;

    participant.dataset.participantIndex = String(index);
    const title = participant.querySelector('.participant-title');
    if (title) title.textContent = `Participante ${index}`;

    participant.querySelectorAll('[id]').forEach((el) => {
      el.id = el.id.replace(prefix, replacement);
    });
    participant.querySelectorAll('[name]').forEach((el) => {
      el.setAttribute('name', el.getAttribute('name').replace(prefix, replacement));
    });
    participant.querySelectorAll('[for]').forEach((el) => {
      el.setAttribute('for', el.getAttribute('for').replace(prefix, replacement));
    });
  });
}

function deleteParticipant(participant) {
  if (participantsList.querySelectorAll('.participant').length <= 1) return;
  participant.remove();
  renumberParticipants();
  updateParticipantControls();
}

function updateParticipantControls() {
  const participants = participantsList.querySelectorAll('.participant');
  const onlyOne = participants.length <= 1;
  participants.forEach((participant) => {
    const deleteButton = participant.querySelector('.delete-participant-button');
    if (deleteButton) deleteButton.hidden = onlyOne;
  });
  addParticipantButton.disabled = participants.length >= MAX_PARTICIPANTS;
}

function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : '';
}

function readAddress(prefix) {
  return {
    postalCode: readValue(`${prefix}-postal-code`),
    street: readValue(`${prefix}-street`),
    number: readValue(`${prefix}-number`),
    complement: readValue(`${prefix}-address-complement`),
    neighborhood: readValue(`${prefix}-neighborhood`),
    city: readValue(`${prefix}-city`),
    state: readValue(`${prefix}-state`),
  };
}

function readPerson(prefix) {
  return {
    fullName: readValue(`${prefix}-full-name`),
    cpf: readValue(`${prefix}-cpf`),
    role: readValue(`${prefix}-role`),
    areaCode: readValue(`${prefix}-area-code`),
    whatsapp: readValue(`${prefix}-whatsapp`),
    email: readValue(`${prefix}-email`),
  };
}

function collectFormData() {
  const participants = [...participantsList.querySelectorAll('.participant')].map((participant) =>
    readPerson(`participant-${participant.dataset.participantIndex}`)
  );

  return {
    company: {
      legalName: readValue('company-legal-name'),
      cnpj: readValue('company-cnpj'),
      address: readAddress('company'),
    },
    shippingAddress: {
      useCompanyAddress: useCompanyAddressCheckbox.checked,
      ...readAddress('shipping'),
    },
    legalRepresentative: readPerson('legal-rep'),
    adminAssistant: readPerson('admin-assistant'),
    participants,
  };
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.setAttribute('aria-busy', String(isSubmitting));
  form.classList.toggle('is-submitting', isSubmitting);
  submitButton.classList.toggle('is-submitting', isSubmitting);
}

async function submitForm() {
  const submitLabel = submitButton.textContent;
  setSubmitting(true);
  submitButton.textContent = 'Enviando…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectFormData()),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw { error: data.error };
    form.classList.remove('is-submitting');
    form.classList.add('form--submitted');
  } catch (error) {
    console.error('Falha no envio do formulário:', error);
    window.alert(SUBMIT_ERROR_MESSAGES[error && error.error] || SUBMIT_ERROR_FALLBACK);
    setSubmitting(false);
    submitButton.textContent = submitLabel;
  } finally {
    clearTimeout(timeout);
  }
}

enforceDeviceGate();
window.addEventListener('resize', enforceDeviceGate);

form.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.id) return;

  applyMask(target);
  if (typeof target.setCustomValidity === 'function') target.setCustomValidity('');

  if (target.id.endsWith('-city')) {
    target.value = target.value.replace(/\d/g, '');
  }
  if (target.id.endsWith('-email') || target.id.endsWith('-email-confirm')) {
    clearEmailWarning(emailBaseFromId(target.id));
  }
  if (useCompanyAddressCheckbox.checked && isCompanyAddressSource(target.id)) {
    syncShippingAddress();
  }
});

form.addEventListener('focusout', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.id) return;
  normalizeField(target);
  if (target.id.endsWith('-email') || target.id.endsWith('-email-confirm')) {
    validateEmailPair(emailBaseFromId(target.id));
  }
  if (target.id.endsWith('-cpf') || target.id.endsWith('-cnpj')) {
    validateDocumentField(target);
  }
  if (useCompanyAddressCheckbox.checked && isCompanyAddressSource(target.id)) {
    syncShippingAddress();
  }
});

useCompanyAddressCheckbox.addEventListener('change', syncShippingAddress);

[['company-no-number', 'company-number'], ['shipping-no-number', 'shipping-number']].forEach(([checkboxId, numberId]) => {
  const checkbox = document.getElementById(checkboxId);
  const numberInput = document.getElementById(numberId);
  checkbox.addEventListener('change', () => {
    applyNoNumber(checkbox, numberInput);
    if (useCompanyAddressCheckbox.checked) syncShippingAddress();
  });
});

addParticipantButton.addEventListener('click', addParticipant);

participantsList.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-participant-button');
  if (button) deleteParticipant(button.closest('.participant'));
});

addParticipant();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  normalizeAllFields();
  form.querySelectorAll('.text-input').forEach((input) => input.setCustomValidity(''));
  validateAllEmailPairs();
  validateAllDocumentFields();
  flagDuplicateParticipantFields('-cpf', onlyDigits, 'CPF repetido em outro participante.');
  flagDuplicateParticipantFields('-email', (value) => value.trim().toLowerCase(), 'E-mail repetido em outro participante.');
  if (!form.reportValidity()) return;
  submitForm();
});
