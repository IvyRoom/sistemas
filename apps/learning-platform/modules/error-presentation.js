export const learningPlatformErrorPresentations = Object.freeze({
    FEEDBACK_APPEND: 'feedbackAppend',
    GENERIC_SERVER_RETRY: 'genericServerRetry',
    LOGIN_FACE_COMPONENT: 'loginFaceComponent',
    LOGIN_FACE_RESULT: 'loginFaceResult',
    LOGIN_FACE_SESSION: 'loginFaceSession',
    LOGIN_FACE_SESSION_GENERIC: 'loginFaceSessionGeneric',
    LOGIN_REFERENCE_PHOTO: 'loginReferencePhoto',
    PLATFORM_DATA_RETRY: 'platformDataRetry',
    PLATFORM_DATA_WRITE: 'platformDataWrite',
    REGISTRATION_FACE_COMPONENT: 'registrationFaceComponent',
    REGISTRATION_FACE_RESULT: 'registrationFaceResult',
    REGISTRATION_FACE_RESULT_GENERIC: 'registrationFaceResultGeneric',
    REGISTRATION_FACE_SESSION: 'registrationFaceSession',
    REGISTRATION_PHOTO_REGISTRATION_UPDATE: 'registrationPhotoRegistrationUpdate',
    REGISTRATION_PHOTO_UPLOAD: 'registrationPhotoUpload',
    REGISTRATION_REQUEST_GENERIC: 'registrationRequestGeneric',
    STUDY_REFRESH_GENERIC: 'studyRefreshGeneric',
    STUDY_REFRESH_PLATFORM_DATA: 'studyRefreshPlatformData'
});

const messages = Object.freeze({
    [learningPlatformErrorPresentations.FEEDBACK_APPEND]: 'Erro_009: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.',
    [learningPlatformErrorPresentations.GENERIC_SERVER_RETRY]: 'Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.',
    [learningPlatformErrorPresentations.LOGIN_FACE_COMPONENT]: 'Erro_006: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.',
    [learningPlatformErrorPresentations.LOGIN_FACE_RESULT]: 'Erro_007: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.',
    [learningPlatformErrorPresentations.LOGIN_FACE_SESSION]: 'Erro_004: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.',
    [learningPlatformErrorPresentations.LOGIN_FACE_SESSION_GENERIC]: 'Erro_000: Verifique sua conexão com a internet.',
    [learningPlatformErrorPresentations.LOGIN_REFERENCE_PHOTO]: 'Erro_005: falha ao obter sua foto de referência.\nTente novamente.',
    [learningPlatformErrorPresentations.PLATFORM_DATA_RETRY]: 'Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente.',
    [learningPlatformErrorPresentations.PLATFORM_DATA_WRITE]: 'Erro_008: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_FACE_COMPONENT]: 'Erro_006. Aguarde 2min e tente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_FACE_RESULT]: 'Erro_007. Tente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_FACE_RESULT_GENERIC]: 'Erro_000. Tente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_FACE_SESSION]: 'Erro_004. Tente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_PHOTO_REGISTRATION_UPDATE]: 'Erro_003. Tente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_PHOTO_UPLOAD]: 'Erro_002. Tente novamente.',
    [learningPlatformErrorPresentations.REGISTRATION_REQUEST_GENERIC]: 'Erro_000. Verifique sua conexão com a internet.',
    [learningPlatformErrorPresentations.STUDY_REFRESH_GENERIC]: 'Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e então atualize a página.',
    [learningPlatformErrorPresentations.STUDY_REFRESH_PLATFORM_DATA]: 'Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nAtualize a página.'
});

export function learningPlatformErrorMessage(presentation) {
    const message = messages[presentation];
    if (message === undefined) {
        throw new TypeError('Unknown learning-platform error presentation');
    }
    return message;
}
