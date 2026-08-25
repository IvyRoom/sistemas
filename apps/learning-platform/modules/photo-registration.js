import { createFaceStartup } from './face-startup.js';
import {
    learningPlatformErrorKinds,
    learningPlatformErrorOperations,
    normalizeLearningPlatformError,
    normalizeLearningPlatformLocalError
} from './error-adapter.js';
import {
    learningPlatformErrorMessage,
    learningPlatformErrorPresentations
} from './error-presentation.js';
import { isMicrosoftEdge, redirectToDeviceWarning } from './lifecycle.js';
import { createPlatformClient, resolvePlatformBaseUrl } from './platform-client.js';
import { createSessionStore } from './session.js';

export function createRegistrationApplication({
    window,
    document,
    navigator,
    sessionStorage,
    fetch,
    FormDataConstructor,
    createFaceElement,
    createFaceStyleSheet,
    navigate,
    alert
}) {
    const session = createSessionStore(sessionStorage);
    const backendBase = resolvePlatformBaseUrl(session.read('backendBase'));
    const verifiedIndex = session.read('verifiedIndex');
    const client = createPlatformClient({ baseUrl: backendBase, fetch, FormDataConstructor });

    const referencePhotoForm = document.getElementById('Formulário-Foto-Referência');
    const submitButton = document.getElementById('Botão-Cadastrar-Foto-Referência');
    const registeringNotice = document.getElementById('Aviso-Cadastrando');
    const faceContainer = document.getElementById('Container-Auxiliar-FaceID');
    const faceStartup = createFaceStartup({
        createElement: createFaceElement,
        createStyleSheet: createFaceStyleSheet,
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
        referencePhotoForm.setAttribute('aria-busy', 'true');
        event.preventDefault();

        const referencePhotoInput = document.getElementById('Botão-Escolher-Arquivo');
        const referencePhoto = referencePhotoInput.files[0];

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
                    const failure = normalizeLearningPlatformError(
                        err,
                        learningPlatformErrorOperations.FACE_RESULT
                    );
                    if (failure.kind !== learningPlatformErrorKinds.FACE_LIVENESS_RESULT_READ_FAILURE) {
                        alert(learningPlatformErrorMessage(
                            learningPlatformErrorPresentations.REGISTRATION_FACE_RESULT_GENERIC
                        ));
                        navigate('/plataforma/login');
                    }
                    else {
                        alert(learningPlatformErrorMessage(
                            learningPlatformErrorPresentations.REGISTRATION_FACE_RESULT
                        ));
                        navigate('/plataforma/login');
                    }
                });
            })
            .catch(err => {
                const failure = normalizeLearningPlatformLocalError(
                    err,
                    learningPlatformErrorKinds.FACE_COMPONENT_FAILURE
                );
                if (failure.kind === learningPlatformErrorKinds.FACE_COMPONENT_FAILURE) {
                    alert(learningPlatformErrorMessage(
                        learningPlatformErrorPresentations.REGISTRATION_FACE_COMPONENT
                    ));
                }
                navigate('/plataforma/login');
            });
        })
        .catch(err => {
            document.body.style.cursor = 'default';
            submitButton.disabled = false;
            submitButton.style.display = 'block';
            registeringNotice.style.display = 'none';
            referencePhotoForm.setAttribute('aria-busy', 'false');
            referencePhotoInput.focus();

            const failure = normalizeLearningPlatformError(
                err,
                learningPlatformErrorOperations.REGISTRATION
            );
            if (
                failure.kind !== learningPlatformErrorKinds.REFERENCE_PHOTO_UPLOAD_FAILURE &
                failure.kind !== learningPlatformErrorKinds.REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE &&
                failure.kind !== learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE
            ) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.REGISTRATION_REQUEST_GENERIC
                ));
            }
            else if (failure.kind === learningPlatformErrorKinds.REFERENCE_PHOTO_UPLOAD_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.REGISTRATION_PHOTO_UPLOAD
                ));
            }
            else if (failure.kind === learningPlatformErrorKinds.REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.REGISTRATION_PHOTO_REGISTRATION_UPDATE
                ));
            }
            else if (failure.kind === learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.REGISTRATION_FACE_SESSION
                ));
            }
        });
    });
}
