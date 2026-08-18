import { isMicrosoftEdge, redirectToDeviceWarning } from '../modules/lifecycle.js';
import { createPlatformClient } from '../modules/platform-client.js';
import { createSessionStore } from '../modules/session.js';
import { createStudyApplication } from '../modules/study/application.js';
import { createCertificateRenderer } from '../modules/study/certificate-renderer.js';
import { createStudyDom } from '../modules/study/dom.js';
import { createDownloadConfigurator } from '../modules/study/downloads.js';
import { createStudyPlayer } from '../modules/study/player.js';

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
const backendBase = session.read('backendBase');
let legacySessionSeconds;
const studyDom = createStudyDom(window.document, () => {
    legacySessionSeconds = session.read('legacySessionSeconds');
});
const platformClient = createPlatformClient({
    baseUrl: backendBase,
    fetch: window.fetch.bind(window),
    FormDataConstructor: window.FormData
});

let controller;
const mediaState = new Proxy({}, {
    get(_target, property) {
        return controller.state[property];
    }
});
const player = createStudyPlayer({
    alert: window.alert.bind(window),
    configureDrm,
    document: window.document,
    dom: studyDom,
    getShaka: () => window.shaka,
    isDrmEnabled,
    loadSelectedMedia,
    state: mediaState
});

controller = createStudyApplication({
    alert: window.alert.bind(window),
    client: platformClient,
    clock: {
        createDate: (...argumentsList) => new window.Date(...argumentsList),
        now: () => window.Date.now()
    },
    configureDownloads: createDownloadConfigurator(window.document),
    document: window.document,
    dom: studyDom,
    isMicrosoftEdge,
    loadMedia: player.loadMedia,
    navigate: path => { window.location.href = path; },
    navigator: window.navigator,
    redirectToDeviceWarning,
    renderCertificate: createCertificateRenderer(() => window.jspdf.jsPDF),
    session,
    timers: {
        clearInterval: window.clearInterval.bind(window),
        setInterval: window.setInterval.bind(window)
    },
    window
});

void legacySessionSeconds;
controller.install();
