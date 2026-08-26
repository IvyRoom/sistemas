import "../azure-ai-vision-face-ui/FaceLivenessDetector.js";
import { createRegistrationApplication } from "../modules/photo-registration.js";
import { BACKEND_ORIGIN } from "../../shared/backend-origin.js";

const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;

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
    },
    backendBase
});
