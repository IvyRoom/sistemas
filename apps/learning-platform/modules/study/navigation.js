import { STUDY_MODULE_TOPIC_COUNTS, STUDY_TOPIC_COUNT } from './state.js';

export function createStudyNavigation({ document, dom, state }) {
    function updateMetrics(completedTopics) {
        const totalPercentage = (completedTopics / STUDY_TOPIC_COUNT) * 100;

        document.getElementById('Formação-Régua-Avanço').style.width = totalPercentage + "%";
        document.getElementById('Formação-Percentual-Concluído').innerHTML = totalPercentage.toFixed(1) + "% concluído";

        let accumulatedTopics = 0;
        STUDY_MODULE_TOPIC_COUNTS.forEach((moduleTopicCount, moduleIndex) => {
            const moduleStart = accumulatedTopics;
            const moduleEnd = accumulatedTopics + moduleTopicCount;
            let modulePercentage;

            if (completedTopics <= moduleStart) {
                modulePercentage = 0;
            } else if (completedTopics >= moduleEnd) {
                modulePercentage = 100;
            } else {
                modulePercentage = ((completedTopics - moduleStart) / moduleTopicCount) * 100;
            }

            document.getElementById(`Módulo-${moduleIndex + 1}-Anel-Avanço-Progresso`).style.strokeDashoffset =
                (2.5 - modulePercentage / 50) * Math.PI * 12;
            document.getElementById(`Fração-Avanço-Módulo-${moduleIndex + 1}`).innerHTML =
                `${Math.round(modulePercentage * moduleTopicCount / 100)}/${moduleTopicCount}`;
            accumulatedTopics = moduleEnd;
        });
    }

    function openModule(activeModuleIndex) {
        dom.moduleTopicContainers.forEach((moduleTopicContainer, moduleIndex) => {
            if (moduleIndex === activeModuleIndex) {
                state.openModule = `Módulo ${activeModuleIndex + 1}`;
                moduleTopicContainer.style.display = moduleTopicContainer.style.display === "block" ? "none" : "block";
                dom.arrows[moduleIndex].innerHTML = moduleTopicContainer.style.display === "block"
                    ? '<polygon points="0,6 7,0 14,6 13,6 7,1 1,6"/>'
                    : '<polygon points="0,0 7,6 14,0 13,0 7,5 1,0"/>';
            } else {
                moduleTopicContainer.style.display = "none";
                dom.arrows[moduleIndex].innerHTML = '<polygon points="0,0 7,6 14,0 13,0 7,5 1,0"/>';
            }
        });
    }

    function prepareTopics(completedTopics) {
        const closedTopics = Array.from(document.getElementsByClassName("Container-Tópico-Fechado"));
        closedTopics.sort((first, second) =>
            parseInt(first.getAttribute('data-index')) - parseInt(second.getAttribute('data-index'))
        );

        for (let index = 0; index < completedTopics; index += 1) {
            closedTopics[index].className = "Container-Tópico-Concluído";
            closedTopics[index].querySelector('.Símbolo-Check-Fechado').innerHTML = "✔";
            closedTopics[index].querySelector('.Símbolo-Check-Fechado').className = "Símbolo-Check-Concluído";
        }

        closedTopics[completedTopics] && (closedTopics[completedTopics].className = "Container-Tópico-Aberto");
        closedTopics[completedTopics] &&
            (closedTopics[completedTopics].querySelector('.Símbolo-Check-Fechado').className = "Símbolo-Check-Aberto");
        return closedTopics;
    }

    function bindNavigation(openTopic) {
        document.querySelectorAll("[id^='Container-Módulo-']").forEach((moduleContainer, moduleIndex) => {
            moduleContainer.addEventListener('click', () => openModule(moduleIndex));
        });
        for (let index = 0; index < dom.completedTopics.length; index += 1) {
            dom.completedTopics[index].addEventListener('click', openTopic);
        }
        for (let index = 0; index < dom.openTopics.length; index += 1) {
            dom.openTopics[index].addEventListener('click', openTopic);
        }
    }

    function selectTopic(selectedTopic) {
        for (let index = 0; index < dom.completedTopics.length; index += 1) {
            dom.completedTopics[index].style.backgroundColor = "";
            dom.completedTopics[index].querySelector('.Tópico-Nome').style.fontWeight = "400";
        }
        for (let index = 0; index < dom.openTopics.length; index += 1) {
            dom.openTopics[index].style.backgroundColor = "";
            dom.openTopics[index].querySelector('.Tópico-Nome').style.fontWeight = "400";
        }

        selectedTopic.style.backgroundColor = "#4a0816";
        selectedTopic.querySelector('.Tópico-Nome').style.fontWeight = "500";
        document.getElementById("Nome-Tópico").innerHTML =
            "<b>" + selectedTopic.querySelector('.Tópico-Nome').innerHTML + "</b>";
    }

    function openInitialTopic(closedTopics, openTopic, openPerformance) {
        if (state.completedTopics < STUDY_TOPIC_COUNT) {
            openModule(
                parseInt(
                    closedTopics[state.completedTopics].parentElement.id.split('-').pop(),
                    10
                ) - 1
            );
            openTopic.call(closedTopics[state.completedTopics]);
        } else {
            openPerformance();
        }
    }

    function closeModules() {
        for (let index = 0; index < dom.openTopics.length; index += 1) {
            dom.openTopics[index].style.backgroundColor = "";
            dom.openTopics[index].querySelector('.Tópico-Nome').style.fontWeight = "400";
        }
        dom.moduleTopicContainers.forEach((moduleTopicContainer, moduleIndex) => {
            moduleTopicContainer.style.display = "none";
            dom.arrows[moduleIndex].innerHTML = '<polygon points="0,0 7,6 14,0 13,0 7,5 1,0"/>';
        });
    }

    return {
        bindNavigation,
        closeModules,
        openInitialTopic,
        openModule,
        prepareTopics,
        selectTopic,
        updateMetrics
    };
}
