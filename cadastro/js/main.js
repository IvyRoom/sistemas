/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Define as Variáveis Puxadas do HTML
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

var NomeCompleto = document.getElementById("NomeCompleto"); 
var Email = document.getElementById("Email");
var AvisoProcessando = document.getElementById("Aviso_Processando");
var AvisoEmailInválido = document.getElementById("Aviso_Email_Inválido");

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Configura os Campos de Dados Pessoais
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*Configura a digitação do NomeCompleto para:
a) Não permitir qualquer caracter que não seja " " ou letras. 
b) Não permitir que o último caracter seja " ".*/

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

Email.addEventListener("change", function() {

  Email.value = Email.value.replace(/\s+$/, "");
  AvisoEmailInválido.style.display = "none";

})


/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
      Envia os dados de cadastro para o backend.
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

var Formulário_de_Cadastro = document.getElementById('Formulário_de_Cadastro');
var Receber_Convite = document.getElementById('Receber_Convite');
var Status_EmSubmissão = false;

////////////////////////////////////////////////////////////////////////////
// Obtém o IP do Lead.

var EndereçoIP = "";

fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => { EndereçoIP = data.ip })
  .catch(error => { EndereçoIP = "" });

////////////////////////////////////////////////////////////////////////////
// Obtém o User_Agent do Lead.

var UserAgent = navigator.userAgent;

Formulário_de_Cadastro.addEventListener('submit', (event) => {
    
    //////////////////////////////////////////////////////////////////////
    // Evita envio duplicado dos dados do Potencial Aluno:
    
    Receber_Convite.style.display = "none";
    AvisoProcessando.style.display = "flex";
    document.body.style.cursor = 'wait';
    
    event.preventDefault();

    //////////////////////////////////////////////////////////////////////
    // Cria o Lead_fbclid_Tratado, conforme orientações presentes em https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc#2--format-clickid

    var fbclid = localStorage.getItem('fbclid');
    var fbclid_momento_registro = localStorage.getItem('fbclid_momento_registro');
    var fbclid_tratado;
    
    if (fbclid === "") {
        
        fbclid_tratado = "";
    
    } else {
        
        fbclid_tratado = "fb.1." + (Date.now() - new Date(fbclid_momento_registro).getTime()) + "." + fbclid;
    }
    
    //////////////////////////////////////////////////////////////////////
    // Manda as informações do lead ao backend.

    fetch('https://plataforma-backend-v3.azurewebsites.net/landingpage/cadastro', { //http://localhost:3000/landingpage/cadastro //https://plataforma-backend-v3.azurewebsites.net/landingpage/cadastro
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ NomeCompleto: NomeCompleto.value, Email: Email.value, EndereçoIP: EndereçoIP, UserAgent: UserAgent, fbclid_tratado: fbclid_tratado })
    })
    
    .then(response => {
        
        if (response.status === 200) {
            
            window.location.href = "https://www.instagram.com/channel/AbaebGO_wVnsawoW/";
        
        } else {
    
            Receber_Convite.style.display = "block";
            AvisoProcessando.style.display = "none";
            document.body.style.cursor = 'default';
            AvisoEmailInválido.style.display = "flex";
    
        }
    
    });

});