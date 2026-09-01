import {
    learningPlatformErrorKinds,
    learningPlatformErrorOperations,
    normalizeLearningPlatformError
} from '../error-adapter.js';
import {
    learningPlatformErrorMessage,
    learningPlatformErrorPresentations
} from '../error-presentation.js';
import {
    browserAdmissionEntries,
    browserAdmissionOutcomes,
    classifyBrowserAdmission,
    replaceWithViewportWarning
} from '../lifecycle.js';
import {
    AUTHENTICATION_PHASES,
    SESSION_NEXT_OPERATIONS,
    hasSessionNextOperation,
    readAuthoritativeSessionStatus
} from '../session.js';
import { createStudyAssessment } from './assessment.js';
import { createStudyCertificate } from './certificate.js';
import { createStudyContent } from './content.js';
import { createStudyFeedback } from './feedback.js';
import { createStudyNavigation } from './navigation.js';
import { createStudyPerformance } from './performance.js';
import { createStudyProgress } from './progress.js';
import { createStudySessionTimer } from './session-timer.js';
import { createStudyState } from './state.js';

export function createStudyApplication({
    alert,
    authoritativeSessionsEnabled = false,
    client,
    clock,
    configureDownloads,
    document,
    dom,
    loadMedia,
    navigate,
    navigator,
    logoutPresentation,
    replaceNavigation,
    renderCertificate,
    session,
    timers,
    window
}) {
    if (
        authoritativeSessionsEnabled &&
        (
            !logoutPresentation ||
            typeof logoutPresentation.close !== 'function' ||
            typeof logoutPresentation.listen !== 'function' ||
            typeof logoutPresentation.publish !== 'function' ||
            typeof logoutPresentation.snapshot !== 'function'
        )
    ) {
        throw new TypeError('Authoritative logout presentation is required');
    }
    const browserAdmission = classifyBrowserAdmission({
        document,
        entry: browserAdmissionEntries.STUDY,
        navigator,
        window
    });
    const stateContainer = createStudyState();
    const { state } = stateContainer;
    const navigation = createStudyNavigation({ document, dom, state });
    let logoutControl;
    let logoutPending = false;
    let authoritativePresentationEnded = false;
    const sessionTimer = createStudySessionTimer({
        authoritativeSessionsEnabled,
        clock,
        document,
        navigate,
        onAuthoritativeExpiry: () => endAuthoritativePresentation({ publish: false }),
        session,
        timers
    });

    let content;
    let assessment;
    let feedback;
    let certificate;
    let performanceView;

    function setAuthoritativeLogoutPending(pending) {
        logoutPending = pending;
        if (logoutControl) logoutControl.disabled = pending;
        const protectedPresentation = document.getElementById('Container-Seções');
        protectedPresentation.inert = pending;
        protectedPresentation.setAttribute('aria-busy', pending ? 'true' : 'false');
        document.body.style.cursor = pending ? 'wait' : 'default';
    }

    function endAuthoritativePresentation({ publish }) {
        if (authoritativePresentationEnded) return;
        authoritativePresentationEnded = true;
        logoutPending = false;
        const protectedPresentation = document.getElementById('Container-Seções');
        protectedPresentation.inert = true;
        protectedPresentation.setAttribute('aria-busy', 'false');
        protectedPresentation.style.display = 'none';
        if (logoutControl) logoutControl.disabled = true;
        document.body.style.cursor = 'default';
        sessionTimer.stop();
        if (dom.playerElement && typeof dom.playerElement.pause === 'function') {
            dom.playerElement.pause();
        }
        session.write('loggedIn', 'Não');
        if (publish) logoutPresentation.publish();
        logoutPresentation.close();
        navigate('/plataforma/login');
    }

    async function logoutAuthoritatively() {
        if (logoutPending || authoritativePresentationEnded) return;
        setAuthoritativeLogoutPending(true);
        try {
            await client.delete('/sessions/current');
            if (authoritativePresentationEnded) return;
            endAuthoritativePresentation({ publish: true });
        } catch {
            if (authoritativePresentationEnded) return;
            setAuthoritativeLogoutPending(false);
            alert(learningPlatformErrorMessage(
                learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
            ));
        }
    }

    function openTopic(options) {
        const selectedTopic = this;
        navigation.selectTopic(selectedTopic, {
            focusHeading: options?.focusHeading !== false
        });
        const topicName = selectedTopic.querySelector('.Tópico-Nome').innerHTML;

        if (!topicName.includes("Teste:") && !topicName.includes("Feedback:")) {
            content.open(selectedTopic);
        } else if (topicName.includes("Teste:")) {
            assessment.open(selectedTopic);
        } else if (topicName.includes("Feedback:")) {
            feedback.open(selectedTopic);
        }
        dom.footer.style.display = "flex";
    }

    function openPerformance(options) {
        performanceView.open({
            focusHeading: options?.focusHeading !== false
        });
    }

    const progress = createStudyProgress({
        alert,
        authoritativeSessionsEnabled,
        client,
        document,
        dom,
        navigation,
        openTopic,
        state
    });
    content = createStudyContent({ configureDownloads, document, dom, loadMedia, progress, state });
    assessment = createStudyAssessment({
        alert,
        authoritativeSessionsEnabled,
        client,
        document,
        dom,
        navigation,
        openTopic,
        state
    });
    certificate = createStudyCertificate({ document, renderCertificate, state });
    performanceView = createStudyPerformance({ certificate, document, dom, navigation, state });
    feedback = createStudyFeedback({
        alert,
        authoritativeSessionsEnabled,
        client,
        clock,
        document,
        dom,
        navigation,
        openPerformance,
        openTopic,
        state
    });

    function hydrate(data, authoritativeSessionStatus) {
        if (authoritativeSessionsEnabled) {
            state.authoritativeSessionStatus = authoritativeSessionStatus;
        }
        state.fullName = data.Usuário_NomeCompleto;
        state.firstName = data.Usuário_PrimeiroNome;
        state.email = data.Usuário_Email;
        state.accessDeadline = data.Usuário_PrazoAcesso;
        state.loginStatus = data.Usuário_Status_Login;
        state.completedTopics = parseFloat(data.Usuário_Formação_NúmeroTópicosConcluídos);

        const moduleGrades = [];
        for (let moduleNumber = 1; moduleNumber <= 10; moduleNumber += 1) {
            moduleGrades[moduleNumber] = data[`Usuário_Formação_NotaMódulo${moduleNumber}`];
        }
        state.moduleGrades = moduleGrades;
        state.accumulatedGrade = data.Usuário_Formação_NotaAcumulado;
        state.certificateId = data.Usuário_Formação_CertificadoID;

        document.getElementById('Container-Seções').style.display = 'flex';
        if (authoritativeSessionsEnabled) {
            logoutControl = document.getElementById("Botão-Sair");
            logoutControl.addEventListener("click", logoutAuthoritatively);
        } else {
            document.getElementById("Botão-Sair").addEventListener("click", () => {
                session.write('loggedIn', 'Não');
                navigate('/plataforma/login');
            });
        }
        document.getElementById('Formação-Prazo-Acesso').textContent =
            "Acesso Expira: " + state.accessDeadline;
        navigation.updateMetrics(state.completedTopics);

        const closedTopics = navigation.prepareTopics(state.completedTopics);
        navigation.bindNavigation(openTopic);
        document.getElementById('Formação-Botão-Desempenho-e-Certificado').addEventListener(
            'click',
            openPerformance
        );
        document.getElementById('Usuário-Nome').innerHTML = state.fullName;
        sessionTimer.start(authoritativeSessionStatus);
        navigation.openInitialTopic(closedTopics, openTopic, openPerformance);
    }

    function presentRefreshFailure(error) {
        const failure = normalizeLearningPlatformError(
            error,
            learningPlatformErrorOperations.REFRESH
        );
        if (failure.kind !== learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE) {
            alert(learningPlatformErrorMessage(
                learningPlatformErrorPresentations.STUDY_REFRESH_GENERIC
            ));
        } else {
            alert(learningPlatformErrorMessage(
                learningPlatformErrorPresentations.STUDY_REFRESH_PLATFORM_DATA
            ));
        }
    }

    function readStudySessionStatus(data) {
        const status = readAuthoritativeSessionStatus(data);
        if (
            status.authenticationPhase !== AUTHENTICATION_PHASES.AUTHENTICATED ||
            !hasSessionNextOperation(status, SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING)
        ) {
            throw new TypeError('Authoritative session does not permit protected learning');
        }
        return status;
    }

    function loadAuthoritativeStudy() {
        let refreshData;
        client.postJson('/refresh', {}).then(data => {
            if (authoritativePresentationEnded) return undefined;
            refreshData = data;
            return client.getJson('/sessions/current');
        }).then(data => {
            if (authoritativePresentationEnded || data === undefined) return;
            const status = readStudySessionStatus(data);
            hydrate(refreshData, status);
            session.write('loggedIn', 'Sim');
        }).catch(error => {
            if (authoritativePresentationEnded) return;
            const failure = normalizeLearningPlatformError(
                error,
                learningPlatformErrorOperations.REFRESH
            );
            if (failure.status === 401) {
                session.write('loggedIn', 'Não');
                navigate('/plataforma/login');
                return;
            }
            presentRefreshFailure(failure);
        });
    }

    function loadLegacyStudy() {
        state.verifiedIndex = session.read('verifiedIndex');
        client.postJson('/refresh', {
            IndexVerificado: state.verifiedIndex
        }).then(hydrate).catch(presentRefreshFailure);
    }

    function onLoad() {
        session.write('deviceWarningOrigin', 'Não');

        if (browserAdmission.outcome !== browserAdmissionOutcomes.CANDIDATE) {
            replaceNavigation('/plataforma/aviso-dispositivo-navegador');
        } else if (replaceWithViewportWarning({ replaceNavigation, window })) {
            return;
        } else if (!authoritativeSessionsEnabled && session.read('loggedIn') !== 'Sim') {
            navigate('/plataforma/login');
        } else {
            const handleViewportWidth = () => replaceWithViewportWarning({
                replaceNavigation,
                window
            });
            window.addEventListener('resize', handleViewportWidth);

            if (authoritativeSessionsEnabled) {
                logoutPresentation.listen(() => {
                    endAuthoritativePresentation({ publish: false });
                });
                if (!authoritativePresentationEnded) loadAuthoritativeStudy();
            } else {
                loadLegacyStudy();
            }
        }
    }

    function install() {
        window.addEventListener('load', onLoad);
    }

    return {
        hydrate,
        install,
        observeState: stateContainer.observe,
        onLoad,
        completeTopic: progress.completeTopic,
        openModule: navigation.openModule,
        openPerformance,
        openTopic,
        snapshotState: stateContainer.snapshot,
        snapshotLogoutPresentation: () => logoutPresentation && logoutPresentation.snapshot(),
        state
    };
}
