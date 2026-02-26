//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Declara variáveis globais.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const URL_Base_Backend = sessionStorage.getItem('URL_Base_Backend');

const NúmeroTópicosMódulos = [ 11 + 2, 15 + 2, 19 + 2, 18 + 2, 17 + 2, 8 + 2, 12 + 2, 22 + 2, 17 + 2, 12 + 2 ];
const NúmeroTópicosTotal =  NúmeroTópicosMódulos.reduce((a, b) => a + b, 0);

const SetasAuxiliaresMódulos = document.querySelectorAll("[id^='Seta-Auxiliar-Módulo-']");
const ContainerExternoTópicosMódulos = document.querySelectorAll("[id^='Container-Externo-Tópicos-Módulo-']");
let MóduloAberto;

let IndexVerificado;
let Usuário_NomeCompleto;
let Usuário_PrimeiroNome;
let Usuário_Email;
let Usuário_PrazoAcesso;
let Usuário_Status_Login;
let Usuário_Formação_NúmeroTópicosConcluídos;
let Usuário_Formação_NotasMódulos;
let Usuário_Formação_NotaAcumulado;
let Usuário_Formação_CertificadoID;

let ContainersTópicosConcluídos = document.getElementsByClassName("Container-Tópico-Concluído");
let ContainersTópicosAbertos = document.getElementsByClassName("Container-Tópico-Aberto");

let TempoSessão_Segundos = sessionStorage.getItem('TempoSessão_Segundos');

let ContainerExternoConteúdo = document.getElementById("Container-Externo-Conteúdo");

const ContainerExternoShakaPlayer = document.getElementById('Container-Externo-Shaka-Player');
const ContainerInternoShakaPlayer = document.getElementById('Container-Interno-Shaka-Player');
let ShakaPlayer;
let UIShakaPlayer;
let AlgumVídeoJáFoiCarregado = false;

let ContainerExternoTestes = document.getElementById("Container-Externo-Testes");
let ContainerInternoOrientaçõesTeste = document.getElementById("Container-Interno-Orientações-Teste");
let ContainerExternoAvisoRevisão = document.getElementById("Container-Externo-Aviso-Revisão");
let ContainerExternoNotaePercentil = document.getElementById("Container-Externo-Nota-e-Percentil");
let ContainerQuestõesMódulo = document.querySelectorAll("[id^='Container-Questões-Módulo-']");

let ContainerExternoFeedbacks = document.getElementById("Container-Externo-Feedbacks");
let ContainerExternoDesempenhoeCertificado = document.getElementById('Container-Externo-Desempenho-e-Certificado');

let FaixaInferior = document.getElementById('Faixa-Inferior');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {

    sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Não');

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Verifica se o navegador é o Microsoft Edge.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
        
    if ((navigator.userAgentData?.brands?.some(b => b.brand === "Microsoft Edge") || navigator.userAgent.includes("Edg")) === false) { window.location.href = '/plataforma_v2/aviso-navegador'; } else {
    
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        // Verifica se o usuário está logado.
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        
        if (sessionStorage.getItem('Usuário_Logado') !== 'Sim') { window.location.href = '/plataforma_v2/login'; } else {
        
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Controle da largura do dispositivo:
            // Cria a função, roda inicialmente e ativa a leitura contínua.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            function LevaàPáginaAvisoDispositivo() { if (window.innerWidth <= 1024) { window.location.href = "/plataforma_v2/aviso-dispositivo"; } }
            
            LevaàPáginaAvisoDispositivo();
            
            window.addEventListener('resize', LevaàPáginaAvisoDispositivo);

            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            // Puxa as informações do backend, para atualizar a página.
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////

            IndexVerificado = sessionStorage.getItem('IndexVerificado');
            
            fetch(URL_Base_Backend + '/refresh', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ IndexVerificado: IndexVerificado }) }).then(response => response.json()).then(data => {
                
                Usuário_NomeCompleto = data.Usuário_NomeCompleto;
                Usuário_PrimeiroNome = data.Usuário_PrimeiroNome;
                Usuário_Email = data.Usuário_Email;
                Usuário_PrazoAcesso = data.Usuário_PrazoAcesso;
                Usuário_Status_Login = data.Usuário_Status_Login;
                Usuário_Formação_NúmeroTópicosConcluídos = parseFloat(data.Usuário_Formação_NúmeroTópicosConcluídos);
                Usuário_Formação_NotasMódulos = []; for (let i = 1; i <= 10; i++) { Usuário_Formação_NotasMódulos[i] = data[`Usuário_Formação_NotaMódulo${i}`] }
                Usuário_Formação_NotaAcumulado = data.Usuário_Formação_NotaAcumulado;
                Usuário_Formação_CertificadoID = data.Usuário_Formação_CertificadoID;
                        
                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////
                // Torna a página visível.
                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////
                
                document.getElementById('Container-Seções').style.display = 'flex';
                
                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza a Seção-Navegação e ativa os botões internos.
                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////

                ////////////////////////////////////////////////////////////////////////////////////////
                // Ativa o processamento do Botão-Sair.
                ////////////////////////////////////////////////////////////////////////////////////////
                        
                document.getElementById("Botão-Sair").addEventListener("click", function(){ sessionStorage.setItem('Usuário_Logado', 'Não'); window.location.href = '/plataforma_v2/login'; })

                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza o Prazo de Acesso.
                ////////////////////////////////////////////////////////////////////////////////////////

                document.getElementById('Formação-Prazo-Acesso').textContent = "Acesso Expira: " + Usuário_PrazoAcesso;
            
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza as Métricas de Avanço na Formação.
                ////////////////////////////////////////////////////////////////////////////////////////
                            
                AtualizaMétricasAvançoFormação(Usuário_Formação_NúmeroTópicosConcluídos);
            
                ////////////////////////////////////////////////////////////////////////////////////////
                // Atualiza os Container-Tópico e os Símbolo-Check.
                ////////////////////////////////////////////////////////////////////////////////////////
            
                let ContainersTópicosFechados = Array.from(document.getElementsByClassName("Container-Tópico-Fechado"));
            
                ContainersTópicosFechados.sort(function(a, b) { return parseInt(a.getAttribute('data-index')) - parseInt(b.getAttribute('data-index')); });
                        
                for (var i = 0; i < Usuário_Formação_NúmeroTópicosConcluídos; i++) {
                    ContainersTópicosFechados[i].className = "Container-Tópico-Concluído";
                    ContainersTópicosFechados[i].querySelector('.Símbolo-Check-Fechado').innerHTML = "✔";
                    ContainersTópicosFechados[i].querySelector('.Símbolo-Check-Fechado').className = "Símbolo-Check-Concluído";
                }
            
                // Antes de atualizar o Container-Tópico que deve estar aberto, verifica se é undefined (que é o caso, quando a Formação já foi finalizada).
                ContainersTópicosFechados[Usuário_Formação_NúmeroTópicosConcluídos] && (ContainersTópicosFechados[Usuário_Formação_NúmeroTópicosConcluídos].className = "Container-Tópico-Aberto");
                ContainersTópicosFechados[Usuário_Formação_NúmeroTópicosConcluídos] && (ContainersTópicosFechados[Usuário_Formação_NúmeroTópicosConcluídos].querySelector('.Símbolo-Check-Fechado').className = "Símbolo-Check-Aberto");
            
                ////////////////////////////////////////////////////////////////////////////////////////
                // Ativa o processamento de abertura e fechamento dos Módulos.
                ////////////////////////////////////////////////////////////////////////////////////////

                document.querySelectorAll("[id^='Container-Módulo-']").forEach((ContainerMódulos, NúmeroMódulo) => { ContainerMódulos.addEventListener('click', () => AbreMódulo(NúmeroMódulo)); });
                        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Ativa o processamento de abertura e fechamento dos Tópicos (concluídos e abertos).
                ////////////////////////////////////////////////////////////////////////////////////////
                               
                for (let i = 0; i < ContainersTópicosConcluídos.length; i++) { ContainersTópicosConcluídos[i].addEventListener('click', AbreTópico); }
                for (let i = 0; i < ContainersTópicosAbertos.length; i++) { ContainersTópicosAbertos[i].addEventListener('click', AbreTópico); }

                ////////////////////////////////////////////////////////////////////////////////////////
                // Ativa o processamento do botão "Desempenho e Certificado".
                ////////////////////////////////////////////////////////////////////////////////////////

                document.getElementById('Formação-Botão-Desempenho-e-Certificado').addEventListener('click', function(){ AbreDesempenhoeCertificado.call(); });

                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////
                // Abre / atualiza a Seção-Conteúdo.
                ////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////
                        
                ////////////////////////////////////////////////////////////////////////////////////////
                // Configura o Container-Usuário e ativa o Contador Regressivo do Tempo de Sessão.
                ////////////////////////////////////////////////////////////////////////////////////////
                
                document.getElementById('Usuário-Nome').innerHTML = Usuário_NomeCompleto;

                let UsuárioTempoSessão = document.getElementById("Usuário-Tempo-Sessão");

                let ContadorRegressivoTempoSessão = setInterval(() => {
                    
                    TempoSessão_Segundos--;
                    sessionStorage.setItem('TempoSessão_Segundos', TempoSessão_Segundos);
                    UsuárioTempoSessão.textContent = `Tempo Sessão: ${String((TempoSessão_Segundos/60|0)).padStart(2,"0")}:${String(TempoSessão_Segundos%60).padStart(2,"0")}`;
                    if (TempoSessão_Segundos <= 600) { UsuárioTempoSessão.style.color = "red"; }
                    if (TempoSessão_Segundos <= 300) { UsuárioTempoSessão.classList.add("Tempo-Sessão-Últimos-5min"); }
                    if (TempoSessão_Segundos <= 0) { clearInterval(ContadorRegressivoTempoSessão); sessionStorage.setItem('Usuário_Logado', 'Não'); window.location.href = '/plataforma_v2/login'; }

                }, 1000);

                ////////////////////////////////////////////////////////////////////////////////////////
                // Abre o Módulo e o Tópico.
                ////////////////////////////////////////////////////////////////////////////////////////
                
                if (Usuário_Formação_NúmeroTópicosConcluídos < NúmeroTópicosTotal){
                        
                    AbreMódulo(parseInt(ContainersTópicosFechados[Usuário_Formação_NúmeroTópicosConcluídos].parentElement.id.split('-').pop(), 10) - 1);
                    AbreTópico.call(ContainersTópicosFechados[Usuário_Formação_NúmeroTópicosConcluídos]);
            
                } else {
                        
                    AbreDesempenhoeCertificado.call();
            
                }

            })
        
        }

    }

});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que atualiza as métricas de avanço na formação.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function AtualizaMétricasAvançoFormação(Usuário_Formação_NúmeroTópicosConcluídos_Atualizado) {

    ////////////////////////////////////////////////////////////////////////////////////////
    // Atualiza a Régua.
    ////////////////////////////////////////////////////////////////////////////////////////

    let PercentualTotal = (Usuário_Formação_NúmeroTópicosConcluídos_Atualizado / NúmeroTópicosTotal) * 100;

    document.getElementById('Formação-Régua-Avanço').style.width = PercentualTotal + "%";
    document.getElementById('Formação-Percentual-Concluído').innerHTML = PercentualTotal.toFixed(1) + "% concluído";

    ////////////////////////////////////////////////////////////////////////////////////////
    // Atualiza os Anéis e as Frações.
    ////////////////////////////////////////////////////////////////////////////////////////

    let NúmeroTópicosAcumulados = 0;

    NúmeroTópicosMódulos.forEach((NúmeroTópicosMódulo, ÍndiceMódulo) => {

        let InícioMódulo = NúmeroTópicosAcumulados;
        let FimMódulo = NúmeroTópicosAcumulados + NúmeroTópicosMódulo;

        let PercentualAvançoMódulo;

        if (Usuário_Formação_NúmeroTópicosConcluídos_Atualizado <= InícioMódulo) { 
            
            PercentualAvançoMódulo = 0; 
        
        } else if ( Usuário_Formação_NúmeroTópicosConcluídos_Atualizado >= FimMódulo) {
            
            PercentualAvançoMódulo = 100;

        } else {
            
            PercentualAvançoMódulo = ((Usuário_Formação_NúmeroTópicosConcluídos_Atualizado - InícioMódulo) / NúmeroTópicosMódulo) * 100;
        
        }

        ////////////////////////////////////////////////////////////////////////////////////////
        // Atualiza os Anéis.

        document.getElementById(`Módulo-${ÍndiceMódulo + 1}-Anel-Avanço-Progresso`).style.strokeDashoffset = (2.5 - PercentualAvançoMódulo / 50) * Math.PI * 12;


        ////////////////////////////////////////////////////////////////////////////////////////
        // Atualiza as Frações.

        document.getElementById(`Fração-Avanço-Módulo-${ÍndiceMódulo + 1}`).innerHTML = `${Math.round((PercentualAvançoMódulo * NúmeroTópicosMódulo) / 100 )}/${NúmeroTópicosMódulo}`;

        NúmeroTópicosAcumulados = FimMódulo;
        
    });

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que abre um Módulo.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que abre um Tópico.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function AbreTópico() {
    
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura a Seção-Navegação.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Deixa só o Tópico escolhido com fonte em negrito, background escurecido e estampa.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////

    for (let i = 0; i < ContainersTópicosConcluídos.length; i++) {
        ContainersTópicosConcluídos[i].style.backgroundColor = "";
        ContainersTópicosConcluídos[i].querySelector('.Tópico-Nome').style.fontWeight = "400";
    }

    for (let i = 0; i < ContainersTópicosAbertos.length; i++) {
        ContainersTópicosAbertos[i].style.backgroundColor = "";
        ContainersTópicosAbertos[i].querySelector('.Tópico-Nome').style.fontWeight = "400";
    }

    let ContainerTópicoSelecionado = this;

    ContainerTópicoSelecionado.style.backgroundColor = "#4a0816";
    ContainerTópicoSelecionado.querySelector('.Tópico-Nome').style.fontWeight = "500";

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura a Seção-Conteúdo.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    
    document.getElementById("Nome-Tópico").innerHTML = "<b>" + ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML + "</b>";

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura especificamente se for Tópico de Conteúdo.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////

    if (!ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML.includes("Teste:") && 
    !ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML.includes("Feedback:")) {

        ////////////////////////////////////////////////////////////////////////////////////////
        // Torna só o Container-Externo-Conteúdo visível.
        ////////////////////////////////////////////////////////////////////////////////////////

        ContainerExternoConteúdo.style.display = "flex";
        ContainerExternoTestes.style.display = "none";
        ContainerExternoFeedbacks.style.display = "none";
        ContainerExternoDesempenhoeCertificado.style.display = "none";
        ContainerExternoConteúdo.scrollTo(0,0);
        
        ////////////////////////////////////////////////////////////////////////////////////////
        // Cria a estrutura do ShakaPlayer e faz o download do vídeo .mpd a partir do Azure Container.
        ////////////////////////////////////////////////////////////////////////////////////////

        let NomeVídeo = ContainerTópicoSelecionado.getAttribute('name');
        
        async function initPlayer() {
            if (AlgumVídeoJáFoiCarregado === false) {
                ShakaPlayer = new shaka.Player();
                await ShakaPlayer.attach(ContainerInternoShakaPlayer);
                UIShakaPlayer = new shaka.ui.Overlay(ShakaPlayer, ContainerExternoShakaPlayer, ContainerInternoShakaPlayer);
                UIShakaPlayer.configure({ controlPanelElements: ['play_pause', 'time_and_duration','spacer', 'mute', 'volume', 'quality', 'playback_rate', 'fullscreen' ], overflowMenuButtons: [] });
                ShakaPlayer.configure({ drm: { servers: {'com.microsoft.playready': 'https://eu-playready.ezdrm.com/cency/preauth.aspx?pX=7C6D6C'}}});
                AlgumVídeoJáFoiCarregado = true;
            } 
            await ShakaPlayer.load('https://videospreparatoriosv2.blob.core.windows.net/videosv3/plataforma_v2/' + MóduloAberto + '/' + NomeVídeo + '_dash.mpd');
            ContainerInternoShakaPlayer.play();
        }
        shaka.polyfill.installAll();
        if (shaka.Player.isBrowserSupported()) { initPlayer(); } else { alert('Navegador não suportado.'); }
                                
        //////////////////////////////////////////////////////////////////////////////////////
        // Disponibiliza os arquivos para download.
        ////////////////////////////////////////////////////////////////////////////////////////

        let ContainerDownloadArquivo1 = document.getElementById("Container-Download-Arquivo-1");
        let NomeArquivo1 = document.getElementById("Nome-Arquivo-1");
        let BotãoDownload1 = document.getElementById("Botão-Download-1");

        let ContainerDownloadArquivo2 = document.getElementById("Container-Download-Arquivo-2");
        let NomeArquivo2 = document.getElementById("Nome-Arquivo-2");
        let BotãoDownload2 = document.getElementById("Botão-Download-2");

        let ContainerDownloadArquivo3 = document.getElementById("Container-Download-Arquivo-3");
        let NomeArquivo3 = document.getElementById("Nome-Arquivo-3");
        let BotãoDownload3 = document.getElementById("Botão-Download-3");

        let ContainerDownloadArquivo4 = document.getElementById("Container-Download-Arquivo-4");
        let NomeArquivo4 = document.getElementById("Nome-Arquivo-4");
        let BotãoDownload4 = document.getElementById("Botão-Download-4");

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 2

        if (MóduloAberto === "Módulo 2" && NomeVídeo === "8. PRIORIDADE"){            
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }
        
        else if (MóduloAberto === "Módulo 2" && NomeVídeo === "10. PLANO DE AÇÃO CLÁUDIA"){
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (CLÁUDIA)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (CLÁUDIA).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 2" && NomeVídeo === "13. RACIOCÍNIO") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (RODRIGO)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (RODRIGO).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 3

        else if (MóduloAberto === "Módulo 3" && NomeVídeo === "2. ANÁLISE DO FENÔMENO") {
            NomeArquivo1.innerHTML = "BASE DE DADOS";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/Boyá-Arquitetura-Campaigns-Jul-01-2035-Jul-31-2035.xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 3" && NomeVídeo === "4. ANÁLISE DO FENÔMENO") {
            NomeArquivo1.innerHTML = "BD TRATADA";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/BD TRATADA.xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 4

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "7. CÁLCULO DE METAS") {
            NomeArquivo1.innerHTML = "BD INDENIZAÇÕES (2033-01 a 2034-10)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/BD INDENIZAÇÕES (2033-01 a 2034-10).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (VALOR MÉDIO INDENIZADO)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "9. CÁLCULO DE METAS") {
            NomeArquivo1.innerHTML = "BD DESLIGAMENTOS (2032-10 A 2034-10)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/BD DESLIGAMENTOS (2032-10 A 2034-10).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "12. PREPARAR GRÁFICOS DE CONTROLE") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (VALOR MÉDIO INDENIZADO)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "BD INDENIZAÇÕES (2034-06 A 2035-01)";
            BotãoDownload3.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/BD INDENIZAÇÕES (2034-06 A 2035-01).xlsx";
            ContainerDownloadArquivo3.style.display = "flex";
            NomeArquivo4.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO)";
            BotãoDownload4.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 1.xlsm";
            ContainerDownloadArquivo4.style.display = "flex";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "14. PREPARAR GRÁFICOS DE CONTROLE") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "BD DESLIGAMENTOS (2034-06 A 2035-01)";
            BotãoDownload3.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx";
            ContainerDownloadArquivo3.style.display = "flex";
            NomeArquivo4.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload4.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 1.xlsm";
            ContainerDownloadArquivo4.style.display = "flex";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "15. FAZER A REUNIÃO DE NÍVEL") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 2.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 2.xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 5

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "1. ANÁLISE DO FENÔMENO") {
            NomeArquivo1.innerHTML = "BD DESLIGAMENTOS (2034-06 A 2035-01)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "5. PLANO DE AÇÃO") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (DAVI)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (DAVI).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "PLANO DE AÇÃO (SAMARA)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (SAMARA).xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload3.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm";
            ContainerDownloadArquivo3.style.display = "flex";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "8. PREPARAR GRÁFICOS DE CONTROLE") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO).xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "9. FAZER REUNIÃO DE NÍVEL") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO.xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 7

        else if (MóduloAberto === "Módulo 7" && NomeVídeo === "10. PADRONIZAÇÃO - CONSTRUIR O PADRÃO") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (RAFAEL)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (RAFAEL).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 8

        else if (MóduloAberto === "Módulo 8" && NomeVídeo === "9. TREINAMENTO - COMO ACONTECE") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (RAFAEL)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (RAFAEL).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 9

        else if (MóduloAberto === "Módulo 9" && NomeVídeo === "5. FOPs - BOAS PRÁTICAS") {
            NomeArquivo1.innerHTML = "TEMPLATE FOP (A3)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/TEMPLATE FOP (A3).vsdx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "TEMPLATE FOP (A2)";
            BotãoDownload2.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/TEMPLATE FOP (A2).vsdx";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "SIMBOLOGIA FOPs (BPMN)";
            BotãoDownload3.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/SIMBOLOGIA FOPs (BPMN).vssx";
            ContainerDownloadArquivo3.style.display = "flex";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 9" && NomeVídeo === "9. POPs - BOAS PRÁTICAS") {
            NomeArquivo1.innerHTML = "TEMPLATE POP (A4)";
            BotãoDownload1.href = "/plataforma_v2/estudo/files/" + MóduloAberto + "/TEMPLATE POP (A4).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }
        
        else { ContainerDownloadArquivo1.style.display = "none"; ContainerDownloadArquivo2.style.display = "none"; ContainerDownloadArquivo3.style.display = "none"; ContainerDownloadArquivo4.style.display = "none"; }

        ////////////////////////////////////////////////////////////////////////////////////////
        // Configura o botão da Faixa Inferior.
        ////////////////////////////////////////////////////////////////////////////////////////

        if(ContainerTópicoSelecionado.className === "Container-Tópico-Aberto"){

            ////////////////////////////////////////////////////////////////////////////////////////
            // Cria e processa o botão "Completar e Continuar".
            ////////////////////////////////////////////////////////////////////////////////////////

            FaixaInferior.innerHTML = '<div id="Botão-Completar-e-Continuar">Completar e Continuar →</div>';
            
            document.getElementById("Botão-Completar-e-Continuar").addEventListener('click', function(){
    
                FaixaInferior.innerHTML = '';                    
                document.body.style.cursor = 'wait';
                Usuário_Formação_NúmeroTópicosConcluídos += 1;

                ////////////////////////////////////////////////////////////////////////////////////////
                // Envia informações ao backend para atualizar a BD - PLATAFORMA.

                fetch(URL_Base_Backend + "/updates", { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ TipoAtualização: 'NúmeroTópicosConcluídos', IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: Usuário_Formação_NúmeroTópicosConcluídos, NúmeroMódulo: 'n/a', NotaTeste: 'n/a'}) }).then(response => {
                    
                    if (response.status === 200) {

                        document.body.style.cursor = 'default';
                        AtualizaMétricasAvançoFormação(Usuário_Formação_NúmeroTópicosConcluídos);
                        
                        ////////////////////////////////////////////////////////////////////////////////////////
                        // Atualiza o Container Tópico Selecionado.
            
                        ContainerTópicoSelecionado.className = "Container-Tópico-Concluído";
                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').classList.replace("Símbolo-Check-Aberto", "Símbolo-Check-Concluído");
            
                        ////////////////////////////////////////////////////////////////////////////////////////
                        // Atualiza o próximo Container Tópico.
            
                        let PróximoContainerTópico = document.querySelector('[data-index="' + (parseInt(ContainerTópicoSelecionado.getAttribute('data-index'), 10) + 1) + '"]');
                        PróximoContainerTópico.className = "Container-Tópico-Aberto";
                        PróximoContainerTópico.querySelector('.Símbolo-Check-Fechado').classList.replace("Símbolo-Check-Fechado", "Símbolo-Check-Aberto");                
                        AbreTópico.call(PróximoContainerTópico);
                        PróximoContainerTópico.addEventListener('click', AbreTópico);

                    }
                
                });

            });
    
        } else {
    
            FaixaInferior.innerHTML = '<div id="Aviso-Tópico-Concluído">Tópico Concluído</div>';
    
        }

    }

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura especificamente se for Tópico de Teste.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    
    else if (ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML.includes("Teste:")) {

        ////////////////////////////////////////////////////////////////////////////////////////
        // Pausa o eventual vídeo que esteja rodando e torna só o Container-Externo-Teste-Módulo selecionado visível.
        ////////////////////////////////////////////////////////////////////////////////////////

        ContainerInternoShakaPlayer.pause();
        ContainerExternoConteúdo.style.display = "none";
        ContainerExternoTestes.style.display = "block";
        ContainerInternoOrientaçõesTeste.style.display = "block";
        ContainerExternoAvisoRevisão.style.display = 'none';
        ContainerExternoNotaePercentil.style.display = 'none';
        ContainerExternoTestes.scrollTo(0, 0);
        let NúmeroMóduloContémTópicoSelecionado = parseInt(ContainerTópicoSelecionado.getAttribute("name").match(/\d+/)[0], 10);
        ContainerQuestõesMódulo.forEach((ContainerQuestõesMódulo, Índice) => { ContainerQuestõesMódulo.style.display = (Índice === NúmeroMóduloContémTópicoSelecionado - 1) ? "block" : "none"; });
        ContainerExternoFeedbacks.style.display = "none";
        ContainerExternoDesempenhoeCertificado.style.display = "none";

        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Tópico se for o Tópico Aberto.
        ////////////////////////////////////////////////////////////////////////////////////////

        if(ContainerTópicoSelecionado.className === "Container-Tópico-Aberto"){
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Destrava as questões e desmarca as respostas.

            let RespostasTodas = document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"], input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]');
            RespostasTodas.forEach(function(input) { input.disabled = false; input.parentElement.style.backgroundColor = '#ffffff'; });
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Cria e processa o botão "Enviar Respostas"
            
            FaixaInferior.innerHTML = '<div id="Botão-Enviar-Respostas">Enviar Respostas</div>';
                
            document.getElementById("Botão-Enviar-Respostas").addEventListener('click', function(){

                Usuário_Formação_NúmeroTópicosConcluídos += 1;
                FaixaInferior.innerHTML = '';
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Calcula o PercentualAcerto.

                let RespostasCorretasSelecionadas = Array.from(document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]:checked')).filter(e => e.closest('#Container-Questões-Módulo-' + NúmeroMóduloContémTópicoSelecionado)).length;                
                let RespostasIncorretasSelecionadas = Array.from(document.querySelectorAll('input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]:checked')).filter(e => e.closest('#Container-Questões-Módulo-' + NúmeroMóduloContémTópicoSelecionado)).length;
                let TotalRespostasCorretas = Array.from(document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]')).filter(e => e.closest('#Container-Questões-Módulo-' + NúmeroMóduloContémTópicoSelecionado)).length;
                let PercentualAcerto = Math.max(0,(RespostasCorretasSelecionadas - RespostasIncorretasSelecionadas) / TotalRespostasCorretas);

                ////////////////////////////////////////////////////////////////////////////////////////
                // Envia informações ao backend para atualizar a BD - PLATAFORMA.
                
                fetch(URL_Base_Backend + "/updates", {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ TipoAtualização: 'NúmeroTópicosConcluídos-e-NotaTeste', IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: Usuário_Formação_NúmeroTópicosConcluídos, NúmeroMódulo: NúmeroMóduloContémTópicoSelecionado, NotaTeste: PercentualAcerto })
                })
                
                .then(response => {
                    
                    if (response.status === 200) {

                        ////////////////////////////////////////////////////////////////////////////////////////
                        // Atualiza as Seção-Navegação.

                        // Atualiza as Métricas de Avanço na Formação.
                        AtualizaMétricasAvançoFormação(Usuário_Formação_NúmeroTópicosConcluídos);

                        // Atualiza o Tópico Selecionado.
                        ContainerTópicoSelecionado.className = "Container-Tópico-Concluído";
                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').classList.replace("Símbolo-Check-Aberto", "Símbolo-Check-Concluído");
            
                        // Atualiza o próximo Tópico.
                        let PróximoContainerTópico = document.querySelector('[data-index="' + (parseInt(ContainerTópicoSelecionado.getAttribute('data-index'), 10) + 1) + '"]');
                        PróximoContainerTópico.className = "Container-Tópico-Aberto";
                        PróximoContainerTópico.querySelector('.Símbolo-Check-Fechado').classList.replace("Símbolo-Check-Fechado", "Símbolo-Check-Aberto");                    
                        PróximoContainerTópico.addEventListener('click', AbreTópico);

                        ////////////////////////////////////////////////////////////////////////////////////////
                        // Atualiza a Seção-Conteúdo.

                        ContainerInternoOrientaçõesTeste.style.display = "none"; 
                        ContainerExternoAvisoRevisão.style.display = 'block';
                        ContainerExternoNotaePercentil.style.display = 'flex';

                        // Define a Nota e calcula o Percentil a partir de uma equação do segundo grau tipo "y = ax2 - b".
                        let Nota = document.getElementById("Nota");
                        let Percentil = document.getElementById("Percentil");
                        let PercentilCalculado;
                        if (PercentualAcerto < 0.6){ PercentilCalculado = 0; } else { PercentilCalculado =  1.453125 * Math.pow(PercentualAcerto,2) -0.523125 }
                        Nota.innerHTML = (PercentualAcerto * 100).toFixed(1) + "%";
                        Percentil.innerHTML = (PercentilCalculado * 100).toFixed(1) + "%";

                        // Configura as cores da Nota e do Percentil.
                        function DefineCorNotaPercentil(value) { let r, g, b; if (value <= 60) { r = Math.round(139 + (200 - 139) * (value / 60)); g = Math.round(0 + (200 - 0) * (value / 60)); } else { r = Math.round(200 - (200 - 0) * ((value - 60) / 40)); g = Math.round(150 - (150 - 100) * ((value - 60) / 40)); } b=0; return `rgb(${r}, ${g}, ${b})`; }
                        Nota.style.color = DefineCorNotaPercentil(PercentualAcerto * 100);
                        Percentil.style.color = DefineCorNotaPercentil(PercentilCalculado * 100);
    
                        // Trava as todas as respostas e marca as corretas.
                        RespostasTodas.forEach(function(input) { input.disabled = true; });
                        var RespostasCorretas = document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]');
                        RespostasCorretas.forEach(function(input) { input.parentElement.style.backgroundColor = '#c2ffb6'; });
    
                        // Navega para o topo da tela.                        
                        ContainerExternoTestes.scrollTop = 0

                        // Atualiza o botão da faixa inferior para "Continuar".    
                        FaixaInferior.innerHTML = '<div id="Botão-Continuar">Continuar →</div>';

                        // Processa o botão "Continuar".
                        document.getElementById("Botão-Continuar").addEventListener('click', function(){ AbreTópico.call(PróximoContainerTópico); });

                        // Atualiza a nota do módulo e a nota acumulada aqui no frontend (sem precisar extrair do backend via novo fetch), para estarem atualizadas na aba "Desempenho e Certificado".
                        Usuário_Formação_NotasMódulos[NúmeroMóduloContémTópicoSelecionado] = PercentualAcerto;
                        Usuário_Formação_NotaAcumulado = Usuário_Formação_NotasMódulos.reduce((a, b) => a + b, 0) / (Usuário_Formação_NotasMódulos.length - 1);

                    }
                
                });

            });
    
        }

        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Tópico se for o Tópico Concluído.
        ////////////////////////////////////////////////////////////////////////////////////////
        
        else {

            ////////////////////////////////////////////////////////////////////////////////////////
            // Trava as questões e desmarca as respostas.

            let RespostasTodas = document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"], input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]');
            RespostasTodas.forEach(function(input) { input.disabled = true; input.parentElement.style.backgroundColor = '#ffffff'; });
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Cria o botão "Teste Concluído"

            FaixaInferior.innerHTML = '<div id="Aviso-Teste-Concluído">Teste Concluído</div>'; 
        
        }
        
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura especificamente se for Tópico de Feedback.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    
    else if (ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML.includes("Feedback:")) {
    
        ContainerInternoShakaPlayer.pause();
        ContainerExternoConteúdo.style.display = "none";
        ContainerExternoTestes.style.display = "none";
        ContainerExternoFeedbacks.style.display = "block";
        ContainerExternoDesempenhoeCertificado.style.display = "none";
        ContainerExternoFeedbacks.scrollTo(0, 0);

        ////////////////////////////////////////////////////////////////////////////////////////
        // Limpa todos os dados do feedback já preenchidos e aciona o contador de caractéres do Campo-Comentários.
        ////////////////////////////////////////////////////////////////////////////////////////

        document.querySelectorAll('.Opções-Feedbacks').forEach(r => r.checked = false);
        let CampoComentários = document.getElementById("Campo-Comentários");
        let CampoComentáriosContadorCaracteres = document.getElementById("Campo-Comentários-Contador-Caracteres");
        CampoComentários.value = '';
        CampoComentáriosContadorCaracteres.textContent = "0 / 1000";
        CampoComentários.oninput=()=>CampoComentáriosContadorCaracteres.textContent=`${CampoComentários.value.length} / 1000`;
    
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Tópico se for Tópico Aberto.
        ////////////////////////////////////////////////////////////////////////////////////////
        
        if(ContainerTópicoSelecionado.className === "Container-Tópico-Aberto") {

            ////////////////////////////////////////////////////////////////////////////////////////
            // Cria e processa o botão "Enviar Feedback".
            
            FaixaInferior.innerHTML = '<div id="Botão-Enviar-Feedback">Enviar Feedback</div>';
    
            document.getElementById("Botão-Enviar-Feedback").addEventListener('click', function(){

                FaixaInferior.innerHTML = '';                
                document.body.style.cursor = 'wait';
                Usuário_Formação_NúmeroTópicosConcluídos += 1;

                // Atualiza a BD - PLATAFORMA e a BD - FEEDBACKS.

                let NúmeroMóduloContémTópicoSelecionado = parseInt(ContainerTópicoSelecionado.getAttribute("name").match(/\d+/)[0], 10);
                let Feedback_DataPreenchimento = new Date().toLocaleDateString('pt-BR');
                let Feedback_TamanhoMódulo = document.querySelector('input[name="Tamanho-Módulo"]:checked')?.getAttribute('query-id');
                let Feedback_QualidadeConteúdo = document.querySelector('input[name="Qualidade-Conteúdo"]:checked')?.getAttribute('query-id');
                let Feedback_QualidadePlataforma = document.querySelector('input[name="Qualidade-Plataforma"]:checked')?.getAttribute('query-id');
                let Feedback_QualidadeMateriaisImpressos = document.querySelector('input[name="Qualidade-Materiais-Impressos"]:checked')?.getAttribute('query-id');
                let Feedback_Comentários = document.getElementById('Campo-Comentários').value;

                fetch(URL_Base_Backend + '/processa-feedback', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ IndexVerificado: IndexVerificado, NúmeroTópicosConcluídos: Usuário_Formação_NúmeroTópicosConcluídos, Usuário_NomeCompleto: Usuário_NomeCompleto, Usuário_Email: Usuário_Email, Feedback_DataPreenchimento: Feedback_DataPreenchimento, NúmeroMódulo: NúmeroMóduloContémTópicoSelecionado, Feedback_TamanhoMódulo: Feedback_TamanhoMódulo, Feedback_QualidadeConteúdo: Feedback_QualidadeConteúdo, Feedback_QualidadePlataforma: Feedback_QualidadePlataforma, Feedback_QualidadeMateriaisImpressos: Feedback_QualidadeMateriaisImpressos, Feedback_Comentários: Feedback_Comentários }) }).then(response => {
                    
                    if (response.status === 200) {

                        document.body.style.cursor = 'default';
                        AtualizaMétricasAvançoFormação(Usuário_Formação_NúmeroTópicosConcluídos);
                        
                        // Atualiza o Container Tópico Selecionado.
            
                        ContainerTópicoSelecionado.className = "Container-Tópico-Concluído";
                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
                        ContainerTópicoSelecionado.querySelector('.Símbolo-Check-Aberto').classList.replace("Símbolo-Check-Aberto", "Símbolo-Check-Concluído");

                        // Se não for o "Feedback: Módulo 10", faz as alterações necessárias no Próximo Tópico e abre o Próximo Tópico.
            
                        if(ContainerTópicoSelecionado.querySelector('.Tópico-Nome').innerHTML !== "Feedback: Módulo 10") {
                
                            let PróximoContainerTópico = document.querySelector('[data-index="' + (parseInt(ContainerTópicoSelecionado.getAttribute('data-index'), 10) + 1) + '"]');
                            PróximoContainerTópico.className = "Container-Tópico-Aberto";
                            PróximoContainerTópico.querySelector('.Símbolo-Check-Fechado').classList.replace("Símbolo-Check-Fechado", "Símbolo-Check-Aberto");
                            PróximoContainerTópico.addEventListener('click', AbreTópico);

                            AbreMódulo(parseInt(PróximoContainerTópico.parentElement.id.split('-').pop(), 10) - 1);
                            AbreTópico.call(PróximoContainerTópico);

                        } 
                        
                        // Se for o "Feedback: Módulo 10", faz as alterações necessárias no Próximo Tópico e abre o Próximo Tópico.

                        else { AbreDesempenhoeCertificado.call(); }
                    
                    }
                
                })

            })

        } 
        
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa o Tópico se for Tópico Concluído.
        ////////////////////////////////////////////////////////////////////////////////////////
        
        else { FaixaInferior.innerHTML = '<div id="Aviso-Feedback-Concluído">Feedback Concluído</div>'; }
                        
    }

    FaixaInferior.style.display = "flex";

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que abre a seção "Desempenho e Certificado".
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function AbreDesempenhoeCertificado(){

    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura a Seção-Navegação.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////////////
    // "Desseleciona" o tópico aberto na Seção-Navegação.
    ////////////////////////////////////////////////////////////////////////////////////////

    for (var i = 0; i < ContainersTópicosAbertos.length; i++) {
        ContainersTópicosAbertos[i].style.backgroundColor = "";
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
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura a Seção-Conteúdo.
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    
    ContainerInternoShakaPlayer.pause();
    document.getElementById('Seção-Navegação').scrollTop = 0;
    document.getElementById("Nome-Tópico").innerHTML = "<b>Desempenho e Certificado</b>";
    
    ContainerExternoConteúdo.style.display = "none";
    ContainerExternoTestes.style.display = "none";
    ContainerExternoFeedbacks.style.display = "none";
    ContainerExternoDesempenhoeCertificado.style.display = "block";

    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura o Gráfico de Desempenho.
    ////////////////////////////////////////////////////////////////////////////////////////

    function CorNota(Nota) { let Cor = Nota <= 0.7 ? [164 + (212 - 164) * (Nota / 0.7), 16 + (187 - 16) * (Nota / 0.7), 52 + (28 - 52) * (Nota / 0.7)] : [212 + (10 - 212) * ((Nota - 0.7) / 0.3), 187 + (152 - 187) * ((Nota - 0.7) / 0.3), 28 + (62 - 28) * ((Nota - 0.7) / 0.3)]; return `rgb(${Cor.map(Math.round).join(",")})`; }

    for (let i = 1; i <= 10; i++) {
        document.getElementById(`Barra-Nota-Teste-Módulo-${i}`).style.height = Usuário_Formação_NotasMódulos[i] * 400 + "px";
        document.getElementById(`Barra-Nota-Teste-Módulo-${i}`).style.backgroundColor = CorNota(Usuário_Formação_NotasMódulos[i]);
        document.getElementById(`Percentual-Nota-Teste-Módulo-${i}`).innerHTML = (Usuário_Formação_NotasMódulos[i] * 100).toFixed(1) + "%";
    }

    document.getElementById("Barra-Nota-Testes-Acumulado").style.height = Usuário_Formação_NotaAcumulado * 400 + "px";
    document.getElementById("Barra-Nota-Testes-Acumulado").style.backgroundColor = CorNota(Usuário_Formação_NotaAcumulado);
    document.getElementById("Percentual-Nota-Testes-Acumulado").innerHTML = (Usuário_Formação_NotaAcumulado * 100).toFixed(1) + "%";

    ////////////////////////////////////////////////////////////////////////////////////////
    // Configura o Status-Certificado e a visibilidade do Container-Interno-Orientações-Certificado.
    ////////////////////////////////////////////////////////////////////////////////////////

    let StatusCertificado = document.getElementById('Status-Certificado');
    let ContainerInternoOrientaçõesCertificado = document.getElementById('Container-Interno-Orientações-Certificado');
    
    if (Usuário_Formação_NúmeroTópicosConcluídos === NúmeroTópicosTotal) {

        if(Usuário_Formação_NotaAcumulado < 0.7) { StatusCertificado.innerHTML = "<b>Status:</b> Inelegível à certificação."; } 
        else if (Usuário_Formação_NotaAcumulado < 0.95) { StatusCertificado.innerHTML = "<b>Status:</b> Aprovado"; }
        else { StatusCertificado.innerHTML = "<b>Status:</b> Aprovado com Honra"; }

        if (Usuário_Formação_NotaAcumulado >= 0.7) { ContainerInternoOrientaçõesCertificado.style.display = "block"; }
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // Processa o botão de download do Certificado Impresso.
    ////////////////////////////////////////////////////////////////////////////////////////

    document.getElementById('Botão-Download-Certificado-Impresso').addEventListener('click', function(event){
        
        event.preventDefault();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.addImage('/plataforma_v2/estudo/img/LOGO_MACHADO_CERTIFICADO.jpg', 'PNG', 20, 20, 17, 17);

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
        doc.text('foi aprovado(a) na', 105, 100, null, null, 'center');

        doc.setTextColor(74, 8, 22);
        doc.setFontSize(20);
        doc.setFont('Helvetica','bold');
        doc.text('Formação em Método Gerencial', 105, 120, null, null, 'center');

        doc.setTextColor(74, 8, 22);
        doc.setFontSize(18);
        doc.setFont('Helvetica','bold');
        doc.text('(Competências Técnicas)', 105, 128, null, null, 'center');

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(13);
        doc.setFont('Helvetica','normal');

        if (Usuário_Formação_NotaAcumulado >=0.95){

            doc.text(doc.splitTextToSize('Esta formação capacita profissionais na implementação de soluções gerenciais científicas, passando por inúmeros conceitos e ferramentas do Método Gerencial e do Sistema de Gestão, com ênfase na aplicação da Equação Fundamental da Gestão, dos Princípios Basilares, do Ger. Diretrizes e do Ger. Rotina à solução de problemas reais.', 160), 105, 145, null, null, 'center');

            doc.setTextColor(164, 16, 52);
            doc.setFontSize(18);
            doc.setFont('Helvetica','bold');
            doc.text('Aprovação com Honra', 105, 180, null, null, 'center');

        } else {

            doc.text(doc.splitTextToSize('Esta formação capacita profissionais na implementação de soluções gerenciais científicas, passando por inúmeros conceitos e ferramentas do Método Gerencial e do Sistema de Gestão, com ênfase na aplicação da Equação Fundamental da Gestão, dos Princípios Basilares, do Ger. Diretrizes e do Ger. Rotina à solução de problemas reais.', 160), 105, 150, null, null, 'center');

        }

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(12);
        doc.text('CURITIBA, PARANÁ', 20, 200);
        doc.text('____________________________', 20, 210);

        doc.addImage('/plataforma_v2/estudo/img/ASSINATURA.png', 'PNG', 20, 203, 55, 8);

        doc.setFontSize(10);
        doc.text('L. B. MACHADO', 20, 215);
        doc.text('Fundador e Instrutor Titular:', 20, 220);
        doc.text('Formação em Método Gerencial (Competências Técnicas)', 20, 225);
        doc.text('Machado | Método Gerencial para Empresas', 20, 230);

        doc.addImage('/plataforma_v2/estudo/img/ATLAS.png', 'PNG', 140, 187, 50, 50);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(15);
        doc.setFont('Helvetica','bold');
        doc.text('CERTIFICADO DE CONCLUSÃO', 105, 252, null, null, 'center');

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(10);
        doc.setFont('Helvetica','normal');
        doc.text('Certificado ID#: ' + Usuário_Formação_CertificadoID, 105, 260, null, null, 'center');
        doc.text('Validação via: https://forms.office.com/r/CvRpsnMVyC', 105, 265, null, null, 'center');

        doc.save('CERTIFICADO - ' + Usuário_NomeCompleto + '.pdf');

    });

    ////////////////////////////////////////////////////////////////////////////////////////
    // Torna a Faixa-Inferior invisível.

    FaixaInferior.style.display = "none";

}