import "../azure-ai-vision-face-ui/FaceLivenessDetector.js";
import { createLoginApplication } from "../modules/login.js";

sessionStorage.setItem('URL_Base_Backend', 'https://plataforma-backend-v3.azurewebsites.net/plataforma_v2'); // 'http://localhost:3000/plataforma_v2' 

const URL_Base_Backend = sessionStorage.getItem('URL_Base_Backend');

createLoginApplication({
    window,
    document,
    navigator: window.navigator,
    history: window.history,
    sessionStorage,
    fetch,
    clock: Date,
    createFaceElement: tagName => document.createElement(tagName),
    navigate(target) {
        window.location.href = target;
    },
    alert(message) {
        window.alert(message);
    },
    console: window.console,
    backendBase: URL_Base_Backend
});
