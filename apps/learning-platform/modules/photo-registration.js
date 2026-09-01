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
import {
    browserAdmissionEntries,
    browserAdmissionOutcomes,
    classifyBrowserAdmission,
    replaceWithViewportWarning
} from './lifecycle.js';
import { createPlatformClient } from './platform-client.js';
import {
    AUTHENTICATION_PHASES,
    SESSION_NEXT_OPERATIONS,
    createSessionStore,
    hasSessionNextOperation,
    readAuthoritativeSessionStatus
} from './session.js';

export function createRegistrationApplication({
    window,
    document,
    navigator,
    sessionStorage,
    fetch,
    FormDataConstructor,
    createFaceElement,
    createFaceStyleSheet,
    loadFaceRuntime,
    navigate,
    replaceNavigation,
    alert,
    backendBase,
    authoritativeSessions = false,
    logoutPresentation
}) {
    if (
        authoritativeSessions &&
        (!logoutPresentation || typeof logoutPresentation.listen !== 'function')
    ) {
        throw new TypeError('Authoritative logout presentation is required');
    }
    const session = createSessionStore(sessionStorage);
    const verifiedIndex = authoritativeSessions ? undefined : session.read('verifiedIndex');
    const client = createPlatformClient({
        baseUrl: backendBase,
        fetch,
        FormDataConstructor,
        sessionRequest: authoritativeSessions
    });

    const referencePhotoForm = document.getElementById('Formulário-Foto-Referência');
    const submitButton = document.getElementById('Botão-Cadastrar-Foto-Referência');
    const registeringNotice = document.getElementById('Aviso-Cadastrando');
    let authoritativeRegistrationReady = false;
    let logoutPresentationEnded = false;

    if (authoritativeSessions) {
        submitButton.disabled = true;
        referencePhotoForm.setAttribute('aria-busy', 'true');
    }
    const faceContainer = document.getElementById('Container-Auxiliar-FaceID');
    const faceStartup = createFaceStartup({
        createElement: createFaceElement,
        createStyleSheet: createFaceStyleSheet,
        loadRuntime: loadFaceRuntime,
        mount: element => faceContainer.appendChild(element)
    });
    const browserAdmission = classifyBrowserAdmission({
        document,
        entry: browserAdmissionEntries.PHOTO_REGISTRATION,
        navigator,
        window
    });

    function replaceForViewport() {
        return replaceWithViewportWarning({ replaceNavigation, window });
    }

    window.addEventListener('load', function() {
        session.write('deviceWarningOrigin', 'Não');

        if (browserAdmission.outcome !== browserAdmissionOutcomes.CANDIDATE) {
            replaceNavigation('/plataforma/aviso-dispositivo-navegador');
        }
        else if (replaceForViewport()) {
            return;
        }
        else {
            if (!authoritativeSessions && session.read('registrationAuthorization') !== 'Sim') {
                navigate('/plataforma/login');
            }
            else {
                window.addEventListener('resize', replaceForViewport);
                if (authoritativeSessions) {
                    logoutPresentation.listen(() => {
                        logoutPresentationEnded = true;
                        blockAuthoritativeRegistration();
                        session.write('loggedIn', 'Não');
                        navigate('/plataforma/login');
                    });
                    if (!logoutPresentationEnded) validateAuthoritativeRegistration();
                }
            }
        }
    });

    referencePhotoForm.addEventListener('submit', function(event) {
        if (browserAdmission.outcome !== browserAdmissionOutcomes.CANDIDATE) {
            event.preventDefault();
            return;
        }
        if (submitButton.disabled) {
            event.preventDefault();
            return;
        }
        if (
            authoritativeSessions &&
            (!authoritativeRegistrationReady || logoutPresentationEnded)
        ) {
            event.preventDefault();
            return;
        }
        authoritativeRegistrationReady = false;
        document.body.style.cursor = 'wait';
        submitButton.disabled = true;
        submitButton.style.display = 'none';
        registeringNotice.style.display = 'block';
        referencePhotoForm.setAttribute('aria-busy', 'true');
        event.preventDefault();

        const referencePhotoInput = document.getElementById('Botão-Escolher-Arquivo');
        const referencePhoto = referencePhotoInput.files[0];
        const fields = authoritativeSessions
            ? [['file', referencePhoto]]
            : [
                ['IndexVerificado', verifiedIndex],
                ['file', referencePhoto]
            ];

        client.postMultipart('/CadastroFoto_e_FaceID', fields)
        .then(async data => {
            if (authoritativeSessions) {
                if (logoutPresentationEnded) return;
                return continueAuthoritativeRegistration(data);
            }

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
            if (authoritativeSessions) {
                if (logoutPresentationEnded) return;
                blockAuthoritativeRegistration();
                return presentAuthoritativeRegistrationFailure(err);
            }

            resetRegistration(referencePhotoInput);

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

    function validateAuthoritativeRegistration() {
        client.getJson('/sessions/current').then(data => {
            if (logoutPresentationEnded) return;
            const status = readAuthoritativeSessionStatus(data);
            if (
                status.authenticationPhase !== AUTHENTICATION_PHASES.REGISTRATION_PENDING ||
                !hasSessionNextOperation(
                    status,
                    SESSION_NEXT_OPERATIONS.REGISTRATION_CHALLENGE
                )
            ) {
                throw new TypeError('Authoritative registration is not available in this phase');
            }
            authoritativeRegistrationReady = true;
            submitButton.disabled = false;
            referencePhotoForm.setAttribute('aria-busy', 'false');
        }).catch(error => {
            if (logoutPresentationEnded) return;
            blockAuthoritativeRegistration();
            if (error?.status === 401) {
                navigate('/plataforma/login');
                return;
            }
            alert(learningPlatformErrorMessage(
                learningPlatformErrorPresentations.REGISTRATION_REQUEST_GENERIC
            ));
        });
    }

    async function continueAuthoritativeRegistration(data) {
        if (logoutPresentationEnded) return;
        let faceToken;
        try {
            faceToken = readAuthoritativeFaceChallenge(data);
        }
        catch (error) {
            throw createAuthoritativeFailure('registration-challenge', error);
        }

        document.body.style.cursor = 'default';

        try {
            await faceStartup.start(faceToken);
            if (logoutPresentationEnded) return;
        }
        catch (error) {
            throw createAuthoritativeFailure('face-component', error);
        }

        try {
            const completedStatus = readAuthoritativeSessionStatus(
                await client.post('/sessions/current/face-completion')
            );
            if (logoutPresentationEnded) return;
            if (
                completedStatus.authenticationPhase === AUTHENTICATION_PHASES.AUTHENTICATED &&
                hasSessionNextOperation(
                    completedStatus,
                    SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING
                )
            ) {
                session.write('loggedIn', 'Sim');
                navigate('/plataforma/estudo');
                return;
            }
            throw new TypeError('Authoritative Face completion returned an invalid phase');
        }
        catch (error) {
            throw createAuthoritativeFailure('face-completion', error);
        }
    }

    function readAuthoritativeFaceChallenge(value) {
        const keys = value && typeof value === 'object' && !Array.isArray(value)
            ? Object.keys(value)
            : [];
        const token = value?.Azure_Face_API_LivenessSession_authToken;
        if (
            keys.length !== 1 ||
            keys[0] !== 'Azure_Face_API_LivenessSession_authToken' ||
            typeof token !== 'string' ||
            token.trim().length === 0
        ) {
            throw new TypeError('Authoritative Face challenge has an invalid shape');
        }
        return token;
    }

    function createAuthoritativeFailure(stage, cause) {
        return { authoritativeStage: stage, cause };
    }

    async function presentAuthoritativeRegistrationFailure(failure) {
        const stage = failure?.authoritativeStage || 'registration';
        const cause = failure?.cause || failure;

        if (stage === 'face-component') {
            const localFailure = normalizeLearningPlatformLocalError(
                cause,
                learningPlatformErrorKinds.FACE_COMPONENT_FAILURE
            );
            if (localFailure.kind === learningPlatformErrorKinds.FACE_COMPONENT_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.REGISTRATION_FACE_COMPONENT
                ));
            }
            navigate('/plataforma/login');
            return;
        }

        if (stage === 'face-completion' && cause?.status === 403) {
            try {
                readAuthoritativeSessionStatus(await client.getJson('/sessions/current'));
            }
            catch (statusError) {
                if (statusError?.status === 401) {
                    alert('⮾ FaceID reprovado. Tente novamente.');
                    navigate('/plataforma/login');
                    return;
                }
            }
        }

        alert(learningPlatformErrorMessage(
            learningPlatformErrorPresentations.REGISTRATION_REQUEST_GENERIC
        ));
        navigate('/plataforma/login');
    }

    function blockAuthoritativeRegistration() {
        authoritativeRegistrationReady = false;
        document.body.style.cursor = 'default';
        submitButton.disabled = true;
        submitButton.style.display = 'none';
        registeringNotice.style.display = 'none';
        referencePhotoForm.setAttribute('aria-busy', 'false');
    }

    function resetRegistration(referencePhotoInput) {
        document.body.style.cursor = 'default';
        submitButton.disabled = false;
        submitButton.style.display = 'block';
        registeringNotice.style.display = 'none';
        referencePhotoForm.setAttribute('aria-busy', 'false');
        referencePhotoInput.focus();
    }
}
