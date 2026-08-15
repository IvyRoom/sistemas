import { createFaceStartup } from './face-startup.js';
import { isMicrosoftEdge, redirectToDeviceWarning } from './lifecycle.js';
import { createPlatformClient } from './platform-client.js';
import { createSessionStore } from './session.js';

export function createLoginApplication({
    window,
    document,
    navigator,
    history,
    sessionStorage,
    fetch,
    clock,
    createFaceElement,
    navigate,
    alert,
    console,
    backendBase
}) {
    const session = createSessionStore(sessionStorage);
    const client = createPlatformClient({ baseUrl: backendBase, fetch });

    const loginForm = document.getElementById('Formulário-Login');
    const email = document.getElementById('E-mail');
    const password = document.getElementById('Senha');
    const submitButton = document.getElementById('Entrar');
    const initializingNotice = document.getElementById('Aviso-Inicializando');
    const invalidCredentialsNotice = document.getElementById('Aviso-Email-ou-Senha-Inválidos');
    const expiredLoginNotice = document.getElementById('Aviso-Login-Expirado');
    const rejectedFaceNotice = document.getElementById('Aviso-FaceID-Reprovado');
    const faceContainer = document.getElementById('Container-Auxiliar-FaceID');
    const faceStartup = createFaceStartup({
        createElement: createFaceElement,
        mount: element => faceContainer.appendChild(element)
    });

    function redirectForWidth() {
        redirectToDeviceWarning({ window, navigate });
    }

    window.addEventListener('resize', redirectForWidth);

    window.addEventListener('load', function() {
        if (isMicrosoftEdge(navigator) === false) {
            navigate('/plataforma/aviso-navegador');
        }
        else {
            if (session.read('loggedIn') === 'Sim') {
                navigate('/plataforma/estudo');
            }
            else if (
                session.read('registrationAuthorization') === 'Sim' &&
                session.read('deviceWarningOrigin') !== 'Sim'
            ) {
                session.write('deviceWarningOrigin', 'Não');
                history.back();
            }
            else {
                redirectForWidth();
            }
        }
    });

    loginForm.addEventListener('submit', function(event) {
        if (submitButton.disabled) return;
        document.body.style.cursor = 'wait';
        submitButton.disabled = true;
        submitButton.style.display = 'none';
        initializingNotice.style.display = 'block';
        event.preventDefault();

        const userLogin = email.value;
        const userPassword = password.value;

        client.postJson('/login-FaceID', {
            Usuário_Login: userLogin,
            Usuário_Senha: userPassword
        })
        .then(data => {
            const verifiedIndex = data.IndexVerificado;
            const faceStatus = data.Usuário_Status_FaceID;
            const registeredPhoto = data.Usuário_Foto_Cadastrada;
            const accessDeadline = data.Usuário_PrazoAcesso;
            const loginStatus = data.Usuário_Status_Login;

            session.write('verifiedIndex', verifiedIndex);
            session.write('registeredPhoto', registeredPhoto);

            if (loginStatus === 'Ativo') {
                session.write('sessionDeadline', clock.now() + (14400 * 1000));

                if (faceStatus === 'Inativo') {
                    session.write('loggedIn', 'Sim');
                    navigate('/plataforma/estudo');
                }
                else if (registeredPhoto === 'Não') {
                    session.write('registrationAuthorization', 'Sim');
                    navigate('/plataforma/avisos-iniciais');
                }
                else if (registeredPhoto === 'Sim') {
                    client.postJson('/FaceID', { IndexVerificado: verifiedIndex })
                    .then(async data => {
                        document.body.style.cursor = 'default';

                        faceStartup.start(data.Azure_Face_API_LivenessSession_authToken).then(resultData => {
                            client.getJson('/FaceID_resultado/' + data.Azure_Face_API_LivenessSession_sessionID)
                            .then(data => {
                                if (
                                    data.Azure_Face_API_LivenessSession_LivenessDecision === 'realface' &&
                                    data.Azure_Face_API_LivenessSession_MatchDecision === true
                                ) {
                                    session.write('loggedIn', 'Sim');
                                    navigate('/plataforma/estudo');
                                }
                                else {
                                    resetLogin();
                                    rejectedFaceNotice.style.display = 'block';
                                    rejectedFaceNotice.innerHTML = '⮾ FaceID reprovado. Tente novamente.';
                                }
                            })
                            .catch(err => {
                                resetLogin();
                                if (err.error !== 'Erro_007') {
                                    alert('Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.');
                                }
                                else {
                                    alert('Erro_007: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.');
                                }
                            });

                        })
                        .catch(errorData => {
                            resetLogin();
                            alert('Erro_006: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.');
                            console.log(errorData);
                        });
                    })
                    .catch(err => {
                        resetLogin();
                        if (err.error !== 'Erro_004' && err.error !== 'Erro_005') {
                            alert('Erro_000: Verifique sua conexão com a internet.');
                        }
                        else if (err.error === 'Erro_004') {
                            alert('Erro_004: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.');
                        }
                        else if (err.error === 'Erro_005') {
                            alert('Erro_005: falha ao obter sua foto de referência.\nTente novamente.');
                        }
                    });
                }
            }
            else {
                resetLogin();
                expiredLoginNotice.style.display = 'block';
                expiredLoginNotice.innerHTML = '⮾ Login expirado em ' + accessDeadline;
            }
        })
        .catch(err => {
            resetLogin();
            if (err.status === 401) {
                invalidCredentialsNotice.style.display = 'block';
            }
            else if (err.error !== 'Erro_001') {
                alert('Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.');
            }
            else {
                alert('Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente.');
            }
        });
    });

    function resetLogin() {
        document.body.style.cursor = 'default';
        submitButton.disabled = false;
        submitButton.style.display = 'block';
        initializingNotice.style.display = 'none';
        email.value = '';
        password.value = '';
    }

    email.addEventListener('input', resetNotices);
    password.addEventListener('input', resetNotices);

    function resetNotices() {
        invalidCredentialsNotice.style.display = 'none';
        expiredLoginNotice.style.display = 'none';
        rejectedFaceNotice.style.display = 'none';
    }
}
