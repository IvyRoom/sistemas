////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Declara as demais variáveis necessárias.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var FormulárioLogin = document.getElementById('Formulário-Login');
var Entrar = document. getElementById('Entrar');
var AvisoInconsistência = document.getElementById('Aviso-Inconsistência');
var AvisoInicializando = document.getElementById('Aviso-Inicializando');

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Leva à página de aviso se a largura da tela ficar <= 1350.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('resize', LevaàPáginaAviso);

function LevaàPáginaAviso() {

    if (window.innerWidth <= 1024) {
    
        window.location.href = "/plataforma/aviso";
    
    }

}

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {
    
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Verifica se o login já foi feito anteriormente com "Lembrar-me".
    // Caso afirmativo, já entra na plataforma.
    // Caso negativo, limpa o sessionStorage.
    
    if (localStorage.getItem('Usuário_Logado') === 'Sim' || sessionStorage.getItem('Usuário_Logado') === 'Sim') {
    
        window.location.href = '/plataforma/painel';
    
    } else {

        LevaàPáginaAviso();

    }

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa submissão do formulário de login.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

FormulárioLogin.addEventListener('submit', function(event) {
    
    Entrar.style.display = "none";
    AvisoInicializando.style.display = "block";
    document.body.style.cursor = 'wait';
    
    event.preventDefault();
    
    var Usuário_Login = document.getElementById('E-mail').value;
    var Usuário_Senha = document.getElementById('Senha').value;
    var LembrarMeBinário = document.getElementById('Lembrar-me').checked;
    var TipoArmazenamento = LembrarMeBinário ? localStorage : sessionStorage;

    ////////////////////////////////////////////////////////////////////////////////////////
    // Envia o Usuário_Login e a Usuário_Senha ao backend.
    
    fetch('https://plataforma-backend-v3.azurewebsites.net/login', { //http://localhost:3000/login //https://plataforma-backend-v3.azurewebsites.net/login
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ login: Usuário_Login, senha: Usuário_Senha })
    })
    
    .then(response => response.json())
    
    //////////////////////////////////////////////////////////////////////////////////////////
    // Processa a entrada do usuário na plataforma de acordo com o resultado da autenticação.

    .then(data =>  {
        
        var LoginAutenticado = data.LoginAutenticado;
        
        if (LoginAutenticado === 1) {
            
            TipoArmazenamento.setItem('Usuário_Logado', 'Sim');
            TipoArmazenamento.setItem('Usuário_LembrarMe', 'Sim');
            TipoArmazenamento.setItem('IndexVerificado', data.IndexVerificado);
            TipoArmazenamento.setItem('Usuário_PrimeiroNome', data.Usuário_PrimeiroNome);
            TipoArmazenamento.setItem('Usuário_Preparatório1_Status', data.Usuário_Preparatório1_Status);
            TipoArmazenamento.setItem('Usuário_Preparatório1_PrazoAcesso', data.Usuário_Preparatório1_PrazoAcesso);
            
            window.location.href = '/plataforma/painel';

        } else {
            
            Entrar.style.display = "block";
            AvisoInicializando.style.display = "none";
            document.body.style.cursor = 'default';
            AvisoInconsistência.style.display = 'block';
            Usuário_Login.value = '';
            Usuário_Senha.value = '';

        }

    })

});


