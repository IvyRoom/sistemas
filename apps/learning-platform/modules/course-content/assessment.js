import {
    learningPlatformErrorKinds,
    learningPlatformErrorOperations,
    normalizeLearningPlatformError
} from '../error-adapter.js';
import {
    learningPlatformErrorMessage,
    learningPlatformErrorPresentations
} from '../error-presentation.js';

export function createStudyAssessment({
    alert,
    client,
    document,
    dom,
    navigation,
    openTopic,
    state
}) {
    function open(selectedTopic) {
        dom.playerElement.pause();
        dom.content.style.display = "none";
        dom.assessments.style.display = "block";
        dom.assessmentInstructions.style.display = "block";
        dom.assessmentReview.style.display = 'none';
        dom.assessmentGrade.style.display = 'none';
        dom.assessmentLegend.style.display = 'none';
        dom.assessments.scrollTo(0, 0);

        const moduleNumber = parseInt(selectedTopic.getAttribute("name").match(/\d+/)[0], 10);
        dom.moduleQuestions.forEach((moduleQuestions, index) => {
            moduleQuestions.style.display = index === moduleNumber - 1 ? "block" : "none";
        });
        dom.feedback.style.display = "none";
        dom.performance.style.display = "none";

        if (selectedTopic.className === "Container-Tópico-Aberto") {
            const allAnswers = document.querySelectorAll(
                'input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"], input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]'
            );
            allAnswers.forEach(input => {
                input.checked = false;
                input.disabled = false;
                input.parentElement.style.backgroundColor = '#ffffff';
            });

            dom.footer.innerHTML = '<button type="button" id="Botão-Enviar-Respostas">Enviar Respostas</button>';
            dom.footer.onclick = event => {
                if (event.target.closest('#Botão-Enviar-Respostas')) {
                    dom.footer.innerHTML = '<button type="button" id="Botão-Confirmar-Envio-Respostas">Confirmar Envio</button><button type="button" id="Botão-Voltar-Respostas">Voltar</button>';
                    document.getElementById('Botão-Confirmar-Envio-Respostas').focus();
                } else if (event.target.closest('#Botão-Voltar-Respostas')) {
                    dom.footer.innerHTML = '<button type="button" id="Botão-Enviar-Respostas">Enviar Respostas</button>';
                    document.getElementById('Botão-Enviar-Respostas').focus();
                } else if (event.target.closest('#Botão-Confirmar-Envio-Respostas')) {
                    submit(selectedTopic, moduleNumber, allAnswers);
                } else if (event.target.closest('#Botão-Continuar')) {
                    const nextTopic = document.querySelector(
                        '[data-index="' + (parseInt(selectedTopic.getAttribute('data-index'), 10) + 1) + '"]'
                    );
                    openTopic.call(nextTopic);
                }
            };
        } else {
            const allAnswers = document.querySelectorAll(
                'input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"], input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]'
            );
            allAnswers.forEach(input => {
                input.checked = false;
                input.disabled = true;
                input.parentElement.style.backgroundColor = '#ffffff';
            });
            dom.footer.innerHTML = '<p id="Aviso-Teste-Concluído">Teste Concluído</p>';
        }
    }

    function submit(selectedTopic, moduleNumber, allAnswers) {
        dom.footer.innerHTML = '';
        document.body.style.cursor = 'wait';
        state.completedTopics += 1;

        const selectedCorrect = Array.from(document.querySelectorAll(
            'input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]:checked'
        )).filter(input => input.closest('#Container-Questões-Módulo-' + moduleNumber)).length;
        const selectedIncorrect = Array.from(document.querySelectorAll(
            'input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]:checked'
        )).filter(input => input.closest('#Container-Questões-Módulo-' + moduleNumber)).length;
        const totalCorrect = Array.from(document.querySelectorAll(
            'input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]'
        )).filter(input => input.closest('#Container-Questões-Módulo-' + moduleNumber)).length;
        const score = Math.max(0, (selectedCorrect - selectedIncorrect) / totalCorrect);

        client.postJson('/updates', {
            TipoAtualização: 'NúmeroTópicosConcluídos-e-NotaTeste',
            IndexVerificado: state.verifiedIndex,
            NúmeroTópicosConcluídos: state.completedTopics,
            NúmeroMódulo: moduleNumber,
            NotaTeste: score
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
            nextTopic.addEventListener('click', openTopic);

            dom.assessmentInstructions.style.display = "none";
            dom.assessmentReview.style.display = 'block';
            dom.assessmentGrade.style.display = 'flex';
            dom.assessmentLegend.style.display = 'block';

            const grade = document.getElementById("Nota");
            const percentile = document.getElementById("Percentil");
            const percentileValue = score < 0.6 ? 0 : 1.453125 * Math.pow(score, 2) - 0.523125;
            grade.innerHTML = (score * 100).toFixed(1) + "%";
            percentile.innerHTML = (percentileValue * 100).toFixed(1) + "%";
            grade.style.color = gradeColor(score * 100);
            percentile.style.color = gradeColor(percentileValue * 100);

            allAnswers.forEach(input => { input.disabled = true; });
            document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]:checked')
                .forEach(input => { input.parentElement.style.backgroundColor = '#94fd7f'; });
            document.querySelectorAll('input[query-id="c11aoIurJLm38YTHncm87493KaiowJMca"]:not(:checked)')
                .forEach(input => { input.parentElement.style.backgroundColor = '#d3ffcb'; });
            document.querySelectorAll('input[query-id="Ij73hRG8120Amb85Ff473LCx3Zaor991"]:checked')
                .forEach(input => { input.parentElement.style.backgroundColor = '#fd7f7f'; });

            dom.assessments.scrollTop = 0;
            dom.footer.innerHTML = '<button type="button" id="Botão-Continuar">Continuar →</button>';
            dom.assessmentReview.focus();
            state.moduleGrades[moduleNumber] = score;
            state.accumulatedGrade = state.moduleGrades.reduce((total, value) => total + value, 0) /
                (state.moduleGrades.length - 1);
        }).catch(error => {
            dom.footer.innerHTML = '<button type="button" id="Botão-Enviar-Respostas">Enviar Respostas</button>';
            document.getElementById('Botão-Enviar-Respostas').focus();
            document.body.style.cursor = 'default';
            state.completedTopics -= 1;

            const failure = normalizeLearningPlatformError(
                error,
                learningPlatformErrorOperations.ASSESSMENT_UPDATE
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

    function gradeColor(value) {
        let red;
        let green;
        if (value <= 60) {
            red = Math.round(139 + (200 - 139) * (value / 60));
            green = Math.round((200 - 0) * (value / 60));
        } else {
            red = Math.round(200 - 200 * ((value - 60) / 40));
            green = Math.round(150 - 50 * ((value - 60) / 40));
        }
        return `rgb(${red}, ${green}, 0)`;
    }

    return { open };
}
