////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// Retorna à página anterior se a largura da tela ficar de novo > 1350.
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener('resize', LevaàPáginaAviso);

function LevaàPáginaAviso() {

    if (window.innerWidth > 1350) {
    
        window.history.back();
    
    }

}


