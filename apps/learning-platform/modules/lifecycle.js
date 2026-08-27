export const browserAdmissionEntries = Object.freeze({
    INITIAL_NOTICES: 'initial-notices',
    LOGIN: 'login',
    PHOTO_REGISTRATION: 'photo-registration',
    STUDY: 'study'
});

export const browserAdmissionOutcomes = Object.freeze({
    CANDIDATE: 'candidate',
    UNSUPPORTED: 'unsupported',
    UNVERIFIED: 'unverified'
});

export const browserAdmissionReasons = Object.freeze({
    CAPABILITY_EVIDENCE_UNAVAILABLE: 'capability-evidence-unavailable',
    CONFLICTING_BROWSER_EVIDENCE: 'conflicting-browser-evidence',
    CONFLICTING_PLATFORM_EVIDENCE: 'conflicting-platform-evidence',
    INSECURE_CONTEXT: 'insecure-context',
    INSUFFICIENT_BROWSER_EVIDENCE: 'insufficient-browser-evidence',
    INSUFFICIENT_PLATFORM_EVIDENCE: 'insufficient-platform-evidence',
    MISSING_MANDATORY_API: 'missing-mandatory-api',
    UNSUPPORTED_BROWSER_FAMILY: 'unsupported-browser-family',
    UNSUPPORTED_EMBEDDED_BROWSER: 'unsupported-embedded-browser',
    UNSUPPORTED_MOBILE_ENVIRONMENT: 'unsupported-mobile-environment',
    UNSUPPORTED_PLATFORM: 'unsupported-platform',
    WINDOWS_EDGE_CANDIDATE: 'windows-edge-candidate'
});

const baseRequirements = Object.freeze([
    ['dom', ({ document }) => typeof document?.getElementById === 'function'],
    ['events', ({ window }) => typeof window?.addEventListener === 'function'],
    ['session-storage', ({ window }) =>
        typeof window?.sessionStorage?.getItem === 'function' &&
        typeof window?.sessionStorage?.setItem === 'function']
]);

const apiRequirements = Object.freeze([
    ['fetch', ({ window }) => typeof window?.fetch === 'function'],
    ['json', ({ window }) => typeof window?.JSON?.parse === 'function'],
    ['promise', ({ window }) => typeof window?.Promise === 'function'],
    ['url', ({ window }) => typeof window?.URL === 'function']
]);

const faceRequirements = Object.freeze([
    ['bigint', ({ window }) => typeof window?.BigInt === 'function'],
    ['camera-api', ({ navigator }) => typeof navigator?.mediaDevices?.getUserMedia === 'function'],
    ['canvas', ({ window }) => typeof window?.HTMLCanvasElement?.prototype?.getContext === 'function'],
    ['constructable-stylesheets', ({ document, window }) =>
        typeof window?.CSSStyleSheet === 'function' &&
        typeof window?.CSSStyleSheet?.prototype?.replaceSync === 'function' &&
        document !== null &&
        typeof document === 'object' &&
        'adoptedStyleSheets' in document &&
        typeof window?.ShadowRoot === 'function' &&
        'adoptedStyleSheets' in window.ShadowRoot.prototype],
    ['custom-elements', ({ window }) => typeof window?.customElements?.define === 'function'],
    ['shadow-dom', ({ window }) => typeof window?.Element?.prototype?.attachShadow === 'function'],
    ['webassembly', ({ window }) => typeof window?.WebAssembly?.validate === 'function'],
    ['web-crypto', ({ window }) =>
        typeof window?.crypto?.getRandomValues === 'function' &&
        typeof window?.crypto?.subtle === 'object']
]);

const registrationRequirements = Object.freeze([
    ['file', ({ window }) => typeof window?.File === 'function'],
    ['form-data', ({ window }) => typeof window?.FormData === 'function']
]);

const studyRequirements = Object.freeze([
    ['date', ({ window }) =>
        typeof window?.Date === 'function' && typeof window?.Date?.now === 'function'],
    ['encrypted-media', ({ navigator }) =>
        typeof navigator?.requestMediaKeySystemAccess === 'function'],
    ['media-element', ({ window }) => typeof window?.HTMLMediaElement?.prototype?.play === 'function'],
    ['media-source', ({ window }) => typeof window?.MediaSource?.isTypeSupported === 'function'],
    ['timers', ({ window }) =>
        typeof window?.clearInterval === 'function' && typeof window?.setInterval === 'function']
]);

const requirementsByEntry = Object.freeze({
    [browserAdmissionEntries.INITIAL_NOTICES]: baseRequirements,
    [browserAdmissionEntries.LOGIN]: [...baseRequirements, ...apiRequirements, ...faceRequirements],
    [browserAdmissionEntries.PHOTO_REGISTRATION]: [
        ...baseRequirements,
        ...apiRequirements,
        ...registrationRequirements,
        ...faceRequirements
    ],
    [browserAdmissionEntries.STUDY]: [...baseRequirements, ...apiRequirements, ...studyRequirements]
});

function readSafely(reader) {
    try {
        return reader();
    } catch {
        return undefined;
    }
}

function normalizeBrandFamily(brand) {
    const normalizedBrand = typeof brand === 'string' ? brand.trim().toLowerCase() : '';
    if (
        normalizedBrand === '' ||
        normalizedBrand === 'chromium' ||
        /not.?a?.?brand/.test(normalizedBrand)
    ) {
        return undefined;
    }
    if (normalizedBrand === 'microsoft edge') return 'edge';
    if (normalizedBrand === 'google chrome') return 'chrome';
    if (normalizedBrand.includes('firefox')) return 'firefox';
    if (normalizedBrand.includes('safari')) return 'safari';
    if (
        normalizedBrand.includes('brave') ||
        normalizedBrand.includes('opera') ||
        normalizedBrand.includes('samsung') ||
        normalizedBrand.includes('vivaldi') ||
        normalizedBrand.includes('yandex')
    ) {
        return 'other-chromium';
    }
    return undefined;
}

function classifyBrandHints(navigator) {
    const brands = readSafely(() => navigator?.userAgentData?.brands);
    if (!Array.isArray(brands)) return { family: undefined, conflicting: false };

    const families = new Set();
    for (const brand of brands) {
        const family = normalizeBrandFamily(readSafely(() => brand?.brand));
        if (family) families.add(family);
    }
    return {
        family: families.size === 1 ? [...families][0] : undefined,
        conflicting: families.size > 1
    };
}

function classifyUserAgentFamily(userAgent) {
    const embedded = /\b(?:WebView|wv)\b/i.test(userAgent);
    const edge = /\bEdg(?:A|iOS)?[/]/i.test(userAgent);
    const otherChromium = /\b(?:OPR|Opera|Vivaldi|YaBrowser|SamsungBrowser)[/]/i.test(
        userAgent
    );
    const chrome = /\b(?:Chrome|CriOS)[/]/i.test(userAgent);
    const chromium = /\bChromium[/]/i.test(userAgent);
    const families = new Set();

    if (/\b(?:MSIE|Trident)\b/i.test(userAgent)) families.add('internet-explorer');
    if (edge) families.add('edge');
    if (otherChromium) families.add('other-chromium');
    if (/\b(?:Firefox|FxiOS)[/]/i.test(userAgent)) families.add('firefox');
    if (/\bVersion[/][^ ]+.*\bSafari[/]/i.test(userAgent)) families.add('safari');
    if (chrome && !edge && !otherChromium) families.add('chrome');
    if (chromium && !edge && !otherChromium && !chrome) families.add('other-chromium');

    return {
        conflicting: families.size > 1,
        embedded,
        family: families.size === 1 ? [...families][0] : undefined
    };
}

function normalizePlatform(platform) {
    const normalizedPlatform = typeof platform === 'string' ? platform.trim().toLowerCase() : '';
    if (normalizedPlatform === 'windows') return 'windows';
    if (normalizedPlatform === 'macos') return 'macos';
    if (normalizedPlatform === 'linux') return 'linux';
    if (normalizedPlatform === 'android') return 'android';
    if (normalizedPlatform === 'ios') return 'ios';
    if (normalizedPlatform === 'chrome os') return 'chromeos';
    return undefined;
}

function classifyUserAgentPlatform(userAgent) {
    const android = /\bAndroid\b|\bEdgA[/]/i.test(userAgent);
    const chromeOs = /\bCrOS\b/i.test(userAgent);
    const ios = /\b(?:iPhone|iPad|iPod)\b|\b(?:EdgiOS|CriOS|FxiOS)[/]/i.test(userAgent);
    const windowsMobile = /\bWindows Phone\b/i.test(userAgent);
    const platforms = new Set();

    if (windowsMobile) platforms.add('windows-mobile');
    if (/\bWindows NT\b/i.test(userAgent) && !windowsMobile) platforms.add('windows');
    if (android) platforms.add('android');
    if (ios) platforms.add('ios');
    if (/\bMacintosh\b/i.test(userAgent)) platforms.add('macos');
    if (chromeOs) platforms.add('chromeos');
    if (/\bLinux\b/i.test(userAgent) && !android && !chromeOs) platforms.add('linux');

    const mobile = android || ios || windowsMobile || /\bMobile\b/i.test(userAgent);
    return {
        conflicting: platforms.size > 1,
        mobile: mobile ? true : platforms.size > 0 ? false : undefined,
        platform: platforms.size === 1 ? [...platforms][0] : undefined
    };
}

function createResult(outcome, reasonCode, {
    browserFamily = 'unknown',
    missingCapabilities = [],
    platform = 'unknown'
} = {}) {
    return Object.freeze({
        browserFamily,
        missingCapabilities: Object.freeze([...missingCapabilities]),
        outcome,
        platform,
        reasonCode
    });
}

function inspectRequirements(entry, environment) {
    const missingCapabilities = [];
    const unreadableCapabilities = [];

    for (const [name, inspect] of requirementsByEntry[entry]) {
        try {
            if (!inspect(environment)) missingCapabilities.push(name);
        } catch {
            unreadableCapabilities.push(name);
        }
    }
    return { missingCapabilities, unreadableCapabilities };
}

export function classifyBrowserAdmission({ document, entry, navigator, window }) {
    if (!requirementsByEntry[entry]) {
        throw new TypeError(`Unknown browser-admission entry: ${entry}`);
    }

    const userAgent = readSafely(() => navigator?.userAgent);
    const usableUserAgent = typeof userAgent === 'string' ? userAgent : '';
    const brandHints = classifyBrandHints(navigator);
    const hintedPlatform = normalizePlatform(readSafely(() => navigator?.userAgentData?.platform));
    const userAgentBrowser = classifyUserAgentFamily(usableUserAgent);
    const userAgentEnvironment = classifyUserAgentPlatform(usableUserAgent);
    const userAgentFamily = userAgentBrowser.family;
    const userAgentPlatform = userAgentEnvironment.platform;
    const mobileHintValue = readSafely(() => navigator?.userAgentData?.mobile);
    const mobileHint = typeof mobileHintValue === 'boolean' ? mobileHintValue : undefined;
    const embeddedApi = readSafely(() => window?.chrome?.webview);

    if (
        userAgentBrowser.embedded ||
        (embeddedApi !== null && typeof embeddedApi === 'object')
    ) {
        return createResult(
            browserAdmissionOutcomes.UNSUPPORTED,
            browserAdmissionReasons.UNSUPPORTED_EMBEDDED_BROWSER,
            { browserFamily: 'embedded', platform: hintedPlatform ?? userAgentPlatform }
        );
    }

    if (
        brandHints.conflicting ||
        userAgentBrowser.conflicting ||
        (brandHints.family && userAgentFamily && brandHints.family !== userAgentFamily)
    ) {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.CONFLICTING_BROWSER_EVIDENCE,
            { browserFamily: 'conflicting', platform: hintedPlatform ?? userAgentPlatform }
        );
    }

    if (
        userAgentEnvironment.conflicting ||
        (hintedPlatform && userAgentPlatform && hintedPlatform !== userAgentPlatform) ||
        (
            mobileHint !== undefined &&
            userAgentEnvironment.mobile !== undefined &&
            userAgentEnvironment.mobile !== mobileHint &&
            usableUserAgent !== ''
        )
    ) {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.CONFLICTING_PLATFORM_EVIDENCE,
            {
                browserFamily: brandHints.family ?? userAgentFamily,
                platform: 'conflicting'
            }
        );
    }

    const browserFamily = brandHints.family ?? userAgentFamily;
    const platform = hintedPlatform ?? userAgentPlatform;

    const mobile = mobileHint ?? userAgentEnvironment.mobile;

    if (mobile && platform === 'windows') {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.CONFLICTING_PLATFORM_EVIDENCE,
            { browserFamily, platform: 'conflicting' }
        );
    }

    if (mobile || ['android', 'ios', 'windows-mobile'].includes(platform)) {
        return createResult(
            browserAdmissionOutcomes.UNSUPPORTED,
            browserAdmissionReasons.UNSUPPORTED_MOBILE_ENVIRONMENT,
            { browserFamily, platform }
        );
    }

    if (platform && platform !== 'windows') {
        return createResult(
            browserAdmissionOutcomes.UNSUPPORTED,
            browserAdmissionReasons.UNSUPPORTED_PLATFORM,
            { browserFamily, platform }
        );
    }

    if (browserFamily && browserFamily !== 'edge') {
        return createResult(
            browserAdmissionOutcomes.UNSUPPORTED,
            browserAdmissionReasons.UNSUPPORTED_BROWSER_FAMILY,
            { browserFamily, platform }
        );
    }

    if (!browserFamily) {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.INSUFFICIENT_BROWSER_EVIDENCE,
            { platform }
        );
    }

    if (!platform) {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.INSUFFICIENT_PLATFORM_EVIDENCE,
            { browserFamily }
        );
    }

    if (
        [browserAdmissionEntries.LOGIN, browserAdmissionEntries.PHOTO_REGISTRATION,
            browserAdmissionEntries.STUDY].includes(entry) &&
        readSafely(() => window?.isSecureContext) !== true
    ) {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.INSECURE_CONTEXT,
            { browserFamily, missingCapabilities: ['secure-context'], platform }
        );
    }

    const { missingCapabilities, unreadableCapabilities } = inspectRequirements(entry, {
        document,
        navigator,
        window
    });
    if (unreadableCapabilities.length > 0) {
        return createResult(
            browserAdmissionOutcomes.UNVERIFIED,
            browserAdmissionReasons.CAPABILITY_EVIDENCE_UNAVAILABLE,
            { browserFamily, missingCapabilities: unreadableCapabilities, platform }
        );
    }
    if (missingCapabilities.length > 0) {
        return createResult(
            browserAdmissionOutcomes.UNSUPPORTED,
            browserAdmissionReasons.MISSING_MANDATORY_API,
            { browserFamily, missingCapabilities, platform }
        );
    }

    return createResult(
        browserAdmissionOutcomes.CANDIDATE,
        browserAdmissionReasons.WINDOWS_EDGE_CANDIDATE,
        { browserFamily, platform }
    );
}

export function redirectToDeviceWarning({ window, navigate }) {
    if (window.innerWidth <= 1024) navigate('/plataforma/aviso-dispositivo');
}
