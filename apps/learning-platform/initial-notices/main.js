import { createInitialNoticesApplication } from '../modules/initial-notices.js';
import { isMicrosoftEdge, redirectToDeviceWarning } from '../modules/lifecycle.js';
import { createSessionStore } from '../modules/session.js';

const requiredAcknowledgements = Object.freeze({
    credentials: 'credenciais',
    rights: 'direitos',
    window: 'janela'
});

const navigate = target => { window.location.href = target; };

createInitialNoticesApplication({
    document,
    isMicrosoftEdge,
    navigate,
    navigator,
    redirectToDeviceWarning,
    requiredAcknowledgements,
    session: createSessionStore(sessionStorage),
    window
}).install();
