import {
    BotãoTelaCheiaVídeoDepoimento1,
    BotãoTelaCheiaVídeoDepoimento2,
    BotãoTelaCheiaVídeoDepoimento3,
    BotãoTelaCheiaVídeoDepoimento4,
    BotãoTelaCheiaVídeoDepoimento5,
    ContainerExternoVídeoPrincipal,
    ContainerInternoVídeoPrincipal,
    VídeoDepoimento1,
    VídeoDepoimento2,
    VídeoDepoimento3,
    VídeoDepoimento4,
    VídeoDepoimento5,
    VídeoPrincipal
} from './elements.js';

/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*/// Retira os botões de girar os vídeos se o usuário não estiver usando o Instagram In-App Browser. //*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

export var userAgent = navigator.userAgent;

if (userAgent.indexOf('Instagram') === -1) {

    BotãoTelaCheiaVídeoDepoimento1.classList.add('is-hidden');
    VídeoDepoimento1.classList.add('has-hidden-rotation-control');

    BotãoTelaCheiaVídeoDepoimento2.classList.add('is-hidden');
    VídeoDepoimento2.classList.add('has-hidden-rotation-control');

    BotãoTelaCheiaVídeoDepoimento3.classList.add('is-hidden');
    VídeoDepoimento3.classList.add('has-hidden-rotation-control');

    BotãoTelaCheiaVídeoDepoimento4.classList.add('is-hidden');
    VídeoDepoimento4.classList.add('has-hidden-rotation-control');

    BotãoTelaCheiaVídeoDepoimento5.classList.add('is-hidden');
    VídeoDepoimento5.classList.add('has-hidden-rotation-control');

}

/*/////////////////////////////////////////////////////////////////////////////////////////////*/
/*//// Carrega o Vídeo-Principal somente ao visualizar o Container-Externo-Vídeo-Principal ////*/
/*/////////////////////////////////////////////////////////////////////////////////////////////*/

function handleIntersection(entries, observer) {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            ContainerInternoVídeoPrincipal.setAttribute("data-shaka-player-container", "");
            VídeoPrincipal.setAttribute("data-shaka-player", "");
            VídeoPrincipal.setAttribute("poster", "./landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg");
            VídeoPrincipal.setAttribute("src", "https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/video-principal/master.m3u8");

            const player = new shaka.Player(VídeoPrincipal);
            const ui = new shaka.ui.Overlay(player, ContainerInternoVídeoPrincipal, VídeoPrincipal);

            ui.configure({
                overflowMenuButtons: ['quality', 'playback_rate']
            });

            player.load(VídeoPrincipal.getAttribute('src'));

            observer.unobserve(entry.target);
        }

    });
}

const observer = new IntersectionObserver(handleIntersection);
observer.observe(ContainerExternoVídeoPrincipal);
