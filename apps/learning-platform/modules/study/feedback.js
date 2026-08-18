export function createStudyFeedback({
    alert,
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
            dom.footer.innerHTML = '<div id="Botão-Enviar-Feedback">Enviar Feedback</div>';
            dom.footer.onclick = event => {
                if (event.target.closest('#Botão-Enviar-Feedback')) {
                    submit(selectedTopic);
                }
            };
        } else {
            dom.footer.innerHTML = '<div id="Aviso-Feedback-Concluído">Feedback Concluído</div>';
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
            IndexVerificado: state.verifiedIndex,
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
            dom.footer.innerHTML = '<div id="Botão-Enviar-Feedback">Enviar Feedback</div>';
            document.body.style.cursor = 'default';
            state.completedTopics -= 1;

            if (error.error !== 'Erro_008' && error.error !== 'Erro_009') {
                alert("Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.");
            } else if (error.error === 'Erro_008') {
                alert("Erro_008: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.");
            } else if (error.error === 'Erro_009') {
                alert("Erro_009: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.");
            }
        });
    }

    return { open };
}
