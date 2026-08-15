export function isMicrosoftEdge(navigator) {
    return navigator.userAgentData?.brands?.some(brand => brand.brand === 'Microsoft Edge') ||
        navigator.userAgent.includes('Edg');
}

export function redirectToDeviceWarning({ window, navigate }) {
    if (window.innerWidth <= 1024) navigate('/plataforma/aviso-dispositivo');
}
