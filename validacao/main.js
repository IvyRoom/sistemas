'use strict';

const VALIDATE_ENDPOINT = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/landingpage/validacaocertificados/'
  : 'https://plataforma-backend-v3.azurewebsites.net/landingpage/validacaocertificados/';
const VALIDATE_TIMEOUT_MS = 15000;

const form = document.querySelector('.validator-form');
const input = document.getElementById('certificate-id');
const button = document.querySelector('.validate-button');
const result = document.getElementById('validation-result');

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.setAttribute('aria-busy', String(isLoading));
  button.textContent = isLoading ? 'Validando…' : 'Validar Certificado';
}

function makeLine(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

function showResult(state, lines) {
  result.className = `validation-result validation-result--${state}`;
  result.replaceChildren(...lines);
  result.hidden = false;
}

function renderValid(data) {
  const lines = [
    makeLine('result-headline', '✓ Certificado válido'),
    makeLine('result-name', data.Titular_NomeCompleto),
  ];
  if (Number.isFinite(data.Acumulado_Percentual)) {
    lines.push(makeLine('result-detail', `Aproveitamento: ${data.Acumulado_Percentual}%`));
  }
  if (data.Certificado_ID) {
    lines.push(makeLine('result-detail', `Certificado ID#: ${data.Certificado_ID}`));
  }
  showResult('valid', lines);
}

function renderInvalid() {
  showResult('invalid', [
    makeLine('result-headline', '✗ Certificado não encontrado'),
    makeLine('result-detail', 'Confira o Certificado ID# digitado e tente novamente.'),
  ]);
}

function renderError() {
  showResult('error', [
    makeLine('result-headline', 'Não foi possível validar agora'),
    makeLine('result-detail', 'Tente novamente em alguns instantes.'),
  ]);
}

async function validate(certificateId) {
  setLoading(true);
  result.hidden = true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VALIDATE_TIMEOUT_MS);

  try {
    const response = await fetch(VALIDATE_ENDPOINT + encodeURIComponent(certificateId), {
      method: 'GET',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.Certificado_Válido) renderValid(data);
    else renderInvalid();
  } catch (error) {
    console.error('Falha na validação do certificado:', error);
    renderError();
  } finally {
    clearTimeout(timeout);
    setLoading(false);
  }
}

input.addEventListener('input', () => {
  input.value = input.value.trim().toUpperCase();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const certificateId = input.value.trim().toUpperCase();
  if (!certificateId) return;
  validate(certificateId);
});
