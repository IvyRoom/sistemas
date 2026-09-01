export const AUTHORITATIVE_SESSIONS_ENABLED = false;

export const AUTHENTICATION_PHASES = Object.freeze({
    AUTHENTICATED: 'authenticated',
    CREDENTIAL_VERIFIED: 'credential-verified',
    FACE_PENDING: 'face-pending',
    REGISTRATION_PENDING: 'registration-pending'
});

export const SESSION_NEXT_OPERATIONS = Object.freeze({
    FACE_CHALLENGE: 'face-challenge',
    FACE_COMPLETION: 'face-completion',
    PROTECTED_LEARNING: 'protected-learning',
    REGISTRATION_CHALLENGE: 'registration-challenge',
    REGISTRATION_ENROLLMENT: 'registration-enrollment',
    REVOKE_ALL: 'revoke-all'
});

export const SESSION_KEYS = Object.freeze({
    sessionDeadline: 'Horário-Encerramento-Sessão',
    verifiedIndex: 'IndexVerificado',
    deviceWarningOrigin: 'Origem_Aviso_Dispositivo',
    legacySessionSeconds: 'TempoSessão_Segundos',
    registrationAuthorization: 'Usuário_Autorização_Cadastro',
    registeredPhoto: 'Usuário_Foto_Cadastrada',
    loggedIn: 'Usuário_Logado'
});

export const LOGOUT_PRESENTATION_CHANNEL_NAME = 'machado-learning-platform-logout';

export const LOGOUT_PRESENTATION_MESSAGE = Object.freeze({
    type: 'logout',
    version: 1
});

const STATUS_KEYS = Object.freeze([
    'allowedNextOperations',
    'authenticationPhase',
    'eligibilityRevalidateAt',
    'expiresAt',
    'serverTime'
]);

function hasExactKeys(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const actual = Object.keys(value).sort();
    const expected = [...keys].sort();
    return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function requireCanonicalInstant(value, name) {
    if (typeof value !== 'string') throw new TypeError(`${name} must be a UTC instant`);
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
        throw new TypeError(`${name} must be a canonical UTC instant`);
    }
    return value;
}

function expectedOperationsFor(phase, operations) {
    if (phase === AUTHENTICATION_PHASES.CREDENTIAL_VERIFIED) {
        return operations.length === 1 && (
            operations[0] === SESSION_NEXT_OPERATIONS.REGISTRATION_ENROLLMENT ||
            operations[0] === SESSION_NEXT_OPERATIONS.FACE_CHALLENGE
        );
    }
    if (phase === AUTHENTICATION_PHASES.REGISTRATION_PENDING) {
        return operations.length === 1 &&
            operations[0] === SESSION_NEXT_OPERATIONS.REGISTRATION_CHALLENGE;
    }
    if (phase === AUTHENTICATION_PHASES.FACE_PENDING) {
        return operations.length === 1 &&
            operations[0] === SESSION_NEXT_OPERATIONS.FACE_COMPLETION;
    }
    if (phase === AUTHENTICATION_PHASES.AUTHENTICATED) {
        return operations.length === 2 &&
            operations[0] === SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING &&
            operations[1] === SESSION_NEXT_OPERATIONS.REVOKE_ALL;
    }
    return false;
}

export function readAuthoritativeSessionStatus(value) {
    if (!hasExactKeys(value, STATUS_KEYS)) {
        throw new TypeError('Authoritative session status has an invalid shape');
    }

    const operations = value.allowedNextOperations;
    if (
        !Array.isArray(operations) ||
        operations.some(operation => typeof operation !== 'string') ||
        !expectedOperationsFor(value.authenticationPhase, operations)
    ) {
        throw new TypeError('Authoritative session status has an invalid transition');
    }

    const status = {
        allowedNextOperations: Object.freeze([...operations]),
        authenticationPhase: value.authenticationPhase,
        eligibilityRevalidateAt: requireCanonicalInstant(
            value.eligibilityRevalidateAt,
            'eligibilityRevalidateAt'
        ),
        expiresAt: requireCanonicalInstant(value.expiresAt, 'expiresAt'),
        serverTime: requireCanonicalInstant(value.serverTime, 'serverTime')
    };
    return Object.freeze(status);
}

export function hasSessionNextOperation(status, operation) {
    return status.allowedNextOperations.includes(operation);
}

export function createSessionStore(storage) {
    return {
        read(keyName) {
            return storage.getItem(SESSION_KEYS[keyName]);
        },
        write(keyName, value) {
            storage.setItem(SESSION_KEYS[keyName], value);
        }
    };
}

function isLogoutPresentationMessage(value) {
    try {
        return Boolean(
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.keys(value).length === 2 &&
            value.type === LOGOUT_PRESENTATION_MESSAGE.type &&
            value.version === LOGOUT_PRESENTATION_MESSAGE.version
        );
    } catch {
        return false;
    }
}

export function createLogoutPresentationChannel({ createChannel }) {
    if (typeof createChannel !== 'function') {
        throw new TypeError('A BroadcastChannel factory is required');
    }

    let channel;
    let messageListener;
    let closed = false;
    let failed = false;
    let published = false;
    let received = false;

    function close() {
        if (closed) return;
        closed = true;
        if (channel && messageListener) {
            try {
                channel.removeEventListener('message', messageListener);
            } catch {
                failed = true;
            }
        }
        if (channel) {
            try {
                channel.close();
            } catch {
                failed = true;
            }
        }
        channel = undefined;
        messageListener = undefined;
    }

    function open() {
        if (channel) return true;
        if (closed || failed) return false;
        try {
            const candidate = createChannel(LOGOUT_PRESENTATION_CHANNEL_NAME);
            if (
                !candidate ||
                typeof candidate.addEventListener !== 'function' ||
                typeof candidate.removeEventListener !== 'function' ||
                typeof candidate.postMessage !== 'function' ||
                typeof candidate.close !== 'function'
            ) {
                throw new TypeError('BroadcastChannel is unavailable');
            }
            channel = candidate;
            return true;
        } catch {
            failed = true;
            return false;
        }
    }

    function listen(onLogout) {
        if (typeof onLogout !== 'function') {
            throw new TypeError('A logout presentation listener is required');
        }
        if (messageListener) return true;
        if (!open()) return false;

        messageListener = event => {
            let data;
            try {
                data = event && event.data;
            } catch {
                return;
            }
            if (received || !isLogoutPresentationMessage(data)) return;
            received = true;
            try {
                onLogout();
            } finally {
                close();
            }
        };
        try {
            channel.addEventListener('message', messageListener);
            return true;
        } catch {
            failed = true;
            messageListener = undefined;
            close();
            return false;
        }
    }

    function publish() {
        if (!open()) return false;
        try {
            channel.postMessage(LOGOUT_PRESENTATION_MESSAGE);
            published = true;
            return true;
        } catch {
            failed = true;
            close();
            return false;
        }
    }

    function snapshot() {
        return Object.freeze({
            available: Boolean(channel) && !closed && !failed,
            closed,
            failed,
            published,
            received
        });
    }

    return Object.freeze({ close, listen, publish, snapshot });
}
