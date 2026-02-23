////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que leva à página aviso-dispositivo e processa alterações do tamanho da tela.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function LevaàPáginaAvisoDispositivo() { if (window.innerWidth <= 1024) { window.location.href = "/plataforma_v2/aviso-dispositivo"; } }

window.addEventListener('resize', LevaàPáginaAvisoDispositivo);

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function () {

    sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Não');

    if ((navigator.userAgentData?.brands?.some(b => b.brand === "Microsoft Edge") || navigator.userAgent.includes("Edg")) === false) { window.location.href = '/plataforma_v2/aviso-navegador'; }

    else {

        if (sessionStorage.getItem('Usuário_Autorização_Cadastro') !== 'Sim') { window.location.href = '/plataforma_v2/login'; }

        else { LevaàPáginaAvisoDispositivo(); }

    }

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa a submissão do formulário.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

let PalavraPasseCredenciais = document.getElementById('Palavra-Passe-Credenciais');
let PalavraPasseDireitos = document.getElementById('Palavra-Passe-Direitos');
let PalavraPasseMedidas = document.getElementById('Palavra-Passe-Medidas');
let AlertaPalavraPasseCredenciais = document.getElementById("Alerta-Palavra-Passe-Credenciais");
let AlertaPalavraPasseDireitos = document.getElementById("Alerta-Palavra-Passe-Direitos");
let AlertaPalavraPasseMedidas = document.getElementById("Alerta-Palavra-Passe-Medidas");
let BotãoLieConcordo = document.getElementById("Botão-Li-e-Concordo");

document.getElementById('Formulário').addEventListener('submit', function (event) {
    
    document.body.style.cursor = 'wait';
    event.preventDefault();
    BotãoLieConcordo.style.display = "none";
    
    if (PalavraPasseCredenciais.value !== "credenciais") { document.getElementById('Alerta-Palavra-Passe-Credenciais').style.display = "block"; }
    if (PalavraPasseDireitos.value !== "direitos") { document.getElementById('Alerta-Palavra-Passe-Direitos').style.display = "block"; }
    if (PalavraPasseMedidas.value !== "medidas") { document.getElementById('Alerta-Palavra-Passe-Medidas').style.display = "block"; }

    if (PalavraPasseCredenciais.value === "credenciais" && PalavraPasseDireitos.value === "direitos" && PalavraPasseMedidas.value === "medidas") { window.location.href = '/plataforma_v2/cadastro'; }
    else { document.body.style.cursor = 'default'; }

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Reseta o AvisoInconsistência e o AvisoLoginExpirado caso o Email ou Senha sejam alterados.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

PalavraPasseCredenciais.addEventListener('change', function () { AlertaPalavraPasseCredenciais.style.display = 'none'; AlertaPalavraPasseDireitos.style.display = 'none'; AlertaPalavraPasseMedidas.style.display = 'none'; BotãoLieConcordo.style.display = "block"; });
PalavraPasseDireitos.addEventListener('change', function () { AlertaPalavraPasseCredenciais.style.display = 'none'; AlertaPalavraPasseDireitos.style.display = 'none'; AlertaPalavraPasseMedidas.style.display = 'none'; BotãoLieConcordo.style.display = "block"; });
PalavraPasseMedidas.addEventListener('change', function () { AlertaPalavraPasseCredenciais.style.display = 'none'; AlertaPalavraPasseDireitos.style.display = 'none'; AlertaPalavraPasseMedidas.style.display = 'none'; BotãoLieConcordo.style.display = "block"; });