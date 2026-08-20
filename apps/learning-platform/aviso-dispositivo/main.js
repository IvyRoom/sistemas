// Return to the previous page if the viewport becomes wider than 1024 pixels again.
sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Sim');
window.addEventListener('resize', function () { if (window.innerWidth > 1024) { window.history.back(); } });
