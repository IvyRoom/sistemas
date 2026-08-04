import {
    BotãoInstagramDirect,
    ContainerBotãoPrincipal,
    ContainerExternoVídeoPrincipal,
    EspaçoFinalContainerBotãoPrincipal,
    Seção1,
    Seção2,
    Seção3,
    Seção4,
    SetaFechamentoSeção1,
    SetaFechamentoSeção2,
    SetaFechamentoSeção3,
    SetaFechamentoSeção4,
    SubseçãoCadastro1,
    SubseçãoCadastro2,
    SubseçãoCadastro3,
    SubseçãoCadastro4,
    VídeoPrincipal
} from './elements.js';
import { userAgent } from './media.js';

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*///////////////////// Controla as posições do Itens Dinâmicos ///////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*////////////////////// Controla a posição do Container-Botão-Principal ///////////////////////*/

ContainerBotãoPrincipal.classList.add('is-hidden', 'is-fixed');

export function ControlaPosição_ContainerBotãoPrincipal(){

    if (window.scrollY + window.innerHeight >= Seção1.offsetTop) {

        ContainerBotãoPrincipal.classList.remove('is-hidden');
        EspaçoFinalContainerBotãoPrincipal.style.setProperty('--quote-cta-height', ContainerBotãoPrincipal.offsetHeight + 'px');

        if (window.scrollY + window.innerHeight < Seção1.offsetTop + ContainerBotãoPrincipal.offsetHeight){

            ContainerBotãoPrincipal.classList.remove('is-fixed');
            ContainerBotãoPrincipal.classList.add('is-anchored');
            ContainerBotãoPrincipal.style.setProperty('--quote-cta-top', Seção1.offsetTop + 'px');

        } else {

            ContainerBotãoPrincipal.classList.remove('is-anchored');
            ContainerBotãoPrincipal.classList.add('is-fixed');

        }

    }

}

window.onscroll = function() {

    ControlaPosição_ContainerBotãoPrincipal();

    /*/////////////////////////////////////////////////////////////////////////////////////*/
    /*/////////////////////////////// Pausa o Vídeo Principal /////////////////////////////*/
    /*/////////////////////////////////////////////////////////////////////////////////////*/

    var Posição_ContainerVídeoPrincipal = ContainerExternoVídeoPrincipal.offsetTop;
    var Altura_ContainerVídeoPrincipal = ContainerExternoVídeoPrincipal.offsetHeight;

    if (VídeoPrincipal !== null) {

        if (window.scrollY + window.innerHeight <= Posição_ContainerVídeoPrincipal) {

            if (!VídeoPrincipal.paused) VídeoPrincipal.pause();

        }


        if (window.scrollY >= Posição_ContainerVídeoPrincipal + Altura_ContainerVídeoPrincipal) {

            if (!VídeoPrincipal.paused) VídeoPrincipal.pause();

        }

    }

    /*/////////////////////////////////////////////////////////////////////////////////////*/
    /*////////////// Controla a posição das Setas de Fechamento das Seções ////////////////*/
    /*/////////////////////////////////////////////////////////////////////////////////////*/

    var Posição_Seção1 = Seção1.offsetTop;
    var Posição_Seção2 = Seção2.offsetTop;
    var Posição_Seção3 = Seção3.offsetTop;
    var Posição_Seção4 = Seção4.offsetTop;
    var Posição_EspaçoFinalContainerBotãoPrincipal = EspaçoFinalContainerBotãoPrincipal.offsetTop;

    /* Seção 1 */

    if (window.scrollY <= Posição_Seção1) {

        SetaFechamentoSeção1.classList.add('is-hidden');

    } else if (window.scrollY > Posição_Seção1 && window.scrollY <= (Posição_Seção2 - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro1.classList.remove('has-contained-close-button');
        SubseçãoCadastro1.classList.add('has-fixed-close-button');

        SetaFechamentoSeção1.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        SetaFechamentoSeção1.classList.add('is-fixed-above-quote');
        SetaFechamentoSeção1.style.setProperty('--section-close-bottom', ContainerBotãoPrincipal.offsetHeight + 15 + 'px');

    } else if (window.scrollY > (Posição_Seção2 - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro1.classList.remove('has-fixed-close-button');
        SubseçãoCadastro1.classList.add('has-contained-close-button');

        SetaFechamentoSeção1.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        SetaFechamentoSeção1.classList.add('is-contained');

    }

    /* Seção 2 */

    if (window.scrollY <= Posição_Seção2) {

        SetaFechamentoSeção2.classList.add('is-hidden');

    } else if (window.scrollY > Posição_Seção2 && window.scrollY <= (Posição_Seção3 - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro2.classList.remove('has-contained-close-button');
        SubseçãoCadastro2.classList.add('has-fixed-close-button');

        SetaFechamentoSeção2.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        SetaFechamentoSeção2.classList.add('is-fixed-above-quote');
        SetaFechamentoSeção2.style.setProperty('--section-close-bottom', ContainerBotãoPrincipal.offsetHeight + 15 + 'px');

    } else if (window.scrollY > (Posição_Seção3 - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro2.classList.remove('has-fixed-close-button');
        SubseçãoCadastro2.classList.add('has-contained-close-button');

        SetaFechamentoSeção2.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        SetaFechamentoSeção2.classList.add('is-contained');

    }

    /* Seção 3 */

    if (window.scrollY <= Posição_Seção3) {

        SetaFechamentoSeção3.classList.add('is-hidden');
        BotãoInstagramDirect.classList.add('is-hidden');

    } else if (window.scrollY > Posição_Seção3 && window.scrollY <= (Posição_Seção4 - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro3.classList.remove('has-contained-close-button');
        SubseçãoCadastro3.classList.add('has-fixed-close-button');

        SetaFechamentoSeção3.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        SetaFechamentoSeção3.classList.add('is-fixed-above-quote');
        SetaFechamentoSeção3.style.setProperty('--section-close-bottom', ContainerBotãoPrincipal.offsetHeight + 15 + 'px');

        if (userAgent.indexOf('Instagram') === -1) {

            BotãoInstagramDirect.classList.remove('is-hidden', 'is-contained', 'has-fixed-position');
            BotãoInstagramDirect.classList.add('is-fixed');

        }

    } else if (window.scrollY > (Posição_Seção4 - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro3.classList.remove('has-fixed-close-button');
        SubseçãoCadastro3.classList.add('has-contained-close-button');

        SetaFechamentoSeção3.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        SetaFechamentoSeção3.classList.add('is-contained');

        if (userAgent.indexOf('Instagram') === -1) {

            BotãoInstagramDirect.classList.remove('is-hidden', 'is-fixed', 'has-fixed-position');
            BotãoInstagramDirect.classList.add('is-contained');

        }

    }

    /* Seção 4 */

    if (window.scrollY <= Posição_Seção4) {

        SetaFechamentoSeção4.classList.add('is-hidden');

    } else if (window.scrollY > Posição_Seção4 && window.scrollY <= (Posição_EspaçoFinalContainerBotãoPrincipal - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro4.classList.remove('has-contained-close-button');
        SubseçãoCadastro4.classList.add('has-fixed-close-button');

        SetaFechamentoSeção4.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        SetaFechamentoSeção4.classList.add('is-fixed-above-quote');
        SetaFechamentoSeção4.style.setProperty('--section-close-bottom', ContainerBotãoPrincipal.offsetHeight + 15 + 'px');

    } else if (window.scrollY > (Posição_EspaçoFinalContainerBotãoPrincipal - window.innerHeight + ContainerBotãoPrincipal.offsetHeight)) {

        SubseçãoCadastro4.classList.remove('has-fixed-close-button');
        SubseçãoCadastro4.classList.add('has-contained-close-button');

        SetaFechamentoSeção4.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        SetaFechamentoSeção4.classList.add('is-contained');

    }

}
