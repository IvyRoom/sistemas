////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis extraídas do URL buscada.
////////////////////////////////////////////////////////////////////////////////////////

const parâmetros = new URLSearchParams(window.location.search);

const nome_completo_recomendante = parâmetros.get('ncr');
const email_recomendante = parâmetros.get('emr');
const empresa_beneficiada = parâmetros.get('eb');

////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis extraídas do HTML.
////////////////////////////////////////////////////////////////////////////////////////

const Recomendante_Nome_Completo = document.getElementById("Recomendante_Nome_Completo");
const Recomendante_Email = document.getElementById("Recomendante_Email");
const Recomendante_Empresa_Beneficiada = document.getElementById("Recomendante_Empresa_Beneficiada");

Recomendante_Nome_Completo.innerHTML = nome_completo_recomendante;
Recomendante_Email.innerHTML = email_recomendante;
Recomendante_Empresa_Beneficiada.innerHTML = empresa_beneficiada;

// BotãoCadastrar.onclick = function (e) {

//     //////////////////////////////////////////////////////////////////////
//     // Evita envio duplicado:

//     BotãoCadastrar.style.display = "none";
//     document.body.style.cursor = 'wait';
//     event.preventDefault();

//     //////////////////////////////////////////////////////////////////////
//     // Manda as informações ao backend.

//     fetch('http://localhost:3000/conecta/cadastro', { //http://localhost:3000/conecta/cadastro //https://plataforma-backend-v3.azurewebsites.net/conecta/cadastro
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ NomeCompleto: NomeCompleto.value, Email: Email.value })
//     })
    
//     .then(response => { if (response.status === 200) { FormulárioCadastro.style.display = "none"; AvisoCadastroRealizado.style.display = "block"; } });

// };