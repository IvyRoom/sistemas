sessionStorage.setItem('Origem_Aviso_Dispositivo', 'Sim');

const MAX_ENCODED_RETURN_TO_LENGTH = 2048;
const FALLBACK_RETURN_TARGET = '/plataforma/login/';
const approvedReturnPathnames = Object.freeze([
    '/plataforma/login',
    '/plataforma/login/',
    '/plataforma/avisos-iniciais',
    '/plataforma/avisos-iniciais/',
    '/plataforma/cadastro-foto',
    '/plataforma/cadastro-foto/',
    '/plataforma/estudo',
    '/plataforma/estudo/',
    '/plataforma/statusreport',
    '/plataforma/statusreport/',
    '/formulario-informacoes-iniciais',
    '/formulario-informacoes-iniciais/'
]);

function readValidatedReturnTarget(search) {
    if (typeof search !== 'string' || search.length <= 1) return undefined;

    let encodedReturnTo;
    let returnToCount = 0;
    for (const parameter of search.slice(1).split('&')) {
        const separatorIndex = parameter.indexOf('=');
        const encodedName = separatorIndex === -1
            ? parameter
            : parameter.slice(0, separatorIndex);
        let name;
        try {
            name = decodeURIComponent(encodedName.replace(/\+/g, ' '));
        } catch {
            continue;
        }
        if (name !== 'returnTo') continue;

        returnToCount += 1;
        if (returnToCount > 1 || separatorIndex === -1) return undefined;
        encodedReturnTo = parameter.slice(separatorIndex + 1);
    }

    if (
        returnToCount !== 1 ||
        encodedReturnTo.length === 0 ||
        encodedReturnTo.length > MAX_ENCODED_RETURN_TO_LENGTH
    ) {
        return undefined;
    }

    let returnTarget;
    try {
        returnTarget = decodeURIComponent(encodedReturnTo);
        if (encodeURIComponent(returnTarget) !== encodedReturnTo) return undefined;
    } catch {
        return undefined;
    }

    if (/[\u0000-\u001f\u007f]/.test(returnTarget)) return undefined;

    const queryIndex = returnTarget.indexOf('?');
    const fragmentIndex = returnTarget.indexOf('#');
    const pathnameEnd = Math.min(
        queryIndex === -1 ? returnTarget.length : queryIndex,
        fragmentIndex === -1 ? returnTarget.length : fragmentIndex
    );
    const pathname = returnTarget.slice(0, pathnameEnd);
    return approvedReturnPathnames.includes(pathname) ? returnTarget : undefined;
}

const returnTarget = readValidatedReturnTarget(window.location.search);
let recoveryPerformed = false;

function recoverFromViewportWarning() {
    if (recoveryPerformed || window.innerWidth <= 1024) return;
    recoveryPerformed = true;
    window.location.replace(returnTarget ?? FALLBACK_RETURN_TARGET);
}

window.addEventListener('resize', recoverFromViewportWarning);
recoverFromViewportWarning();
