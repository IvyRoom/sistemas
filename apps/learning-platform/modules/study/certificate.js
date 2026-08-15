import { STUDY_TOPIC_COUNT } from './state.js';

export function createStudyCertificate({ document, dom, navigation, renderCertificate, state }) {
    function open() {
        navigation.closeModules();
        dom.playerElement.pause();
        document.getElementById('Seção-Navegação').scrollTop = 0;
        document.getElementById("Nome-Tópico").innerHTML = "<b>Desempenho e Certificado</b>";

        dom.content.style.display = "none";
        dom.assessments.style.display = "none";
        dom.feedback.style.display = "none";
        dom.performance.style.display = "block";

        for (let moduleNumber = 1; moduleNumber <= 10; moduleNumber += 1) {
            const grade = state.moduleGrades[moduleNumber];
            document.getElementById(`Barra-Nota-Teste-Módulo-${moduleNumber}`).style.height = grade * 400 + "px";
            document.getElementById(`Barra-Nota-Teste-Módulo-${moduleNumber}`).style.backgroundColor = gradeColor(grade);
            document.getElementById(`Percentual-Nota-Teste-Módulo-${moduleNumber}`).innerHTML =
                (grade * 100).toFixed(1) + "%";
        }

        document.getElementById("Barra-Nota-Testes-Acumulado").style.height = state.accumulatedGrade * 400 + "px";
        document.getElementById("Barra-Nota-Testes-Acumulado").style.backgroundColor = gradeColor(state.accumulatedGrade);
        document.getElementById("Percentual-Nota-Testes-Acumulado").innerHTML =
            (state.accumulatedGrade * 100).toFixed(1) + "%";

        const certificateStatus = document.getElementById('Status-Certificado');
        const certificateInstructions = document.getElementById('Container-Interno-Orientações-Certificado');
        if (state.completedTopics === STUDY_TOPIC_COUNT) {
            if (state.accumulatedGrade < 0.7) {
                certificateStatus.innerHTML = "<b>Status:</b> Inelegível à certificação.";
            } else if (state.accumulatedGrade < 0.95) {
                certificateStatus.innerHTML = "<b>Status:</b> Aprovado";
            } else {
                certificateStatus.innerHTML = "<b>Status:</b> Aprovado com Honra";
            }
            if (state.accumulatedGrade >= 0.7) {
                certificateInstructions.style.display = "block";
            }
        }

        document.getElementById('Botão-Download-Certificado-Impresso').onclick = event => {
            renderCertificate(event, state);
        };
        dom.footer.style.display = "none";
    }

    function gradeColor(grade) {
        const color = grade <= 0.7
            ? [
                164 + (212 - 164) * (grade / 0.7),
                16 + (187 - 16) * (grade / 0.7),
                52 + (28 - 52) * (grade / 0.7)
            ]
            : [
                212 + (10 - 212) * ((grade - 0.7) / 0.3),
                187 + (152 - 187) * ((grade - 0.7) / 0.3),
                28 + (62 - 28) * ((grade - 0.7) / 0.3)
            ];
        return `rgb(${color.map(Math.round).join(",")})`;
    }

    return { open };
}
