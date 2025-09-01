/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Define as Variáveis Puxadas do HTML
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

var FormuláriodeValidação = document.getElementById("Formulário-de-Validação");
var CertificadoID = document.getElementById("Certificado-ID");
var Email = document.getElementById("Email");
var BotãoValidarCertificado = document.getElementById("Botão-Validar-Certificado");
var AvisoProcessando = document.getElementById("Aviso-Processando");

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Configura os Campos de Preenchimento
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*////////////////////////////////////////////////////////////*/
/*///////////////////////// E-mail ///////////////////////////*/
/*////////////////////////////////////////////////////////////*/

/*
a) Retira o último caracter se for " ".
*/

Email.addEventListener("blur", function() {
    
    Email.value = Email.value.replace(/\s+$/, "");

})

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
      Envia os dados da validação para o backend.
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

FormuláriodeValidação.addEventListener('submit', (event) => {
    
    //////////////////////////////////////////////////////////////////////
    // Evita envio duplicado:
    
    BotãoValidarCertificado.style.display = "none";
    AvisoProcessando.style.display = "flex";
    document.body.style.cursor = 'wait';
    
    event.preventDefault();
    
    //////////////////////////////////////////////////////////////////////
    // Manda as informações do solicitante ao backend.

    fetch('https://plataforma-backend-v3.azurewebsites.net/landingpage/validacaocertificados', { //http://localhost:3000/landingpage/validacaocertificados //https://plataforma-backend-v3.azurewebsites.net/landingpage/validacaocertificados
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            Solicitante_CertificadoID: CertificadoID.value,
            Solicitante_Email: Email.value
        })
    })

    .then(response => {
        
        if (response.status === 200) {

             window.location.href = "../confirmação/";
        
        }
    
    });

});