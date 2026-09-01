export const SESSION_KEYS = Object.freeze({
    sessionDeadline: 'Horário-Encerramento-Sessão',
    verifiedIndex: 'IndexVerificado',
    deviceWarningOrigin: 'Origem_Aviso_Dispositivo',
    legacySessionSeconds: 'TempoSessão_Segundos',
    registrationAuthorization: 'Usuário_Autorização_Cadastro',
    registeredPhoto: 'Usuário_Foto_Cadastrada',
    loggedIn: 'Usuário_Logado'
});

export function createSessionStore(storage) {
    return {
        read(keyName) {
            return storage.getItem(SESSION_KEYS[keyName]);
        },
        remove(keyName) {
            storage.removeItem(SESSION_KEYS[keyName]);
        },
        write(keyName, value) {
            storage.setItem(SESSION_KEYS[keyName], value);
        }
    };
}
