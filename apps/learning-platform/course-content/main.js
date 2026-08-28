import { createPlatformClient } from '../modules/platform-client.js';
import { createSessionStore } from '../modules/session.js';
import { createStudyApplication } from '../modules/course-content/application.js';
import { createCertificateRenderer } from '../modules/course-content/certificate-renderer.js';
import { createStudyDom } from '../modules/course-content/dom.js';
import { createDownloadConfigurator } from '../modules/course-content/downloads.js';
import { createStudyPlayer } from '../modules/course-content/player.js';
import { BACKEND_ORIGIN } from '../../shared/backend-origin.js';

function isDrmEnabled(fullName) {
    let drmEnabled;
    if (fullName === 'Ellyson Freitas' || fullName === 'Rafael Santos Jesus' || fullName === 'Ader Angelo Passos' || fullName === 'Pedro Henrique Dabul Tosin' || fullName === 'Theo Mouchbahani de Souza') { drmEnabled = false } else { drmEnabled = true };
    return drmEnabled;
}

function configureDrm(player) {
    const drmEnabled = true;
    if (drmEnabled === true) { player.configure({ drm: { servers: { 'com.microsoft.playready': 'https://na-playready.ezdrm.com/cency/preauth.aspx?pX=7C6D6C' } } }); }
}

async function loadSelectedMedia(player, { drmEnabled, moduleName, videoName }) {
    if (drmEnabled === true) { await player.load('https://videospreparatoriosv2.blob.core.windows.net/videosv3/plataforma_v2/' + moduleName + '/' + videoName + '_dash.mpd'); } else { await player.load('https://videospreparatoriosv2.blob.core.windows.net/videosv3/plataforma_v2_sem_drm/' + moduleName + '/' + videoName + '_dash.mpd'); };
}

const session = createSessionStore(window.sessionStorage);
const backendBase = `${BACKEND_ORIGIN}/plataforma_v2`;
const bindWindowFunction = name => typeof window[name] === 'function'
    ? window[name].bind(window)
    : window[name];
let legacySessionSeconds;
const studyDom = createStudyDom(window.document, () => {
    legacySessionSeconds = session.read('legacySessionSeconds');
});
const platformClient = createPlatformClient({
    baseUrl: backendBase,
    fetch: bindWindowFunction('fetch'),
    FormDataConstructor: window.FormData
});

let controller;
const mediaState = new Proxy({}, {
    get(_target, property) {
        return controller.state[property];
    }
});
const player = createStudyPlayer({
    alert: bindWindowFunction('alert'),
    configureDrm,
    document: window.document,
    dom: studyDom,
    getShaka: () => window.shaka,
    isDrmEnabled,
    loadSelectedMedia,
    state: mediaState
});

controller = createStudyApplication({
    alert: bindWindowFunction('alert'),
    client: platformClient,
    clock: {
        createDate: (...argumentsList) => new window.Date(...argumentsList),
        now: () => window.Date.now()
    },
    configureDownloads: createDownloadConfigurator(window.document),
    document: window.document,
    dom: studyDom,
    loadMedia: player.loadMedia,
    navigate: path => { window.location.href = path; },
    navigator: window.navigator,
    replaceNavigation: path => { window.location.replace(path); },
    renderCertificate: createCertificateRenderer(() => window.jspdf.jsPDF),
    session,
    timers: {
        clearInterval: bindWindowFunction('clearInterval'),
        setInterval: bindWindowFunction('setInterval')
    },
    window
});

void legacySessionSeconds;
controller.install();
