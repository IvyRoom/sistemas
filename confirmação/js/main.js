/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*////////////////////// Dispara o evento de "Lead" do Pixel - Ivy Room 01 ///////////////////////////*/
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
fbq('track', 'Lead');

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
        Processa o botão "Entrar Canal de Transmissão"
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

EntrarCanalTransmissão = document.getElementById('Entrar-Canal-Transmissão');

EntrarCanalTransmissão.addEventListener('click', function() {
    
    window.location.href = 'https://www.instagram.com/channel/AbaebGO_wVnsawoW/';

});

