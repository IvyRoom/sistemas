/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Define as Variáveis Puxadas do HTML
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

var NomeCompleto = document.getElementById("NomeCompleto"); 
var PerfilInstagram = document.getElementById("PerfilInstagram");

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


/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
      Envia os dados do checkout para o Power Automate.
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

var Formulário_de_Cadastro = document.getElementById('Formulário_de_Cadastro');
var Receber_Convite = document.getElementById('Receber_Convite');
var Status_EmSubmissão = false;

Formulário_de_Cadastro.addEventListener('submit', (event) => {
    
    event.preventDefault();

    //////////////////////////////////////////////////////////////////////
    // Evita envio duplicado ou triplicado dos dados do Potencial Aluno:

    // a) Desativando o botão "Receber Convite"
    Receber_Convite.disabled = true;

    // b) Cancelando a função se o Status_Submissão já for "true".
    if (Status_EmSubmissão) return;
    Status_EmSubmissão = true;

    //Manda as informações ao Power Automate.
    const payload = {
      
      NomeCompleto: NomeCompleto.value,
      PerfilInstagram: PerfilInstagram.value,

    };

    fetch('https://prod2-08.brazilsouth.logic.azure.com:443/workflows/735473bec8274c41aa3657e631956e10/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RD7BFuMbFbATUQHwzjEpyxT4lYYDmVX7hP056xLRfqQ', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    .then(response => {
        window.location.href = "/confirmação";
        console.log ("Infos enviadas ao Power Automate.");
    })

    // Reseta o Status_EmSubmissão e o botão Receber_Convite caso haja erro no fetch:
    .catch(error => {
      console.error("Erro ao enviar os dados ao Power Automate:", error);
      Status_EmSubmissão = false; 
      Receber_Convite.disabled = false;
    });

});