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

export function createFaceStartup({ createElement, createStyleSheet, loadRuntime, mount }) {
    let loadPromise;
    let activeAttempt;

    function ensureRuntime() {
        if (!loadPromise) {
            const currentLoad = Promise.resolve().then(loadRuntime);
            loadPromise = currentLoad;
            currentLoad.then(undefined, () => {
                if (loadPromise === currentLoad) loadPromise = undefined;
            });
        }
        return loadPromise;
    }

    function createAttempt() {
        let startPromise;
        const preparationPromise = ensureRuntime().then(() => {
            const faceLivenessDetector = createElement('azure-ai-vision-face-ui');
            installFaceShadowPresentation(faceLivenessDetector, createStyleSheet);
            faceLivenessDetector.locale = 'pt-BR';
            faceLivenessDetector.fontSize = '18px';
            faceLivenessDetector.buttonStyles = FACE_BUTTON_STYLES;
            mount(faceLivenessDetector);
            return faceLivenessDetector;
        });
        const attempt = {
            start(token) {
                if (startPromise) return startPromise;

                const currentStart = preparationPromise.then(faceLivenessDetector => (
                    faceLivenessDetector.start(token)
                ));
                startPromise = currentStart;
                currentStart.then(
                    () => { if (activeAttempt === attempt) activeAttempt = undefined; },
                    () => { if (activeAttempt === attempt) activeAttempt = undefined; }
                );
                return currentStart;
            }
        };
        preparationPromise.then(undefined, () => {
            if (activeAttempt === attempt) activeAttempt = undefined;
        });
        return attempt;
    }

    function prepare() {
        if (!activeAttempt) activeAttempt = createAttempt();
        return activeAttempt;
    }

    return {
        prepare,
        start(token) {
            return prepare().start(token);
        }
    };
}
