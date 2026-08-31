import {
    learningPlatformErrorKinds,
    learningPlatformErrorOperations,
    normalizeLearningPlatformError
} from '../error-adapter.js';
import {
    learningPlatformErrorMessage,
    learningPlatformErrorPresentations
} from '../error-presentation.js';

export function createStudyFeedback({
    alert,
    authoritativeSessionsEnabled = false,
    client,
    clock,
    document,
    dom,
    navigation,
    openPerformance,
    openTopic,
    state
}) {
    function open(selectedTopic) {
        dom.playerElement.pause();
        dom.content.style.display = "none";
        dom.assessments.style.display = "none";
        dom.feedback.style.display = "block";
        dom.performance.style.display = "none";
        dom.feedback.scrollTo(0, 0);

        document.querySelectorAll('.Opções-Feedbacks').forEach(rating => { rating.checked = false; });
        const comments = document.getElementById("Campo-Comentários");
        const commentCount = document.getElementById("Campo-Comentários-Contador-Caracteres");
        comments.value = '';
        commentCount.textContent = "0 / 1000";
        comments.oninput = () => {
            commentCount.textContent = `${comments.value.length} / 1000`;
        };

        if (selectedTopic.className === "Container-Tópico-Aberto") {
            dom.footer.innerHTML = '<button type="button" id="Botão-Enviar-Feedback">Enviar Feedback</button>';
            dom.footer.onclick = event => {
                if (event.target.closest('#Botão-Enviar-Feedback')) {
                    submit(selectedTopic);
                }
            };
        } else {
            dom.footer.innerHTML = '<p id="Aviso-Feedback-Concluído">Feedback Concluído</p>';
        }
    }

    function submit(selectedTopic) {
        dom.footer.innerHTML = '';
        document.body.style.cursor = 'wait';
        state.completedTopics += 1;

        const moduleNumber = parseInt(selectedTopic.getAttribute("name").match(/\d+/)[0], 10);
        const filledAt = clock.createDate().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', '');
        const moduleLength = document.querySelector('input[name="Tamanho-Módulo"]:checked')?.getAttribute('query-id');
        const contentQuality = document.querySelector('input[name="Qualidade-Conteúdo"]:checked')?.getAttribute('query-id');
        const platformQuality = document.querySelector('input[name="Qualidade-Plataforma"]:checked')?.getAttribute('query-id');
        const printedMaterialQuality = document.querySelector('input[name="Qualidade-Materiais-Impressos"]:checked')?.getAttribute('query-id');
        const comments = document.getElementById('Campo-Comentários').value;

        client.postJson('/processa-feedback', {
            ...(authoritativeSessionsEnabled ? {} : { IndexVerificado: state.verifiedIndex }),
            NúmeroTópicosConcluídos: state.completedTopics,
            Usuário_NomeCompleto: state.fullName,
            Usuário_Email: state.email,
            Feedback_DataPreenchimento: filledAt,
            NúmeroMódulo: moduleNumber,
            Feedback_TamanhoMódulo: moduleLength,
            Feedback_QualidadeConteúdo: contentQuality,
            Feedback_QualidadePlataforma: platformQuality,
            Feedback_QualidadeMateriaisImpressos: printedMaterialQuality,
            Feedback_Comentários: comments
        }).then(() => {
            document.body.style.cursor = 'default';
            navigation.updateMetrics(state.completedTopics);

            selectedTopic.className = "Container-Tópico-Concluído";
            selectedTopic.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
            selectedTopic.querySelector('.Símbolo-Check-Aberto').classList.replace(
                "Símbolo-Check-Aberto",
                "Símbolo-Check-Concluído"
            );

            if (selectedTopic.querySelector('.Tópico-Nome').innerHTML !== "Feedback: Módulo 10") {
                const nextTopic = document.querySelector(
                    '[data-index="' + (parseInt(selectedTopic.getAttribute('data-index'), 10) + 1) + '"]'
                );
                nextTopic.className = "Container-Tópico-Aberto";
                nextTopic.disabled = false;
                nextTopic.querySelector('.Símbolo-Check-Fechado').classList.replace(
                    "Símbolo-Check-Fechado",
                    "Símbolo-Check-Aberto"
                );
                nextTopic.addEventListener('click', openTopic);
                navigation.openModule(parseInt(nextTopic.parentElement.id.split('-').pop(), 10) - 1);
                openTopic.call(nextTopic);
            } else {
                openPerformance();
            }
        }).catch(error => {
            dom.footer.innerHTML = '<button type="button" id="Botão-Enviar-Feedback">Enviar Feedback</button>';
            document.getElementById('Botão-Enviar-Feedback').focus();
            document.body.style.cursor = 'default';
            state.completedTopics -= 1;

            const failure = normalizeLearningPlatformError(
                error,
                learningPlatformErrorOperations.FEEDBACK
            );
            if (
                failure.kind !== learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE &&
                failure.kind !== learningPlatformErrorKinds.FEEDBACK_APPEND_FAILURE
            ) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
                ));
            } else if (failure.kind === learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.PLATFORM_DATA_WRITE
                ));
            } else if (failure.kind === learningPlatformErrorKinds.FEEDBACK_APPEND_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.FEEDBACK_APPEND
                ));
            }
        });
    }

    return { open };
}
