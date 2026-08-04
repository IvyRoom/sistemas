import {
    BotãoTelaCheiaVídeoDepoimento1,
    BotãoTelaCheiaVídeoDepoimento2,
    BotãoTelaCheiaVídeoDepoimento3,
    BotãoTelaCheiaVídeoDepoimento4,
    BotãoTelaCheiaVídeoDepoimento5,
    ContainerVídeoDepoimento1,
    ContainerVídeoDepoimento2,
    ContainerVídeoDepoimento3,
    ContainerVídeoDepoimento4,
    ContainerVídeoDepoimento5,
    TextoTelaCheiaVídeoDepoimento1,
    TextoTelaCheiaVídeoDepoimento2,
    TextoTelaCheiaVídeoDepoimento3,
    TextoTelaCheiaVídeoDepoimento4,
    TextoTelaCheiaVídeoDepoimento5,
    VídeoDepoimento1,
    VídeoDepoimento2,
    VídeoDepoimento3,
    VídeoDepoimento4,
    VídeoDepoimento5
} from './elements.js';
import { preferredScrollBehavior } from './scroll-behavior.js';
import { ControlaPosição_ContainerBotãoPrincipal } from './scroll-state.js';

/*///////////////////////// Botão-Tela-Cheia-Vídeo-Depoimento-1 //////////////////////////*/

BotãoTelaCheiaVídeoDepoimento1.addEventListener("click", function(event) {

    if (!ContainerVídeoDepoimento1.classList.contains('is-rotated')) {

        ContainerVídeoDepoimento1.classList.remove('is-restored');
        ContainerVídeoDepoimento1.classList.add('is-rotated');

        TextoTelaCheiaVídeoDepoimento1.innerHTML = 'Tela Padrão';
        BotãoTelaCheiaVídeoDepoimento1.setAttribute("aria-pressed", "true");

        VídeoDepoimento1.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    } else {

        ContainerVídeoDepoimento1.classList.remove('is-rotated');
        ContainerVídeoDepoimento1.classList.add('is-restored');

        TextoTelaCheiaVídeoDepoimento1.innerHTML = 'Tela Cheia';
        BotãoTelaCheiaVídeoDepoimento1.setAttribute("aria-pressed", "false");

        VídeoDepoimento1.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    }

})

/*///////////////////////// Botão-Tela-Cheia-Vídeo-Depoimento-2 //////////////////////////*/

BotãoTelaCheiaVídeoDepoimento2.addEventListener("click", function(event) {

    if (!ContainerVídeoDepoimento2.classList.contains('is-rotated')) {

        ContainerVídeoDepoimento2.classList.remove('is-restored');
        ContainerVídeoDepoimento2.classList.add('is-rotated');

        TextoTelaCheiaVídeoDepoimento2.innerHTML = 'Tela Padrão';
        BotãoTelaCheiaVídeoDepoimento2.setAttribute("aria-pressed", "true");

        VídeoDepoimento2.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    } else {

        ContainerVídeoDepoimento2.classList.remove('is-rotated');
        ContainerVídeoDepoimento2.classList.add('is-restored');

        TextoTelaCheiaVídeoDepoimento2.innerHTML = 'Tela Cheia';
        BotãoTelaCheiaVídeoDepoimento2.setAttribute("aria-pressed", "false");

        VídeoDepoimento2.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    }

})

/*///////////////////////// Botão-Tela-Cheia-Vídeo-Depoimento-3 //////////////////////////*/

BotãoTelaCheiaVídeoDepoimento3.addEventListener("click", function(event) {

    if (!ContainerVídeoDepoimento3.classList.contains('is-rotated')) {

        ContainerVídeoDepoimento3.classList.remove('is-restored');
        ContainerVídeoDepoimento3.classList.add('is-rotated');

        TextoTelaCheiaVídeoDepoimento3.innerHTML = 'Tela Padrão';
        BotãoTelaCheiaVídeoDepoimento3.setAttribute("aria-pressed", "true");

        VídeoDepoimento3.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    } else {

        ContainerVídeoDepoimento3.classList.remove('is-rotated');
        ContainerVídeoDepoimento3.classList.add('is-restored');

        TextoTelaCheiaVídeoDepoimento3.innerHTML = 'Tela Cheia';
        BotãoTelaCheiaVídeoDepoimento3.setAttribute("aria-pressed", "false");

        VídeoDepoimento3.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    }

})

/*///////////////////////// Botão-Tela-Cheia-Vídeo-Depoimento-4 //////////////////////////*/

BotãoTelaCheiaVídeoDepoimento4.addEventListener("click", function(event) {

    if (!ContainerVídeoDepoimento4.classList.contains('is-rotated')) {

        ContainerVídeoDepoimento4.classList.remove('is-restored');
        ContainerVídeoDepoimento4.classList.add('is-rotated');

        TextoTelaCheiaVídeoDepoimento4.innerHTML = 'Tela Padrão';
        BotãoTelaCheiaVídeoDepoimento4.setAttribute("aria-pressed", "true");

        VídeoDepoimento4.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    } else {

        ContainerVídeoDepoimento4.classList.remove('is-rotated');
        ContainerVídeoDepoimento4.classList.add('is-restored');

        TextoTelaCheiaVídeoDepoimento4.innerHTML = 'Tela Cheia';
        BotãoTelaCheiaVídeoDepoimento4.setAttribute("aria-pressed", "false");

        VídeoDepoimento4.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    }

})

/*///////////////////////// Botão-Tela-Cheia-Vídeo-Depoimento-5 //////////////////////////*/

BotãoTelaCheiaVídeoDepoimento5.addEventListener("click", function(event) {

    if (!ContainerVídeoDepoimento5.classList.contains('is-rotated')) {

        ContainerVídeoDepoimento5.classList.remove('is-restored');
        ContainerVídeoDepoimento5.classList.add('is-rotated');

        TextoTelaCheiaVídeoDepoimento5.innerHTML = 'Tela Padrão';
        BotãoTelaCheiaVídeoDepoimento5.setAttribute("aria-pressed", "true");

        VídeoDepoimento5.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    } else {

        ContainerVídeoDepoimento5.classList.remove('is-rotated');
        ContainerVídeoDepoimento5.classList.add('is-restored');

        TextoTelaCheiaVídeoDepoimento5.innerHTML = 'Tela Cheia';
        BotãoTelaCheiaVídeoDepoimento5.setAttribute("aria-pressed", "false");

        VídeoDepoimento5.scrollIntoView({behavior: preferredScrollBehavior()});

        ControlaPosição_ContainerBotãoPrincipal();

    }

})
