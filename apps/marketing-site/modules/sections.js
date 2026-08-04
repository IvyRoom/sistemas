import {
    BotãoAberturaSeção1,
    BotãoAberturaSeção2,
    BotãoAberturaSeção3,
    BotãoAberturaSeção4,
    BotãoInstagramDirect,
    ContainerExternoSeção1,
    ContainerExternoSeção2,
    ContainerExternoSeção3,
    ContainerExternoSeção4,
    ContainerInternoSeção1,
    ContainerInternoSeção2,
    ContainerInternoSeção3,
    ContainerInternoSeção4,
    DataAtualizaçãoEstatísticasPadrãoVermelho,
    MancheteSubseçãoAberta31,
    MancheteSubseçãoAberta32,
    MancheteSubseçãoAberta33,
    MancheteSubseçãoAberta34,
    MancheteSubseçãoAberta35,
    MancheteSubseçãoAberta41,
    MancheteSubseçãoAberta42,
    MancheteSubseçãoAberta43,
    SetaAberturaSubseção31,
    SetaAberturaSubseção32,
    SetaAberturaSubseção33,
    SetaAberturaSubseção34,
    SetaAberturaSubseção35,
    SetaAberturaSubseção41,
    SetaAberturaSubseção42,
    SetaAberturaSubseção43,
    SetaFechamentoSeção1,
    SetaFechamentoSeção2,
    SetaFechamentoSeção3,
    SetaFechamentoSeção4,
    SetaFechamentoSubseção31,
    SetaFechamentoSubseção32,
    SetaFechamentoSubseção33,
    SetaFechamentoSubseção34,
    SetaFechamentoSubseção35,
    SetaFechamentoSubseção41,
    SetaFechamentoSubseção42,
    SetaFechamentoSubseção43,
    SubseçãoAberta31,
    SubseçãoAberta32,
    SubseçãoAberta33,
    SubseçãoAberta34,
    SubseçãoAberta35,
    SubseçãoAberta41,
    SubseçãoAberta42,
    SubseçãoAberta43,
    SubseçãoFechada31,
    SubseçãoFechada32,
    SubseçãoFechada33,
    SubseçãoFechada34,
    SubseçãoFechada35,
    SubseçãoFechada41,
    SubseçãoFechada42,
    SubseçãoFechada43,
    TextoInternoChamadaSeção1,
    TextoInternoChamadaSeção2,
    TextoInternoChamadaSeção3,
    TextoInternoChamadaSeção4,
    VídeoDepoimento1,
    VídeoDepoimento2,
    VídeoDepoimento3,
    VídeoDepoimento4,
    VídeoDepoimento5
} from './elements.js';
import { preferredScrollBehavior } from './scroll-behavior.js';

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 1 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 1*/
BotãoAberturaSeção1.addEventListener("click", function(event) {
    BotãoAberturaSeção1.setAttribute("aria-expanded", "true");
    BotãoAberturaSeção2.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção3.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção4.setAttribute("aria-expanded", "false");
    ContainerExternoSeção1.classList.add('is-hidden');
    ContainerInternoSeção1.classList.add('is-open');
    ContainerInternoSeção1.scrollIntoView({behavior: preferredScrollBehavior()});
    TextoInternoChamadaSeção1.focus({preventScroll: true});
    SetaFechamentoSeção1.classList.add('is-fixed-near-bottom');
    ContainerExternoSeção2.classList.remove('is-hidden');
    ContainerInternoSeção2.classList.remove('is-open');
    ContainerExternoSeção3.classList.remove('is-hidden');
    ContainerInternoSeção3.classList.remove('is-open');
    ContainerExternoSeção4.classList.remove('is-hidden');
    ContainerInternoSeção4.classList.remove('is-open');
})



/*Fecha a Seção 1*/
SetaFechamentoSeção1.addEventListener("click", function(event) {
    BotãoAberturaSeção1.setAttribute("aria-expanded", "false");
    ContainerExternoSeção1.classList.remove('is-hidden');
    ContainerInternoSeção1.classList.remove('is-open');
    ContainerExternoSeção1.scrollIntoView({behavior: preferredScrollBehavior()});
    BotãoAberturaSeção1.focus({preventScroll: true});
})


/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 2 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 2*/
BotãoAberturaSeção2.addEventListener("click", function(event) {
    BotãoAberturaSeção1.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção2.setAttribute("aria-expanded", "true");
    BotãoAberturaSeção3.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção4.setAttribute("aria-expanded", "false");
    ContainerExternoSeção1.classList.remove('is-hidden');
    ContainerInternoSeção1.classList.remove('is-open');
    ContainerExternoSeção2.classList.add('is-hidden');
    ContainerInternoSeção2.classList.add('is-open');
    ContainerInternoSeção2.scrollIntoView({behavior: preferredScrollBehavior()});
    TextoInternoChamadaSeção2.focus({preventScroll: true});
    SetaFechamentoSeção2.classList.add('is-fixed-near-bottom');
    ContainerExternoSeção3.classList.remove('is-hidden');
    ContainerInternoSeção3.classList.remove('is-open');
    ContainerExternoSeção4.classList.remove('is-hidden');
    ContainerInternoSeção4.classList.remove('is-open');
})

/*Fecha a Seção 2*/
SetaFechamentoSeção2.addEventListener("click", function(event) {
    BotãoAberturaSeção2.setAttribute("aria-expanded", "false");
    ContainerExternoSeção2.classList.remove('is-hidden');
    ContainerInternoSeção2.classList.remove('is-open');
    ContainerExternoSeção2.scrollIntoView({behavior: preferredScrollBehavior()});
    BotãoAberturaSeção2.focus({preventScroll: true});
})

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 3 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 3*/
BotãoAberturaSeção3.addEventListener("click", function(event) {
    BotãoAberturaSeção1.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção2.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção3.setAttribute("aria-expanded", "true");
    BotãoAberturaSeção4.setAttribute("aria-expanded", "false");
    ContainerExternoSeção1.classList.remove('is-hidden');
    ContainerInternoSeção1.classList.remove('is-open');
    ContainerExternoSeção2.classList.remove('is-hidden');
    ContainerInternoSeção2.classList.remove('is-open');
    ContainerExternoSeção3.classList.add('is-hidden');
    ContainerInternoSeção3.classList.add('is-open');
    ContainerInternoSeção3.scrollIntoView({behavior: preferredScrollBehavior()});
    TextoInternoChamadaSeção3.focus({preventScroll: true});
    SetaFechamentoSeção3.classList.add('is-fixed-near-bottom');
    ContainerExternoSeção4.classList.remove('is-hidden');
    ContainerInternoSeção4.classList.remove('is-open');
})

/*Fecha a Seção 3*/
SetaFechamentoSeção3.addEventListener("click", function(event) {
    BotãoAberturaSeção3.setAttribute("aria-expanded", "false");

    ContainerExternoSeção3.classList.remove('is-hidden');
    ContainerInternoSeção3.classList.remove('is-open');
    ContainerExternoSeção3.scrollIntoView({behavior: preferredScrollBehavior()});
    BotãoAberturaSeção3.focus({preventScroll: true});

    SubseçãoFechada31.classList.remove('is-hidden');
    SubseçãoAberta31.classList.remove('is-open');
    SetaAberturaSubseção31.setAttribute("aria-expanded", "false");

    SubseçãoFechada32.classList.remove('is-hidden');
    SubseçãoAberta32.classList.remove('is-open');
    SetaAberturaSubseção32.setAttribute("aria-expanded", "false");

    SubseçãoFechada33.classList.remove('is-hidden');
    SubseçãoAberta33.classList.remove('is-open');
    SetaAberturaSubseção33.setAttribute("aria-expanded", "false");

    SubseçãoFechada34.classList.remove('is-hidden');
    SubseçãoAberta34.classList.remove('is-open');
    SetaAberturaSubseção34.setAttribute("aria-expanded", "false");

    SubseçãoFechada35.classList.remove('is-hidden');
    SubseçãoAberta35.classList.remove('is-open');
    SetaAberturaSubseção35.setAttribute("aria-expanded", "false");
})

/*///////////////////////////////////// Subseção 3.1 /////////////////////////////////////*/

/*Abre a Subseção 3.1*/
SetaAberturaSubseção31.addEventListener("click", function(event) {
    SetaAberturaSubseção31.setAttribute("aria-expanded", "true");
    SetaAberturaSubseção32.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção33.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção34.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção35.setAttribute("aria-expanded", "false");
    SubseçãoFechada31.classList.add('is-hidden');
    SubseçãoAberta31.classList.add('is-open');
    SubseçãoAberta31.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta31.focus({preventScroll: true});

    SubseçãoFechada32.classList.remove('is-hidden');
    SubseçãoAberta32.classList.remove('is-open');

    SubseçãoFechada33.classList.remove('is-hidden');
    SubseçãoAberta33.classList.remove('is-open');

    SubseçãoFechada34.classList.remove('is-hidden');
    SubseçãoAberta34.classList.remove('is-open');

    SubseçãoFechada35.classList.remove('is-hidden');
    SubseçãoAberta35.classList.remove('is-open');

})

/*Fecha a Subseção 3.1*/
SetaFechamentoSubseção31.addEventListener("click", function(event) {
    SetaAberturaSubseção31.setAttribute("aria-expanded", "false");
    SubseçãoFechada31.classList.remove('is-hidden');
    SubseçãoAberta31.classList.remove('is-open');
    SubseçãoFechada31.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção31.focus({preventScroll: true});
})

/*///////////////////////////////////// Subseção 3.2 /////////////////////////////////////*/

/*Abre a Subseção 3.2*/
SetaAberturaSubseção32.addEventListener("click", function(event) {
    SetaAberturaSubseção31.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção32.setAttribute("aria-expanded", "true");
    SetaAberturaSubseção33.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção34.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção35.setAttribute("aria-expanded", "false");

    SubseçãoFechada31.classList.remove('is-hidden');
    SubseçãoAberta31.classList.remove('is-open');

    SubseçãoFechada32.classList.add('is-hidden');
    SubseçãoAberta32.classList.add('is-open');
    SubseçãoAberta32.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta32.focus({preventScroll: true});

    SubseçãoFechada33.classList.remove('is-hidden');
    SubseçãoAberta33.classList.remove('is-open');

    SubseçãoFechada34.classList.remove('is-hidden');
    SubseçãoAberta34.classList.remove('is-open');

    SubseçãoFechada35.classList.remove('is-hidden');
    SubseçãoAberta35.classList.remove('is-open');

})

/*Fecha a Subseção 3.2*/
SetaFechamentoSubseção32.addEventListener("click", function(event) {
    SetaAberturaSubseção32.setAttribute("aria-expanded", "false");
    SubseçãoFechada32.classList.remove('is-hidden');
    SubseçãoAberta32.classList.remove('is-open');
    SubseçãoFechada32.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção32.focus({preventScroll: true});
})

/*///////////////////////////////////// Subseção 3.3 /////////////////////////////////////*/

/*Abre a Subseção 3.3*/
SetaAberturaSubseção33.addEventListener("click", function(event) {
    SetaAberturaSubseção31.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção32.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção33.setAttribute("aria-expanded", "true");
    SetaAberturaSubseção34.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção35.setAttribute("aria-expanded", "false");

    SubseçãoFechada31.classList.remove('is-hidden');
    SubseçãoAberta31.classList.remove('is-open');

    SubseçãoFechada32.classList.remove('is-hidden');
    SubseçãoAberta32.classList.remove('is-open');

    SubseçãoFechada33.classList.add('is-hidden');
    SubseçãoAberta33.classList.add('is-open');
    SubseçãoAberta33.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta33.focus({preventScroll: true});

    SubseçãoFechada34.classList.remove('is-hidden');
    SubseçãoAberta34.classList.remove('is-open');

    SubseçãoFechada35.classList.remove('is-hidden');
    SubseçãoAberta35.classList.remove('is-open');

})

/*Fecha a Subseção 3.3*/
SetaFechamentoSubseção33.addEventListener("click", function(event) {
    SetaAberturaSubseção33.setAttribute("aria-expanded", "false");
    SubseçãoFechada33.classList.remove('is-hidden');
    SubseçãoAberta33.classList.remove('is-open');
    SubseçãoFechada33.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção33.focus({preventScroll: true});
})

/*///////////////////////////////////// Subseção 3.4 /////////////////////////////////////*/

/*Abre a Subseção 3.4*/
SetaAberturaSubseção34.addEventListener("click", function(event) {
    SetaAberturaSubseção31.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção32.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção33.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção34.setAttribute("aria-expanded", "true");
    SetaAberturaSubseção35.setAttribute("aria-expanded", "false");

    SubseçãoFechada31.classList.remove('is-hidden');
    SubseçãoAberta31.classList.remove('is-open');

    SubseçãoFechada32.classList.remove('is-hidden');
    SubseçãoAberta32.classList.remove('is-open');

    SubseçãoFechada33.classList.remove('is-hidden');
    SubseçãoAberta33.classList.remove('is-open');

    SubseçãoFechada34.classList.add('is-hidden');
    SubseçãoAberta34.classList.add('is-open');
    SubseçãoAberta34.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta34.focus({preventScroll: true});

    SubseçãoFechada35.classList.remove('is-hidden');
    SubseçãoAberta35.classList.remove('is-open');

})

/*Fecha a Subseção 3.4*/
SetaFechamentoSubseção34.addEventListener("click", function(event) {
    SetaAberturaSubseção34.setAttribute("aria-expanded", "false");
    SubseçãoFechada34.classList.remove('is-hidden');
    SubseçãoAberta34.classList.remove('is-open');
    SubseçãoFechada34.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção34.focus({preventScroll: true});
})

/*///////////////////////////////////// Subseção 3.5 /////////////////////////////////////*/

/*Abre a Subseção 3.5*/
SetaAberturaSubseção35.addEventListener("click", function(event) {
    SetaAberturaSubseção31.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção32.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção33.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção34.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção35.setAttribute("aria-expanded", "true");

    SubseçãoFechada31.classList.remove('is-hidden');
    SubseçãoAberta31.classList.remove('is-open');

    SubseçãoFechada32.classList.remove('is-hidden');
    SubseçãoAberta32.classList.remove('is-open');

    SubseçãoFechada33.classList.remove('is-hidden');
    SubseçãoAberta33.classList.remove('is-open');

    SubseçãoFechada34.classList.remove('is-hidden');
    SubseçãoAberta34.classList.remove('is-open');

    SubseçãoFechada35.classList.add('is-hidden');
    SubseçãoAberta35.classList.add('is-open');
    SubseçãoAberta35.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta35.focus({preventScroll: true});

})

/*Fecha a Subseção 3.5*/
SetaFechamentoSubseção35.addEventListener("click", function(event) {
    SetaAberturaSubseção35.setAttribute("aria-expanded", "false");
    SubseçãoFechada35.classList.remove('is-hidden');
    SubseçãoAberta35.classList.remove('is-open');
    SubseçãoFechada35.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção35.focus({preventScroll: true});
})

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 4 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 4*/
BotãoAberturaSeção4.addEventListener("click", function(event) {
    BotãoAberturaSeção1.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção2.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção3.setAttribute("aria-expanded", "false");
    BotãoAberturaSeção4.setAttribute("aria-expanded", "true");
    ContainerExternoSeção1.classList.remove('is-hidden');
    ContainerInternoSeção1.classList.remove('is-open');
    ContainerExternoSeção2.classList.remove('is-hidden');
    ContainerInternoSeção2.classList.remove('is-open');
    ContainerExternoSeção3.classList.remove('is-hidden');
    ContainerInternoSeção3.classList.remove('is-open');
    ContainerExternoSeção4.classList.add('is-hidden');
    ContainerInternoSeção4.classList.add('is-open');
    ContainerInternoSeção4.scrollIntoView({behavior: preferredScrollBehavior()});
    TextoInternoChamadaSeção4.focus({preventScroll: true});
    SetaFechamentoSeção4.classList.add('is-fixed-near-bottom');
    BotãoInstagramDirect.classList.add('has-fixed-position');
})

/*Fecha a Seção 4*/
SetaFechamentoSeção4.addEventListener("click", function(event) {
    BotãoAberturaSeção4.setAttribute("aria-expanded", "false");

    ContainerExternoSeção4.classList.remove('is-hidden');
    ContainerInternoSeção4.classList.remove('is-open');
    ContainerExternoSeção4.scrollIntoView({behavior: preferredScrollBehavior()});
    BotãoAberturaSeção4.focus({preventScroll: true});

    if (!VídeoDepoimento1.paused) VídeoDepoimento1.pause();
    if (!VídeoDepoimento2.paused) VídeoDepoimento2.pause();
    if (!VídeoDepoimento3.paused) VídeoDepoimento3.pause();
    if (!VídeoDepoimento4.paused) VídeoDepoimento4.pause();
    if (!VídeoDepoimento5.paused) VídeoDepoimento5.pause();

    SubseçãoFechada41.classList.remove('is-hidden');
    SubseçãoAberta41.classList.remove('is-open');
    SetaAberturaSubseção41.setAttribute("aria-expanded", "false");

    SubseçãoFechada42.classList.remove('is-hidden');
    SubseçãoAberta42.classList.remove('is-open');
    SetaAberturaSubseção42.setAttribute("aria-expanded", "false");

    SubseçãoFechada43.classList.remove('is-hidden');
    SubseçãoAberta43.classList.remove('is-open');
    SetaAberturaSubseção43.setAttribute("aria-expanded", "false");

})

/*///////////////////////////////////// Subseção 4.1 /////////////////////////////////////*/

/*Abre a Subseção 4.1*/
SetaAberturaSubseção41.addEventListener("click", function(event) {
    SetaAberturaSubseção41.setAttribute("aria-expanded", "true");
    SetaAberturaSubseção42.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção43.setAttribute("aria-expanded", "false");

    SubseçãoFechada41.classList.add('is-hidden');
    SubseçãoAberta41.classList.add('is-open');
    SubseçãoAberta41.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta41.focus({preventScroll: true});

    SubseçãoFechada42.classList.remove('is-hidden');
    SubseçãoAberta42.classList.remove('is-open');

    SubseçãoFechada43.classList.remove('is-hidden');
    SubseçãoAberta43.classList.remove('is-open');

})

/*Fecha a Subseção 4.1*/
SetaFechamentoSubseção41.addEventListener("click", function(event) {
    SetaAberturaSubseção41.setAttribute("aria-expanded", "false");

    SubseçãoFechada41.classList.remove('is-hidden');
    SubseçãoAberta41.classList.remove('is-open');
    SubseçãoFechada41.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção41.focus({preventScroll: true});

})

/*///////////////////////////////////// Subseção 4.2 /////////////////////////////////////*/

/*Abre a Subseção 4.2*/
SetaAberturaSubseção42.addEventListener("click", function(event) {
    SetaAberturaSubseção41.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção42.setAttribute("aria-expanded", "true");
    SetaAberturaSubseção43.setAttribute("aria-expanded", "false");

    SubseçãoFechada41.classList.remove('is-hidden');
    SubseçãoAberta41.classList.remove('is-open');

    SubseçãoFechada42.classList.add('is-hidden');
    SubseçãoAberta42.classList.add('is-open');
    SubseçãoAberta42.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta42.focus({preventScroll: true});

    SubseçãoFechada43.classList.remove('is-hidden');
    SubseçãoAberta43.classList.remove('is-open');

    DataAtualizaçãoEstatísticasPadrãoVermelho.innerHTML = "Data e hora de atualização: " + new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

})

/*Fecha a Subseção 4.2*/
SetaFechamentoSubseção42.addEventListener("click", function(event) {
    SetaAberturaSubseção42.setAttribute("aria-expanded", "false");

    SubseçãoFechada42.classList.remove('is-hidden');
    SubseçãoAberta42.classList.remove('is-open');
    SubseçãoFechada42.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção42.focus({preventScroll: true});

})

/*///////////////////////////////////// Subseção 4.3 /////////////////////////////////////*/

/*Abre a Subseção 4.3*/
SetaAberturaSubseção43.addEventListener("click", function(event) {
    SetaAberturaSubseção41.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção42.setAttribute("aria-expanded", "false");
    SetaAberturaSubseção43.setAttribute("aria-expanded", "true");

    SubseçãoFechada41.classList.remove('is-hidden');
    SubseçãoAberta41.classList.remove('is-open');

    SubseçãoFechada42.classList.remove('is-hidden');
    SubseçãoAberta42.classList.remove('is-open');

    SubseçãoFechada43.classList.add('is-hidden');
    SubseçãoAberta43.classList.add('is-open');
    SubseçãoAberta43.scrollIntoView({behavior: preferredScrollBehavior()});
    MancheteSubseçãoAberta43.focus({preventScroll: true});

})

/*Fecha a Subseção 4.3*/
SetaFechamentoSubseção43.addEventListener("click", function(event) {
    SetaAberturaSubseção43.setAttribute("aria-expanded", "false");

    SubseçãoFechada43.classList.remove('is-hidden');
    SubseçãoAberta43.classList.remove('is-open');
    SubseçãoFechada43.scrollIntoView({behavior: preferredScrollBehavior()});
    SetaAberturaSubseção43.focus({preventScroll: true});

    if (!VídeoDepoimento1.paused) VídeoDepoimento1.pause();
    if (!VídeoDepoimento2.paused) VídeoDepoimento2.pause();
    if (!VídeoDepoimento3.paused) VídeoDepoimento3.pause();
    if (!VídeoDepoimento4.paused) VídeoDepoimento4.pause();
    if (!VídeoDepoimento5.paused) VídeoDepoimento5.pause();

})
