var SeçãoBlackFriday = document.getElementById("Seção-Black-Friday");

var SeçãoInicial = document.getElementById("Seção-Inicial");

var ContainerVídeoPrincipal = document.getElementById("Container-Vídeo-Principal");
var BotãoTelaCheia1 = document.getElementById("Botão-Tela-Cheia-1");
var TextoTelaCheia1 = document.getElementById("Texto-Tela-Cheia-1");

var Seção1 = document.getElementById("Seção-1");
var ContainerExternoSeção1 = document.getElementById("Container-Externo-Seção-1");
var ContainerInternoSeção1 = document.getElementById("Container-Interno-Seção-1");
var SubseçãoCadastro1 = document.getElementById("Subseção-Cadastro-1");
var SetaFechamentoSeção1 = document.getElementById("Seta-Fechamento-Seção-1");

var Seção2 = document.getElementById("Seção-2");
var ContainerExternoSeção2 = document.getElementById("Container-Externo-Seção-2");
var ContainerInternoSeção2 = document.getElementById("Container-Interno-Seção-2");
var SubseçãoCadastro2 = document.getElementById("Subseção-Cadastro-2");
var SetaFechamentoSeção2 = document.getElementById("Seta-Fechamento-Seção-2");

var Seção3 = document.getElementById("Seção-3");
var ContainerExternoSeção3 = document.getElementById("Container-Externo-Seção-3");
var ContainerInternoSeção3 = document.getElementById("Container-Interno-Seção-3");
var SubseçãoCadastro3 = document.getElementById("Subseção-Cadastro-3");
var SetaFechamentoSeção3 = document.getElementById("Seta-Fechamento-Seção-3");

var Seção4 = document.getElementById("Seção-4");
var ContainerExternoSeção4 = document.getElementById("Container-Externo-Seção-4");
var ContainerInternoSeção4 = document.getElementById("Container-Interno-Seção-4");
var ContainerCondiçõesComerciais3 = document.getElementById("Container-Condições-Comerciais-3");
var SetaFechamentoSeção4 = document.getElementById("Seta-Fechamento-Seção-4");
var BotãoInstagramDirect = document.getElementById("Botão-Instagram-Direct");

var ContainerVídeoDepoimentos = document.getElementById("Container-Vídeo-Depoimentos");
var VídeoDepoimentos = document.getElementById("Vídeo-Depoimentos");
var BotãoTelaCheia2 = document.getElementById("Botão-Tela-Cheia-2");
var TextoTelaCheia2 = document.getElementById("Texto-Tela-Cheia-2");

var BotãoCronograma = document.getElementById("Botão-Cronograma");
var BotãoEmenta = document.getElementById("Botão-Ementa");
var BotãoBibliografia = document.getElementById("Botão-Bibliografia");
var BotãoSoftwares = document.getElementById("Botão-Softwares");

var ContainerExternoSubseção41 = document.getElementById("Container-Externo-Subseção-4-1");
var ContainerInternoSubseção41 = document.getElementById("Container-Interno-Subseção-4-1");
var SetaFechamentoSubseção41 = document.getElementById("Seta-Fechamento-Subseção-4-1");

var ContainerExternoSubseção42 = document.getElementById("Container-Externo-Subseção-4-2");
var ContainerInternoSubseção42 = document.getElementById("Container-Interno-Subseção-4-2");
var SetaFechamentoSubseção42 = document.getElementById("Seta-Fechamento-Subseção-4-2");

var ContainerExternoSubseção43 = document.getElementById("Container-Externo-Subseção-4-3");
var ContainerInternoSubseção43 = document.getElementById("Container-Interno-Subseção-4-3");
var SetaFechamentoSubseção43 = document.getElementById("Seta-Fechamento-Subseção-4-3");

var EspaçoFinalContainerBotãoCadastro = document.getElementById("Espaço-Final-Container-Botão-Cadastro");
var ContainerBotãoCadastro = document.getElementById("Container-Botão-Cadastro");
var BotãoCadastro = document.getElementById("Botão-Cadastro");

var userAgent = navigator.userAgent;

/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////// Dispara o evento de "PageView" do Pixel - Ivy Room 01 ///////////////////////////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '916097029235819');
fbq('track', 'PageView');

/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*//// Armazena os dados do fbclid para o evento de "Lead" do Pixel - Ivy Room 01: Conversion API //////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

const fbclid = new URLSearchParams(window.location.search).get('fbclid') || "";
const fbclid_momento_registro = new Date().toISOString();

localStorage.setItem('fbclid', fbclid);
localStorage.setItem('fbclid_momento_registro', fbclid_momento_registro);


/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*/// Retira os botões de girar os vídeos se o usuário não estiver usando o Instagram In-App Browser. //*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

if (userAgent.indexOf('Instagram') === -1) {
    
    BotãoTelaCheia1.style.display = 'none';
    BotãoTelaCheia2.style.display = 'none';
    ContainerVídeoPrincipal.style.marginBottom = '40px';
    ContainerVídeoDepoimentos.style.marginBottom = '40px';

}


/*/////////////////////////////////////////////////////////////////////////////////////*/
/*//// Carrega o Vídeo-Principal somente ao visualizar o Container-Vídeo-Principal ////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

function handleIntersection(entries, observer) {
    
    entries.forEach(entry => {
      
        if (entry.isIntersecting) {

        var VídeoPrincipal = document.createElement("iframe");
        VídeoPrincipal.setAttribute("id", "Vídeo-Principal");
        VídeoPrincipal.setAttribute("frameborder", "0");
        VídeoPrincipal.setAttribute("src", "https://www.youtube.com/embed/z9tmj6jxhrY?si=QwcMiypQLzI9bSVf");

        /* Adiciona o allowfullscreen para os dois vídeos se o usuário estiver no Laptop ou num navegador que não seja o Instagram In-App Browser. */
        if (window.innerWidth > 430 || userAgent.indexOf('Instagram') === -1) {
            VídeoPrincipal.setAttribute("allowfullscreen", "true");
            VídeoDepoimentos.setAttribute("allowfullscreen", "true");
        }
        
        ContainerVídeoPrincipal.appendChild(VídeoPrincipal);
  
        observer.unobserve(entry.target);
      }
    
    });
  
}
  
var observer = new IntersectionObserver(handleIntersection);

observer.observe(ContainerVídeoPrincipal);


/*/////////////////////////////////////////////////////////////////////////////////////*/
/*///////////////////////////////// Botão Tela Cheia //////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

BotãoTelaCheia1.addEventListener("click", function(event) {
    
    if (TextoTelaCheia1.innerHTML !== 'Tela Padrão') {
 
        ContainerVídeoPrincipal.style.width = 'calc(var(--considered-screen-width) * 0.95)';
        ContainerVídeoPrincipal.style.height = 'calc(var(--considered-screen-width) * 1.68858)';

        var VídeoPrincipal = document.getElementById("Vídeo-Principal");

        VídeoPrincipal.style.width = 'calc(var(--considered-screen-width) * 1.68858)';
        VídeoPrincipal.style.height = 'calc(var(--considered-screen-width) * 0.95)';
        VídeoPrincipal.style.transformOrigin = 'top left';
        VídeoPrincipal.style.transform = 'rotate(90deg) translateY(-100%)';

        TextoTelaCheia1.innerHTML = 'Tela Padrão';

        VídeoPrincipal.scrollIntoView({behavior: 'smooth'});

        ControlaPosição_ContainerBotãoCadastro();

    } else {
        
        ContainerVídeoPrincipal.style.width = 'calc(var(--considered-screen-width) * 0.90)';
        ContainerVídeoPrincipal.style.height = 'calc(var(--considered-screen-width) * 0.50634)';

        var VídeoPrincipal = document.getElementById("Vídeo-Principal");

        VídeoPrincipal.style.width = 'calc(var(--considered-screen-width) * 0.90)';
        VídeoPrincipal.style.height = 'calc(var(--considered-screen-width) * 0.50634)';
        VídeoPrincipal.style.transformOrigin = '';
        VídeoPrincipal.style.transform = '';

        TextoTelaCheia1.innerHTML = 'Tela Cheia';

        VídeoPrincipal.scrollIntoView({behavior: 'smooth'});

        ControlaPosição_ContainerBotãoCadastro();

    }

})

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*///////////////////// Controla as posições do Itens Dinâmicos ///////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*////////////////////// Controla a posição do Container-Botão-Cadastro ///////////////////////*/


function ControlaPosição_ContainerBotãoCadastro (){

    if (window.scrollY + window.innerHeight < SeçãoInicial.offsetTop) {

        ContainerBotãoCadastro.style.position = 'fixed';
        ContainerBotãoCadastro.style.top = '';
        ContainerBotãoCadastro.style.bottom = '0px';
        
    } else if (window.scrollY + window.innerHeight >= SeçãoInicial.offsetTop && window.scrollY < SeçãoInicial.offsetTop) {
    
        ContainerBotãoCadastro.style.position = 'absolute';
        ContainerBotãoCadastro.style.top = SeçãoInicial.offsetTop - 150 + 'px';
    
    } else if (window.scrollY + window.innerHeight >= Seção1.offsetTop) {
    
        ContainerBotãoCadastro.style.display = 'block';
        EspaçoFinalContainerBotãoCadastro.style.height = ContainerBotãoCadastro.offsetHeight + 'px';
    
        if (window.scrollY + window.innerHeight < Seção1.offsetTop + ContainerBotãoCadastro.offsetHeight){
    
            ContainerBotãoCadastro.style.position = 'absolute';
            ContainerBotãoCadastro.style.top = Seção1.offsetTop + 'px';
            ContainerBotãoCadastro.style.bottom = '';
    
        } else {
    
            ContainerBotãoCadastro.style.position = 'fixed';
            ContainerBotãoCadastro.style.top = '';
            ContainerBotãoCadastro.style.bottom = '0px';
    
        }
    
    }

}

window.onscroll = function() {

    ControlaPosição_ContainerBotãoCadastro();

    /*////////////////////// Controla a posição das Setas de Fechamento das Seções ///////////////////////*/
    var Posição_Seção1 = Seção1.offsetTop;
    var Posição_Seção2 = Seção2.offsetTop;
    var Posição_Seção3 = Seção3.offsetTop;
    var Posição_Seção4 = Seção4.offsetTop;
    var Posição_EspaçoFinalContainerBotãoCadastro = EspaçoFinalContainerBotãoCadastro.offsetTop;

    /* Seção 1 */

    if (window.scrollY <= Posição_Seção1) {
    
        SetaFechamentoSeção1.style.display = 'none';
    
    } else if (window.scrollY > Posição_Seção1 && window.scrollY <= (Posição_Seção2 - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        SubseçãoCadastro1.style.marginBottom = '20px';
        
        SetaFechamentoSeção1.style.display = 'flex';
        SetaFechamentoSeção1.style.position = 'fixed';
        SetaFechamentoSeção1.style.bottom = ContainerBotãoCadastro.offsetHeight + 15 + 'px';
        SetaFechamentoSeção1.style.marginBottom = '0px';
        SetaFechamentoSeção1.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    } else if (window.scrollY > (Posição_Seção2 - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        SubseçãoCadastro1.style.marginBottom = '15px';

        SetaFechamentoSeção1.style.display = 'flex';
        SetaFechamentoSeção1.style.position = 'relative';
        SetaFechamentoSeção1.style.bottom = '0px';
        SetaFechamentoSeção1.style.marginBottom = '-25px';
        SetaFechamentoSeção1.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    }

    /* Seção 2 */

    if (window.scrollY <= Posição_Seção2) {

        SetaFechamentoSeção2.style.display = 'none';
    
    } else if (window.scrollY > Posição_Seção2 && window.scrollY <= (Posição_Seção3 - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        SubseçãoCadastro2.style.marginBottom = '20px';
        
        SetaFechamentoSeção2.style.display = 'flex';
        SetaFechamentoSeção2.style.position = 'fixed';
        SetaFechamentoSeção2.style.bottom = ContainerBotãoCadastro.offsetHeight + 15 + 'px';
        SetaFechamentoSeção2.style.marginBottom = '0px';
        SetaFechamentoSeção2.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    } else if (window.scrollY > (Posição_Seção3 - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        SubseçãoCadastro2.style.marginBottom = '15px';

        SetaFechamentoSeção2.style.display = 'flex';
        SetaFechamentoSeção2.style.position = 'relative';
        SetaFechamentoSeção2.style.bottom = '0px';
        SetaFechamentoSeção2.style.marginBottom = '-25px';
        SetaFechamentoSeção2.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    }

    /* Seção 3 */

    if (window.scrollY <= Posição_Seção3) {

        SetaFechamentoSeção3.style.display = 'none';
    
    } else if (window.scrollY > Posição_Seção3 && window.scrollY <= (Posição_Seção4 - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        SubseçãoCadastro3.style.marginBottom = '20px';
        
        SetaFechamentoSeção3.style.display = 'flex';
        SetaFechamentoSeção3.style.position = 'fixed';
        SetaFechamentoSeção3.style.bottom = ContainerBotãoCadastro.offsetHeight + 15 + 'px';
        SetaFechamentoSeção3.style.marginBottom = '0px';
        SetaFechamentoSeção3.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    } else if (window.scrollY > (Posição_Seção4 - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        SubseçãoCadastro3.style.marginBottom = '15px';

        SetaFechamentoSeção3.style.display = 'flex';
        SetaFechamentoSeção3.style.position = 'relative';
        SetaFechamentoSeção3.style.bottom = '0px';
        SetaFechamentoSeção3.style.marginBottom = '-25px';
        SetaFechamentoSeção3.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    }

    /* Seção 4 */

    if (window.scrollY <= Posição_Seção4) {
    
        SetaFechamentoSeção4.style.display = 'none';
        BotãoInstagramDirect.style.display = 'none';

    } else if (window.scrollY > Posição_Seção4 && window.scrollY <= (Posição_EspaçoFinalContainerBotãoCadastro - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        ContainerCondiçõesComerciais3.style.marginBottom = '20px';
    
        if (userAgent.indexOf('Instagram') === -1) {

            BotãoInstagramDirect.style.display = 'block';
    
        }

        SetaFechamentoSeção4.style.display = 'flex';
        SetaFechamentoSeção4.style.position = 'fixed';
        SetaFechamentoSeção4.style.bottom = ContainerBotãoCadastro.offsetHeight + 15 + 'px';
        SetaFechamentoSeção4.style.marginBottom = '0px';
        SetaFechamentoSeção4.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    } else if (window.scrollY > (Posição_EspaçoFinalContainerBotãoCadastro - window.innerHeight + ContainerBotãoCadastro.offsetHeight)) {

        ContainerCondiçõesComerciais3.style.marginBottom = '15px';

        SetaFechamentoSeção4.style.display = 'flex';
        SetaFechamentoSeção4.style.position = 'relative';
        SetaFechamentoSeção4.style.bottom = '0px';
        SetaFechamentoSeção4.style.marginBottom = '-25px';
        SetaFechamentoSeção4.style.marginLeft = 'calc((var(--considered-screen-width) * 0.50) - 40px)';

    }

}

/*Abre o Cadastro*/
BotãoCadastro.addEventListener("click", function(event){
    event.preventDefault();
    window.location.href = "cadastro/";
})


/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 1 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 1*/
ContainerExternoSeção1.addEventListener("click", function(event) {
    ContainerExternoSeção1.style.display = 'none';
    ContainerInternoSeção1.style.display = 'block';
    ContainerExternoSeção2.style.display = 'block';
    ContainerInternoSeção2.style.display = 'none';
    ContainerExternoSeção3.style.display = 'block';
    ContainerInternoSeção3.style.display = 'none';
    ContainerExternoSeção4.style.display = 'block';
    ContainerInternoSeção4.style.display = 'none';
    ContainerInternoSeção1.scrollIntoView({behavior: 'smooth'});
    SetaFechamentoSeção1.style.position = 'fixed';
    SetaFechamentoSeção1.style.bottom = '25px';
})



/*Fecha a Seção 1*/
SetaFechamentoSeção1.addEventListener("click", function(event) {
    ContainerExternoSeção1.style.display = 'block';
    ContainerInternoSeção1.style.display = 'none';
    ContainerExternoSeção1.scrollIntoView({behavior: 'smooth'});
})


/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 2 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 2*/
ContainerExternoSeção2.addEventListener("click", function(event) {
    ContainerExternoSeção1.style.display = 'block';
    ContainerInternoSeção1.style.display = 'none';
    ContainerExternoSeção2.style.display = 'none';
    ContainerInternoSeção2.style.display = 'block';
    ContainerExternoSeção3.style.display = 'block';
    ContainerInternoSeção3.style.display = 'none';
    ContainerExternoSeção4.style.display = 'block';
    ContainerInternoSeção4.style.display = 'none';
    ContainerInternoSeção2.scrollIntoView({behavior: 'smooth'});
    SetaFechamentoSeção2.style.position = 'fixed';
    SetaFechamentoSeção2.style.bottom = '25px';
})

/*Fecha a Seção 2*/
SetaFechamentoSeção2.addEventListener("click", function(event) {
    ContainerExternoSeção2.style.display = 'block';
    ContainerInternoSeção2.style.display = 'none';
    ContainerExternoSeção2.scrollIntoView({behavior: 'smooth'});
})

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 3 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 3*/
ContainerExternoSeção3.addEventListener("click", function(event) {
    ContainerExternoSeção1.style.display = 'block';
    ContainerInternoSeção1.style.display = 'none';
    ContainerExternoSeção2.style.display = 'block';
    ContainerInternoSeção2.style.display = 'none';
    ContainerExternoSeção3.style.display = 'none';
    ContainerInternoSeção3.style.display = 'block';
    ContainerExternoSeção4.style.display = 'block';
    ContainerInternoSeção4.style.display = 'none';
    ContainerInternoSeção3.scrollIntoView({behavior: 'smooth'});
    SetaFechamentoSeção3.style.position = 'fixed';
    SetaFechamentoSeção3.style.bottom = '25px';
})

/*Fecha a Seção 3*/
SetaFechamentoSeção3.addEventListener("click", function(event) {
    ContainerExternoSeção3.style.display = 'block';
    ContainerInternoSeção3.style.display = 'none';
    ContainerExternoSeção3.scrollIntoView({behavior: 'smooth'});
})


/*/////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////////////////////// Seção 4 //////////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

/*Abre a Seção 4*/
ContainerExternoSeção4.addEventListener("click", function(event) {
    ContainerExternoSeção1.style.display = 'block';
    ContainerInternoSeção1.style.display = 'none';
    ContainerExternoSeção2.style.display = 'block';
    ContainerInternoSeção2.style.display = 'none';
    ContainerExternoSeção3.style.display = 'block';
    ContainerInternoSeção3.style.display = 'none';
    ContainerExternoSeção4.style.display = 'none';
    ContainerInternoSeção4.style.display = 'block';
    ContainerInternoSeção4.scrollIntoView({behavior: 'smooth'});
    SetaFechamentoSeção4.style.position = 'fixed';
    SetaFechamentoSeção4.style.bottom = '25px';
    BotãoInstagramDirect.style.position = 'fixed';
})

/*///////////////////////////////////// Seção 4-1 /////////////////////////////////////*/

/*Abre a Seção 4-1*/
ContainerExternoSubseção41.addEventListener("click", function(event) {
    ContainerExternoSubseção41.style.display = 'none';
    ContainerInternoSubseção41.style.display = 'block';
    ContainerInternoSubseção41.scrollIntoView({behavior: 'smooth'});
})

/*Fecha a Subseção 4-1*/
SetaFechamentoSubseção41.addEventListener("click", function(event) {
    ContainerExternoSubseção41.style.display = 'block';
    ContainerInternoSubseção41.style.display = 'none';
    ContainerExternoSubseção41.scrollIntoView({behavior: 'smooth'});
})

/*///////////////////////////////////// Seção 4-2 /////////////////////////////////////*/

/*Abre a Seção 4-2*/
ContainerExternoSubseção42.addEventListener("click", function(event) {
    ContainerExternoSubseção42.style.display = 'none';
    ContainerInternoSubseção42.style.display = 'block';
    ContainerInternoSubseção42.scrollIntoView({behavior: 'smooth'});
})

/*Fecha a Subseção 4-2*/
SetaFechamentoSubseção42.addEventListener("click", function(event) {
    ContainerExternoSubseção42.style.display = 'block';
    ContainerInternoSubseção42.style.display = 'none';
    ContainerExternoSubseção42.scrollIntoView({behavior: 'smooth'});
})

/*///////////////////////////////////// Seção 4-3 /////////////////////////////////////*/

/*Abre a Seção 4-3*/
ContainerExternoSubseção43.addEventListener("click", function(event) {
    ContainerExternoSubseção43.style.display = 'none';
    ContainerInternoSubseção43.style.display = 'block';
    ContainerInternoSubseção43.scrollIntoView({behavior: 'smooth'});
})

/*Fecha a Subseção 4-3*/
SetaFechamentoSubseção43.addEventListener("click", function(event) {
    ContainerExternoSubseção43.style.display = 'block';
    ContainerInternoSubseção43.style.display = 'none';
    ContainerExternoSubseção43.scrollIntoView({behavior: 'smooth'});
})

/*/////////////////////////////////////////////////////////////////////////////////////*/
/*///////////////////////////////// Botão Tela Cheia //////////////////////////////////*/
/*/////////////////////////////////////////////////////////////////////////////////////*/

BotãoTelaCheia2.addEventListener("click", function(event) {
    
    if (TextoTelaCheia2.innerHTML !== 'Tela Padrão') {

        ContainerVídeoDepoimentos.style.width = 'calc(var(--considered-screen-width) * 0.95)';
        ContainerVídeoDepoimentos.style.height = 'calc(var(--considered-screen-width) * 1.68858)';

        VídeoDepoimentos.style.width = 'calc(var(--considered-screen-width) * 1.68858)';
        VídeoDepoimentos.style.height = 'calc(var(--considered-screen-width) * 0.95)';
        VídeoDepoimentos.style.transformOrigin = 'top left';
        VídeoDepoimentos.style.transform = 'rotate(90deg) translateY(-100%)';

        TextoTelaCheia2.innerHTML = 'Tela Padrão';

        VídeoDepoimentos.scrollIntoView({behavior: 'smooth'});

    } else {
        
        ContainerVídeoDepoimentos.style.width = 'calc(var(--considered-screen-width) * 0.90)';
        ContainerVídeoDepoimentos.style.height = 'calc(var(--considered-screen-width) * 0.50634)';

        VídeoDepoimentos.style.width = 'calc(var(--considered-screen-width) * 0.90)';
        VídeoDepoimentos.style.height = 'calc(var(--considered-screen-width) * 0.50634)';
        VídeoDepoimentos.style.transformOrigin = '';
        VídeoDepoimentos.style.transform = '';

        TextoTelaCheia2.innerHTML = 'Tela Cheia';

        VídeoDepoimentos.scrollIntoView({behavior: 'smooth'});

    }

})

/*////////////////////////////////// Demais Funções //////////////////////////////////*/

/*Abre documentos em .pdf*/
BotãoCronograma.addEventListener("click", function(event) {
    event.preventDefault();
    window.open("pdf/GESTÃO GENERALISTA - CRONOGRAMA DE ESTUDOS_v3.pdf","_blank");
})

BotãoEmenta.addEventListener("click", function(event) {
    event.preventDefault();
    window.open("pdf/GESTÃO GENERALISTA - EMENTA_v5.pdf","_blank");
})

BotãoBibliografia.addEventListener("click", function(event) {
    event.preventDefault();
    window.open("pdf/GESTÃO GENERALISTA - BIBLIOGRAFIA_v3.pdf","_blank");
})

BotãoSoftwares.addEventListener("click", function(event) {
    event.preventDefault();
    window.open("pdf/GESTÃO GENERALISTA - SOFTWARES_v3.pdf","_blank");
})

/*Fecha a Seção 4*/
SetaFechamentoSeção4.addEventListener("click", function(event) {
    ContainerExternoSeção4.style.display = 'block';
    ContainerInternoSeção4.style.display = 'none';
    ContainerExternoSeção4.scrollIntoView({behavior: 'smooth'});
})

/*Abre o Direct*/
BotãoInstagramDirect.addEventListener("click", function(event) {
    event.preventDefault();
    window.open("https://ig.me/m/ivy.escoladegestao","_blank");
})