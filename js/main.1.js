////////////////////////////////////////////////////////////////////////////////////////
// Botão "Entrar": Envia informações de login ao backend.
////////////////////////////////////////////////////////////////////////////////////////

// Declara as variáveis necessárias.
var FormulárioLogin = document.getElementById('Formulário-Login')
var EmailUsuário = document.getElementById('E-mail');
var SenhaUsuário = document.getElementById('Senha');

FormulárioLogin.addEventListener('submit', function(event) {
    event.preventDefault();

    fetch('https://plataforma-backend-evamawanhpe4ccaw.brazilsouth-01.azurewebsites.net/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: EmailUsuário.value, senha: SenhaUsuário.value })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));

});



