export function createStudyDom(document, afterTopicCollectionCapture = () => {}) {
    const arrows = document.querySelectorAll("[id^='Seta-Auxiliar-Módulo-']");
    const moduleTopicContainers = document.querySelectorAll("[id^='Container-Externo-Tópicos-Módulo-']");
    const completedTopics = document.getElementsByClassName("Container-Tópico-Concluído");
    const openTopics = document.getElementsByClassName("Container-Tópico-Aberto");
    afterTopicCollectionCapture();

    return {
        arrows,
        moduleTopicContainers,
        completedTopics,
        openTopics,
        content: document.getElementById("Container-Externo-Conteúdo"),
        playerContainer: document.getElementById('Container-Externo-Shaka-Player'),
        playerElement: document.getElementById('Container-Interno-Shaka-Player'),
        assessments: document.getElementById("Container-Externo-Testes"),
        assessmentInstructions: document.getElementById("Container-Externo-Orientações-Teste"),
        assessmentReview: document.getElementById("Container-Externo-Aviso-Revisão"),
        assessmentGrade: document.getElementById("Container-Externo-Nota-e-Percentil"),
        assessmentLegend: document.getElementById("Container-Externo-Legenda-Respostas"),
        moduleQuestions: document.querySelectorAll("[id^='Container-Questões-Módulo-']"),
        feedback: document.getElementById("Container-Externo-Feedbacks"),
        performance: document.getElementById('Container-Externo-Desempenho-e-Certificado'),
        footer: document.getElementById('Faixa-Inferior')
    };
}
