import "../azure-ai-vision-face-ui/FaceLivenessDetector.js";
import { createLoginApplication } from "../modules/login.js";
import { BACKEND_ORIGIN } from "../../shared/backend-origin.js";

const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;

createLoginApplication({
    window,
    document,
    navigator: window.navigator,
    history: window.history,
    sessionStorage,
    fetch,
    clock: Date,
    createFaceElement: tagName => document.createElement(tagName),
    createFaceStyleSheet: () => new CSSStyleSheet(),
    navigate(target) {
        window.location.href = target;
    },
    alert(message) {
        window.alert(message);
    },
    console: window.console,
    backendBase
});
