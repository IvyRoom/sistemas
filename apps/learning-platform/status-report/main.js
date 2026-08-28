import { replaceWithViewportWarning } from '../modules/lifecycle.js';
import { createPlatformClient } from '../modules/platform-client.js';
import { createStatusReportApplication } from '../modules/status-report/application.js';
import { BACKEND_ORIGIN } from '../../shared/backend-origin.js';

const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;

const navigate = target => { window.location.href = target; };
const replaceNavigation = target => { window.location.replace(target); };

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
    replaceNavigation,
    replaceWithViewportWarning,
    showAlert: message => window.alert(message),
    window
}).install();
