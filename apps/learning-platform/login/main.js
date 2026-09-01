import { createLoginApplication } from "../modules/login.js";
import { BACKEND_ORIGIN } from "../../shared/backend-origin.js";

const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;

createLoginApplication({
    window,
    document,
    navigator: window.navigator,
    history: window.history,
    sessionStorage: window.sessionStorage,
    fetch: window.fetch,
    clock: window.Date,
    createFaceElement: tagName => document.createElement(tagName),
    createFaceStyleSheet: () => new window.CSSStyleSheet(),
    loadFaceRuntime: () => import("../azure-ai-vision-face-ui/FaceLivenessDetector.js"),
    navigate(target) {
        window.location.href = target;
    },
    replaceNavigation(target) {
        window.location.replace(target);
    },
    alert(message) {
        window.alert(message);
    },
    console: window.console,
    backendBase
});
