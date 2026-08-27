export function createInitialNoticesApplication({
    document,
    isMicrosoftEdge,
    navigate,
    navigator,
    redirectToDeviceWarning,
    requiredAcknowledgements,
    session,
    window
}) {
    function handleDeviceWidth() {
        redirectToDeviceWarning({ window, navigate });
    }

    function handleLoad() {
        session.write('deviceWarningOrigin', 'Não');

        if (isMicrosoftEdge(navigator) === false) {
            navigate('/plataforma/aviso-navegador');
        } else {
            if (session.read('registrationAuthorization') !== 'Sim') {
                navigate('/plataforma/login');
            } else {
                handleDeviceWidth();
            }
        }
    }

    function install() {
        window.addEventListener('resize', handleDeviceWidth);
        window.addEventListener('load', handleLoad);

        const credentialsPassword = document.getElementById('Palavra-Passe-Credenciais');
        const rightsPassword = document.getElementById('Palavra-Passe-Direitos');
        const windowPassword = document.getElementById('Palavra-Passe-Janela');
        const credentialsAlert = document.getElementById('Alerta-Palavra-Passe-Credenciais');
        const rightsAlert = document.getElementById('Alerta-Palavra-Passe-Direitos');
        const windowAlert = document.getElementById('Alerta-Palavra-Passe-Janela');
        const agreementButton = document.getElementById('Botão-Li-e-Concordo');

        document.getElementById('Formulário').addEventListener('submit', function (event) {
            document.body.style.cursor = 'wait';
            event.preventDefault();
            agreementButton.style.display = 'none';
            const invalidFields = [];

            if (credentialsPassword.value !== requiredAcknowledgements.credentials) {
                document.getElementById('Alerta-Palavra-Passe-Credenciais').style.display = 'block';
                credentialsPassword.setAttribute('aria-invalid', 'true');
                invalidFields.push(credentialsPassword);
            }
            if (rightsPassword.value !== requiredAcknowledgements.rights) {
                document.getElementById('Alerta-Palavra-Passe-Direitos').style.display = 'block';
                rightsPassword.setAttribute('aria-invalid', 'true');
                invalidFields.push(rightsPassword);
            }
            if (windowPassword.value !== requiredAcknowledgements.window) {
                document.getElementById('Alerta-Palavra-Passe-Janela').style.display = 'block';
                windowPassword.setAttribute('aria-invalid', 'true');
                invalidFields.push(windowPassword);
            }

            if (
                credentialsPassword.value === requiredAcknowledgements.credentials &&
                rightsPassword.value === requiredAcknowledgements.rights &&
                windowPassword.value === requiredAcknowledgements.window
            ) {
                navigate('/plataforma/cadastro-foto');
            } else {
                document.body.style.cursor = 'default';
                invalidFields[0].focus();
            }
        });

        function resetAcknowledgementAlerts() {
            credentialsAlert.style.display = 'none';
            rightsAlert.style.display = 'none';
            windowAlert.style.display = 'none';
            credentialsPassword.setAttribute('aria-invalid', 'false');
            rightsPassword.setAttribute('aria-invalid', 'false');
            windowPassword.setAttribute('aria-invalid', 'false');
            agreementButton.style.display = 'block';
        }

        credentialsPassword.addEventListener('change', function () {
            resetAcknowledgementAlerts();
        });
        rightsPassword.addEventListener('change', function () {
            resetAcknowledgementAlerts();
        });
        windowPassword.addEventListener('change', function () {
            resetAcknowledgementAlerts();
        });
    }

    return { install };
}
