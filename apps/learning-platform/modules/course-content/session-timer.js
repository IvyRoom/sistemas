export function createStudySessionTimer({
    clock,
    document,
    session,
    timers,
    onExpiry
}) {
    let activeTimerId;

    function secondsRemaining() {
        const deadline = Number(session.read('sessionDeadline'));
        return () => Math.max(0, Math.floor((deadline - clock.now()) / 1000));
    }

    function start() {
        if (activeTimerId !== undefined) stop();
        const sessionTime = document.getElementById("Usuário-Tempo-Sessão");
        const readSecondsRemaining = secondsRemaining();
        const timerId = timers.setInterval(() => {
            const secondsRemaining = readSecondsRemaining();
            sessionTime.textContent = `Tempo Sessão: ${String((secondsRemaining / 3600 | 0)).padStart(2, "0")}:${String(((secondsRemaining % 3600) / 60 | 0)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
            if (secondsRemaining <= 600 && sessionTime.style.color !== "red") {
                sessionTime.style.color = "red";
            }
            if (secondsRemaining <= 300 && !sessionTime.classList.contains("Tempo-Sessão-Últimos-5min")) {
                sessionTime.classList.add("Tempo-Sessão-Últimos-5min");
            }
            if (secondsRemaining <= 0) {
                timers.clearInterval(timerId);
                if (activeTimerId === timerId) activeTimerId = undefined;
                onExpiry();
            }
        }, 1000);
        activeTimerId = timerId;
        return timerId;
    }

    function stop() {
        if (activeTimerId === undefined) return;
        timers.clearInterval(activeTimerId);
        activeTimerId = undefined;
    }

    return { start, stop };
}
