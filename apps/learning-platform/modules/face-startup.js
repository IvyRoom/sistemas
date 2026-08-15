const FACE_BUTTON_STYLES = 'margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;';

export function createFaceStartup({ createElement, mount }) {
    return {
        start(token) {
            const faceLivenessDetector = createElement('azure-ai-vision-face-ui');
            faceLivenessDetector.locale = 'pt-BR';
            faceLivenessDetector.fontSize = '18px';
            faceLivenessDetector.buttonStyles = FACE_BUTTON_STYLES;
            mount(faceLivenessDetector);
            return faceLivenessDetector.start(token);
        }
    };
}
