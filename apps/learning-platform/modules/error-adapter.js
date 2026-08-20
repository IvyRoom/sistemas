export const learningPlatformErrorKinds = Object.freeze({
    APPLICATION_FAILURE: 'applicationFailure',
    FACE_COMPONENT_FAILURE: 'faceComponentFailure',
    FACE_LIVENESS_RESULT_READ_FAILURE: 'faceLivenessResultReadFailure',
    FACE_LIVENESS_SESSION_CREATION_FAILURE: 'faceLivenessSessionCreationFailure',
    FEEDBACK_APPEND_FAILURE: 'feedbackAppendFailure',
    HTTP_FAILURE: 'httpFailure',
    INVALID_CREDENTIALS: 'invalidCredentials',
    MALFORMED_RESPONSE: 'malformedResponse',
    PLATFORM_DATA_READ_FAILURE: 'platformDataReadFailure',
    PLATFORM_DATA_WRITE_FAILURE: 'platformDataWriteFailure',
    REFERENCE_PHOTO_READ_FAILURE: 'referencePhotoReadFailure',
    REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE: 'referencePhotoRegistrationUpdateFailure',
    REFERENCE_PHOTO_UPLOAD_FAILURE: 'referencePhotoUploadFailure',
    TRANSPORT_FAILURE: 'transportFailure',
    UNKNOWN_DOMAIN_FAILURE: 'unknownDomainFailure'
});

export const learningPlatformErrorOperations = Object.freeze({
    ASSESSMENT_UPDATE: 'assessmentUpdate',
    FACE_RESULT: 'faceResult',
    FACE_SESSION: 'faceSession',
    FEEDBACK: 'feedback',
    LOGIN: 'login',
    PROGRESS_UPDATE: 'progressUpdate',
    REFRESH: 'refresh',
    REGISTRATION: 'registration',
    STATUS_REPORT: 'statusReport'
});

export const learningPlatformErrorOwners = Object.freeze({
    BACKEND: 'backend',
    FRONTEND: 'frontend',
    UNKNOWN: 'unknown'
});

export const learningPlatformFutureWireValues = Object.freeze({
    FACE_LIVENESS_RESULT_READ_FAILURE: 'learning_platform.read_face_liveness_result_failed',
    FACE_LIVENESS_SESSION_CREATION_FAILURE: 'learning_platform.create_face_liveness_session_failed',
    FEEDBACK_APPEND_FAILURE: 'learning_platform.append_feedback_failed',
    PLATFORM_DATA_READ_FAILURE: 'learning_platform.read_platform_data_failed',
    PLATFORM_DATA_WRITE_FAILURE: 'learning_platform.update_platform_data_failed',
    REFERENCE_PHOTO_READ_FAILURE: 'learning_platform.read_reference_photo_failed',
    REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE: 'learning_platform.update_reference_photo_registration_failed',
    REFERENCE_PHOTO_UPLOAD_FAILURE: 'learning_platform.upload_reference_photo_failed'
});

const backendDefinitions = [
    {
        kind: learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE,
        legacy: 'Erro_001',
        named: learningPlatformFutureWireValues.PLATFORM_DATA_READ_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.REFERENCE_PHOTO_UPLOAD_FAILURE,
        legacy: 'Erro_002',
        named: learningPlatformFutureWireValues.REFERENCE_PHOTO_UPLOAD_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE,
        legacy: 'Erro_003',
        named: learningPlatformFutureWireValues.REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE,
        legacy: 'Erro_004',
        named: learningPlatformFutureWireValues.FACE_LIVENESS_SESSION_CREATION_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.REFERENCE_PHOTO_READ_FAILURE,
        legacy: 'Erro_005',
        named: learningPlatformFutureWireValues.REFERENCE_PHOTO_READ_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.FACE_LIVENESS_RESULT_READ_FAILURE,
        legacy: 'Erro_007',
        named: learningPlatformFutureWireValues.FACE_LIVENESS_RESULT_READ_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE,
        legacy: 'Erro_008',
        named: learningPlatformFutureWireValues.PLATFORM_DATA_WRITE_FAILURE
    },
    {
        kind: learningPlatformErrorKinds.FEEDBACK_APPEND_FAILURE,
        legacy: 'Erro_009',
        named: learningPlatformFutureWireValues.FEEDBACK_APPEND_FAILURE
    }
];

const frontendLegacyKinds = new Map([
    ['Erro_000', learningPlatformErrorKinds.APPLICATION_FAILURE],
    ['Erro_006', learningPlatformErrorKinds.FACE_COMPONENT_FAILURE]
]);
const backendDefinitionByValue = new Map();
backendDefinitions.forEach(definition => {
    backendDefinitionByValue.set(definition.legacy, definition);
    backendDefinitionByValue.set(definition.named, definition);
});

const allowedKindsByOperation = new Map([
    [learningPlatformErrorOperations.ASSESSMENT_UPDATE, new Set([
        learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE
    ])],
    [learningPlatformErrorOperations.FACE_RESULT, new Set([
        learningPlatformErrorKinds.FACE_LIVENESS_RESULT_READ_FAILURE
    ])],
    [learningPlatformErrorOperations.FACE_SESSION, new Set([
        learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE,
        learningPlatformErrorKinds.REFERENCE_PHOTO_READ_FAILURE
    ])],
    [learningPlatformErrorOperations.FEEDBACK, new Set([
        learningPlatformErrorKinds.FEEDBACK_APPEND_FAILURE,
        learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE
    ])],
    [learningPlatformErrorOperations.LOGIN, new Set([
        learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE
    ])],
    [learningPlatformErrorOperations.PROGRESS_UPDATE, new Set([
        learningPlatformErrorKinds.PLATFORM_DATA_WRITE_FAILURE
    ])],
    [learningPlatformErrorOperations.REFRESH, new Set([
        learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE
    ])],
    [learningPlatformErrorOperations.REGISTRATION, new Set([
        learningPlatformErrorKinds.FACE_LIVENESS_SESSION_CREATION_FAILURE,
        learningPlatformErrorKinds.REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE,
        learningPlatformErrorKinds.REFERENCE_PHOTO_UPLOAD_FAILURE
    ])],
    [learningPlatformErrorOperations.STATUS_REPORT, new Set([
        learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE
    ])]
]);

const knownKinds = new Set(Object.values(learningPlatformErrorKinds));
const knownOwners = new Set(Object.values(learningPlatformErrorOwners));

function normalizedFailure(kind, owner, status) {
    return Object.freeze({ kind, owner, status });
}

function isNormalizedFailure(error) {
    return Boolean(
        error &&
        knownKinds.has(error.kind) &&
        knownOwners.has(error.owner) &&
        Object.prototype.hasOwnProperty.call(error, 'status')
    );
}

function numericStatus(error) {
    return typeof error?.status === 'number' ? error.status : undefined;
}

export function normalizeLearningPlatformError(error, operation) {
    if (isNormalizedFailure(error)) return error;

    const status = numericStatus(error);
    if (operation === learningPlatformErrorOperations.LOGIN && status === 401) {
        return normalizedFailure(
            learningPlatformErrorKinds.INVALID_CREDENTIALS,
            learningPlatformErrorOwners.BACKEND,
            status
        );
    }

    const machineValue = typeof error?.error === 'string' ? error.error : undefined;
    if (machineValue !== undefined) {
        const definition = backendDefinitionByValue.get(machineValue);
        const allowedKinds = allowedKindsByOperation.get(operation);
        if (definition && allowedKinds?.has(definition.kind)) {
            return normalizedFailure(
                definition.kind,
                learningPlatformErrorOwners.BACKEND,
                status
            );
        }
        return normalizedFailure(
            learningPlatformErrorKinds.UNKNOWN_DOMAIN_FAILURE,
            learningPlatformErrorOwners.UNKNOWN,
            status
        );
    }

    if (status !== undefined) {
        return normalizedFailure(
            learningPlatformErrorKinds.HTTP_FAILURE,
            learningPlatformErrorOwners.FRONTEND,
            status
        );
    }

    return normalizedFailure(
        learningPlatformErrorKinds.APPLICATION_FAILURE,
        learningPlatformErrorOwners.FRONTEND,
        undefined
    );
}

export function normalizeLearningPlatformMalformedResponse(error) {
    void error;
    return normalizedFailure(
        learningPlatformErrorKinds.MALFORMED_RESPONSE,
        learningPlatformErrorOwners.FRONTEND,
        undefined
    );
}

export function normalizeLearningPlatformTransportError(error) {
    void error;
    return normalizedFailure(
        learningPlatformErrorKinds.TRANSPORT_FAILURE,
        learningPlatformErrorOwners.FRONTEND,
        undefined
    );
}

export function normalizeLearningPlatformLocalError(error, kind) {
    void error;
    if (
        kind !== learningPlatformErrorKinds.APPLICATION_FAILURE &&
        kind !== learningPlatformErrorKinds.FACE_COMPONENT_FAILURE
    ) {
        throw new TypeError('Unsupported learning-platform local error kind');
    }
    return normalizedFailure(kind, learningPlatformErrorOwners.FRONTEND, undefined);
}

export function normalizeLearningPlatformLegacyFrontendError(legacyValue) {
    const kind = frontendLegacyKinds.get(legacyValue);
    if (!kind) {
        return normalizedFailure(
            learningPlatformErrorKinds.UNKNOWN_DOMAIN_FAILURE,
            learningPlatformErrorOwners.UNKNOWN,
            undefined
        );
    }
    return normalizedFailure(kind, learningPlatformErrorOwners.FRONTEND, undefined);
}
