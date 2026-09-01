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

export function createLoginApplication({
    window,
    document,
    navigator,
    history,
    sessionStorage,
    fetch,
    clock,
    createFaceElement,
    createFaceStyleSheet,
    loadFaceRuntime,
    navigate,
    replaceNavigation,
    alert,
    console,
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
    const client = createPlatformClient({
        baseUrl: backendBase,
        fetch,
        sessionRequest: authoritativeSessions
    });

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
        createStyleSheet: createFaceStyleSheet,
        loadRuntime: loadFaceRuntime,
        mount: element => faceContainer.appendChild(element)
    });
    const browserAdmission = classifyBrowserAdmission({
        document,
        entry: browserAdmissionEntries.LOGIN,
        navigator,
        window
    });

    function replaceForViewport() {
        return replaceWithViewportWarning({ replaceNavigation, window });
    }

    window.addEventListener('load', function() {
        if (browserAdmission.outcome !== browserAdmissionOutcomes.CANDIDATE) {
            replaceNavigation('/plataforma/aviso-dispositivo-navegador');
        }
        else if (replaceForViewport()) {
            return;
        }
        else {
            window.addEventListener('resize', replaceForViewport);
            if (authoritativeSessions) {
                logoutPresentation.listen(() => {
                    session.write('loggedIn', 'Não');
                });
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
            }
        }
    });

    loginForm.addEventListener('submit', function(event) {
        if (browserAdmission.outcome !== browserAdmissionOutcomes.CANDIDATE) {
            event.preventDefault();
            return;
        }
        if (submitButton.disabled) {
            event.preventDefault();
            return;
        }
        document.body.style.cursor = 'wait';
        submitButton.disabled = true;
        submitButton.style.display = 'none';
        initializingNotice.style.display = 'block';
        loginForm.setAttribute('aria-busy', 'true');
        event.preventDefault();

        const userLogin = email.value;
        const userPassword = password.value;

        client.postJson('/login-FaceID', {
            Usuário_Login: userLogin,
            Usuário_Senha: userPassword
        })
        .then(data => {
            if (authoritativeSessions) {
                return continueAuthoritativeLogin(data);
            }

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
                                const failure = normalizeLearningPlatformError(
                                    err,
                                    learningPlatformErrorOperations.FACE_RESULT
                                );
                                if (failure.kind !== learningPlatformErrorKinds.FACE_LIVENESS_RESULT_READ_FAILURE) {
                                    alert(learningPlatformErrorMessage(
                                        learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
                                    ));
                                }
                                else {
                                    alert(learningPlatformErrorMessage(
                                        learningPlatformErrorPresentations.LOGIN_FACE_RESULT
                                    ));
                                }
                            });

                        })
                        .catch(errorData => {
                            resetLogin();
                            const failure = normalizeLearningPlatformLocalError(
                                errorData,
                                learningPlatformErrorKinds.FACE_COMPONENT_FAILURE
                            );
                            if (failure.kind === learningPlatformErrorKinds.FACE_COMPONENT_FAILURE) {
                                alert(learningPlatformErrorMessage(
                                    learningPlatformErrorPresentations.LOGIN_FACE_COMPONENT
                                ));
                            }
                            console.log(errorData);
                        });
                    })
                    .catch(err => {
                        resetLogin();
                        const failure = normalizeLearningPlatformError(
                            err,
                            learningPlatformErrorOperations.FACE_SESSION
                        );
                        if (
                            failure.kind !== learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE &&
                            failure.kind !== learningPlatformErrorKinds.REFERENCE_PHOTO_READ_FAILURE
                        ) {
                            alert(learningPlatformErrorMessage(
                                learningPlatformErrorPresentations.LOGIN_FACE_SESSION_GENERIC
                            ));
                        }
                        else if (failure.kind === learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE) {
                            alert(learningPlatformErrorMessage(
                                learningPlatformErrorPresentations.LOGIN_FACE_SESSION
                            ));
                        }
                        else if (failure.kind === learningPlatformErrorKinds.REFERENCE_PHOTO_READ_FAILURE) {
                            alert(learningPlatformErrorMessage(
                                learningPlatformErrorPresentations.LOGIN_REFERENCE_PHOTO
                            ));
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
            if (authoritativeSessions) {
                return presentAuthoritativeLoginFailure(err).finally(() => {
                    const invalidCredentialsPresented =
                        invalidCredentialsNotice.style.display === 'block';
                    resetLogin();
                    if (invalidCredentialsPresented) {
                        email.setAttribute('aria-invalid', 'true');
                        password.setAttribute('aria-invalid', 'true');
                    }
                });
            }

            resetLogin();

            const failure = normalizeLearningPlatformError(
                err,
                learningPlatformErrorOperations.LOGIN
            );
            if (failure.kind === learningPlatformErrorKinds.INVALID_CREDENTIALS) {
                invalidCredentialsNotice.style.display = 'block';
                email.setAttribute('aria-invalid', 'true');
                password.setAttribute('aria-invalid', 'true');
            }
            else if (failure.kind !== learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
                ));
            }
            else {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.PLATFORM_DATA_RETRY
                ));
            }
        });
    });

    async function continueAuthoritativeLogin(data) {
        const status = readAuthoritativeSessionStatus(data);

        if (
            status.authenticationPhase === AUTHENTICATION_PHASES.AUTHENTICATED &&
            hasSessionNextOperation(status, SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING)
        ) {
            session.write('loggedIn', 'Sim');
            navigate('/plataforma/estudo');
            return;
        }

        if (
            status.authenticationPhase === AUTHENTICATION_PHASES.CREDENTIAL_VERIFIED &&
            hasSessionNextOperation(status, SESSION_NEXT_OPERATIONS.REGISTRATION_ENROLLMENT)
        ) {
            try {
                await client.post('/sessions/current/registration-enrollment');
                const enrolledStatus = readAuthoritativeSessionStatus(
                    await client.getJson('/sessions/current')
                );
                if (
                    enrolledStatus.authenticationPhase === AUTHENTICATION_PHASES.REGISTRATION_PENDING &&
                    hasSessionNextOperation(
                        enrolledStatus,
                        SESSION_NEXT_OPERATIONS.REGISTRATION_CHALLENGE
                    )
                ) {
                    navigate('/plataforma/avisos-iniciais');
                    return;
                }
                throw new TypeError('Authoritative registration enrollment returned an invalid phase');
            }
            catch (error) {
                throw createAuthoritativeFailure('registration-enrollment', error);
            }
        }

        if (
            status.authenticationPhase === AUTHENTICATION_PHASES.CREDENTIAL_VERIFIED &&
            hasSessionNextOperation(status, SESSION_NEXT_OPERATIONS.FACE_CHALLENGE)
        ) {
            let challenge;
            try {
                challenge = await client.post('/FaceID');
            }
            catch (error) {
                throw createAuthoritativeFailure('face-challenge', error);
            }

            let faceToken;
            try {
                faceToken = readAuthoritativeFaceChallenge(challenge);
            }
            catch (error) {
                throw createAuthoritativeFailure('face-challenge', error);
            }

            document.body.style.cursor = 'default';
            try {
                await faceStartup.start(faceToken);
            }
            catch (error) {
                throw createAuthoritativeFailure('face-component', error);
            }

            try {
                const completedStatus = readAuthoritativeSessionStatus(
                    await client.post('/sessions/current/face-completion')
                );
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

        throw new TypeError('Authoritative login returned an unsupported phase');
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

    async function presentAuthoritativeLoginFailure(failure) {
        const stage = failure?.authoritativeStage || 'credential-login';
        const cause = failure?.cause || failure;

        if (stage === 'face-component') {
            const localFailure = normalizeLearningPlatformLocalError(
                cause,
                learningPlatformErrorKinds.FACE_COMPONENT_FAILURE
            );
            if (localFailure.kind === learningPlatformErrorKinds.FACE_COMPONENT_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.LOGIN_FACE_COMPONENT
                ));
            }
            return;
        }

        if (stage === 'credential-login' && cause?.status === 401) {
            invalidCredentialsNotice.style.display = 'block';
            email.setAttribute('aria-invalid', 'true');
            password.setAttribute('aria-invalid', 'true');
            return;
        }

        if (stage === 'face-completion' && cause?.status === 403) {
            try {
                const status = readAuthoritativeSessionStatus(
                    await client.getJson('/sessions/current')
                );
                if (
                    status.authenticationPhase === AUTHENTICATION_PHASES.AUTHENTICATED &&
                    hasSessionNextOperation(
                        status,
                        SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING
                    )
                ) {
                    session.write('loggedIn', 'Sim');
                    navigate('/plataforma/estudo');
                    return;
                }
            }
            catch (statusError) {
                if (statusError?.status === 401) {
                    rejectedFaceNotice.style.display = 'block';
                    rejectedFaceNotice.innerHTML = '⮾ FaceID reprovado. Tente novamente.';
                    return;
                }
            }
            alert(learningPlatformErrorMessage(
                learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
            ));
            return;
        }

        if (cause?.status === 409) {
            alert(learningPlatformErrorMessage(
                learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
            ));
            return;
        }

        alert(learningPlatformErrorMessage(
            learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
        ));
    }

    function resetLogin() {
        document.body.style.cursor = 'default';
        submitButton.disabled = false;
        submitButton.style.display = 'block';
        initializingNotice.style.display = 'none';
        loginForm.setAttribute('aria-busy', 'false');
        email.setAttribute('aria-invalid', 'false');
        password.setAttribute('aria-invalid', 'false');
        email.value = '';
        password.value = '';
        email.focus();
    }

    email.addEventListener('input', resetNotices);
    password.addEventListener('input', resetNotices);

    function resetNotices() {
        invalidCredentialsNotice.style.display = 'none';
        expiredLoginNotice.style.display = 'none';
        rejectedFaceNotice.style.display = 'none';
        email.setAttribute('aria-invalid', 'false');
        password.setAttribute('aria-invalid', 'false');
    }
}
