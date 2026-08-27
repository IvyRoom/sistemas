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
    redirectToDeviceWarning
} from '../lifecycle.js';
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
    client,
    clock,
    configureDownloads,
    document,
    dom,
    loadMedia,
    navigate,
    navigator,
    renderCertificate,
    session,
    timers,
    window
}) {
    const browserAdmission = classifyBrowserAdmission({
        document,
        entry: browserAdmissionEntries.STUDY,
        navigator,
        window
    });
    const stateContainer = createStudyState();
    const { state } = stateContainer;
    const navigation = createStudyNavigation({ document, dom, state });
    const sessionTimer = createStudySessionTimer({ clock, document, navigate, session, timers });

    let content;
    let assessment;
    let feedback;
    let certificate;
    let performanceView;

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
        client,
        clock,
        document,
        dom,
        navigation,
        openPerformance,
        openTopic,
        state
    });

    function hydrate(data) {
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
        document.getElementById("Botão-Sair").addEventListener("click", () => {
            session.write('loggedIn', 'Não');
            navigate('/plataforma/login');
        });
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
        sessionTimer.start();
        navigation.openInitialTopic(closedTopics, openTopic, openPerformance);
    }

    function onLoad() {
        session.write('deviceWarningOrigin', 'Não');

        if (browserAdmission.outcome !== browserAdmissionOutcomes.CANDIDATE) {
            navigate('/plataforma/aviso-navegador');
        } else if (session.read('loggedIn') !== 'Sim') {
            navigate('/plataforma/login');
        } else {
            const handleDeviceWidth = () => redirectToDeviceWarning({ window, navigate });
            handleDeviceWidth();
            window.addEventListener('resize', handleDeviceWidth);

            state.verifiedIndex = session.read('verifiedIndex');
            client.postJson('/refresh', {
                IndexVerificado: state.verifiedIndex
            }).then(hydrate).catch(error => {
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
            });
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
        state
    };
}
