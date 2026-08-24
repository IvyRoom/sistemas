import "../azure-ai-vision-face-ui/FaceLivenessDetector.js";
import { createRegistrationApplication } from "../modules/photo-registration.js";

createRegistrationApplication({
    window,
    document,
    navigator: window.navigator,
    sessionStorage,
    fetch,
    FormDataConstructor: FormData,
    createFaceElement: tagName => document.createElement(tagName),
    createFaceStyleSheet: () => new CSSStyleSheet(),
    navigate(target) {
        window.location.href = target;
    },
    alert(message) {
        window.alert(message);
    }
});
