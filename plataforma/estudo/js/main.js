////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Puxa as váriaveis do backend.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {
    
    if (localStorage.getItem('Usuário_Logado') === 'Sim' || sessionStorage.getItem('Usuário_Logado') === 'Sim') {
    
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
            
            var Usuário_NomeCompleto = data.Usuário_NomeCompleto;
            var Usuário_Preparatório1_Status = data.Usuário_Preparatório1_Status;
            var Usuário_Preparatório1_PrazoAcesso = data.Usuário_Preparatório1_PrazoAcesso;
            var Usuário_Preparatório1_NúmeroTópicosConcluídos = parseFloat(data.Usuário_Preparatório1_NúmeroTópicosConcluídos);
            
            var Usuário_Preparatório1_NotasMódulos = [];

            for (var i = 1; i <= 7; i++) {
            
                Usuário_Preparatório1_NotasMódulos[i] = data[`Usuário_Preparatório1_NotaMódulo${i}`];
            
            }
            
            var Usuário_Preparatório1_NotaAcumulado = data.Usuário_Preparatório1_NotaAcumulado;
            var Usuário_Preparatório1_CertificadoID = data.Usuário_Preparatório1_CertificadoID;
            var Usuário_Preparatório2_Interesse = data.Usuário_Preparatório2_Interesse;
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Declara as demais variáveis necessárias.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            ////////////////////////////////////// Geral ///////////////////////////////////////////
            var NúmeroTópicosMódulo1 = 17;
            var NúmeroTópicosMódulo2 = 16;
            var NúmeroTópicosMódulo3 = 26;
            var NúmeroTópicosMódulo4 = 7;
            var NúmeroTópicosMódulo5 = 11;
            var NúmeroTópicosMódulo6 = 14;
            var NúmeroTópicosMódulo7 = 8;
        
            var NúmeroTópicosTotal = NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4 + NúmeroTópicosMódulo5 + NúmeroTópicosMódulo6 + NúmeroTópicosMódulo7;
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura os itens necessários ao carregar a página.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            var Preparatório01StatusSímboloOriginal = document.getElementById('Preparatório-01-Status-Símbolo-Original');
            var Preparatório01BotãoPrincipal = document.getElementById('Preparatório-01-Botão-Principal');
            var Preparatório01PrazoAcesso = document.getElementById('Preparatório-01-Prazo-Acesso');
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Torna a página visível.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            var ContainerSeções = document.getElementById('Container-Seções');
            
            ContainerSeções.style.display = 'flex';

            ////////////////////////////////////////////////////////////////////////////////////////
            // Atualiza o Símbolo de Status, o Prazo de Acesso e o Botão de Extensão de Acesso.
            ////////////////////////////////////////////////////////////////////////////////////////
            
            if (Usuário_Preparatório1_Status === 'Ativo'){

                // Substitui o Status de "Cadeado" para "Check Verde".
                var Preparatório01StatusSímboloSubstituído = document.createElement('div');
                Preparatório01StatusSímboloSubstituído.id = 'Preparatório-01-Status-Símbolo-Substituído';
                Preparatório01StatusSímboloOriginal.parentNode.replaceChild(Preparatório01StatusSímboloSubstituído, Preparatório01StatusSímboloOriginal);

                // Configura o Prazo de Acesso.
                Preparatório01PrazoAcesso.textContent = "Expira: " + Usuário_Preparatório1_PrazoAcesso;

                // Configura o Botão Principal.
                Preparatório01BotãoPrincipal.textContent = 'Estender Acesso';
                Preparatório01BotãoPrincipal.style.backgroundColor = "#343434";
                Preparatório01BotãoPrincipal.style.animation = "none";
                Preparatório01BotãoPrincipal.style.fontSize = "14px";

            } else {

                window.location.href = '/plataforma/painel';

            }

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////// Seção-Navegação //////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão-Voltar.
            ////////////////////////////////////////////////////////////////////////////////////////
        
            var BotãoVoltar = document.getElementById("Botão-Voltar");
        
            BotãoVoltar.addEventListener("click", function(){
        
                window.location.href = '/plataforma/painel';
        
            })
        
            ////////////////////////////////// Seção-Conteúdo //////////////////////////////////////
        
            var NomeTópico = document.getElementById("Nome-Tópico");
            var DisplayVídeo = document.getElementById("Display-Vídeo");
            var AvisoEspecialTópico = document.getElementById("Aviso-Especial-Tópico");
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa a abertura da página.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão Principal do Preparatório 01.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            Preparatório01BotãoPrincipal.addEventListener('click', function(){
        
                window.location.href = '/plataforma/extensão';
    
            })
            
            AtualizaAvançoPreparatório(Usuário_Preparatório1_NúmeroTópicosConcluídos);
        
            function AtualizaAvançoPreparatório(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado){
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza a Régua de Avanço.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                var Preparatório01RéguaAvanço = document.getElementById('Preparatório-01-Régua-Avanço');
                Preparatório01RéguaAvanço.style.width = Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado / NúmeroTópicosTotal * 100 + "%";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza o "% Concluído" do Preparatório.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                var Preparatório01PercentualConcluído = document.getElementById('Preparatório-01-Percentual-Concluído');
                Preparatório01PercentualConcluído.innerHTML = (Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado / NúmeroTópicosTotal * 100).toFixed(1) + "% concluído";

                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza os Anéis de Avanço.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                var PercentualAvançoMódulo1;
                var PercentualAvançoMódulo2;
                var PercentualAvançoMódulo3;
                var PercentualAvançoMódulo4;
                var PercentualAvançoMódulo5;
                var PercentualAvançoMódulo6;
                var PercentualAvançoMódulo7;
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Calcula os percentuais de avanço em cada um dos módulos.
        
                // Módulo 1
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= NúmeroTópicosMódulo1) {
                    
                    PercentualAvançoMódulo1 = 100;
        
                } else {
        
                    PercentualAvançoMódulo1 = (Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado / NúmeroTópicosMódulo1) * 100;
        
                }
        
                // Módulo 2
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado <= NúmeroTópicosMódulo1) {
                    
                    PercentualAvançoMódulo2 = 0;
        
                } else if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2)) {
                    
                    PercentualAvançoMódulo2 = 100;
        
                } else {
        
                    PercentualAvançoMódulo2 = ((Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado - NúmeroTópicosMódulo1) / NúmeroTópicosMódulo2) * 100;
        
                }
        
                // Módulo 3
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado <= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2)) {
                    
                    PercentualAvançoMódulo3 = 0;
        
                } else if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3)) {
                    
                    PercentualAvançoMódulo3 = 100;
        
                } else {
        
                    PercentualAvançoMódulo3 = ((Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado - NúmeroTópicosMódulo1 - NúmeroTópicosMódulo2) / NúmeroTópicosMódulo3) * 100;
        
                }
        
                // Módulo 4
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado <= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3)) {
                    
                    PercentualAvançoMódulo4 = 0;
        
                } else if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4)) {
                    
                    PercentualAvançoMódulo4 = 100;
        
                } else {
        
                    PercentualAvançoMódulo4 = ((Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado - NúmeroTópicosMódulo1 - NúmeroTópicosMódulo2 - NúmeroTópicosMódulo3) / NúmeroTópicosMódulo4) * 100;
        
                }
        
                // Módulo 5
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado <= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4)) {
                    
                    PercentualAvançoMódulo5 = 0;
        
                } else if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4 + NúmeroTópicosMódulo5)) {
                    
                    PercentualAvançoMódulo5 = 100;
        
                } else {
        
                    PercentualAvançoMódulo5 = ((Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado - NúmeroTópicosMódulo1 - NúmeroTópicosMódulo2 - NúmeroTópicosMódulo3 - NúmeroTópicosMódulo4) / NúmeroTópicosMódulo5) * 100;
        
                }
        
                // Módulo 6
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado <= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4 + NúmeroTópicosMódulo5)) {
                    
                    PercentualAvançoMódulo6 = 0;
        
                } else if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4 + NúmeroTópicosMódulo5 + NúmeroTópicosMódulo6)) {
                    
                    PercentualAvançoMódulo6 = 100;
        
                } else {
        
                    PercentualAvançoMódulo6 = ((Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado - NúmeroTópicosMódulo1 - NúmeroTópicosMódulo2 - NúmeroTópicosMódulo3 - NúmeroTópicosMódulo4 - NúmeroTópicosMódulo5) / NúmeroTópicosMódulo6) * 100;
        
                }
        
                // Módulo 7
        
                if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado <= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4 + NúmeroTópicosMódulo5 + NúmeroTópicosMódulo6)) {
                    
                    PercentualAvançoMódulo7 = 0;

                } else if(Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado >= (NúmeroTópicosMódulo1 + NúmeroTópicosMódulo2 + NúmeroTópicosMódulo3 + NúmeroTópicosMódulo4 + NúmeroTópicosMódulo5 + NúmeroTópicosMódulo6 + NúmeroTópicosMódulo7)) {
                    
                    PercentualAvançoMódulo7 = 100;
        
                } else {
        
                    PercentualAvançoMódulo7 = ((Usuário_Preparatório1_NúmeroTópicosConcluídos_Atualizado - NúmeroTópicosMódulo1 - NúmeroTópicosMódulo2 - NúmeroTópicosMódulo3 - NúmeroTópicosMódulo4 - NúmeroTópicosMódulo5 - NúmeroTópicosMódulo6) / NúmeroTópicosMódulo7) * 100;

                }
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza os anéis.
        
                var Módulo1_AnelAvançoProgresso = document.getElementById("Módulo-1-Anel-Avanço-Progresso");
                var Módulo2_AnelAvançoProgresso = document.getElementById("Módulo-2-Anel-Avanço-Progresso");
                var Módulo3_AnelAvançoProgresso = document.getElementById("Módulo-3-Anel-Avanço-Progresso");
                var Módulo4_AnelAvançoProgresso = document.getElementById("Módulo-4-Anel-Avanço-Progresso");
                var Módulo5_AnelAvançoProgresso = document.getElementById("Módulo-5-Anel-Avanço-Progresso");
                var Módulo6_AnelAvançoProgresso = document.getElementById("Módulo-6-Anel-Avanço-Progresso");
                var Módulo7_AnelAvançoProgresso = document.getElementById("Módulo-7-Anel-Avanço-Progresso");
        
                Módulo1_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo1 / 50) * Math.PI * 12;
                Módulo2_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo2 / 50) * Math.PI * 12;
                Módulo3_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo3 / 50) * Math.PI * 12;
                Módulo4_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo4 / 50) * Math.PI * 12;
                Módulo5_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo5 / 50) * Math.PI * 12;
                Módulo6_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo6 / 50) * Math.PI * 12;
                Módulo7_AnelAvançoProgresso.style.strokeDashoffset = (2.5 - PercentualAvançoMódulo7 / 50) * Math.PI * 12;
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza as Frações de Tópicos Concluídos.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                var FraçãoAvançoMódulo1 = document.getElementById('Fração-Avanço-Módulo-1');
                var FraçãoAvançoMódulo2 = document.getElementById('Fração-Avanço-Módulo-2');
                var FraçãoAvançoMódulo3 = document.getElementById('Fração-Avanço-Módulo-3');
                var FraçãoAvançoMódulo4 = document.getElementById('Fração-Avanço-Módulo-4');
                var FraçãoAvançoMódulo5 = document.getElementById('Fração-Avanço-Módulo-5');
                var FraçãoAvançoMódulo6 = document.getElementById('Fração-Avanço-Módulo-6');
                var FraçãoAvançoMódulo7 = document.getElementById('Fração-Avanço-Módulo-7');
        
                FraçãoAvançoMódulo1.innerHTML = Math.round((PercentualAvançoMódulo1 * NúmeroTópicosMódulo1)/100) + "/" + NúmeroTópicosMódulo1;
                FraçãoAvançoMódulo2.innerHTML = Math.round((PercentualAvançoMódulo2 * NúmeroTópicosMódulo2)/100) + "/" + NúmeroTópicosMódulo2;
                FraçãoAvançoMódulo3.innerHTML = Math.round((PercentualAvançoMódulo3 * NúmeroTópicosMódulo3)/100) + "/" + NúmeroTópicosMódulo3;
                FraçãoAvançoMódulo4.innerHTML = Math.round((PercentualAvançoMódulo4 * NúmeroTópicosMódulo4)/100) + "/" + NúmeroTópicosMódulo4;
                FraçãoAvançoMódulo5.innerHTML = Math.round((PercentualAvançoMódulo5 * NúmeroTópicosMódulo5)/100) + "/" + NúmeroTópicosMódulo5;
                FraçãoAvançoMódulo6.innerHTML = Math.round((PercentualAvançoMódulo6 * NúmeroTópicosMódulo6)/100) + "/" + NúmeroTópicosMódulo6;
                FraçãoAvançoMódulo7.innerHTML = Math.round((PercentualAvançoMódulo7 * NúmeroTópicosMódulo7)/100) + "/" + NúmeroTópicosMódulo7;
        
            }
        
            ////////////////////////////////////////////////////////////////////////////////////////
            // Atualiza os Container-Tópico e os Símbolo-Check.
            ////////////////////////////////////////////////////////////////////////////////////////
        
            var ContainersTópicosFechados = Array.from(document.getElementsByClassName("Container-Tópico-Fechado"));
        
            ContainersTópicosFechados.sort(function(a, b) {
                return parseInt(a.getAttribute('data-index')) - parseInt(b.getAttribute('data-index'));
            });
        
            ////////////////////////////////////////////////////////////////////////////////////////
            // Atualiza o "status" (o className) dos Container-Tópico e dos Símbolos-Check.
        
            for (var i = 0; i < Usuário_Preparatório1_NúmeroTópicosConcluídos; i++) {
                ContainersTópicosFechados[i].className = "Container-Tópico-Concluído";
                ContainersTópicosFechados[i].querySelector('.Símbolo-Check-Fechado').innerHTML = "✔";
                ContainersTópicosFechados[i].querySelector('.Símbolo-Check-Fechado').className = "Símbolo-Check-Concluído";
            }
        
            // Antes de atualizar o Container-Tópico que deve estar aberto, verifica se é undefined (que é o caso, quando o Preparatório já foi finalizado).
            ContainersTópicosFechados[Usuário_Preparatório1_NúmeroTópicosConcluídos] && (ContainersTópicosFechados[Usuário_Preparatório1_NúmeroTópicosConcluídos].className = "Container-Tópico-Aberto");
            ContainersTópicosFechados[Usuário_Preparatório1_NúmeroTópicosConcluídos] && (ContainersTópicosFechados[Usuário_Preparatório1_NúmeroTópicosConcluídos].querySelector('.Símbolo-Check-Fechado').className = "Símbolo-Check-Aberto");
        
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa a abertura e fechamento dos Módulos na Seção-Navegação.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            const ContainersMódulos = document.querySelectorAll("[id^='Container-Módulo-']");
            const SetasAuxiliaresMódulos = document.querySelectorAll("[id^='Seta-Auxiliar-Módulo-']");
            const ContainerExternoTópicosMódulos = document.querySelectorAll("[id^='Container-Externo-Tópicos-Módulo-']");
            var MóduloAberto;
        
            ContainersMódulos.forEach((ContainerMódulos, NúmeroMódulo) => {
        
                ContainerMódulos.addEventListener('click', () => AbreMódulo(NúmeroMódulo));
        
            });
        
            function AbreMódulo(NúmeroMóduloAtivo) {
                
                ContainerExternoTópicosMódulos.forEach((ContainerExternoTópicosMódulo, NúmeroMódulo) => {
        
                    if (NúmeroMódulo === NúmeroMóduloAtivo) {
        
                        MóduloAberto = `Módulo ${NúmeroMóduloAtivo + 1}`;
                        
                        ContainerExternoTópicosMódulo.style.display = ContainerExternoTópicosMódulo.style.display === "block" ? "none" : "block";
                        SetasAuxiliaresMódulos[NúmeroMódulo].innerHTML = ContainerExternoTópicosMódulo.style.display === "block"
                            ? '<polygon points="0,6 7,0 14,6 13,6 7,1 1,6"/>'
                            : '<polygon points="0,0 7,6 14,0 13,0 7,5 1,0"/>';
        
                    } else {
                        
                        ContainerExternoTópicosMódulo.style.display = "none";
                        SetasAuxiliaresMódulos[NúmeroMódulo].innerHTML = '<polygon points="0,0 7,6 14,0 13,0 7,5 1,0"/>';
                    
                    }
                
                });
        
            }
        
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa a abertura e fechamento dos tópicos na Seção-Navegação e na Seção-Conteúdo.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            ////////////////////////////////////////////////////////////////////////////////////////
            // Aciona o processamento do clique nos Containers de Tópicos Concluídos e Abertos.
            ////////////////////////////////////////////////////////////////////////////////////////
        
            var ContainersTópicosConcluídos = document.getElementsByClassName("Container-Tópico-Concluído");
            var ContainersTópicosAbertos = document.getElementsByClassName("Container-Tópico-Aberto");
        
            for (var i = 0; i < ContainersTópicosConcluídos.length; i++) {
                ContainersTópicosConcluídos[i].addEventListener('click', AbreTópico);
            }
        
            for (var i = 0; i < ContainersTópicosAbertos.length; i++) {
                ContainersTópicosAbertos[i].addEventListener('click', AbreTópico);
            }
        
            ////////////////////////////////////////////////////////////////////////////////////////
            // Abre o Conteúdo do Tópico.
            ////////////////////////////////////////////////////////////////////////////////////////
        
            var ContainerExternoConteúdo = document.getElementById("Container-Externo-Conteúdo");
            var ContainerInternoConteúdo = document.getElementById("Container-Interno-Conteúdo");
            var ContainersExternosTesteMódulos = document.querySelectorAll("[id^='Container-Externo-Teste-Módulo-']");
            var FaixaInferior = document.getElementById('Faixa-Inferior');
            var ContainerExternoDesempenhoeCertificado = document.getElementById('Container-Externo-Desempenho-e-Certificado');
        
            function AbreTópico() {
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna o Container-Externo-Desempenho-e-Certificado invisível.
                ////////////////////////////////////////////////////////////////////////////////////////
                
                ContainerExternoDesempenhoeCertificado.style.display = "none";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna a Faixa Inferior visível.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                FaixaInferior.style.display = "flex";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Deixa só o Tópico escolhido com fonte em negrito, background escurecido e estampa.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                for (var i = 0; i < ContainersTópicosConcluídos.length; i++) {
                    ContainersTópicosConcluídos[i].style.backgroundColor = "#ebebeb";
                    ContainersTópicosConcluídos[i].querySelector('.Tópico-Nome').style.fontWeight = "400";
                }
        
                for (var i = 0; i < ContainersTópicosAbertos.length; i++) {
                    ContainersTópicosAbertos[i].style.backgroundColor = "#ebebeb";
                    ContainersTópicosAbertos[i].querySelector('.Tópico-Nome').style.fontWeight = "400";
                }
        
                var ContainerTópicoSelecionado = this;
        
                ContainerTópicoSelecionado.style.backgroundColor = "#d4d4d4";
                ContainerTópicoSelecionado.querySelector('.Tópico-Nome').style.fontWeight = "500";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza o Nome do Tópico escolhido, no canto superior esquerdo do cabeçalho.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                NomeTópico.innerHTML = "<b>" + ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML + "</b>";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza o conteúdo sendo mostrado na tela.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                if (ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML.includes("Teste:")) {
        
                    ////////////////////////////////////////////////////////////////////////////////////////
                    // Caso o Tópico selecionado seja um Teste...
        
                    // Torna o Container-Externo-Conteúdo invisível.
        
                    ContainerExternoConteúdo.style.display = "none";
        
                    // Torna só o Container-Externo-Teste-Módulo-# selecionado visível.
        
                    var NúmeroMóduloContémTópicoSelecionado = parseInt(ContainerTópicoSelecionado.getAttribute("name").match(/\d+/)[0], 10);
        
                    ContainersExternosTesteMódulos.forEach((ContainerExternoTesteMódulo, Índice) => {
        
                        ContainerExternoTesteMódulo.style.display = (Índice === NúmeroMóduloContémTópicoSelecionado - 1) ? "block" : "none";
                    
                    });
        
                    // Destrava as questões e desmarca as respostas.
                    
                    var RespostasTodas = document.querySelectorAll('input[data-correct="sim"], input[data-correct="não"]');
        
                    RespostasTodas.forEach(function(input) {
                        input.disabled = false;
                        input.parentElement.style.backgroundColor = '#ffffff';
                    });
                    
                } else {
        
                    ////////////////////////////////////////////////////////////////////////////////////////
                    // Caso o Tópico selecionado não seja um Teste...
        
                    // Torna o Container-Externo-Conteúdo visível.
        
                    ContainerExternoConteúdo.style.display = "flex";
        
                    // Torna todos os Container-Externo-Teste-Módulo-# invisível.
        
                    ContainersExternosTesteMódulos.forEach(ContainerExternoTesteMódulo => ContainerExternoTesteMódulo.style.display = "none");
        
                    // Atualiza o vídeo a partir do Microsoft Azure Storage Account Container.
        
                    var NomeVídeo = ContainerTópicoSelecionado.getAttribute('name');
                    
                    //Puxa o vídeo do Azure Storage Account (videospreparatoriosv2) por meio do Azure CDN (plataformaCDN).
                    
                    DisplayVídeo.src = "https://plataformaCDN.azureedge.net/videosv3/" + MóduloAberto + "/" + NomeVídeo + ".mp4";

                    // Atualiza o Aviso Especial Tópico e o arquivo para download.
        
                    var ContainerDownloadArquivo1 = document.getElementById("Container-Download-Arquivo-1");
                    var NomeArquivo1 = document.getElementById("Nome-Arquivo-1");
                    var BotãoDownload1 = document.getElementById("Botão-Download-1");
        
                    var ContainerDownloadArquivo2 = document.getElementById("Container-Download-Arquivo-2");
                    var NomeArquivo2 = document.getElementById("Nome-Arquivo-2");
                    var BotãoDownload2 = document.getElementById("Botão-Download-2");
        
                    var ContainerDownloadArquivo3 = document.getElementById("Container-Download-Arquivo-3");
                    var NomeArquivo3 = document.getElementById("Nome-Arquivo-3");
                    var BotãoDownload3 = document.getElementById("Botão-Download-3");
        
                    var ContainerDownloadArquivo4 = document.getElementById("Container-Download-Arquivo-4");
                    var NomeArquivo4 = document.getElementById("Nome-Arquivo-4");
                    var BotãoDownload4 = document.getElementById("Botão-Download-4");
        
                    if (NomeVídeo === "3.3 ESTUDO DE CASO GG.01 (PARTE 1)"){
        
                        ContainerInternoConteúdo.style.height = "auto";
                        
                        NomeArquivo1.innerHTML = "BASE DE DADOS GG.01";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 1/BASE DE DADOS GG.01.xlsx";
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "3.5 - ESTUDO DE CASO GG.02"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "BASE DE DADOS GG.02";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 1/BASE DE DADOS GG.02.xlsx";
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "3.5 - ESTUDO DE CASO GG.02"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "BASE DE DADOS GG.02";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 1/BASE DE DADOS GG.02.xlsx";
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "3.7 - ESTUDO DE CASO GG.03"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "BASE DE DADOS GG.03";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 1/BASE DE DADOS GG.03.xlsx";
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "1.4 ESTUDO DE CASO GG.04"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = "Note que trabalhamos numa cópia da base de dados original, a aba&nbsp;<b>BD - GG.04 ORIGINAL</b>.";
                        
                        NomeArquivo1.innerHTML = "BASE DE DADOS GG.04";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 2/BASE DE DADOS GG.04.xlsx";
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "1.6 ESTUDO DE CASO GG.05"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = "Note que trabalhamos numa cópia da base de dados original, a aba&nbsp;<b>BD - GG.05 ORIGINAL</b>.";
                        
                        NomeArquivo1.innerHTML = "BASE DE DADOS GG.05";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 2/BASE DE DADOS GG.05.xlsx";
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "2.6 ESTUDO DE CASO INTERNO"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = "Nós enviamos uma cópia impressa do Ishikawa preenchido para você. Veja o caderno: Estudos de Caso";
                        
                        ContainerDownloadArquivo1.style.display = "none";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    }   else if (NomeVídeo === "1.4 TO DO SIMPLIFICADO"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "TO DO SIMPLIFICADO";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 3/TO DO SIMPLIFICADO.xlsm";
                        
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
                        
                    } else if (NomeVídeo === "1.5 ESTUDO DE CASO INTERNO"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "TO DO (TATIANA)";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 3/TO DO (TATIANA).xlsm";
                        ContainerDownloadArquivo1.style.display = "flex";
        
                        NomeArquivo2.innerHTML = "TO DO (LUCAS)";
                        BotãoDownload2.href = "/plataforma/estudo/files/Módulo 3/TO DO (LUCAS).xlsm";
                        ContainerDownloadArquivo2.style.display = "flex";
        
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
                        
                    } else if (NomeVídeo === "2.2 FERRAMENTA DE CONTROLE DE RESULTADOS"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "FERRAMENTA CONTROLE RESULTADOS";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 3/FERRAMENTA CONTROLE DE RESULTADOS.xlsm";
                        
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
                        
                    } else if (NomeVídeo === "3.6 TO DO AVANÇADO"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        NomeArquivo1.innerHTML = "TO DO AVANÇADO";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 3/TO DO AVANÇADO.xlsm";
        
                        ContainerDownloadArquivo1.style.display = "flex";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
                        
                    } else if (NomeVídeo === "3.8 ESTUDO DE CASO GG.06 (EXTRA)"){
        
                        ContainerInternoConteúdo.style.height = "100%";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = "Estudo de Caso extra! Estes conceitos não serão cobrados no teste.";
                        
                        NomeArquivo1.innerHTML = "TO DO AVANÇADO GG.06";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 3/TO DO AVANÇADO GG.06.xlsm";
                        ContainerDownloadArquivo1.style.display = "flex";
        
                        NomeArquivo2.innerHTML = "BASE DE DADOS GG.06";
                        BotãoDownload2.href = "/plataforma/estudo/files/Módulo 3/BASE DE DADOS GG.06.xlsx";
                        ContainerDownloadArquivo2.style.display = "flex";
        
                        NomeArquivo3.innerHTML = "FERRAMENTA CONTROLE DE RESULTADOS GG.06";
                        BotãoDownload3.href = "/plataforma/estudo/files/Módulo 3/FERRAMENTA CONTROLE DE RESULTADOS GG.06.xlsm";
                        ContainerDownloadArquivo3.style.display = "flex";
        
                        NomeArquivo4.innerHTML = "FERRAMENTA CONTROLE DE RESULTADOS";
                        BotãoDownload4.href = "/plataforma/estudo/files/Módulo 3/FERRAMENTA CONTROLE DE RESULTADOS.pbix";
                        ContainerDownloadArquivo4.style.display = "flex";
                        
                        
                    } else if (NomeVídeo === "1.1 PADRONIZAÇÃO (Parte 1)"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = 'Microsoft Visio -&nbsp;<a href="https://www.microsoft.com/en-us/evalcenter/evaluate-visio" target="_blank">Licença Gratuita Experimental</a>';
                        
                        ContainerDownloadArquivo1.style.display = "none";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "1.4 PADRONIZAÇÃO (Parte 3)"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = 'Link:&nbsp;<a href="https://www.bpmn.org/" target="_blank">BPMN.org</a>';
                        
                        ContainerDownloadArquivo1.style.display = "none";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "1.5 GUIA PARA PADRONIZAÇÃO E AUTOMATIZAÇÃO"){
        
                        ContainerInternoConteúdo.style.height = "100%";
        
                        AvisoEspecialTópico.style.display = "none";
                        
                        NomeArquivo1.innerHTML = "SIMBOLOGIA FLUXOGRAMAS (BPMN)";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 5/SIMBOLOGIA FLUXOGRAMAS (BPMN).vssx";
                        ContainerDownloadArquivo1.style.display = "flex";
        
                        NomeArquivo2.innerHTML = "TEMPLATE FOP (A3)";
                        BotãoDownload2.href = "/plataforma/estudo/files/Módulo 5/TEMPLATE FOP (A3).vsdx";
                        ContainerDownloadArquivo2.style.display = "flex";
        
                        NomeArquivo3.innerHTML = "TEMPLATE FOP (A4)";
                        BotãoDownload3.href = "/plataforma/estudo/files/Módulo 5/TEMPLATE FOP (A4).vsdx";
                        ContainerDownloadArquivo3.style.display = "flex";
        
                        NomeArquivo4.innerHTML = "TEMPLATE POP";
                        BotãoDownload4.href = "/plataforma/estudo/files/Módulo 5/TEMPLATE POP.xlsx";
                        ContainerDownloadArquivo4.style.display = "flex";
        
                    } else if (NomeVídeo === "1.7 ESTUDO DE CASO INTERNO"){
        
                        ContainerInternoConteúdo.style.height = "100%";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = 'Observe que nós enviamos uma cópia impressa do FOP que construímos para você. Consulte o caderno "Estudos de Caso".';
                        
                        NomeArquivo1.innerHTML = "TO DO (LUCAS)";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 5/TO DO (LUCAS).xlsm";
                        ContainerDownloadArquivo1.style.display = "flex";
        
                        NomeArquivo2.innerHTML = "TO DO (TATIANA)";
                        BotãoDownload2.href = "/plataforma/estudo/files/Módulo 5/TO DO (TATIANA).xlsm";
                        ContainerDownloadArquivo2.style.display = "flex";
        
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "1.1 AUTOMATIZAÇÃO (Parte 1)"){
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "none";
                        AvisoEspecialTópico.innerHTML = 'Microsoft Power Automate -&nbsp;<a href="https://www.microsoft.com/en-us/power-platform/products/power-automate" target="_blank">Licença Experimental Gratuita</a>; Safety Culture iAuditor -&nbsp;<a href="https://app.safetyculture.io" target="_blank">Licença Experimental Gratuita</a>';
                        
                        ContainerDownloadArquivo1.style.display = "none";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else if (NomeVídeo === "1.4 ESTUDO DE CASO GG.07"){
        
                        ContainerInternoConteúdo.style.height = "100%";
        
                        AvisoEspecialTópico.style.display = "flex";
                        AvisoEspecialTópico.style.userSelect = "text";
                        AvisoEspecialTópico.innerHTML = 'Código de Auxílio (Power Automate): &lt;img src="data:image/jpeg;base64,@{body(&#39;Get_file_content_using_path&#39;)[&#39;$content&#39;]}" alt="" /&gt;';
                        
                        NomeArquivo1.innerHTML = "FOP (MONTAGEM E ENVIO DE RELATÓRIOS CONTÁBEIS)";
                        BotãoDownload1.href = "/plataforma/estudo/files/Módulo 6/FOP (MONTAGEM E ENVIO DE RELATÓRIOS CONTÁBEIS).vsdx";
                        ContainerDownloadArquivo1.style.display = "flex";
        
                        NomeArquivo2.innerHTML = "RELATÓRIO CONTÁBIL";
                        BotãoDownload2.href = "/plataforma/estudo/files/Módulo 6/RELATÓRIO CONTÁBIL.pdf";
                        ContainerDownloadArquivo2.style.display = "flex";
        
                        NomeArquivo3.innerHTML = "ASSINATURA E-MAIL";
                        BotãoDownload3.href = "/plataforma/estudo/files/Módulo 6/ASSINATURA E-MAIL.png";
                        ContainerDownloadArquivo3.style.display = "flex";
                        
                        ContainerDownloadArquivo4.style.display = "none";
        
                    } else {
        
                        ContainerInternoConteúdo.style.height = "auto";
        
                        AvisoEspecialTópico.style.display = "none";
                        AvisoEspecialTópico.innerHTML = "";
        
                        ContainerDownloadArquivo1.style.display = "none";
                        ContainerDownloadArquivo2.style.display = "none";
                        ContainerDownloadArquivo3.style.display = "none";
                        ContainerDownloadArquivo4.style.display = "none";
        
                    }
        
                }
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Adiciona:
                // - O Botão de "Completar e Continuar" ou o aviso de "Tópico Concluído".
                // ou 
                // - O Botão "Enviar Respostas" ou o aviso de "Teste Concluído".
                ////////////////////////////////////////////////////////////////////////////////////////
        
                if(ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML.includes("Teste")){
        
                    if(ContainerTópicoSelecionado.className === "Container-Tópico-Aberto"){
        
                        FaixaInferior.innerHTML = '<div id="Botão-Enviar-Respostas">Enviar Respostas</div>';
                
                        ////////////////////////////////////////////////////////////////////////////////////////
                        ////////////////////////////////////////////////////////////////////////////////////////
                        // Processa o botão "Enviar Respostas".
                        ////////////////////////////////////////////////////////////////////////////////////////
                        ////////////////////////////////////////////////////////////////////////////////////////
                
                        var BotãoEnviarRespostas = document.getElementById("Botão-Enviar-Respostas");
                
                        BotãoEnviarRespostas.addEventListener('click', function(){

                            ////////////////////////////////////////////////////////////////////////////////////////
                            // Atualiza o botão da faixa inferior para "nada".
                            ////////////////////////////////////////////////////////////////////////////////////////
        
                            FaixaInferior.innerHTML = '';
                            
                            //////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            // Calcula o PercentualAcerto.
                            //////////////////////////////////////////////////////////////////////////////////////////////////////////////

                            var TotalRespostasCorretas = Array.from(document.querySelectorAll('input[data-correct="sim"]')).filter(e => e.closest('#Container-Externo-Teste-Módulo-' + NúmeroMóduloContémTópicoSelecionado)).length;
                            var RespostasCorretasSelecionadas = Array.from(document.querySelectorAll('input[data-correct="sim"]:checked')).filter(e => e.closest('#Container-Externo-Teste-Módulo-' + NúmeroMóduloContémTópicoSelecionado)).length;                
                            var PercentualAcerto = (RespostasCorretasSelecionadas / TotalRespostasCorretas);
                            
                            //////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            // Atualiza o Usuário_Preparatório1_PercentualCumprimento e o Usuário_Preparatório1_NotaMódulo#,
                            // junto ao backend, para atualizar a BD - PLATAFORMA.
                            //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
                            Usuário_Preparatório1_NúmeroTópicosConcluídos += 1;
    
                            fetch('https://plataforma-backend-v3.azurewebsites.net/updates', { //http://localhost:3000/updates //https://plataforma-backend-v3.azurewebsites.net/atualizações
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({ TipoAtualização: 'NúmeroTópicosConcluídos-e-NotaTeste', IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: Usuário_Preparatório1_NúmeroTópicosConcluídos, NúmeroMódulo: NúmeroMóduloContémTópicoSelecionado, NotaTeste: PercentualAcerto, Preparatório2_Interesse: 'n/a' })
                            })
                            
                            .then(response => {
                                
                                if (response.status === 200) {

                                    AtualizaAvançoPreparatório(Usuário_Preparatório1_NúmeroTópicosConcluídos);

                                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                    // Atualiza a variável Usuário_Preparatório1_NotaMódulo# para estar correto no "Desempenho e Certificado".
                                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                    Usuário_Preparatório1_NotasMódulos[NúmeroMóduloContémTópicoSelecionado] = PercentualAcerto;
    
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Mostra o Aviso Revisão, a Nota e o Percentil.
                                    ////////////////////////////////////////////////////////////////////////////////////////
                
                                    var ContainersExternosAvisoRevisão = document.querySelectorAll('.Container-Externo-Aviso-Revisão');
                
                                    ContainersExternosAvisoRevisão[NúmeroMóduloContémTópicoSelecionado-1].style.display = 'block';
                
                                    var ContainersExternosNotaePercentil = document.querySelectorAll('.Container-Externo-Nota-e-Percentil');
                                    
                                    ContainersExternosNotaePercentil[NúmeroMóduloContémTópicoSelecionado-1].style.display = 'flex';
                
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Atualiza a Nota e o Percentil.
                
                                    var Nota = document.getElementById('Nota-Teste-Módulo-' + NúmeroMóduloContémTópicoSelecionado);
                                    var Percentil = document.getElementById('Percentil-Teste-Módulo-' + NúmeroMóduloContémTópicoSelecionado);
                                    var PercentilCalculado;
                                    
                                    if (PercentualAcerto < 0.6){
                
                                        PercentilCalculado = 0;
                
                                    } else {
                
                                        // Fórmula vem de construir uma equação do segundo grau tipo "y = ax2 - b".
                                        PercentilCalculado =  1.453125 * Math.pow(PercentualAcerto,2) -0.523125
                
                                    }
                                    
                                    Nota.innerHTML = (PercentualAcerto * 100).toFixed(1) + "%";
                                    Percentil.innerHTML = (PercentilCalculado * 100).toFixed(1) + "%";
                
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Dá cor às fontes da Nota e do Percentil de acordo com o desempenho do aluno.
                
                                    function DefineCorNotaPercentil(value) {
                                        let r, g, b;
                
                                        b=0;
                                    
                                        if (value <= 60) {
                                            r = Math.round(139 + (200 - 139) * (value / 60));
                                            g = Math.round(0 + (200 - 0) * (value / 60));
                                        } else {
                                            r = Math.round(200 - (200 - 0) * ((value - 60) / 40));
                                            g = Math.round(150 - (150 - 100) * ((value - 60) / 40));
                                        }
                                    
                                        return `rgb(${r}, ${g}, ${b})`;
                                    }
                
                                    Nota.style.color = DefineCorNotaPercentil(PercentualAcerto * 100);
                                    Percentil.style.color = DefineCorNotaPercentil(PercentilCalculado * 100);
                
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Trava as escolhas feitas e marca todas as respostas corretas.
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    
                                    var RespostasCorretas = document.querySelectorAll('input[data-correct="sim"]');
                
                                    RespostasTodas.forEach(function(input) {
                                        input.disabled = true;
                                    });
                
                                    RespostasCorretas.forEach(function(input) {
                                        input.parentElement.style.backgroundColor = '#c2ffb6';
                                    });
                
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Faz as alterações necessárias no Container Tópico Selecionado.
                                    ////////////////////////////////////////////////////////////////////////////////////////
                        
                                    ContainerTópicoSelecionado.className = "Container-Tópico-Concluído";
                                    ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
                                    ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').classList.replace("Símbolo-Check-Aberto", "Símbolo-Check-Concluído");
                        
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Faz as alterações necessárias no Próximo Container Tópico.
                                    ////////////////////////////////////////////////////////////////////////////////////////
                        
                                    var PróximoContainerTópico = document.querySelector('[data-index="' + (parseInt(ContainerTópicoSelecionado.getAttribute('data-index'), 10) + 1) + '"]');
                                    PróximoContainerTópico.className = "Container-Tópico-Aberto";
                                    PróximoContainerTópico.querySelector('.Símbolo-Check-Fechado').classList.replace("Símbolo-Check-Fechado", "Símbolo-Check-Aberto");        
                
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Torna o Próximo Tópico clicável.
                                    ////////////////////////////////////////////////////////////////////////////////////////
                        
                                    PróximoContainerTópico.addEventListener('click', AbreTópico);
                
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Navega para o topo da tela.
                                    ////////////////////////////////////////////////////////////////////////////////////////
                
                                    //ContainerExternoTesteMódulo1.scrollTop = 0;
                                    
                                    ContainersExternosTesteMódulos[NúmeroMóduloContémTópicoSelecionado - 1].scrollTop = 0

                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Atualiza o botão da faixa inferior para "Continuar".
                                    ////////////////////////////////////////////////////////////////////////////////////////
                
                                    FaixaInferior.innerHTML = '<div id="Botão-Continuar">Continuar →</div>';

                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    // Processa o botão "Continuar".
                                    ////////////////////////////////////////////////////////////////////////////////////////
                                    ////////////////////////////////////////////////////////////////////////////////////////
                
                                    var BotãoContinuar = document.getElementById("Botão-Continuar");
                        
                                    BotãoContinuar.addEventListener('click', function(){
                
                                        if(ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML === "Teste: Módulo 7") {
                
                                        } else {
                
                                            AbreMódulo(parseInt(PróximoContainerTópico.parentElement.id.split('-').pop(), 10) - 1);
                
                                        }
                
                                        AbreTópico.call(PróximoContainerTópico);
                        
                                    });
    
                                }
                            
                            });
        
                        });
                
                    } else{
        
                        FaixaInferior.innerHTML = '<div id="Aviso-Teste-Concluído">Teste Concluído</div>';
                
                    }
        
                } else {
        
                    if(ContainerTópicoSelecionado.className === "Container-Tópico-Aberto"){
        
                        if (ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML !== "Mensagem Final") {
        
                            FaixaInferior.innerHTML = '<div id="Botão-Completar-e-Continuar">Completar e Continuar →</div>';
        
                            ////////////////////////////////////////////////////////////////////////////////////////
                            ////////////////////////////////////////////////////////////////////////////////////////
                            // Processa o botão "Completar e Continuar".
                            ////////////////////////////////////////////////////////////////////////////////////////
                            ////////////////////////////////////////////////////////////////////////////////////////
                    
                            var BotãoCompletareContinuar = document.getElementById("Botão-Completar-e-Continuar");
                    
                            BotãoCompletareContinuar.addEventListener('click', function(){
                    
                                ////////////////////////////////////////////////////////////////////////////////////////
                                // Atualiza o botão da faixa inferior para "nada".
                                ////////////////////////////////////////////////////////////////////////////////////////
            
                                FaixaInferior.innerHTML = '';

                                ////////////////////////////////////////////////////////////////////////////////////////
                                // Atualiza o cursor para "wait".
                                ////////////////////////////////////////////////////////////////////////////////////////
                                
                                document.body.style.cursor = 'wait';

                                //////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                // Atualiza o Usuário_Preparatório1_PercentualCumprimento junto ao backend, para atualizar a BD - PLATAFORMA.
                                //////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                                Usuário_Preparatório1_NúmeroTópicosConcluídos += 1;
        
                                fetch('https://plataforma-backend-v3.azurewebsites.net/updates', { //http://localhost:3000/updates //https://plataforma-backend-v3.azurewebsites.net/updates
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ TipoAtualização: 'NúmeroTópicosConcluídos', IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: Usuário_Preparatório1_NúmeroTópicosConcluídos, NúmeroMódulo: 'n/a', NotaTeste: 'n/a', Preparatório2_Interesse: 'n/a' })
                                })
                                
                                .then(response => {
                                    
                                    if (response.status === 200) {

                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Atualiza o cursor para "default".
                                        ////////////////////////////////////////////////////////////////////////////////////////
        
                                        document.body.style.cursor = 'default';
                                        
                                        AtualizaAvançoPreparatório(Usuário_Preparatório1_NúmeroTópicosConcluídos);
                                        
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Faz as alterações necessárias no Container Tópico Selecionado.
                                        ////////////////////////////////////////////////////////////////////////////////////////
                            
                                        ContainerTópicoSelecionado.className = "Container-Tópico-Concluído";
                                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
                                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').classList.replace("Símbolo-Check-Aberto", "Símbolo-Check-Concluído");
                            
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Faz as alterações necessárias no Próximo Container Tópico.
                                        ////////////////////////////////////////////////////////////////////////////////////////
                            
                                        var PróximoContainerTópico = document.querySelector('[data-index="' + (parseInt(ContainerTópicoSelecionado.getAttribute('data-index'), 10) + 1) + '"]');
                                        PróximoContainerTópico.className = "Container-Tópico-Aberto";
                                        PróximoContainerTópico.querySelector('.Símbolo-Check-Fechado').classList.replace("Símbolo-Check-Fechado", "Símbolo-Check-Aberto");
                            
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Abre o Próximo Tópico.
                                        ////////////////////////////////////////////////////////////////////////////////////////
                            
                                        AbreTópico.call(PróximoContainerTópico);
                            
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Torna o Próximo Tópico clicável.
                                        ////////////////////////////////////////////////////////////////////////////////////////
                            
                                        PróximoContainerTópico.addEventListener('click', AbreTópico);
        
                                    }
                                
                                });
        
                            });
        
                        } else {
        
                            FaixaInferior.innerHTML = '<div id="Botão-Finalizar-Preparatório">Finalizar Preparatório</div>';
        
                            ////////////////////////////////////////////////////////////////////////////////////////
                            ////////////////////////////////////////////////////////////////////////////////////////
                            // Processa o botão "Finalizar Preparatório".
                            ////////////////////////////////////////////////////////////////////////////////////////
                            ////////////////////////////////////////////////////////////////////////////////////////
                    
                            var BotãoFinalizarPreparatório = document.getElementById("Botão-Finalizar-Preparatório");
                    
                            BotãoFinalizarPreparatório.addEventListener('click', function(){
                    
                                ////////////////////////////////////////////////////////////////////////////////////////
                                // Atualiza o botão da faixa inferior para "nada".
                                ////////////////////////////////////////////////////////////////////////////////////////
            
                                FaixaInferior.innerHTML = '';

                                ////////////////////////////////////////////////////////////////////////////////////////
                                // Atualiza o cursor para "wait".
                                ////////////////////////////////////////////////////////////////////////////////////////
                                
                                document.body.style.cursor = 'wait';

                                //////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                // Atualiza o Usuário_Preparatório1_PercentualCumprimento junto ao backend, para atualizar a BD - PLATAFORMA.
                                //////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                                Usuário_Preparatório1_NúmeroTópicosConcluídos += 1;
        
                                fetch('https://plataforma-backend-v3.azurewebsites.net/updates', { //http://localhost:3000/updates //https://plataforma-backend-v3.azurewebsites.net/atualizações
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ TipoAtualização: 'NúmeroTópicosConcluídos', IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: Usuário_Preparatório1_NúmeroTópicosConcluídos, NúmeroMódulo: 'n/a', NotaTeste: 'n/a', Preparatório2_Interesse: 'n/a' })
                                })
                                
                                .then(response => {
                                    
                                    if (response.status === 200) {

                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Atualiza o cursor para "default".
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        
                                        document.body.style.cursor = 'default';
        
                                        AtualizaAvançoPreparatório(Usuário_Preparatório1_NúmeroTópicosConcluídos);
                                        
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Faz as alterações necessárias no Container Tópico Selecionado.
                                        ////////////////////////////////////////////////////////////////////////////////////////
                            
                                        ContainerTópicoSelecionado.className = "Container-Tópico-Concluído";
                                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
                                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').classList.replace("Símbolo-Check-Aberto", "Símbolo-Check-Concluído");
                            
                                        ////////////////////////////////////////////////////////////////////////////////////////
                                        // Abre o botão Desempenho e Certificado.
                                        ////////////////////////////////////////////////////////////////////////////////////////
                            
                                        AbreDesempenhoeCertificado.call();
                
                                    }
                                
                                });
       
                            });
                    
                        }     
                
                    } else {
                
                        FaixaInferior.innerHTML = '<div id="Aviso-Tópico-Concluído">Tópico Concluído</div>';
                
                    }
        
                }
        
            }
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa a abertura do botão "Desempenho e Certificado" do Preparatório 01.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            var Preparatório01BotãoDesempenhoeCertificado = document.getElementById('Preparatório-01-Botão-Desempenho-e-Certificado');
        
            function AbreDesempenhoeCertificado(){
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // "Desseleciona" o tópico aberto na Seção-Navegação.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                for (var i = 0; i < ContainersTópicosAbertos.length; i++) {
                    ContainersTópicosAbertos[i].style.backgroundColor = "#ebebeb";
                    ContainersTópicosAbertos[i].querySelector('.Tópico-Nome').style.fontWeight = "400";
                }
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Fecha todos os Módulos na Seção-Navegação.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                ContainerExternoTópicosMódulos.forEach((ContainerExternoTópicosMódulo, NúmeroMódulo) => {
                    
                        ContainerExternoTópicosMódulo.style.display = "none";
                        SetasAuxiliaresMódulos[NúmeroMódulo].innerHTML = '<polygon points="0,0 7,6 14,0 13,0 7,5 1,0"/>';
                
                });
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Navega para o topo da Seção-Navegação.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                var SeçãoNavegação = document.getElementById('Seção-Navegação');
        
                SeçãoNavegação.scrollTop = 0
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza o Nome do Tópico escolhido, no canto superior esquerdo do cabeçalho.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                NomeTópico.innerHTML = "<b>Desempenho e Certificado</b>";
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza o conteúdo sendo mostrado na tela.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna o Container-Externo-Conteúdo invisível.
        
                ContainerExternoConteúdo.style.display = "none";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna todos os Container-Externo-Teste-Módulo-# invisível.
        
                ContainersExternosTesteMódulos.forEach(ContainerExternoTesteMódulo => ContainerExternoTesteMódulo.style.display = "none");
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna o Container-Externo-Desempenho-e-Certificado visível.
        
                ContainerExternoDesempenhoeCertificado.style.display = "block";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Configura o Gráfico de Desempenho.
        
                // Configura a altura das Barra-Nota-Teste-Módulo-#.
        
                var BarraNotaTesteMódulo1 = document.getElementById("Barra-Nota-Teste-Módulo-1");
                var BarraNotaTesteMódulo2 = document.getElementById("Barra-Nota-Teste-Módulo-2");
                var BarraNotaTesteMódulo3 = document.getElementById("Barra-Nota-Teste-Módulo-3");
                var BarraNotaTesteMódulo4 = document.getElementById("Barra-Nota-Teste-Módulo-4");
                var BarraNotaTesteMódulo5 = document.getElementById("Barra-Nota-Teste-Módulo-5");
                var BarraNotaTesteMódulo6 = document.getElementById("Barra-Nota-Teste-Módulo-6");
                var BarraNotaTesteMódulo7 = document.getElementById("Barra-Nota-Teste-Módulo-7");
                var BarraNotaTestesAcumulado = document.getElementById("Barra-Nota-Testes-Acumulado");
        
                BarraNotaTesteMódulo1.style.height = Usuário_Preparatório1_NotasMódulos[1] * 400 + "px";
                BarraNotaTesteMódulo2.style.height = Usuário_Preparatório1_NotasMódulos[2] * 400 + "px";
                BarraNotaTesteMódulo3.style.height = Usuário_Preparatório1_NotasMódulos[3] * 400 + "px";
                BarraNotaTesteMódulo4.style.height = Usuário_Preparatório1_NotasMódulos[4] * 400 + "px";
                BarraNotaTesteMódulo5.style.height = Usuário_Preparatório1_NotasMódulos[5] * 400 + "px";
                BarraNotaTesteMódulo6.style.height = Usuário_Preparatório1_NotasMódulos[6] * 400 + "px";
                BarraNotaTesteMódulo7.style.height = Usuário_Preparatório1_NotasMódulos[7] * 400 + "px";
                
                BarraNotaTestesAcumulado.style.height = Usuário_Preparatório1_NotaAcumulado * 400 + "px";
        
                // Configura a cor das Barra-Nota-Teste-Módulo-#.
        
                BarraNotaTesteMódulo1.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[1] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[1] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[1] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[1] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[1] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[1] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[1] - 0.7) / 0.3)].map(Math.round).join(',')}`;
                BarraNotaTesteMódulo2.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[2] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[2] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[2] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[2] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[2] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[2] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[2] - 0.7) / 0.3)].map(Math.round).join(',')}`;
                BarraNotaTesteMódulo3.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[3] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[3] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[3] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[3] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[3] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[3] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[3] - 0.7) / 0.3)].map(Math.round).join(',')}`;
                BarraNotaTesteMódulo4.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[4] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[4] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[4] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[4] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[4] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[4] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[4] - 0.7) / 0.3)].map(Math.round).join(',')}`;
                BarraNotaTesteMódulo5.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[5] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[5] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[5] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[5] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[5] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[5] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[5] - 0.7) / 0.3)].map(Math.round).join(',')}`;
                BarraNotaTesteMódulo6.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[5] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[6] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[6] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[6] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[6] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[6] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[6] - 0.7) / 0.3)].map(Math.round).join(',')}`;
                BarraNotaTesteMódulo7.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotasMódulos[7] <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotasMódulos[7] / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotasMódulos[7] / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotasMódulos[7] / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotasMódulos[7] - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotasMódulos[7] - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotasMódulos[7] - 0.7) / 0.3)].map(Math.round).join(',')}`;  
        
                BarraNotaTestesAcumulado.style.backgroundColor = `rgb(${Usuário_Preparatório1_NotaAcumulado <= 0.7 ? [164 + (212 - 164) * (Usuário_Preparatório1_NotaAcumulado / 0.7), 16 + (187 - 16) * (Usuário_Preparatório1_NotaAcumulado / 0.7), 52 + (28 - 52) * (Usuário_Preparatório1_NotaAcumulado / 0.7)] : [212 + (10 - 212) * ((Usuário_Preparatório1_NotaAcumulado - 0.7) / 0.3), 187 + (152 - 187) * ((Usuário_Preparatório1_NotaAcumulado - 0.7) / 0.3), 28 + (62 - 28) * ((Usuário_Preparatório1_NotaAcumulado - 0.7) / 0.3)].map(Math.round).join(',')}`;
        
                // Configura os Percentual-Nota-Teste-Módulo-#.
        
                var PercentualNotaTesteMódulo1 = document.getElementById("Percentual-Nota-Teste-Módulo-1");
                var PercentualNotaTesteMódulo2 = document.getElementById("Percentual-Nota-Teste-Módulo-2");
                var PercentualNotaTesteMódulo3 = document.getElementById("Percentual-Nota-Teste-Módulo-3");
                var PercentualNotaTesteMódulo4 = document.getElementById("Percentual-Nota-Teste-Módulo-4");
                var PercentualNotaTesteMódulo5 = document.getElementById("Percentual-Nota-Teste-Módulo-5");
                var PercentualNotaTesteMódulo6 = document.getElementById("Percentual-Nota-Teste-Módulo-6");
                var PercentualNotaTesteMódulo7 = document.getElementById("Percentual-Nota-Teste-Módulo-7");
                var PercentualNotaTestesAcumulado = document.getElementById("Percentual-Nota-Testes-Acumulado");
        
                PercentualNotaTesteMódulo1.innerHTML = (Usuário_Preparatório1_NotasMódulos[1] * 100).toFixed(1) + "%";
                PercentualNotaTesteMódulo2.innerHTML = (Usuário_Preparatório1_NotasMódulos[2] * 100).toFixed(1) + "%";
                PercentualNotaTesteMódulo3.innerHTML = (Usuário_Preparatório1_NotasMódulos[3] * 100).toFixed(1) + "%";
                PercentualNotaTesteMódulo4.innerHTML = (Usuário_Preparatório1_NotasMódulos[4] * 100).toFixed(1) + "%";
                PercentualNotaTesteMódulo5.innerHTML = (Usuário_Preparatório1_NotasMódulos[5] * 100).toFixed(1) + "%";
                PercentualNotaTesteMódulo6.innerHTML = (Usuário_Preparatório1_NotasMódulos[6] * 100).toFixed(1) + "%";
                PercentualNotaTesteMódulo7.innerHTML = (Usuário_Preparatório1_NotasMódulos[7] * 100).toFixed(1) + "%";
                PercentualNotaTestesAcumulado.innerHTML = (Usuário_Preparatório1_NotaAcumulado * 100).toFixed(1) + "%";
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Configura:
                // - O Status-Certificado. 
                // - A visibilidade do Container-Interno-Orientações-Certificado.
                // - A visibilidade do Container-Externo-Cartas-Recomendação.
        
                var StatusCertificado = document.getElementById('Status-Certificado');
                var ContainerInternoOrientaçõesCertificado = document.getElementById('Container-Interno-Orientações-Certificado');
                var ContainerExternoCartasRecomendação = document.getElementById('Container-Externo-Cartas-Recomendação');
                var CertificadoID = document.getElementById('Certificado-ID');
        
                if (Usuário_Preparatório1_NúmeroTópicosConcluídos === 99) {
        
                    if(Usuário_Preparatório1_NotaAcumulado < 0.7) {
        
                        StatusCertificado.innerHTML = "<b>Status:</b> Inelegível à certificação.";
        
                        ContainerInternoOrientaçõesCertificado.style.display = "none";
                    
                    } else if (Usuário_Preparatório1_NotaAcumulado < 0.90) {
        
                        StatusCertificado.innerHTML = "<b>Status:</b> Aprovado";
        
                        ContainerInternoOrientaçõesCertificado.style.display = "flex";
        
                        ContainerExternoCartasRecomendação.style.display = "none";

                        CertificadoID.innerHTML = Usuário_Preparatório1_CertificadoID;
        
                    } else if (Usuário_Preparatório1_NotaAcumulado < 0.95) {
        
                        StatusCertificado.innerHTML = "<b>Status:</b> Aprovado";
        
                        ContainerInternoOrientaçõesCertificado.style.display = "flex";
        
                        ContainerExternoCartasRecomendação.style.display = "block";

                        CertificadoID.innerHTML = Usuário_Preparatório1_CertificadoID;
        
                    } else if (Usuário_Preparatório1_NotaAcumulado < 1) {
        
                        StatusCertificado.innerHTML = "<b>Status:</b> Aprovado com Honra";
        
                        ContainerInternoOrientaçõesCertificado.style.display = "flex";
        
                        ContainerExternoCartasRecomendação.style.display = "block";

                        CertificadoID.innerHTML = Usuário_Preparatório1_CertificadoID;
        
                    }
        
                } else {
        
                    ContainerInternoOrientaçõesCertificado.style.display = "none";        
        
                }
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Cria e faz o download do .pdf do Certificado do usuário.
        
                var BotãoDownloadCertificadoImpresso = document.getElementById('Botão-Download-Certificado-Impresso');
        
                BotãoDownloadCertificadoImpresso.addEventListener('click', function(event){
                    
                    event.preventDefault();

                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
        
                    doc.addImage('/plataforma/estudo/img/LOGO_IVY.png', 'PNG', 20, 15, 51, 17);
        
                    doc.setTextColor(130, 130, 130);
                    doc.setFontSize(14);
                    doc.setFont('Helvetica','normal');
                    doc.text('Certificamos que', 105, 60, null, null, 'center');
        
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(20);
                    doc.setFont('Helvetica','bold');
                    doc.text(Usuário_NomeCompleto, 105, 80, null, null, 'center');
        
                    doc.setTextColor(130, 130, 130);
                    doc.setFontSize(14);
                    doc.setFont('Helvetica','normal');
                    doc.text('foi aprovado(a) no', 105, 100, null, null, 'center');
        
                    doc.setTextColor(164, 16, 52);
                    doc.setFontSize(20);
                    doc.setFont('Helvetica','bold');
                    doc.text('Preparatório em Gestão Generalista', 105, 120, null, null, 'center');
        
                    doc.setTextColor(164, 16, 52);
                    doc.setFontSize(18);
                    doc.setFont('Helvetica','bold');
                    doc.text('(Hard Skills)', 105, 128, null, null, 'center');
        
                    doc.setTextColor(130, 130, 130);
                    doc.setFontSize(14);
                    doc.setFont('Helvetica','normal');
        
                    if (Usuário_Preparatório1_NotaAcumulado >=0.95){
        
                        doc.text(doc.splitTextToSize('Este preparatório capacita profissionais na implementação de soluções gerenciais robustas, passando por conceitos fundamentais do Método Gerencial e do Sistema de Gestão, com ênfase no Ger. Diretrizes e no Ger. Rotina.', 160), 105, 145, null, null, 'center');
        
                        doc.setTextColor(164, 16, 52);
                        doc.setFontSize(18);
                        doc.setFont('Helvetica','bold');
                        doc.text('Aprovação com Honra', 105, 180, null, null, 'center');
        
                    } else {
        
                        doc.text(doc.splitTextToSize('Este preparatório capacita profissionais na implementação de soluções gerenciais robustas, passando por conceitos fundamentais do Método Gerencial e do Sistema de Gestão, com ênfase no Ger. Diretrizes e no Ger. Rotina.', 160), 105, 150, null, null, 'center');
        
                    }
        
                    doc.setTextColor(130, 130, 130);
                    doc.setFontSize(12);
                    doc.text('CURITIBA, PARANÁ', 20, 200);
                    doc.text('____________________________', 20, 210);
        
                    doc.addImage('/plataforma/estudo/img/ASSINATURA.png', 'PNG', 20, 203, 55, 8);
        
                    doc.setFontSize(10);
                    doc.text('L. B. MACHADO', 20, 215);
                    doc.text('Fundador e Instrutor Titular:', 20, 220);
                    doc.text('Gestão Generalista Hard Skills', 20, 225);
                    doc.text('Ivy | Escola de Gestão', 20, 230);
        
                    doc.addImage('/plataforma/estudo/img/ATLAS.png', 'PNG', 140, 185, 50, 50);
        
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(16);
                    doc.setFont('Helvetica','bold');
                    doc.text('CERTIFICADO DE CONCLUSÃO', 105, 250, null, null, 'center');
        
                    doc.setTextColor(130, 130, 130);
                    doc.setFontSize(10);
                    doc.setFont('Helvetica','normal');
                    doc.text('Certificado ID#: ' + Usuário_Preparatório1_CertificadoID, 105, 260, null, null, 'center');
                    doc.text('Validação via: https://forms.office.com/r/CvRpsnMVyC', 105, 265, null, null, 'center');
        
                    doc.save('CERTIFICADO - ' + Usuário_NomeCompleto + '.pdf');
        
                });
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna a Faixa-Inferior invisível.
        
                FaixaInferior.style.display = "none";
        
            }
            
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão Desempenho e Certificado.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            Preparatório01BotãoDesempenhoeCertificado.addEventListener('click', function(){
        
                AbreDesempenhoeCertificado.call();
        
            });

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa a abertura da página.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            ////////////////////////////////////////////////////////////////////////////////////////
            // Dependendo do status de finalização do Preparatório...
        
            if (Usuário_Preparatório1_NúmeroTópicosConcluídos < 99){
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Abre o Módulo do Container-Tópico-Aberto e o Container-Tópico-Aberto.
                ////////////////////////////////////////////////////////////////////////////////////////
        
                AbreMódulo(parseInt(ContainersTópicosFechados[Usuário_Preparatório1_NúmeroTópicosConcluídos].parentElement.id.split('-').pop(), 10) - 1);
                
                AbreTópico.call(ContainersTópicosFechados[Usuário_Preparatório1_NúmeroTópicosConcluídos]);
        
            } else {
        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Abre o Desempenho e Certificado. 
                ////////////////////////////////////////////////////////////////////////////////////////
        
                AbreDesempenhoeCertificado.call();
        
            }

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura o Preparatório-02-Botão-Principal.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            var Preparatório02BotãoPrincipal = document.getElementById('Preparatório-02-Botão-Principal');

            if(Usuário_Preparatório2_Interesse === 'SIM'){

                Preparatório02BotãoPrincipal.style.backgroundColor = '#9c9c9c';
                Preparatório02BotãoPrincipal.style.animation = 'none';

            }

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Preparatório-02-Botão-Principal.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            Preparatório02BotãoPrincipal.addEventListener('click', function(){

                window.location.href = '/plataforma/conhecer';
            
            });

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura o Botão-Conhecer-Preparatório-de-Soft-Skills.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            var BotãoConhecerPreparatóriodeSoftSkills = document.getElementById('Botão-Conhecer-Preparatório-de-Soft-Skills');

            if(Usuário_Preparatório2_Interesse === 'SIM'){

                BotãoConhecerPreparatóriodeSoftSkills.style.backgroundColor = '#9c9c9c';
                BotãoConhecerPreparatóriodeSoftSkills.style.animation = 'none';

            }

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa o Botão-Conhecer-Preparatório-de-Soft-Skills.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
        
            BotãoConhecerPreparatóriodeSoftSkills.addEventListener('click', function(){

                window.location.href = '/plataforma/conhecer';
            
            });

        })
    
    } else {

        window.location.href = '/plataforma/painel';

    }

});