import { STUDY_TOPIC_COUNT } from './state.js';

export function createStudyCertificate({ document, renderCertificate, state }) {
    function updateEligibility() {
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
    }

    function bindDownload() {
        document.getElementById('Botão-Download-Certificado-Impresso').onclick = event => {
            renderCertificate(event, state);
        };
    }

    return { bindDownload, updateEligibility };
}
