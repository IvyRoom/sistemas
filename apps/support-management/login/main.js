import { createSupportClient, SCHEDULER_PATH } from '../modules/client.js';

const client = createSupportClient();
const form = document.getElementById('login-form');
const button = document.getElementById('login-submit');
const message = document.getElementById('login-message');
const email = document.getElementById('email');
const password = document.getElementById('password');

window.addEventListener('pagehide', () => { password.value = ''; });

try {
  await client.config();
  message.textContent = '';
  button.disabled = false;
} catch {
  message.textContent = 'O ambiente de testes ainda não está disponível. Tente novamente mais tarde.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  message.textContent = 'Entrando...';
  email.setAttribute('aria-invalid', 'false');
  password.setAttribute('aria-invalid', 'false');
  try {
    await client.login(email.value.trim(), password.value);
    window.location.assign(SCHEDULER_PATH);
  } catch (error) {
    if (error.status === 401) {
      message.textContent = 'E-mail ou senha inválidos, ou acesso inativo.';
      email.setAttribute('aria-invalid', 'true');
      password.setAttribute('aria-invalid', 'true');
      password.focus();
    } else if (error.status === 429) {
      message.textContent = 'Aguarde alguns minutos antes de tentar novamente.';
    } else {
      message.textContent = 'Não foi possível entrar. Tente novamente.';
    }
  } finally {
    password.value = '';
    button.disabled = false;
    form.setAttribute('aria-busy', 'false');
  }
});
