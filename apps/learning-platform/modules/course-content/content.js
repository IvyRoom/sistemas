export function createStudyContent({ configureDownloads, document, dom, loadMedia, progress, state }) {
    function open(selectedTopic) {
        dom.content.style.display = "flex";
        dom.assessments.style.display = "none";
        dom.feedback.style.display = "none";
        dom.performance.style.display = "none";
        dom.content.scrollTo(0, 0);

        const videoName = selectedTopic.getAttribute('name');
        loadMedia({
            completeTopic: progress.completeTopic,
            openTopic: progress.openTopic,
            selectedTopic,
            videoName
        });
        configureDownloads({ moduleName: state.openModule, videoName });

        if (selectedTopic.className === "Container-Tópico-Aberto") {
            dom.footer.innerHTML = '<button type="button" id="Botão-Completar-e-Continuar">Completar e Continuar →</button>';
            dom.footer.onclick = event => {
                if (event.target.closest('#Botão-Completar-e-Continuar')) {
                    progress.completeTopic(selectedTopic);
                }
            };
        } else {
            dom.footer.innerHTML = '<p id="Aviso-Tópico-Concluído">Tópico Concluído</p>';
        }
    }

    return { open };
}
