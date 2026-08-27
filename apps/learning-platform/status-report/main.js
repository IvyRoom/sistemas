import { createPlatformClient } from '../modules/platform-client.js';
import { createStatusReportApplication } from '../modules/status-report/application.js';
import { BACKEND_ORIGIN } from '../../shared/backend-origin.js';

const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;

const platformClient = createPlatformClient({
    baseUrl: backendBase,
    fetch: window.fetch.bind(window),
    FormDataConstructor: window.FormData
});

createStatusReportApplication({
    URLSearchParamsConstructor: window.URLSearchParams,
    document,
    platformClient,
    showAlert: message => window.alert(message),
    window
}).install();
