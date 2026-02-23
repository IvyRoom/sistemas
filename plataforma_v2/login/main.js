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
////////////////////////////////////////////////////////////////////////////////////////
// Importa o código de comunicação com o Azure Face API, para fazer o FaceID.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

import "../azure-ai-vision-face-ui/FaceLivenessDetector.js"

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
const AvisoInconsistência = document.getElementById('Aviso-Inconsistência');
const AvisoInicializando = document.getElementById('Aviso-Inicializando');
const AvisoLoginExpirado = document.getElementById('Aviso-Login-Expirado');
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
    
    document.body.style.cursor = 'wait';
    Entrar.style.display = "none";
    AvisoInicializando.style.display = "block";
    event.preventDefault();
    let Usuário_Login = Email.value;
    let Usuário_Senha = Senha.value;
    
    fetch(URL_Base_Backend + '/login-FaceID', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ login: Usuário_Login, senha: Usuário_Senha }) }).then(response => response.json()).then(data =>  {
        
        let LoginAutenticado = data.LoginAutenticado;
        let IndexVerificado = data.IndexVerificado;
        let Usuário_Status_FaceID = data.Usuário_Status_FaceID;
        let Usuário_Foto_Cadastrada = data.Usuário_Foto_Cadastrada;
        let Usuário_PrazoAcesso = data.Usuário_PrazoAcesso;
        let Usuário_Status_Login = data.Usuário_Status_Login;
        
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa caso o login tenha sido autenticado.
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////
        
        if (LoginAutenticado === 1) {
            
            sessionStorage.setItem('IndexVerificado', IndexVerificado);
            sessionStorage.setItem('Usuário_Foto_Cadastrada', Usuário_Foto_Cadastrada);
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa caso o login esteja ativo.
            ////////////////////////////////////////////////////////////////////////////////////////
            
            if (Usuário_Status_Login === "Ativo") {

                sessionStorage.setItem('TempoSessão_Segundos', 3600);

                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa caso o FaceId esteja inativo (faz o login direto do usuário).
                
                if ( Usuário_Status_FaceID === 'Inativo' ) { sessionStorage.setItem('Usuário_Logado', 'Sim'); window.location.href = '/plataforma_v2/estudo'; } 
                
                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa caso o FaceId esteja ativo e a foto ainda não esteja cadastrada (leva à página de avisos-iniciais).

                else if (Usuário_Foto_Cadastrada === 'Não') { sessionStorage.setItem('Usuário_Autorização_Cadastro', 'Sim'); window.location.href = '/plataforma_v2/avisos-iniciais'; }

                ////////////////////////////////////////////////////////////////////////////////////////
                // Processa caso o FaceId esteja ativo e a foto já esteja cadastrada (roda o FaceID).
                
                else if (Usuário_Foto_Cadastrada === 'Sim') {
                                        
                    fetch(URL_Base_Backend + '/FaceID', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ IndexVerificado: IndexVerificado }) }).then(response => response.json()).then(data =>  {
                
                        let Azure_Face_API_LivenessSession_authToken = data.Azure_Face_API_LivenessSession_authToken;
                        let Azure_Face_API_LivenessSession_sessionID = data.Azure_Face_API_LivenessSession_sessionID;
                        let faceLivenessDetector = document.createElement("azure-ai-vision-face-ui");
                        faceLivenessDetector.locale = "pt-BR";
                        faceLivenessDetector.fontSize = "18px";
                        faceLivenessDetector.buttonStyles = "margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;";
                        ContainerAuxiliarFaceID.appendChild(faceLivenessDetector);

                        faceLivenessDetector.start(Azure_Face_API_LivenessSession_authToken).then(() => {
                
                            // Obtém os resultados do FaceID.
                        
                            fetch(URL_Base_Backend + '/FaceID_resultado/' + Azure_Face_API_LivenessSession_sessionID, { method: 'GET', headers: {'Content-Type': 'application/json'} }).then(response => response.json()).then(data =>  {

                                let Azure_Face_API_LivenessSession_LivenessDecision = data.Azure_Face_API_LivenessSession_LivenessDecision;
                                let Azure_Face_API_LivenessSession_MatchDecision = data.Azure_Face_API_LivenessSession_MatchDecision;
                                
                                // Processa caso o FaceID seja aprovado (leva à página de estudo):
                                
                                if ( Azure_Face_API_LivenessSession_LivenessDecision === 'realface' && Azure_Face_API_LivenessSession_MatchDecision === true ) { sessionStorage.setItem('Usuário_Logado', 'Sim'); window.location.href = '/plataforma_v2/estudo'; } 
                                
                                // Processa caso o FaceID seja reprovado (dá o alerta de FaceID reprovado):

                                else { sessionStorage.setItem('Usuário_Logado', 'Não'); alert("FaceID reprovado. Tente novamente."); location.reload(); }
                
                            })
                
                        })

                        // Processa caso o FaceID não tenha sido concluído (dá o alerta de FaceID reprovado):

                        .catch(() => { sessionStorage.setItem('Usuário_Logado', 'Não');  alert("FaceID reprovado. Tente novamente."); location.reload(); });

                    });

                }

            } 
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Processa caso o login esteja inativo (mostra o aviso de login expirado).
            ////////////////////////////////////////////////////////////////////////////////////////
            
            else {

                document.body.style.cursor = 'default';
                Email.value = '';
                Senha.value = '';
                Entrar.style.display = "block";
                AvisoInconsistência.style.display = 'none';
                AvisoInicializando.style.display = "none";
                AvisoLoginExpirado.style.display = "block";
                AvisoLoginExpirado.innerHTML = "⮾ Login expirado em " + Usuário_PrazoAcesso;

            }
            
        } 
        
        ////////////////////////////////////////////////////////////////////////////////////////
        // Processa caso o login não tenha sido autenticado (mostra o aviso de inconsistência).
        ////////////////////////////////////////////////////////////////////////////////////////

        else {
            
            document.body.style.cursor = 'default';
            Email.value = '';
            Senha.value = '';
            Entrar.style.display = "block";
            AvisoInconsistência.style.display = 'block';
            AvisoInicializando.style.display = "none";
            AvisoLoginExpirado.style.display = "none";

        }

    })

});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Reseta o AvisoInconsistência e o AvisoLoginExpirado caso o Email ou Senha sejam alterados.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

Email.addEventListener('change', function () { AvisoInconsistência.style.display = 'none'; AvisoLoginExpirado.style.display = 'none'; })
Senha.addEventListener('change', function () { AvisoInconsistência.style.display = 'none'; AvisoLoginExpirado.style.display = 'none'; })