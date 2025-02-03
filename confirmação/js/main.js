/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*///////////////////////////// Aciona o evento de "Lead" junto à Meta /////////////////////////////////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

//////////////////////////////////////////////////////////////////////////////////////////////////////*/
// Cria a variável de comunicação com o Pixel.

let Meta_Dataset_ID = "1258615121284107";

//////////////////////////////////////////////////////////////////////////////////////////////////////*/
// Cria os Server Event Parameters.

let Meta_Server_Event_Parameter_Event_Name = 'Lead';
let Meta_Server_Event_Parameter_Event_Time = Math.floor(Date.now() / 1000);
let Meta_Server_Event_Parameter_Event_Source_Url = window.location.href;
let Meta_Server_Event_Parameter_Opt_Out = false;
let Meta_Server_Event_Parameter_Event_ID = Math.floor(100000000000 + Math.random() * 900000000000).toString();
let Meta_Server_Event_Parameter_Action_Source = 'website';
let Meta_Server_Event_Parameter_Data_Processing_Options = [];

//////////////////////////////////////////////////////////////////////////////////////////////////////*/
// Cria os Customer Information Parameters.

let Meta_Customer_Information_Parameter_Email_NotHashed = localStorage.getItem('Email');
let Meta_Customer_Information_Parameter_First_Name_NotHashed = localStorage.getItem('NomeCompleto').split(' ').filter(Boolean)[0].toLowerCase();
let Meta_Customer_Information_Parameter_Last_Name_NotHashed = localStorage.getItem('NomeCompleto').split(' ').filter(Boolean).slice(1).join(' ').toLowerCase();
let Meta_Customer_Information_Parameter_Country_NotHashed = 'br';
let Meta_Customer_Information_Parameter_External_ID_NotHashed = localStorage.getItem('Meta_Customer_Information_Parameter_External_ID_NotHashed');
let Meta_Customer_Information_Parameter_Client_IP_Address;
let Meta_Customer_Information_Parameter_Client_User_Agent = navigator.userAgent;
let Meta_Customer_Information_Parameter_fbc = localStorage.getItem('Meta_Customer_Information_Parameter_fbc');
let Meta_Customer_Information_Parameter_fbp = localStorage.getItem('Meta_Customer_Information_Parameter_fbp');
let Meta_Customer_Information_Parameter_Facebook_Page_ID;

/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*//////////// Aciona o "Lead" via Meta Dataset 01 (acionamento via Pixel / browser). //////////////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', Meta_Dataset_ID);
fbq('track', Meta_Server_Event_Parameter_Event_Name, {external_id: Meta_Customer_Information_Parameter_External_ID_NotHashed}, {eventID: Meta_Server_Event_Parameter_Event_ID});


/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*//////// Envia as informações ao backend para acionamento duplicado via Meta Conversions API. ////////*/
/*//////////////////////////////////////////////////////////////////////////////////////////////////////*/

fetch('https://plataforma-backend-v3.azurewebsites.net/landingpage/meta/lead', { //http://localhost:3000/landingpage/meta/lead //https://plataforma-backend-v3.azurewebsites.net/landingpage/meta/lead
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        Meta_Server_Event_Parameter_Event_Name: Meta_Server_Event_Parameter_Event_Name, 
        Meta_Server_Event_Parameter_Event_Time: Meta_Server_Event_Parameter_Event_Time,
        Meta_Server_Event_Parameter_Event_Source_Url: Meta_Server_Event_Parameter_Event_Source_Url,
        Meta_Server_Event_Parameter_Opt_Out: Meta_Server_Event_Parameter_Opt_Out, 
        Meta_Server_Event_Parameter_Event_ID: Meta_Server_Event_Parameter_Event_ID, 
        Meta_Server_Event_Parameter_Action_Source: Meta_Server_Event_Parameter_Action_Source, 
        Meta_Server_Event_Parameter_Data_Processing_Options: Meta_Server_Event_Parameter_Data_Processing_Options,
        Meta_Customer_Information_Parameter_Email_NotHashed: Meta_Customer_Information_Parameter_Email_NotHashed,
        Meta_Customer_Information_Parameter_First_Name_NotHashed: Meta_Customer_Information_Parameter_First_Name_NotHashed,
        Meta_Customer_Information_Parameter_Last_Name_NotHashed: Meta_Customer_Information_Parameter_Last_Name_NotHashed,
        Meta_Customer_Information_Parameter_Country_NotHashed: Meta_Customer_Information_Parameter_Country_NotHashed,
        Meta_Customer_Information_Parameter_External_ID_NotHashed: Meta_Customer_Information_Parameter_External_ID_NotHashed,
        Meta_Customer_Information_Parameter_Client_User_Agent: Meta_Customer_Information_Parameter_Client_User_Agent,
        Meta_Customer_Information_Parameter_fbc: Meta_Customer_Information_Parameter_fbc,
        Meta_Customer_Information_Parameter_fbp: Meta_Customer_Information_Parameter_fbp
    })
})

.then(response => {
    console.log(response.status);
})

.catch(error => {
    console.error(error);
});

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
        Processa o botão "Entrar Canal de Transmissão"
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

EntrarCanalTransmissão = document.getElementById('Entrar-Canal-Transmissão');

EntrarCanalTransmissão.addEventListener('click', function() {
    
    window.location.href = 'https://www.instagram.com/channel/AbaebGO_wVnsawoW/';

});

