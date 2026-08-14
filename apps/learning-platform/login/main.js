////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Determina a URL_Base_Backend utilizada por todos os arquivos .js.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

sessionStorage.setItem('URL_Base_Backend', 'https://plataforma-backend-v3.azurewebsites.net/plataforma_v2'); // 'http://localhost:3000/plataforma_v2' 

const URL_Base_Backend = sessionStorage.getItem('URL_Base_Backend');

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Importa o código de comunicação com o Azure Face API, para fazer o FaceID.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

import "../azure-ai-vision-face-ui/FaceLivenessDetector.js";

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Declara as demais variáveis necessárias.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

const FormulárioLogin = document.getElementById('Formulário-Login');
const Email = document.getElementById('E-mail');
const Senha = document.getElementById('Senha');
const Entrar = document. getElementById('Entrar');
const AvisoInicializando = document.getElementById('Aviso-Inicializando');
const AvisoEmailouSenhaInválidos = document.getElementById('Aviso-Email-ou-Senha-Inválidos');
const AvisoLoginExpirado = document.getElementById('Aviso-Login-Expirado');
const AvisoFaceIDReprovado = document.getElementById('Aviso-FaceID-Reprovado');
const ContainerAuxiliarFaceID = document.getElementById('Container-Auxiliar-FaceID');

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que leva à página aviso-dispositivo e processa alterações do tamanho da tela.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function LevaàPáginaAvisoDispositivo() { if (window.innerWidth <= 1024) { window.location.href = "/plataforma_v2/aviso-dispositivo"; } }

window.addEventListener('resize', LevaàPáginaAvisoDispositivo);

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {
    
    if ((navigator.userAgentData?.brands?.some(b => b.brand === "Microsoft Edge") || navigator.userAgent.includes("Edg")) === false) { window.location.href = '/plataforma_v2/aviso-navegador'; } 
    
    else { 
        
        if (sessionStorage.getItem('Usuário_Logado') === 'Sim') { window.location.href = '/plataforma_v2/estudo'; } 
        
        else if (sessionStorage.getItem('Usuário_Autorização_Cadastro') === 'Sim' && sessionStorage.getItem('Origem_Aviso_Dispositivo') !== 'Sim') { sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Não'); window.history.back(); }
        
        else { LevaàPáginaAvisoDispositivo(); } 
    
    }

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Processa submissão do formulário de login.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

FormulárioLogin.addEventListener('submit', function(event) {
    
    if (Entrar.disabled) return;
    document.body.style.cursor = 'wait';
    Entrar.disabled = true;
    Entrar.style.display = "none";
    AvisoInicializando.style.display = "block";
    event.preventDefault();

    const Usuário_Login = Email.value;
    const Usuário_Senha = Senha.value;
    
    fetch(URL_Base_Backend + '/login-FaceID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Usuário_Login, Usuário_Senha })
    })

    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw { status: response.status, error: data.error };
        return data;
    })

    ////////////////////////////////////////////////////////////////////////////////////////
    // Processa caso o login e senha tenham sido autenticados.
    ////////////////////////////////////////////////////////////////////////////////////////

    .then(data => {

        let IndexVerificado = data.IndexVerificado;
        let Usuário_Status_FaceID = data.Usuário_Status_FaceID;
        let Usuário_Foto_Cadastrada = data.Usuário_Foto_Cadastrada;
        let Usuário_PrazoAcesso = data.Usuário_PrazoAcesso;
        let Usuário_Status_Login = data.Usuário_Status_Login;
                
        sessionStorage.setItem('IndexVerificado', IndexVerificado);
        sessionStorage.setItem('Usuário_Foto_Cadastrada', Usuário_Foto_Cadastrada);
        
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa caso o login esteja ativo.
        ////////////////////////////////////////////////////////////////////////////////////////
        
        if (Usuário_Status_Login === "Ativo") {

            sessionStorage.setItem('Horário-Encerramento-Sessão', Date.now() + (14400 * 1000));

            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa caso o FaceId esteja inativo.
            ////////////////////////////////////////////////////////////////////////////////////////
            
            if ( Usuário_Status_FaceID === 'Inativo' ) { 
                sessionStorage.setItem('Usuário_Logado', 'Sim'); 
                window.location.href = '/plataforma_v2/estudo'; 
            } 
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa caso o FaceId esteja ativo e a foto ainda não esteja cadastrada.
            ////////////////////////////////////////////////////////////////////////////////////////

            else if (Usuário_Foto_Cadastrada === 'Não') { 
                sessionStorage.setItem('Usuário_Autorização_Cadastro', 'Sim'); 
                window.location.href = '/plataforma_v2/avisos-iniciais'; 
            }

            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa caso o FaceId esteja ativo e a foto já esteja cadastrada.
            ////////////////////////////////////////////////////////////////////////////////////////
            
            else if (Usuário_Foto_Cadastrada === 'Sim') {
                                    
                fetch(URL_Base_Backend + '/FaceID', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ IndexVerificado })
                })

                .then(async response => {
                    const data = await response.json();
                    if (!response.ok) throw { status: response.status, error: data.error };
                    return data;
                })

                ////////////////////////////////////////////////////////////////////////////////////////
                // Inicia o faceLivenessDetector.
                ////////////////////////////////////////////////////////////////////////////////////////

                .then(async data => {

                    document.body.style.cursor = 'default';
                    
                    let faceLivenessDetector = document.createElement("azure-ai-vision-face-ui");
                    faceLivenessDetector.locale = "pt-BR";
                    faceLivenessDetector.fontSize = "18px";
                    faceLivenessDetector.buttonStyles = "margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;";
                    ContainerAuxiliarFaceID.appendChild(faceLivenessDetector);

                    faceLivenessDetector.start(data.Azure_Face_API_LivenessSession_authToken).then(resultData => {
                        
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
                            
                            if (data.Azure_Face_API_LivenessSession_LivenessDecision === 'realface' && 
                                data.Azure_Face_API_LivenessSession_MatchDecision === true ) 
                            { 
                                sessionStorage.setItem('Usuário_Logado', 'Sim'); 
                                window.location.href = '/plataforma_v2/estudo'; 
                            } 
                            
                            ////////////////////////////////////////////////////////////////////////////////////////
                            // Processa caso a LivenessSession tenha sido reprovada:
                            ////////////////////////////////////////////////////////////////////////////////////////

                            else {

                                resetarLogin();
                                AvisoFaceIDReprovado.style.display = "block";
                                AvisoFaceIDReprovado.innerHTML = "⮾ FaceID reprovado. Tente novamente.";

                            }
            
                        })

                        ////////////////////////////////////////////////////////////////////////////////////////
                        // Processa avisos / alertas.
                        ////////////////////////////////////////////////////////////////////////////////////////

                        .catch(err => {

                            resetarLogin();
                            if (err.error !== 'Erro_007') { alert("Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."); }
                            else { alert("Erro_007: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente."); }

                        })

                    })

                    ////////////////////////////////////////////////////////////////////////////////////////
                    // Processa avisos / alertas.
                    ////////////////////////////////////////////////////////////////////////////////////////

                    .catch(errorData => {

                        resetarLogin();
                        alert("Erro_006: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.");
                        console.log(errorData);
                    
                    })

                })

                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa avisos / alertas.
                ////////////////////////////////////////////////////////////////////////////////////////

                .catch(err => {

                    resetarLogin();
                    if (err.error !== 'Erro_004' && err.error !== 'Erro_005') { alert("Erro_000: Verifique sua conexão com a internet."); }
                    else if (err.error === 'Erro_004') { alert("Erro_004: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente."); }
                    else if (err.error === 'Erro_005') { alert("Erro_005: falha ao obter sua foto de referência.\nTente novamente."); }

                })

            }

        } 
        
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa caso o login esteja inativo.
        ////////////////////////////////////////////////////////////////////////////////////////
        
        else {
            
            resetarLogin();
            AvisoLoginExpirado.style.display = "block";
            AvisoLoginExpirado.innerHTML = "⮾ Login expirado em " + Usuário_PrazoAcesso;
            
        }
            
    })

    ////////////////////////////////////////////////////////////////////////////////////////
    // Processa avisos / alertas.
    ////////////////////////////////////////////////////////////////////////////////////////

    .catch(err => {

        resetarLogin();
        if (err.status === 401) { AvisoEmailouSenhaInválidos.style.display = 'block'; }  
        else if (err.error !== 'Erro_001'){ alert("Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."); }
        else { alert("Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente."); }

    });

});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Reseta login.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resetarLogin() {
    document.body.style.cursor = 'default';
    Entrar.disabled = false;
    Entrar.style.display = "block";
    AvisoInicializando.style.display = "none";
    Email.value = '';
    Senha.value = '';
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Reseta avisos.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Email.addEventListener('input', resetarAvisos);
Senha.addEventListener('input', resetarAvisos);

function resetarAvisos() {
    AvisoEmailouSenhaInválidos.style.display = 'none';
    AvisoLoginExpirado.style.display = 'none';
    AvisoFaceIDReprovado.style.display = 'none';
}