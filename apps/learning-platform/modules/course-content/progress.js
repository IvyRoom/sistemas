import {
    learningPlatformErrorKinds,
    learningPlatformErrorOperations,
    normalizeLearningPlatformError
} from '../error-adapter.js';
import {
    learningPlatformErrorMessage,
    learningPlatformErrorPresentations
} from '../error-presentation.js';

export function createStudyProgress({ alert, client, document, dom, navigation, openTopic, state }) {
    function completeTopic(selectedTopic) {
        dom.footer.innerHTML = '';
        document.body.style.cursor = 'wait';
        state.completedTopics += 1;

        client.postJson('/updates', {
            TipoAtualização: 'NúmeroTópicosConcluídos',
            IndexVerificado: state.verifiedIndex,
            NúmeroTópicosConcluídos: state.completedTopics,
            NúmeroMódulo: 'n/a',
            NotaTeste: 'n/a'
        }).then(() => {
            document.body.style.cursor = 'default';
            navigation.updateMetrics(state.completedTopics);

            selectedTopic.className = "Container-Tópico-Concluído";
            selectedTopic.querySelector('.Símbolo-Check-Aberto').innerHTML = "✔";
            selectedTopic.querySelector('.Símbolo-Check-Aberto').classList.replace(
                "Símbolo-Check-Aberto",
                "Símbolo-Check-Concluído"
            );

            const nextTopic = document.querySelector(
                '[data-index="' + (parseInt(selectedTopic.getAttribute('data-index'), 10) + 1) + '"]'
            );
            nextTopic.className = "Container-Tópico-Aberto";
            nextTopic.disabled = false;
            nextTopic.querySelector('.Símbolo-Check-Fechado').classList.replace(
                "Símbolo-Check-Fechado",
                "Símbolo-Check-Aberto"
            );
            openTopic.call(nextTopic);
            nextTopic.addEventListener('click', openTopic);
        }).catch(error => {
            dom.footer.innerHTML = '<button type="button" id="Botão-Completar-e-Continuar">Completar e Continuar →</button>';
            document.getElementById('Botão-Completar-e-Continuar').focus();
            document.body.style.cursor = 'default';
            state.completedTopics -= 1;

            const failure = normalizeLearningPlatformError(
                error,
                learningPlatformErrorOperations.PROGRESS_UPDATE
            );
            if (failure.kind !== learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE) {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
                ));
            } else {
                alert(learningPlatformErrorMessage(
                    learningPlatformErrorPresentations.PLATFORM_DATA_WRITE
                ));
            }
        });
    }

    return { completeTopic, openTopic };
}
