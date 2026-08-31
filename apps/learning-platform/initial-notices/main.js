import { createInitialNoticesApplication } from '../modules/initial-notices.js';
import {
    AUTHORITATIVE_SESSIONS_ENABLED,
    createSessionStore
} from '../modules/session.js';

const requiredAcknowledgements = Object.freeze({
    credentials: 'credenciais',
    rights: 'direitos',
    window: 'janela'
});

const navigate = target => { window.location.href = target; };
const replaceNavigation = target => { window.location.replace(target); };

createInitialNoticesApplication({
    document,
    navigate,
    navigator,
    replaceNavigation,
    requiredAcknowledgements,
    session: createSessionStore(sessionStorage),
    window,
    authoritativeSessions: AUTHORITATIVE_SESSIONS_ENABLED
}).install();
