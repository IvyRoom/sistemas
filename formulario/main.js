'use strict';
// Strict mode: makes JS throw on sloppy mistakes (e.g. assigning to an
// undeclared variable) instead of failing silently. A safety net for the
// whole file.

// ============================================================
// CONFIG
// Values we might want to tweak in one place. MIN_VIEWPORT_WIDTH and
// DEVICE_WARNING_URL drive the "too small screen" redirect; SUBMIT_ENDPOINT
// is where the filled form gets POSTed (still a placeholder backend).
// ============================================================
const MIN_VIEWPORT_WIDTH = 1024;
const DEVICE_WARNING_URL = './plataforma_v2/aviso-dispositivo';
const SUBMIT_ENDPOINT = './plataforma_v2/updates';   // mock backend (placeholder)

// ============================================================
// DOM REFERENCES
// Grab the elements we touch repeatedly, once, up front. Because the script
// is loaded with `defer`, the HTML is fully parsed before this runs, so these
// queries are guaranteed to find their targets.
// ============================================================
const form = document.querySelector('.form');
const participantsList = document.querySelector('.participants-list');
const participantTemplate = document.getElementById('participant-template');
const addParticipantButton = document.querySelector('.add-participant-button');
const submitButton = document.querySelector('.submit-button');
const useCompanyAddressCheckbox = document.getElementById('use-company-address');

// Lookup table pairing each contracting-company address field with its
// shipping-address twin. Used by the "same address" feature to copy values
// from the left id to the right id.
const ADDRESS_FIELD_PAIRS = [
  ['company-postal-code', 'shipping-postal-code'],
  ['company-street', 'shipping-street'],
  ['company-number', 'shipping-number'],
  ['company-address-complement', 'shipping-address-complement'],
  ['company-neighborhood', 'shipping-neighborhood'],
  ['company-city', 'shipping-city'],
  ['company-state', 'shipping-state'],
];

// The two people who always exist in the page (vs. the dynamic participants).
// Their id prefixes let us build "<base>-email" / "<base>-email-confirm" /
// "<base>-email-warning" when checking that the two e-mail fields match.
const STATIC_EMAIL_BASES = ['legal-rep', 'admin-assistant'];

// ============================================================
// DEVICE GATE
// The form isn't meant to be used on narrow screens. If the window is 1024px
// or less, send the user to the warning page. `location.replace` is used
// instead of `location.href` so the form page doesn't stay in the back-button
// history (you can't "back" into a page you were blocked from).
// ============================================================
function enforceDeviceGate() {
  if (window.innerWidth <= MIN_VIEWPORT_WIDTH) {
    window.location.replace(DEVICE_WARNING_URL);
  }
}

// ============================================================
// INPUT MASKS
// As the user types, we reformat certain fields live (CPF, CNPJ, CEP, phone).
// The strategy for every mask: strip everything down to raw digits, cap the
// digit count, then re-insert the dots / slashes / dashes. Matching is done
// by id SUFFIX (e.g. anything ending in "-cpf"), so a participant field that
// didn't exist at page load still gets masked once it's added.
// ============================================================

// Remove every non-digit character. The building block for all masks below.
function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

// CNPJ: 14 digits formatted as 00.000.000/0000-00.
// Each .replace adds one separator as soon as enough digits exist, so the
// formatting appears progressively while typing.
function maskCnpj(value) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// CPF: 11 digits formatted as 000.000.000-00. Same progressive idea as CNPJ.
function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

// CEP (postal code): 8 digits formatted as 00000-000.
function maskCep(value) {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

// Phone (the WhatsApp number, without the DDD which is its own field).
// Up to 9 digits. A 9-digit mobile splits 5+4 (90000-0000); 8 digits or fewer
// split as <rest>-<last 4>. Below 5 digits there's nothing to hyphenate yet.
function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, d.length - 4)}-${d.slice(d.length - 4)}`;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// Given an input, decide which mask (if any) applies, based on its id suffix.
// Returns the formatting function, or null for fields that shouldn't be masked
// (names, e-mails, roles, etc.).
function maskForField(input) {
  const id = input.id;
  if (id.endsWith('-cnpj')) return maskCnpj;
  if (id.endsWith('-cpf')) return maskCpf;
  if (id.endsWith('-postal-code')) return maskCep;
  if (id.endsWith('-whatsapp')) return maskPhone;
  if (id.endsWith('-area-code') || id.endsWith('-number')) return onlyDigits;
  return null;
}

// Apply the chosen mask by overwriting the field's own value with the
// formatted version. (No-op when the field has no mask.)
function applyMask(input) {
  const mask = maskForField(input);
  if (mask) input.value = mask(input.value);
}

// ============================================================
// E-MAIL CONFIRMATION
// Every person has an e-mail field and a "confirm e-mail" field that must
// match. When they don't, we (a) reveal the hidden "<base>-email-warning"
// message and (b) call setCustomValidity on the confirm field. That second
// step is the important one: it marks the field invalid at the browser level,
// so the native form-validation popup (triggered by reportValidity() on
// submit) refuses to let the form through until the e-mails agree.
// ============================================================

// Turn any of the three related ids back into the shared base.
// "legal-rep-email-confirm" -> "legal-rep";  "legal-rep-email" -> "legal-rep".
function emailBaseFromId(id) {
  return id.replace(/-email(-confirm)?$/, '');
}

// Validate one person's e-mail pair. Returns true when they match (or the
// confirm field is still empty, so we don't nag mid-typing).
function validateEmailPair(base) {
  const email = document.getElementById(`${base}-email`);
  const confirm = document.getElementById(`${base}-email-confirm`);
  const warning = document.getElementById(`${base}-email-warning`);
  if (!email || !confirm) return true;

  const mismatch = confirm.value !== '' && email.value !== confirm.value;
  if (warning) warning.hidden = !mismatch;                       // show/hide the red text
  confirm.setCustomValidity(mismatch ? 'E-mails diferentes.' : ''); // block/allow submit
  return !mismatch;
}

// Validate every e-mail pair on the page: the two static people plus one per
// dynamic participant. `.every(Boolean)` returns true only if all passed.
function validateAllEmailPairs() {
  const bases = [...STATIC_EMAIL_BASES];
  participantsList.querySelectorAll('.participant').forEach((participant) => {
    bases.push(`participant-${participant.dataset.participantIndex}`);
  });
  return bases.map(validateEmailPair).every(Boolean);
}

// ============================================================
// SAME ADDRESS (shipping = contracting company)
// When the checkbox is on, the shipping fields mirror the company fields and
// are disabled so they can't drift out of sync. When off, they're re-enabled
// for independent editing. Note: disabled fields are skipped by native
// "required" validation, which is fine here because the company equivalents
// are validated instead — and our submit code reads their values directly.
// ============================================================
function syncShippingAddress() {
  const useCompany = useCompanyAddressCheckbox.checked;
  ADDRESS_FIELD_PAIRS.forEach(([companyId, shippingId]) => {
    const companyField = document.getElementById(companyId);
    const shippingField = document.getElementById(shippingId);
    if (useCompany) shippingField.value = companyField.value;   // copy only while checked
    shippingField.disabled = useCompany;                        // lock while checked
  });
}

// ============================================================
// PARTICIPANTS (add / delete / renumber)
// The HTML holds a <template> whose ids/names all contain the literal token
// __INDEX__. To add a participant we clone that template's markup, swap every
// __INDEX__ for the next number, and insert it. Deleting then renumbers the
// survivors so the numbering stays 1, 2, 3 with no gaps and ids stay unique.
// ============================================================

// Build the next participant from the template.
// `participantTemplate.innerHTML` is the template's markup as a STRING (still
// containing __INDEX__), so replaceAll swaps every token at once. We turn that
// string back into a real element via a throwaway wrapper <div>, then append
// the element itself (firstElementChild) — not the wrapper.
function addParticipant() {
  const index = participantsList.querySelectorAll('.participant').length + 1;
  const markup = participantTemplate.innerHTML.replaceAll('__INDEX__', String(index));
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup.trim();
  participantsList.appendChild(wrapper.firstElementChild);
}

// After a deletion the remaining participants may be numbered with a gap
// (e.g. 1, 3). This walks them in order and rewrites each one to its new
// position. The key trick: every id/name/for in a participant starts with the
// prefix "participant-<number>-", so a single regex swaps just that numeric
// prefix and leaves the rest of the id (like "-email-warning") intact. We do
// NOT do a blind text replace of the number, which could clobber unrelated
// numbers like maxlength="14".
function renumberParticipants() {
  participantsList.querySelectorAll('.participant').forEach((participant, position) => {
    const index = position + 1;
    const prefix = new RegExp('^participant-\\d+-');
    const replacement = `participant-${index}-`;

    participant.dataset.participantIndex = String(index);            // the data-* attribute
    const title = participant.querySelector('.participant-title');
    if (title) title.textContent = `Participante ${index}`;         // the visible heading

    // Rewrite the three attribute kinds that carry the index.
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

// Remove one participant, then renumber whoever's left.
function deleteParticipant(participant) {
  participant.remove();
  renumberParticipants();
}

// ============================================================
// SUBMIT
// On submit we read every field into a structured JS object and POST it as
// JSON. The readers below intentionally use getElementById on known ids
// (rather than serializing the <form>) so we can group the data cleanly and
// still capture disabled shipping fields, which a normal form submit skips.
// ============================================================

// Safe single-field read: trimmed value, or '' if the field isn't present.
function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : '';
}

// Read a whole address block given its prefix ("company" or "shipping").
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

// Read one person given their prefix ("legal-rep", "admin-assistant",
// "participant-2", ...). All four roles share the same field layout.
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

// Assemble the entire form into one nested object. Participants become an
// array, read in their current on-page order via each one's data-index.
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

// Send the collected data to the backend. We disable the submit button while
// the request is in flight (prevents double submits), then re-enable it in
// `finally` no matter what. `response.ok` is true only for 2xx statuses; the
// placeholder UX is a browser alert for now and will be replaced later.
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
    form.reset();                 // clear the fields
    syncShippingAddress();        // reset() unchecks the box -> re-enable shipping fields
  } catch (error) {
    console.error('Falha no envio do formulário:', error);
    window.alert('Não foi possível enviar o formulário. Tente novamente.');
  } finally {
    submitButton.disabled = false;
  }
}

// ============================================================
// EVENT WIRING
// Everything above is just definitions. This bottom section is what actually
// runs / hooks things up when the page loads.
// ============================================================

// Run the screen-size gate immediately, and again whenever the window resizes.
enforceDeviceGate();
window.addEventListener('resize', enforceDeviceGate);

// One delegated "input" listener on the whole form, instead of one per field.
// Because it lives on the form, it also catches events from participant fields
// added later. For each keystroke we: apply any mask, re-check e-mail pairs,
// and (if the same-address box is on) re-mirror a company field into shipping.
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

// Toggling the "same address" checkbox copies-and-locks or unlocks shipping.
useCompanyAddressCheckbox.addEventListener('change', syncShippingAddress);

// The "add participant" button.
addParticipantButton.addEventListener('click', addParticipant);

// Delete buttons live inside dynamically-added participants, so we can't bind
// them directly at load time. Instead we listen on the always-present list and
// check whether the click landed on a delete button (event delegation again).
participantsList.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-participant-button');
  if (button) deleteParticipant(button.closest('.participant'));
});

// On submit: stop the browser's default navigation, run our e-mail checks and
// the native validity check (which surfaces required-field and mismatch
// popups), and only POST if everything passes.
form.addEventListener('submit', (event) => {
  event.preventDefault();
  validateAllEmailPairs();
  if (!form.reportValidity()) return;
  submitForm();
});
