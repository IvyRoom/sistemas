'use strict';

// ============================================================
// CONFIG
// ============================================================
const MIN_VIEWPORT_WIDTH = 1024;
const DEVICE_WARNING_URL = './plataforma_v2/aviso-dispositivo';
const SUBMIT_ENDPOINT = './plataforma_v2/updates';   // mock backend (placeholder)

// ============================================================
// DOM REFERENCES
// ============================================================
const form = document.querySelector('.form');
const participantsList = document.querySelector('.participants-list');
const participantTemplate = document.getElementById('participant-template');
const addParticipantButton = document.querySelector('.add-participant-button');
const submitButton = document.querySelector('.submit-button');
const useCompanyAddressCheckbox = document.getElementById('use-company-address');

// company address field id -> matching shipping address field id
const ADDRESS_FIELD_PAIRS = [
  ['company-postal-code', 'shipping-postal-code'],
  ['company-street', 'shipping-street'],
  ['company-number', 'shipping-number'],
  ['company-address-complement', 'shipping-address-complement'],
  ['company-neighborhood', 'shipping-neighborhood'],
  ['company-city', 'shipping-city'],
  ['company-state', 'shipping-state'],
];

// people whose e-mail/confirmation pair is statically present in the page
const STATIC_EMAIL_BASES = ['legal-rep', 'admin-assistant'];

// ============================================================
// DEVICE GATE
// Page must not be used below 1024px wide (see CLAUDE.md).
// ============================================================
function enforceDeviceGate() {
  if (window.innerWidth <= MIN_VIEWPORT_WIDTH) {
    window.location.replace(DEVICE_WARNING_URL);
  }
}

// ============================================================
// INPUT MASKS
// Each mask keeps only digits and formats them. Fields are
// matched by id suffix, so dynamically added participant
// inputs are masked too (via the delegated listener below).
// ============================================================
function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function maskCnpj(value) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
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

// Returns the formatting function for a field, or null if it has no mask.
function maskForField(input) {
  const id = input.id;
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

// ============================================================
// E-MAIL CONFIRMATION
// A "<base>-email-confirm" must match "<base>-email". On
// mismatch we reveal "<base>-email-warning" and mark the
// confirm field invalid so reportValidity() blocks submit.
// ============================================================
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

function validateAllEmailPairs() {
  const bases = [...STATIC_EMAIL_BASES];
  participantsList.querySelectorAll('.participant').forEach((participant) => {
    bases.push(`participant-${participant.dataset.participantIndex}`);
  });
  return bases.map(validateEmailPair).every(Boolean);
}

// ============================================================
// SAME ADDRESS (shipping = contracting company)
// While checked, shipping fields mirror the company fields
// and are disabled so they can't be edited independently.
// ============================================================
function syncShippingAddress() {
  const useCompany = useCompanyAddressCheckbox.checked;
  ADDRESS_FIELD_PAIRS.forEach(([companyId, shippingId]) => {
    const companyField = document.getElementById(companyId);
    const shippingField = document.getElementById(shippingId);
    if (useCompany) shippingField.value = companyField.value;
    shippingField.disabled = useCompany;
  });
}

// ============================================================
// PARTICIPANTS (add / delete / renumber)
// Clones #participant-template, replacing every __INDEX__ with
// the participant number. Deleting renumbers the rest so ids
// stay unique and sequential (1, 2, 3, ...).
// ============================================================
function addParticipant() {
  const index = participantsList.querySelectorAll('.participant').length + 1;
  const markup = participantTemplate.innerHTML.replaceAll('__INDEX__', String(index));
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup.trim();
  participantsList.appendChild(wrapper.firstElementChild);
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
  participant.remove();
  renumberParticipants();
}

// ============================================================
// SUBMIT
// Gathers the form into a structured payload and POSTs it as
// JSON to the mock backend.
// ============================================================
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

async function submitForm() {
  submitButton.disabled = true;
  try {
    const response = await fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectFormData()),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    window.alert('Informações cadastradas com sucesso!');
    form.reset();
    syncShippingAddress();
  } catch (error) {
    console.error('Falha no envio do formulário:', error);
    window.alert('Não foi possível enviar o formulário. Tente novamente.');
  } finally {
    submitButton.disabled = false;
  }
}

// ============================================================
// EVENT WIRING
// ============================================================
enforceDeviceGate();
window.addEventListener('resize', enforceDeviceGate);

form.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.id) return;

  applyMask(target);

  if (target.id.endsWith('-email') || target.id.endsWith('-email-confirm')) {
    validateEmailPair(emailBaseFromId(target.id));
  }
  if (useCompanyAddressCheckbox.checked && ADDRESS_FIELD_PAIRS.some(([companyId]) => companyId === target.id)) {
    syncShippingAddress();
  }
});

useCompanyAddressCheckbox.addEventListener('change', syncShippingAddress);

addParticipantButton.addEventListener('click', addParticipant);

participantsList.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-participant-button');
  if (button) deleteParticipant(button.closest('.participant'));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  validateAllEmailPairs();
  if (!form.reportValidity()) return;
  submitForm();
});
