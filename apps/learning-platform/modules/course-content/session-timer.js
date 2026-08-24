export function createStudySessionTimer({ clock, document, navigate, session, timers }) {
    function start() {
        const sessionTime = document.getElementById("Usuário-Tempo-Sessão");
        const deadline = Number(session.read('sessionDeadline'));
        const timerId = timers.setInterval(() => {
            const secondsRemaining = Math.max(0, Math.floor((deadline - clock.now()) / 1000));
            sessionTime.textContent = `Tempo Sessão: ${String((secondsRemaining / 3600 | 0)).padStart(2, "0")}:${String(((secondsRemaining % 3600) / 60 | 0)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
            if (secondsRemaining <= 600 && sessionTime.style.color !== "red") {
                sessionTime.style.color = "red";
            }
            if (secondsRemaining <= 300 && !sessionTime.classList.contains("Tempo-Sessão-Últimos-5min")) {
                sessionTime.classList.add("Tempo-Sessão-Últimos-5min");
            }
            if (secondsRemaining <= 0) {
                timers.clearInterval(timerId);
                session.write('loggedIn', 'Não');
                navigate('/plataforma/login');
            }
        }, 1000);
        return timerId;
    }

    return { start };
}
