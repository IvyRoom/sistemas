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
            nextTopic.querySelector('.Símbolo-Check-Fechado').classList.replace(
                "Símbolo-Check-Fechado",
                "Símbolo-Check-Aberto"
            );
            openTopic.call(nextTopic);
            nextTopic.addEventListener('click', openTopic);
        }).catch(error => {
            dom.footer.innerHTML = '<div id="Botão-Completar-e-Continuar">Completar e Continuar →</div>';
            document.body.style.cursor = 'default';
            state.completedTopics -= 1;

            if (error.error !== 'Erro_008') {
                alert("Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.");
            } else {
                alert("Erro_008: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.");
            }
        });
    }

    return { completeTopic, openTopic };
}
