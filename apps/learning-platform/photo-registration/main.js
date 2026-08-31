import { createRegistrationApplication } from "../modules/photo-registration.js";
import { BACKEND_ORIGIN } from "../../shared/backend-origin.js";
import { AUTHORITATIVE_SESSIONS_ENABLED } from "../modules/session.js";

const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;

createRegistrationApplication({
    window,
    document,
    navigator: window.navigator,
    sessionStorage: window.sessionStorage,
    fetch: window.fetch,
    FormDataConstructor: window.FormData,
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
    backendBase,
    authoritativeSessions: AUTHORITATIVE_SESSIONS_ENABLED
});
