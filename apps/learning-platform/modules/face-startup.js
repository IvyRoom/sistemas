const FACE_BUTTON_STYLES = 'margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;';
const FACE_SHADOW_STYLES = ':host,\n* {\n    -webkit-user-select: none;\n    user-select: none;\n}\n\n#spinnerCheck #circle,\n#spinnerCheck #tick {\n    stroke: #4a0816 !important;\n}';

function installFaceShadowPresentation(faceLivenessDetector, createStyleSheet) {
    const attachShadow = faceLivenessDetector.attachShadow;
    faceLivenessDetector.attachShadow = function attachThemedFaceShadow(options) {
        this.attachShadow = attachShadow;
        const shadowRoot = attachShadow.call(this, options);
        const styleSheet = createStyleSheet();
        styleSheet.replaceSync(FACE_SHADOW_STYLES);
        shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, styleSheet];
        return shadowRoot;
    };
}

export function createFaceStartup({ createElement, createStyleSheet, mount }) {
    return {
        start(token) {
            const faceLivenessDetector = createElement('azure-ai-vision-face-ui');
            installFaceShadowPresentation(faceLivenessDetector, createStyleSheet);
            faceLivenessDetector.locale = 'pt-BR';
            faceLivenessDetector.fontSize = '18px';
            faceLivenessDetector.buttonStyles = FACE_BUTTON_STYLES;
            mount(faceLivenessDetector);
            return faceLivenessDetector.start(token);
        }
    };
}
