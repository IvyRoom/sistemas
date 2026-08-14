// Retorna à página anterior se a largura da tela ficar de novo > 1024.
sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Sim');
window.addEventListener('resize', function () { if (window.innerWidth > 1024) { window.history.back(); } });