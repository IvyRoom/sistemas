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
            dom.footer.innerHTML = '<div id="Botão-Completar-e-Continuar">Completar e Continuar →</div>';
            dom.footer.onclick = event => {
                if (event.target.closest('#Botão-Completar-e-Continuar')) {
                    progress.completeTopic(selectedTopic);
                }
            };
        } else {
            dom.footer.innerHTML = '<div id="Aviso-Tópico-Concluído">Tópico Concluído</div>';
        }
    }

    return { open };
}
