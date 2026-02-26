////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis necessárias.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

const URL_Base_Backend = sessionStorage.getItem('URL_Base_Backend');

let IndexVerificado = sessionStorage.getItem('IndexVerificado');

let FormulárioFotoReferência = document.getElementById('Formulário-Foto-Referência');
let BotãoCadastrarFotoReferência = document. getElementById('Botão-Cadastrar-Foto-Referência');
let AvisoCadastrando = document.getElementById('Aviso-Cadastrando');
let ContainerAuxiliarFaceID = document.getElementById('Container-Auxiliar-FaceID');

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
    
    BotãoCadastrarFotoReferência.style.display = "none";
    AvisoCadastrando.style.display = "block";
    document.body.style.cursor = 'wait';
    event.preventDefault();
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Obtém e cadastra a foto do aluno e inicia o FaceID.
    ////////////////////////////////////////////////////////////////////////////////////////

    let FotoReferência = document.getElementById('Botão-Escolher-Arquivo').files[0];
    let DadosFormulário = new FormData();

    DadosFormulário.append('IndexVerificado', IndexVerificado);
    DadosFormulário.append('file', FotoReferência);
    
    fetch(URL_Base_Backend + '/CadastroFoto_e_FaceID', { method: 'POST', body: DadosFormulário }).then(response => response.json()).then(async data =>  {

        document.body.style.cursor = 'default';
        
        await import("../azure-ai-vision-face-ui/FaceLivenessDetector.js");
        let faceLivenessDetector = document.createElement("azure-ai-vision-face-ui");
        faceLivenessDetector.locale = "pt-BR";
        faceLivenessDetector.fontSize = "18px";
        faceLivenessDetector.buttonStyles = "margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;";
        ContainerAuxiliarFaceID.appendChild(faceLivenessDetector);
        faceLivenessDetector.start(data.Azure_Face_API_LivenessSession_authToken).then(() => {

            ////////////////////////////////////////////////////////////////////////////////////////
            // Obtém os resultados do FaceID.
                                
            fetch(URL_Base_Backend + '/FaceID_resultado/' + data.Azure_Face_API_LivenessSession_sessionID, { method: 'GET', headers: {'Content-Type': 'application/json'} }).then(response => response.json()).then(data =>  {
                
                // Processa caso o FaceID seja aprovado (leva à página de estudo).
                
                if (data.Azure_Face_API_LivenessSession_LivenessDecision === 'realface' && data.Azure_Face_API_LivenessSession_MatchDecision === true) { sessionStorage.setItem('Usuário_Autorização_Cadastro', 'Não'); sessionStorage.setItem('Usuário_Logado', 'Sim'); window.location.href = '/plataforma_v2/estudo'; }

                // Processa caso o FaceID seja reprovado (retorna à página de login).

                else { sessionStorage.setItem('Usuário_Logado', 'Não'); alert("FaceID reprovado. Tente novamente."); window.location.href = '/plataforma_v2/login'; }

            })

        })

        // Processa caso o FaceID não tenha sido concluído (retorna à página de login).

        .catch(() => { sessionStorage.setItem('Usuário_Logado', 'Não'); alert("FaceID reprovado. Tente novamente."); window.location.href = '/plataforma_v2/login'; });

    });

});