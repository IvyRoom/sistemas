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
// Puxa as váriaveis do backend.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var BotãoEntrarListaEspera = document.getElementById('Botão-Entrar-Lista-Espera');

window.addEventListener('load', function() {
    
    if (localStorage.getItem('Usuário_Logado') === 'Sim' || sessionStorage.getItem('Usuário_Logado') === 'Sim') {
    
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
            
            var Usuário_Preparatório2_Interesse = data.Usuário_Preparatório2_Interesse;

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura o Botão-Entrar-Lista-Espera.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            if (Usuário_Preparatório2_Interesse === "SIM") {

                BotãoEntrarListaEspera.innerHTML = 'CADASTRO JÁ REALIZADO'

            } else {

                BotãoEntrarListaEspera.style.backgroundColor = '#056839';
                BotãoEntrarListaEspera.style.cursor = 'pointer';
                BotãoEntrarListaEspera.innerHTML = 'ENTRAR NA LISTA DE ESPERA'

                BotãoEntrarListaEspera.addEventListener('mouseenter', function() {
                    this.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.5)';
                });
                
                BotãoEntrarListaEspera.addEventListener('mouseleave', function() {
                    this.style.boxShadow = '';
                });

                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa o Botão-Entrar-Lista-Espera.
                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////

                BotãoEntrarListaEspera.addEventListener('click',function(){

                    BotãoEntrarListaEspera.style.display = 'none';
                    
                    fetch('https://plataforma-backend-v3.azurewebsites.net/updates', { //http://localhost:3000/updates //https://plataforma-backend-v3.azurewebsites.net/updates
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ TipoAtualização: 'Preparatório2_Interesse', IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: 'n/a', NúmeroMódulo: 'n/a', NotaTeste: 'n/a', Preparatório2_Interesse: 'SIM' })
                    })
                    
                    .then(response => {
                                    
                        if (response.status === 200) {
                            
                            window.history.back();
    
                        }
                    
                    });


                });

            }
        
        });
    
    } else {

        BotãoEntrarListaEspera.innerHTML = 'AGUARDANDO LOGIN';

    }

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa o Botão-Voltar.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var BotãoVoltar = document.getElementById('Botão-Voltar');

BotãoVoltar.addEventListener('click', function(){

    window.history.back();

})