
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {

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
    // Declara as demais variáveis necessárias.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////

    // Variáveis do card do Preparatório 01.
    var Preparatório01BotãoPrincipal = document.getElementById('Preparatório-01-Botão-Principal');
    var Preparatório01StatusSímboloOriginal = document.getElementById('Preparatório-01-Status-Símbolo-Original');
    var Preparatório01ContainerPrazoAcesso = document.getElementById('Preparatório-01-Container-Prazo-Acesso');
    var Preparatório01PrazoAcesso = document.getElementById('Preparatório-01-Prazo-Acesso');

    // Variáveis do card do Preparatório 02.
    var Preparatório02BotãoPrincipal = document.getElementById('Preparatório-02-Botão-Principal');

    // Variáveis do Login no Cabeçalho.
    var UsuárioLogadoNome = document.getElementById('Usuário-Logado-Nome');
    var BotãoSair = document.getElementById('Botão-Sair');

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Puxa as váriaveis do backend.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    
    if (localStorage.getItem('Usuário_Logado') === 'Sim' || sessionStorage.getItem('Usuário_Logado') === 'Sim') {
        
        // Deixa o cursor em espera.
        document.body.style.cursor = 'wait';
        Preparatório01BotãoPrincipal.style.cursor = "wait"
        Preparatório02BotãoPrincipal.style.cursor = "wait"
        
        var TipoArmazenamento;

        TipoArmazenamento = localStorage.getItem('Usuário_Logado') === 'Sim' ? localStorage : sessionStorage;
        
        var IndexVerificado = TipoArmazenamento.getItem('IndexVerificado');
        
        fetch('https://plataforma-backend-v3.azurewebsites.net/refresh', { //http://localhost:3000/refresh //https://plataforma-backend-v3.azurewebsites.net/refresh
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ IndexVerificado: IndexVerificado })
        })
        
        .then(response => response.json())
        
        .then(data =>  {
            
            var Usuário_PrimeiroNome = data.Usuário_PrimeiroNome;
            var Usuário_Preparatório1_Status = data.Usuário_Preparatório1_Status;
            var Usuário_Preparatório1_PrazoAcesso = data.Usuário_Preparatório1_PrazoAcesso;

            //////////////////////////////////////////////////////////////////////////////////////////
            // Configura o card do Preparatório 01.

            if (Usuário_Preparatório1_Status === 'Ativo') {

                // Retorna o cursor para "default".
                document.body.style.cursor = 'default';
                
                // Substitui o Status de "Cadeado" para "Check Verde".
                var Preparatório01StatusSímboloSubstituído = document.createElement('div');
                Preparatório01StatusSímboloSubstituído.id = 'Preparatório-01-Status-Símbolo-Substituído';
                Preparatório01StatusSímboloOriginal.parentNode.replaceChild(Preparatório01StatusSímboloSubstituído, Preparatório01StatusSímboloOriginal);

                // Configura o Botão Principal.
                Preparatório01BotãoPrincipal.textContent = 'Entrar';
                Preparatório01BotãoPrincipal.style.backgroundColor = "#a41034";
                Preparatório01BotãoPrincipal.style.cursor = "pointer"

                // Configura o Prazo de Acesso.
                Preparatório01PrazoAcesso.textContent = "Expira: " + Usuário_Preparatório1_PrazoAcesso;

                // Cria o Botão de Extensão de Acesso.
                var Preparatório01BotãoEstenderAcesso = document.createElement('div');
                Preparatório01BotãoEstenderAcesso.id = 'Preparatório-01-Botão-Estender-Acesso';
                Preparatório01BotãoEstenderAcesso.textContent = "Estender Acesso";
                Preparatório01ContainerPrazoAcesso.insertBefore(Preparatório01BotãoEstenderAcesso, Preparatório01PrazoAcesso.nextSibling);

                // Dá funcionalidade ao Botão de Extensão de Acesso.
                Preparatório01BotãoEstenderAcesso.addEventListener('click', function(){
                    
                    window.location.href = '/plataforma/extensão';

                })

            }

            //////////////////////////////////////////////////////////////////////////////////////////
            // Configura o card do Preparatório 02.

            // Configura o Botão Principal.
            Preparatório02BotãoPrincipal.style.cursor = "pointer";

            //////////////////////////////////////////////////////////////////////////////////////////
            // Configura o Nome do Usuário no cabeçalho.

            UsuárioLogadoNome.textContent = Usuário_PrimeiroNome;
            console.log(Usuário_PrimeiroNome);

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão Principal do Preparatório 01.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            Preparatório01BotãoPrincipal.addEventListener('click', function(){

                if (Usuário_Preparatório1_Status === 'Ativo') {

                    window.location.href = '/plataforma/estudo';

                } else {

                    window.location.href = '/';
                
                }

            });

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão Principal do Preparatório 02.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            Preparatório02BotãoPrincipal.addEventListener('click', function(){

                window.location.href = '/plataforma/conhecer';

            });

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão-Sair.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            BotãoSair.addEventListener('click', function() {

                localStorage.removeItem('Usuário_Logado');
                localStorage.removeItem('Usuário_LembrarMe');
                localStorage.removeItem('Usuário_Email');
                localStorage.removeItem('Usuário_PrimeiroNome');
                localStorage.removeItem('Usuário_Preparatório1_Status');
                localStorage.removeItem('Usuário_Preparatório1_PrazoAcesso');
                localStorage.removeItem('Usuário_Preparatório1_PercentualCumprimento');

                sessionStorage.clear();
                
                window.location.href = '/plataforma/login';
                
            });
        
        })

    } else {

        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        // Configura o Botão-Sair.
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////

        BotãoSair.style.display = "none";

        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Botão Principal do Preparatório 01.
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////

        Preparatório01BotãoPrincipal.style.cursor = "pointer";

        Preparatório01BotãoPrincipal.addEventListener('click', function(){

                window.location.href = '/';

        });

        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Botão Principal do Preparatório 02.
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////

        Preparatório02BotãoPrincipal.style.cursor = "pointer";

        Preparatório02BotãoPrincipal.addEventListener('click', function(){

            window.location.href = '/plataforma/conhecer';

        });

        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Botão-Sair.
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////

        BotãoSair.addEventListener('click', function() {

            localStorage.removeItem('Usuário_Logado');
            localStorage.removeItem('Usuário_LembrarMe');
            localStorage.removeItem('Usuário_Email');
            localStorage.removeItem('Usuário_PrimeiroNome');
            localStorage.removeItem('Usuário_Preparatório1_Status');
            localStorage.removeItem('Usuário_Preparatório1_PrazoAcesso');
            localStorage.removeItem('Usuário_Preparatório1_PercentualCumprimento');

            sessionStorage.clear();
            
            window.location.href = '/plataforma/login';
            
        });

    }

});


