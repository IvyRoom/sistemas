////////////////////////////////////////////////////////////////////////////////////////
// Puxa as variáveis do HTML.

var Formulário_Postar_Reel = document.getElementById("Formulário_Postar_Reel");
var Reel_Código = document.getElementById("Reel_Código");
var Reel_Legenda = document.getElementById("Reel_Legenda");
var Incluir_Stories = document.getElementById("Incluir_Stories");
var Atualizações_Postagem = document.getElementById("Atualizações_Postagem");

var Formulário_Criar_Campanha_RL = document.getElementById("Formulário_Criar_Campanha_RL");
var Reel_Código_Campanha_RL = document.getElementById("Reel_Código_Campanha_RL");
var Atualizações_Campanha_RL = document.getElementById("Atualizações_Campanha_RL");

////////////////////////////////////////////////////////////////////////////////////////
// Manda as informações ao backend quando o Botão_Postar_Reels é clicado.

Formulário_Postar_Reel.addEventListener("submit", function(event) {

    event.preventDefault();

    fetch('https://plataforma-backend-v3.azurewebsites.net/meta/temp1', { //http://127.0.0.1:3000/meta/postar //https://plataforma-backend-v3.azurewebsites.net/meta/postar
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "Reel_Código": Reel_Código.value,
            "Reel_Legenda": Reel_Legenda.value,
            "Incluir_Stories": Incluir_Stories.checked
        })
    })

    .then(response => response.json()).then(data => {

        Atualizações_Postagem.innerHTML += data.message;

    })

})

////////////////////////////////////////////////////////////////////////////////////////
// Manda as informações ao backend quando o Botão_Criar_Campanha_RL é clicado.

Formulário_Criar_Campanha_RL.addEventListener("submit", function(event) {

    event.preventDefault();

    fetch('https://plataforma-backend-v3.azurewebsites.net/meta/temp2', { //http://127.0.0.1:3000/meta/CriaCampanhaRL //https://plataforma-backend-v3.azurewebsites.net/meta/CriaCampanhaRL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "Reel_Código": Reel_Código_Campanha_RL.value
        })
    })

    .then(response => response.json()).then(data => {

        Atualizações_Campanha_RL.innerHTML += data.message;

    })

})

// ////////////////////////////////////////////////////////////////////////////////////////
// // Conecta com o endpoint do backend para receber as atualizações de postagem.

// const eventSource = new EventSource('https://plataforma-backend-v3.azurewebsites.net/meta/retornar_atualizacoes'); //http://127.0.0.1:3000/meta/retornar_atualizacoes //https://plataforma-backend-v3.azurewebsites.net/meta/retornar_atualizacoes

// eventSource.onmessage = function(event) {
    
//     const Mensagem = JSON.parse(event.data).mensagem;
//     const Origem = JSON.parse(event.data).origem;

//     if (Origem === "postar"){

//         Atualizações_Postagem.innerHTML += `<br>${Mensagem}`;

//     } else {

//         Atualizações_Campanha_RL.innerHTML += `<br>${Mensagem}`;

//     }

// };


////////////////////////////////////////////////////////////////////////////////////////
// Conecta com o endpoint do backend para receber as atualizações de postagem.

const eventSource = new EventSource('https://plataforma-backend-v3.azurewebsites.net/meta/atualizacoes'); //http://127.0.0.1:3000/meta/retornar_atualizacoes //https://plataforma-backend-v3.azurewebsites.net/meta/retornar_atualizacoes

eventSource.onmessage = function(event) {
    
    const Mensagem = JSON.parse(event.data).mensagem;
    const Origem = JSON.parse(event.data).origem;

    if (Origem === "temp1"){

        Atualizações_Postagem.innerHTML += `<br>${Mensagem}`;

    } else {

        Atualizações_Campanha_RL.innerHTML += `<br>${Mensagem}`;

    }

};