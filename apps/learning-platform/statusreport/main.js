import { redirectToDeviceWarning } from '../modules/lifecycle.js';
import { createPlatformClient } from '../modules/platform-client.js';
import { createStatusReportApplication } from '../modules/status-report/application.js';

const backendBase = "https://plataforma-backend-v3.azurewebsites.net/plataforma_v2"; //https://plataforma-backend-v3.azurewebsites.net/plataforma_v2 //http://localhost:3000/plataforma_v2

const navigate = target => { window.location.href = target; };

const platformClient = createPlatformClient({
    baseUrl: backendBase,
    fetch: window.fetch.bind(window),
    FormDataConstructor: window.FormData
});

createStatusReportApplication({
    URLSearchParamsConstructor: window.URLSearchParams,
    document,
    navigate,
    platformClient,
    redirectToDeviceWarning,
    showAlert: message => window.alert(message),
    window
}).install();
