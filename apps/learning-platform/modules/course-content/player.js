export function createStudyPlayer({
    alert,
    configureDrm,
    document,
    dom,
    getShaka,
    isDrmEnabled,
    loadSelectedMedia,
    state
}) {
    let currentState = state;
    let player;
    let playerUi;
    let playerLoaded = false;

    function loadMedia({ completeTopic, openTopic, selectedTopic }) {
        const shaka = getShaka();
        const drmEnabled = isDrmEnabled(currentState.fullName);
        const videoName = selectedTopic.getAttribute('name');

        async function initializePlayer() {
            if (playerLoaded === false) {
                player = new shaka.Player();
                await player.attach(dom.playerElement);
                playerUi = new shaka.ui.Overlay(player, dom.playerContainer, dom.playerElement);
                playerUi.configure({
                    controlPanelElements: [
                        'play_pause',
                        'time_and_duration',
                        'spacer',
                        'mute',
                        'volume',
                        'quality',
                        'playback_rate',
                        'fullscreen'
                    ],
                    overflowMenuButtons: []
                });
                if (drmEnabled === true) configureDrm(player);
                playerLoaded = true;
            }
            await loadSelectedMedia(player, {
                drmEnabled,
                moduleName: currentState.openModule,
                videoName
            });
            dom.playerElement.play();
        }

        shaka.polyfill.installAll();
        if (shaka.Player.isBrowserSupported()) {
            initializePlayer();
        } else {
            alert('Navegador não suportado.');
        }

        if (selectedTopic.className === "Container-Tópico-Aberto") {
            dom.playerElement.onended = () => { completeTopic(selectedTopic); };
        } else {
            dom.playerElement.onended = () => {
                openTopic.call(document.querySelector(
                    '[data-index="' + (parseInt(selectedTopic.getAttribute('data-index'), 10) + 1) + '"]'
                ));
            };
        }
    }

    return {
        loadMedia,
        setState(stateValue) {
            currentState = stateValue;
        },
        snapshot() {
            return { player, playerLoaded, playerUi };
        }
    };
}
