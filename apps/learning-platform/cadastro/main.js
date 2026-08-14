////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Importa o código de comunicação com o Azure Face API, para fazer o FaceID.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

import "../azure-ai-vision-face-ui/FaceLivenessDetector.js";

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis necessárias.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

const URL_Base_Backend = sessionStorage.getItem('URL_Base_Backend');
const IndexVerificado = sessionStorage.getItem('IndexVerificado');
const FormulárioFotoReferência = document.getElementById('Formulário-Foto-Referência');
const BotãoCadastrarFotoReferência = document.getElementById('Botão-Cadastrar-Foto-Referência');
const AvisoCadastrando = document.getElementById('Aviso-Cadastrando');
const ContainerAuxiliarFaceID = document.getElementById('Container-Auxiliar-FaceID');

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que leva à página aviso-dispositivo e processa alterações do tamanho da tela.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function LevaàPáginaAvisoDispositivo() { if (window.innerWidth <= 1024) { window.location.href = "/plataforma_v2/aviso-dispositivo"; } }

window.addEventListener('resize', LevaàPáginaAvisoDispositivo);

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {
        
    sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Não');

    if ((navigator.userAgentData?.brands?.some(b => b.brand === "Microsoft Edge") || navigator.userAgent.includes("Edg")) === false) { window.location.href = '/plataforma_v2/aviso-navegador'; }
    
    else {
    
        if (sessionStorage.getItem('Usuário_Autorização_Cadastro') !== 'Sim') { window.location.href = '/plataforma_v2/login'; }
            
        else { LevaàPáginaAvisoDispositivo(); }

    }

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa submissão do formulário de cadastro da foto de referência.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

FormulárioFotoReferência.addEventListener('submit', function(event) {
    
    if (BotãoCadastrarFotoReferência.disabled) return;
    document.body.style.cursor = 'wait';
    BotãoCadastrarFotoReferência.disabled = true;
    BotãoCadastrarFotoReferência.style.display = "none";
    AvisoCadastrando.style.display = "block";
    event.preventDefault();
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Obtém e cadastra a foto do aluno e inicia o FaceID.
    ////////////////////////////////////////////////////////////////////////////////////////

    let FotoReferência = document.getElementById('Botão-Escolher-Arquivo').files[0];
    let DadosFormulário = new FormData();

    DadosFormulário.append('IndexVerificado', IndexVerificado);
    DadosFormulário.append('file', FotoReferência);
    
    fetch(URL_Base_Backend + '/CadastroFoto_e_FaceID', {
        method: 'POST',
        body: DadosFormulário
    })

    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw { status: response.status, error: data.error };
        return data;
    })

    .then(async data => {

        sessionStorage.setItem('Usuário_Autorização_Cadastro', 'Não');

        document.body.style.cursor = 'default';
        
        let faceLivenessDetector = document.createElement("azure-ai-vision-face-ui");
        faceLivenessDetector.locale = "pt-BR";
        faceLivenessDetector.fontSize = "18px";
        faceLivenessDetector.buttonStyles = "margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;";
        ContainerAuxiliarFaceID.appendChild(faceLivenessDetector);
        
        faceLivenessDetector.start(data.Azure_Face_API_LivenessSession_authToken).then(() => {

            ////////////////////////////////////////////////////////////////////////////////////////
            // Obtém os resultados da LivenessSession.
            ////////////////////////////////////////////////////////////////////////////////////////
                                
            fetch(URL_Base_Backend + '/FaceID_resultado/' + data.Azure_Face_API_LivenessSession_sessionID, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw { status: response.status, error: data.error };
                return data;
            })

            .then(data => {
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa caso a LivenessSession tenha sido aprovada:
                ////////////////////////////////////////////////////////////////////////////////////////

                if (data.Azure_Face_API_LivenessSession_LivenessDecision === 'realface' && data.Azure_Face_API_LivenessSession_MatchDecision === true) {
                    sessionStorage.setItem('Usuário_Logado', 'Sim');
                    window.location.href = '/plataforma_v2/estudo';
                }

                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa caso a LivenessSession tenha sido reprovada:
                ////////////////////////////////////////////////////////////////////////////////////////

                else {
                    alert("⮾ FaceID reprovado. Tente novamente.\nLiveness Decision: " + data.Azure_Face_API_LivenessSession_LivenessDecision + "\nMatch Confidence: " + data.Azure_Face_API_LivenessSession_MatchConfidence + "\nMatch Decision: " + data.Azure_Face_API_LivenessSession_MatchDecision);
                    window.location.href = '/plataforma_v2/login';
                }

            })

            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa avisos / alertas.
            ////////////////////////////////////////////////////////////////////////////////////////

            .catch(err => {

                if (err.error !== 'Erro_007') { alert("Erro_000. Tente novamente."); window.location.href = '/plataforma_v2/login'; }
                else { alert("Erro_007. Tente novamente."); window.location.href = '/plataforma_v2/login'; }

            });

        })

        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa avisos / alertas.
        ////////////////////////////////////////////////////////////////////////////////////////

        .catch(err => { alert("Erro_006. Aguarde 2min e tente novamente."); window.location.href = '/plataforma_v2/login'; })

    })

    ////////////////////////////////////////////////////////////////////////////////////////
    // Processa avisos / alertas.
    ////////////////////////////////////////////////////////////////////////////////////////

    .catch(err => {
        
        document.body.style.cursor = 'default';
        BotãoCadastrarFotoReferência.disabled = false;
        BotãoCadastrarFotoReferência.style.display = "block";
        AvisoCadastrando.style.display = "none";

        if (err.error !== 'Erro_002' & err.error !== 'Erro_003' && err.error !== 'Erro_004') { alert("Erro_000. Verifique sua conexão com a internet."); }
        else if (err.error === 'Erro_002') { alert("Erro_002. Tente novamente."); }
        else if (err.error === 'Erro_003') { alert("Erro_003. Tente novamente."); }
        else if (err.error === 'Erro_004') { alert("Erro_004. Tente novamente."); }

    })

});