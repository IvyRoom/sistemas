////////////////////////////////////////////////////////////////////////////////////////
// Botão "Entrar": Envia informações de login ao backend.
////////////////////////////////////////////////////////////////////////////////////////

// Declara as variáveis necessárias.
var FormulárioLogin = document.getElementById('Formulário-Login')
var EmailUsuário = document.getElementById('E-mail').value;
var SenhaUsuário = document.getElementById('Senha').value;

FormulárioLogin.addEventListener('submit', function(event) {
    event.preventDefault();

    fetch('plataforma-backend-evamawanhpe4ccaw.eastus-01.azurewebsites.net/login', { // Replace with your backend URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: EmailUsuário, senha: SenhaUsuário })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));

});




