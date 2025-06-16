/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Define as Variáveis Puxadas do HTML
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

var FormuláriodeSolicitação = document.getElementById("Formulário-de-Solicitação");
var NomeCompleto = document.getElementById("Nome-Completo");
var Email = document.getElementById("Email");
var ConfirmaçãoEmail = document.getElementById("Confirmação-Email");
var AvisoEmailsDivergentesCampo = document.getElementById("Aviso-Emails-Divergentes-Campo");
var TelefonecomDDD = document.getElementById("Telefone-com-DDD");
var Cargo = document.getElementById("Cargo");
var NomeEmpresa = document.getElementById("Nome-Empresa");
var CNPJ = document.getElementById("CNPJ");
var Observações = document.getElementById("Observações");
var BotãoSolicitarOrçamento = document.getElementById("Botão-Solicitar-Orçamento");
var AvisoEmailsDivergentesBotão = document.getElementById("Aviso-Emails-Divergentes-Botão");
var AvisoProcessando = document.getElementById("Aviso-Processando");

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Configura os Campos de Preenchimento
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*////////////////////////////////////////////////////////////*/
/*////////////////////// Nome Completo ///////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Bloqueia qualquer caracter que não seja " " ou letras. 
b) Retira o último caracter se for " ".
*/

NomeCompleto.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

NomeCompleto.addEventListener("change", function() {

    NomeCompleto.value = NomeCompleto.value.replace(/\s+$/, "");

})

/*////////////////////////////////////////////////////////////*/
/*///////////////////////// E-mail ///////////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Retira o último caracter se for " ".
*/

Email.addEventListener("blur", function() {
    
    Email.value = Email.value.replace(/\s+$/, "");

})

/*////////////////////////////////////////////////////////////*/
/*/////////////////// Confirmação E-mail /////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Retira o último caracter se for " ".
b) Ativa os avisos de e-mail inválido
*/

let StatusBotãoSolicitarOrçamento = "liberado";

ConfirmaçãoEmail.addEventListener("blur", function() {

    ConfirmaçãoEmail.value = ConfirmaçãoEmail.value.replace(/\s+$/, "");

    if (Email.value == ConfirmaçãoEmail.value) {
        AvisoEmailsDivergentesCampo.style.display = "none";
        AvisoEmailsDivergentesBotão.style.display = "none";
        StatusBotãoSolicitarOrçamento = "liberado";
        BotãoSolicitarOrçamento.style.backgroundColor = "#056839";
        BotãoSolicitarOrçamento.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 1)";
    } else {
        AvisoEmailsDivergentesCampo.style.display = "block";
        AvisoEmailsDivergentesBotão.style.display = "flex";
        StatusBotãoSolicitarOrçamento = "travado";
        BotãoSolicitarOrçamento.style.backgroundColor = "#d2d2d2";
        BotãoSolicitarOrçamento.style.boxShadow = "0px 1px 1px rgba(0, 0, 0, 1)";
    }

})

/*////////////////////////////////////////////////////////////*/
/*//////////////////// Telefone com DDD //////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Bloqueia o "autocomplete".
b) Formata como "(##) #####-####" durante preenchimento.
b) Formata como "(##) #####-####" se realizado com autofill.
*/

TelefonecomDDD.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

    let Tamanho_TelefonecomDDD = TelefonecomDDD.value.length
    
    if (Tamanho_TelefonecomDDD == 0) {

        TelefonecomDDD.value += '('  
    
    } else if (Tamanho_TelefonecomDDD == 3) {

        TelefonecomDDD.value += ') '

    } else if (Tamanho_TelefonecomDDD == 4) {

        TelefonecomDDD.value += ' '

    } else if (Tamanho_TelefonecomDDD == 10) {

        TelefonecomDDD.value += '-'

    } else if (Tamanho_TelefonecomDDD == 15) {

        event.preventDefault();

    } 

})

/*////////////////////////////////////////////////////////////*/
/*/////////////////////////// Cargo //////////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Bloqueia qualquer caracter que não seja " " ou letras. 
b) Retira o último caracter se for " ".
*/

Cargo.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

Cargo.addEventListener("change", function() {

    Cargo.value = Cargo.value.replace(/\s+$/, "");

})

/*////////////////////////////////////////////////////////////*/
/*///////////////////// Nome da Empresa //////////////////////*/
/*////////////////////////////////////////////////////////////*/

/* 
a) Retira o último caracter se for " ".
*/

NomeEmpresa.addEventListener("change", function() {

    NomeEmpresa.value = NomeEmpresa.value.replace(/\s+$/, "");

})

/*////////////////////////////////////////////////////////////*/
/*/////////////////////////// CNPJ ///////////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Bloqueia o "autocomplete".
b) Formata como "##.###.###/####-##".
*/

CNPJ.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

    let Tamanho_CNPJ = CNPJ.value.length
    
    if (Tamanho_CNPJ == 2) {

        CNPJ.value += '.'  
    
    } else if (Tamanho_CNPJ == 6) {

        CNPJ.value += '.'

    } else if (Tamanho_CNPJ == 10) {

        CNPJ.value += '/'

    } else if (Tamanho_CNPJ == 15) {

        CNPJ.value += '-'

    } else if (Tamanho_CNPJ == 18) {

        event.preventDefault();

    } 

})

/*////////////////////////////////////////////////////////////*/
/*/////////////////////// Observações ////////////////////////*/
/*////////////////////////////////////////////////////////////*/

/* 
a) Retira o último caracter se for " ".
*/

Observações.addEventListener("change", function() {

    Observações.value = Observações.value.replace(/\s+$/, "");

})


/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
      Envia os dados da solicitação para o backend.
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

FormuláriodeSolicitação.addEventListener('submit', (event) => {
    
    //////////////////////////////////////////////////////////////////////
    // Evita envio duplicado:
    
    BotãoSolicitarOrçamento.style.display = "none";
    AvisoProcessando.style.display = "flex";
    document.body.style.cursor = 'wait';
    
    event.preventDefault();
    
    //////////////////////////////////////////////////////////////////////
    // Manda as informações do solicitante ao backend.

    fetch('http://plataforma-backend-v3.azurewebsites.net/landingpage/solicitacaoorcamento', { //http://localhost:3000/landingpage/solicitacaoorcamento //https://plataforma-backend-v3.azurewebsites.net/landingpage/solicitacaoorcamento
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            Solicitante_NomeCompleto: NomeCompleto.value,
            Solicitante_Email: Email.value,
            Solicitante_Telefone: TelefonecomDDD.value,
            Solicitante_Cargo: Cargo.value,
            Solicitante_NomeEmpresa: NomeEmpresa.value,
            Solicitante_CNPJ: CNPJ.value,
            Solicitante_Observações: Observações.value.trim()
        })
    })

    .then(response => {
        
        if (response.status === 200) {

             window.location.href = "../confirmação/";
        
        }
    
    });

});