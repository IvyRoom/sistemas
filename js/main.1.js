////////////////////////////////////////////////////////////////////////////////////////
// Botão "Entrar": Envia informações de login ao backend.
////////////////////////////////////////////////////////////////////////////////////////

// Declara as variáveis necessárias.
var BotãoEntrar = document.getElementById("BotãoEntrar");

BotãoEntrar.addEventListener("click", async function(event) {
    
    // Obtém os dados da BD - PLATAFORMA.xlsx.

    if (!Microsoft_Graph_API_Client) { await Conecta_ao_Microsoft_Graph_API() };

    const BD_Plataforma = await Microsoft_Graph_API_Client.api('/users/b4a93dcf-5946-4cb2-8368-5db4d242a236/drive/items/0172BBJB7TUZJNIWDVWFE2MIW7MNKHMWLL/workbook/worksheets/{00000000-0001-0000-0000-000000000000}/tables/{7C4EBF15-124A-4107-9867-F83E9C664B31}/rows').get();    

    console.log(BD_Plataforma)

})




