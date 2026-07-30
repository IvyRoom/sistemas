"use strict";

const PRODUCTION_API_URL = "https://plataforma-backend-v3.azurewebsites.net/landingpage/solicitacaoorcamento";
const LOCAL_API_URL = "http://localhost:3000/landingpage/solicitacaoorcamento";
const REQUEST_TIMEOUT_MS = 60000;
const SUBMIT_LABEL = "SOLICITAR ORÇAMENTO";
const SUBMITTING_LABEL = "Processando informações...";
const SUBMIT_ERROR_MESSAGE = "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.";
const CNPJ_CHECK_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const TITLE_CASE_CONNECTORS = new Set(["de", "da", "do", "das", "dos", "e"]);

const form = document.getElementById("quote-form");
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const emailConfirmInput = document.getElementById("email-confirm");
const emailMismatchWarning = document.getElementById("email-mismatch-warning");
const phoneInput = document.getElementById("phone");
const roleInput = document.getElementById("role");
const companyNameInput = document.getElementById("company-name");
const companyCnpjInput = document.getElementById("company-cnpj");
const participantCountInput = document.getElementById("participant-count");
const notesInput = document.getElementById("notes");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const submissionStatus = document.getElementById("submission-status");
const successMessage = document.getElementById("form-success");

let isSubmitting = false;
let submissionAccepted = false;

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

// CNPJs issued from Jul/2026 on may be alphanumeric: 12 alphanumerics + 2 numeric check digits.
function cnpjChars(value) {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
}

function maskCnpj(value) {
  const chars = cnpjChars(value);
  let masked = chars.slice(0, 2);
  if (chars.length > 2) masked += `.${chars.slice(2, 5)}`;
  if (chars.length > 5) masked += `.${chars.slice(5, 8)}`;
  if (chars.length > 8) masked += `/${chars.slice(8, 12)}`;
  if (chars.length > 12) masked += `-${chars.slice(12, 14)}`;
  return masked;
}

function isValidCnpj(value) {
  const chars = cnpjChars(value);
  if (
    chars.length !== 14
    || !/^\d{2}$/.test(chars.slice(12))
    || /^(.)\1{13}$/.test(chars)
  ) {
    return false;
  }

  for (const length of [12, 13]) {
    const weights = CNPJ_CHECK_WEIGHTS.slice(13 - length);
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += (chars.charCodeAt(index) - 48) * weights[index];
    }
    const checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (checkDigit !== Number(chars[length])) return false;
  }

  return true;
}

function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits === "") return "";
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${areaCode}) ${number}`;

  const prefixLength = number.length <= 8 ? 4 : 5;
  return `(${areaCode}) ${number.slice(0, prefixLength)}-${number.slice(prefixLength)}`;
}

function isCompletePhone(value) {
  return [10, 11].includes(onlyDigits(value).length);
}

function collapseSpaces(value) {
  return value.trim().replace(/\s+/g, " ");
}

function hasIntentionalMixedCase(word) {
  return /\p{Ll}/u.test(word) && /\p{Lu}/u.test(word.slice(1));
}

function isAcronymLike(word) {
  if (/^\p{Lu}{2,3}$/u.test(word)) return true;
  const uppercaseLetters = word.match(/\p{Lu}/gu) || [];
  return uppercaseLetters.length >= 2
    && /[\d&/]/u.test(word)
    && !/\p{Ll}/u.test(word);
}

function titleCaseWord(word, lowercaseConnector, preserveAcronyms) {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (lowercaseConnector && TITLE_CASE_CONNECTORS.has(lower)) return lower;
  if (hasIntentionalMixedCase(word)) return word;
  if (preserveAcronyms && isAcronymLike(word)) return word;
  return lower.replace(/(^|[-'’])(.)/gu, (match, separator, char) => separator + char.toUpperCase());
}

function toTitleCase(value, { preserveAcronyms = false, capitalizeFirst = true } = {}) {
  return collapseSpaces(value)
    .split(" ")
    .map((word, index) => titleCaseWord(word, !(index === 0 && capitalizeFirst), preserveAcronyms))
    .join(" ");
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function preferredScrollBehavior() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

function isLocalHostname(hostname) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

function submissionUrl() {
  return isLocalHostname(window.location.hostname) ? LOCAL_API_URL : PRODUCTION_API_URL;
}

function setFieldValidity(input, message) {
  input.setCustomValidity(message);
  input.setAttribute("aria-invalid", String(message !== ""));
}

function validateEmailPair() {
  const email = normalizeEmail(emailInput.value);
  const confirmation = normalizeEmail(emailConfirmInput.value);
  const mismatch = confirmation !== "" && email !== confirmation;

  emailMismatchWarning.hidden = !mismatch;
  setFieldValidity(emailConfirmInput, mismatch ? "E-mails divergentes." : "");
  return !mismatch;
}

function clearEmailMismatch() {
  emailMismatchWarning.hidden = true;
  setFieldValidity(emailConfirmInput, "");
}

function validatePhone() {
  const message = phoneInput.value !== "" && !isCompletePhone(phoneInput.value)
    ? "Informe um telefone com DDD válido."
    : "";
  setFieldValidity(phoneInput, message);
  return message === "";
}

function validateCnpj() {
  const message = companyCnpjInput.value !== "" && !isValidCnpj(companyCnpjInput.value)
    ? "Informe um CNPJ válido."
    : "";
  setFieldValidity(companyCnpjInput, message);
  return message === "";
}

function normalizeFormValues() {
  fullNameInput.value = toTitleCase(fullNameInput.value);
  emailInput.value = normalizeEmail(emailInput.value);
  emailConfirmInput.value = normalizeEmail(emailConfirmInput.value);
  phoneInput.value = maskPhone(phoneInput.value);
  roleInput.value = toTitleCase(roleInput.value, { preserveAcronyms: true });
  companyNameInput.value = collapseSpaces(companyNameInput.value);
  companyCnpjInput.value = maskCnpj(companyCnpjInput.value);
  notesInput.value = notesInput.value.trim();
}

function collectPayload() {
  return {
    Solicitante_NomeCompleto: fullNameInput.value,
    Solicitante_Email: emailInput.value,
    Solicitante_Telefone: phoneInput.value,
    Solicitante_Cargo: roleInput.value,
    Solicitante_NomeEmpresa: companyNameInput.value,
    Solicitante_CNPJ: companyCnpjInput.value,
    Solicitante_NúmerodeParticipantes: participantCountInput.value,
    Solicitante_Observações: notesInput.value
  };
}

function setSubmitting(submitting) {
  isSubmitting = submitting;
  document.body.classList.toggle("is-submitting", submitting);
  form.setAttribute("aria-busy", String(submitting));
  submitButton.disabled = submitting;
  submitButton.setAttribute("aria-busy", String(submitting));
  submitLabel.textContent = submitting ? SUBMITTING_LABEL : SUBMIT_LABEL;
  submissionStatus.textContent = submitting ? SUBMITTING_LABEL : "";
}

function presentSuccess() {
  form.classList.add("quote-form--submitted");

  try {
    successMessage.focus({ preventScroll: true });
  } catch (error) {
    console.error("Could not focus the quote confirmation.", error);
  }

  try {
    window.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
  } catch (error) {
    console.error("Could not scroll to the quote confirmation.", error);
  }
}

async function submitQuote(event) {
  event.preventDefault();
  if (isSubmitting || submissionAccepted) return;

  normalizeFormValues();
  validateEmailPair();
  validatePhone();
  validateCnpj();
  if (!form.reportValidity()) return;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  setSubmitting(true);

  try {
    const response = await fetch(submissionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectPayload()),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Quote request failed with status ${response.status}.`);
  } catch (error) {
    setSubmitting(false);
    console.error("Falha no envio da solicitação de orçamento:", error);
    alert(SUBMIT_ERROR_MESSAGE);
    return;
  } finally {
    window.clearTimeout(timeoutId);
  }

  submissionAccepted = true;
  setSubmitting(false);
  presentSuccess();
}

fullNameInput.addEventListener("blur", () => {
  fullNameInput.value = toTitleCase(fullNameInput.value);
});

emailInput.addEventListener("input", clearEmailMismatch);
emailConfirmInput.addEventListener("input", clearEmailMismatch);

emailInput.addEventListener("blur", () => {
  emailInput.value = normalizeEmail(emailInput.value);
  emailConfirmInput.value = normalizeEmail(emailConfirmInput.value);
  validateEmailPair();
});

emailConfirmInput.addEventListener("blur", () => {
  emailInput.value = normalizeEmail(emailInput.value);
  emailConfirmInput.value = normalizeEmail(emailConfirmInput.value);
  validateEmailPair();
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = maskPhone(phoneInput.value);
  setFieldValidity(phoneInput, "");
});

phoneInput.addEventListener("blur", validatePhone);

roleInput.addEventListener("blur", () => {
  roleInput.value = toTitleCase(roleInput.value, { preserveAcronyms: true });
});

companyNameInput.addEventListener("blur", () => {
  companyNameInput.value = collapseSpaces(companyNameInput.value);
});

companyCnpjInput.addEventListener("input", () => {
  companyCnpjInput.value = maskCnpj(companyCnpjInput.value);
  setFieldValidity(companyCnpjInput, "");
});

companyCnpjInput.addEventListener("blur", validateCnpj);

notesInput.addEventListener("blur", () => {
  notesInput.value = notesInput.value.trim();
});

form.addEventListener("submit", submitQuote);
