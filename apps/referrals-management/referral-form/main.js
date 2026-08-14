'use strict';

const SUBMIT_ENDPOINT = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/conecta/processa-recomendacao'
  : 'https://plataforma-backend-v3.azurewebsites.net/conecta/processa-recomendacao';
const SUBMIT_TIMEOUT_MS = 60000;
const RETURNING_VISITOR_KEY = 'conecta-returning-visitor';
const COPY_FEEDBACK_MS = 2000;

const SUBMIT_ERROR_FALLBACK = 'Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.';
const SUBMIT_ERROR_MESSAGES = {
  Erro_014: 'Erro_014: dados inválidos ou incompletos.\nRevise o preenchimento e tente novamente.',
  Erro_015: 'Erro_015: falha de comunicação com a base de dados de recomendações.\nTente novamente.',
  Erro_016: 'Erro_016: recomendante não encontrado.\nUtilize o link personalizado que você recebeu por e-mail.',
  Erro_017: 'Erro_017: falha ao atualizar a base de dados de recomendações.\nTente novamente.',
  Erro_018: 'Erro_018: falha ao enviar os e-mails de confirmação.\nTente novamente.',
};

const urlParams = new URLSearchParams(location.search);
const recommenderFullName = (urlParams.get('ncr') || '').trim();
const benefitedCompany = (urlParams.get('eb') || '').trim();

const WHATSAPP_PATTERN = /^\+\d{2} \d{2} \d{5}-\d{4}$/;
const WHATSAPP_FORMAT_MESSAGE = 'Informe o WhatsApp no formato +XX XX XXXXX-XXXX, incluindo o código do país e o DDD.';

const sections = Array.from(document.querySelectorAll('.accordion-section'));
const aboutSection = document.getElementById('section-about');
const recommendSection = document.getElementById('section-recommend');
const form = document.querySelector('.form');
const invalidLinkNotice = document.querySelector('.invalid-link-notice');
const submitButton = document.querySelector('.submit-button');
const newRecommendationButton = document.querySelector('.new-recommendation-button');
const whatsappInput = document.getElementById('recommended-whatsapp');
const successCompanyName = document.querySelector('.success-company');
const copyLinkButtons = Array.from(document.querySelectorAll('.copy-link-button'));
const copyStatus = document.querySelector('.copy-status');
let copyFeedbackTimeout;

function openSection(target) {
  sections.forEach((section) => {
    const isOpen = section === target;
    section.classList.toggle('is-open', isOpen);
    section.querySelector('.section-toggle').setAttribute('aria-expanded', String(isOpen));
  });
}

function preferredScrollBehavior() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function scrollToSectionTop(section) {
  const top = section.getBoundingClientRect().top + window.scrollY - 10;
  window.scrollTo({ top: Math.max(top, 0), behavior: preferredScrollBehavior() });
}

function isReturningVisitor() {
  try {
    return localStorage.getItem(RETURNING_VISITOR_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function markVisit() {
  try {
    localStorage.setItem(RETURNING_VISITOR_KEY, '1');
  } catch (error) {
    /* armazenamento indisponível (ex.: navegação privada) — a página segue funcional */
  }
}

function maskWhatsapp(value) {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits === '') return '';
  let masked = `+${digits.slice(0, 2)}`;
  if (digits.length > 2) masked += ` ${digits.slice(2, 4)}`;
  if (digits.length > 4) masked += ` ${digits.slice(4, 9)}`;
  if (digits.length > 9) masked += `-${digits.slice(9)}`;
  return masked;
}

function isCompleteWhatsapp(value) {
  return WHATSAPP_PATTERN.test(value);
}

async function copyLink(button) {
  const url = button.closest('li').querySelector('a').href;

  try {
    if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(url);
  } catch (error) {
    console.error('Falha ao copiar link:', error);
    window.prompt('Não foi possível copiar automaticamente. Copie o link:', url);
    return;
  }

  clearTimeout(copyFeedbackTimeout);
  copyLinkButtons.forEach((copyButton) => copyButton.classList.remove('is-copied'));
  button.classList.add('is-copied');
  copyStatus.textContent = 'Link copiado!';
  copyFeedbackTimeout = setTimeout(() => {
    button.classList.remove('is-copied');
    copyStatus.textContent = '';
  }, COPY_FEEDBACK_MS);
}

function collectFormData() {
  return {
    recommenderFullName,
    benefitedCompany,
    recommendedCompany: document.getElementById('recommended-company').value.trim(),
    recommendedProfessional: document.getElementById('recommended-professional').value.trim(),
    recommendedWhatsapp: document.getElementById('recommended-whatsapp').value.trim(),
  };
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.setAttribute('aria-busy', String(isSubmitting));
  document.body.classList.toggle('is-submitting', isSubmitting);
}

async function submitForm() {
  const submitLabel = submitButton.textContent;
  setSubmitting(true);
  submitButton.textContent = 'Enviando…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  const formData = collectFormData();

  try {
    const response = await fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw { error: data.error };
    successCompanyName.textContent = formData.recommendedCompany;
    form.classList.add('form--submitted');
    document.querySelector('.form-success').scrollIntoView({ block: 'center', behavior: preferredScrollBehavior() });
  } catch (error) {
    console.error('Falha no envio da recomendação:', error);
    window.alert(SUBMIT_ERROR_MESSAGES[error && error.error] || SUBMIT_ERROR_FALLBACK);
  } finally {
    clearTimeout(timeout);
    setSubmitting(false);
    submitButton.textContent = submitLabel;
  }
}

sections.forEach((section) => {
  section.querySelector('.section-toggle').addEventListener('click', () => {
    openSection(section);
    scrollToSectionTop(section);
  });
});

openSection(isReturningVisitor() ? recommendSection : aboutSection);
markVisit();

if (recommenderFullName && benefitedCompany) {
  document.getElementById('recommender-name').value = recommenderFullName;
  document.getElementById('benefited-company').value = benefitedCompany;
} else {
  form.hidden = true;
  invalidLinkNotice.hidden = false;
}

whatsappInput.addEventListener('input', () => {
  whatsappInput.value = maskWhatsapp(whatsappInput.value);
  whatsappInput.setCustomValidity('');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  whatsappInput.setCustomValidity(whatsappInput.value === '' || isCompleteWhatsapp(whatsappInput.value) ? '' : WHATSAPP_FORMAT_MESSAGE);
  if (!form.reportValidity()) return;
  submitForm();
});

newRecommendationButton.addEventListener('click', () => {
  ['recommended-company', 'recommended-professional', 'recommended-whatsapp'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  form.classList.remove('form--submitted');
  document.getElementById('recommended-company').focus();
});

copyLinkButtons.forEach((button) => {
  button.addEventListener('click', () => copyLink(button));
});
