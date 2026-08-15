import { createFaceStartup } from './face-startup.js';
import { isMicrosoftEdge, redirectToDeviceWarning } from './lifecycle.js';
import { createPlatformClient } from './platform-client.js';
import { createSessionStore } from './session.js';

export function createRegistrationApplication({
    window,
    document,
    navigator,
    sessionStorage,
    fetch,
    FormDataConstructor,
    createFaceElement,
    navigate,
    alert
}) {
    const session = createSessionStore(sessionStorage);
    const backendBase = session.read('backendBase');
    const verifiedIndex = session.read('verifiedIndex');
    const client = createPlatformClient({ baseUrl: backendBase, fetch, FormDataConstructor });

    const referencePhotoForm = document.getElementById('Formulário-Foto-Referência');
    const submitButton = document.getElementById('Botão-Cadastrar-Foto-Referência');
    const registeringNotice = document.getElementById('Aviso-Cadastrando');
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
        session.write('deviceWarningOrigin', 'Não');

        if (isMicrosoftEdge(navigator) === false) {
            navigate('/plataforma/aviso-navegador');
        }
        else {
            if (session.read('registrationAuthorization') !== 'Sim') {
                navigate('/plataforma/login');
            }
            else {
                redirectForWidth();
            }
        }
    });

    referencePhotoForm.addEventListener('submit', function(event) {
        if (submitButton.disabled) return;
        document.body.style.cursor = 'wait';
        submitButton.disabled = true;
        submitButton.style.display = 'none';
        registeringNotice.style.display = 'block';
        event.preventDefault();

        const referencePhoto = document.getElementById('Botão-Escolher-Arquivo').files[0];

        client.postMultipart('/CadastroFoto_e_FaceID', [
            ['IndexVerificado', verifiedIndex],
            ['file', referencePhoto]
        ])
        .then(async data => {
            session.write('registrationAuthorization', 'Não');
            document.body.style.cursor = 'default';

            faceStartup.start(data.Azure_Face_API_LivenessSession_authToken).then(() => {
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
                        alert('⮾ FaceID reprovado. Tente novamente.\nLiveness Decision: ' + data.Azure_Face_API_LivenessSession_LivenessDecision + '\nMatch Confidence: ' + data.Azure_Face_API_LivenessSession_MatchConfidence + '\nMatch Decision: ' + data.Azure_Face_API_LivenessSession_MatchDecision);
                        navigate('/plataforma/login');
                    }
                })
                .catch(err => {
                    if (err.error !== 'Erro_007') {
                        alert('Erro_000. Tente novamente.');
                        navigate('/plataforma/login');
                    }
                    else {
                        alert('Erro_007. Tente novamente.');
                        navigate('/plataforma/login');
                    }
                });
            })
            .catch(err => {
                alert('Erro_006. Aguarde 2min e tente novamente.');
                navigate('/plataforma/login');
            });
        })
        .catch(err => {
            document.body.style.cursor = 'default';
            submitButton.disabled = false;
            submitButton.style.display = 'block';
            registeringNotice.style.display = 'none';

            if (err.error !== 'Erro_002' & err.error !== 'Erro_003' && err.error !== 'Erro_004') {
                alert('Erro_000. Verifique sua conexão com a internet.');
            }
            else if (err.error === 'Erro_002') {
                alert('Erro_002. Tente novamente.');
            }
            else if (err.error === 'Erro_003') {
                alert('Erro_003. Tente novamente.');
            }
            else if (err.error === 'Erro_004') {
                alert('Erro_004. Tente novamente.');
            }
        });
    });
}
