export function createStudySessionTimer({
    authoritativeSessionsEnabled = false,
    clock,
    document,
    navigate,
    session,
    timers,
    onAuthoritativeExpiry
}) {
    let activeTimerId;

    function authoritativeSecondsRemaining(status) {
        if (typeof clock.monotonicNow !== 'function') {
            throw new TypeError('A monotonic clock is required for authoritative session presentation');
        }
        const serverTime = clock.createDate(status.serverTime).getTime();
        const expiresAt = clock.createDate(status.expiresAt).getTime();
        const initialDuration = expiresAt - serverTime;
        const startedAt = clock.monotonicNow();
        if (
            !Number.isFinite(serverTime) ||
            !Number.isFinite(expiresAt) ||
            !Number.isFinite(initialDuration) ||
            initialDuration <= 0 ||
            !Number.isFinite(startedAt)
        ) {
            throw new TypeError('Authoritative session timing is invalid');
        }

        let elapsed = 0;
        return () => {
            const current = clock.monotonicNow();
            if (!Number.isFinite(current)) {
                throw new TypeError('Authoritative session timing is invalid');
            }
            elapsed = Math.max(elapsed, current - startedAt, 0);
            return Math.max(0, Math.floor((initialDuration - elapsed) / 1000));
        };
    }

    function legacySecondsRemaining() {
        const deadline = Number(session.read('sessionDeadline'));
        return () => Math.max(0, Math.floor((deadline - clock.now()) / 1000));
    }

    function start(status) {
        if (authoritativeSessionsEnabled && activeTimerId !== undefined) stop();
        const sessionTime = document.getElementById("Usuário-Tempo-Sessão");
        const readSecondsRemaining = authoritativeSessionsEnabled
            ? authoritativeSecondsRemaining(status)
            : legacySecondsRemaining();
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
                if (
                    authoritativeSessionsEnabled &&
                    typeof onAuthoritativeExpiry === 'function'
                ) {
                    onAuthoritativeExpiry();
                } else {
                    session.write('loggedIn', 'Não');
                    navigate('/plataforma/login');
                }
            }
        }, 1000);
        if (authoritativeSessionsEnabled) activeTimerId = timerId;
        return timerId;
    }

    function stop() {
        if (activeTimerId === undefined) return;
        timers.clearInterval(activeTimerId);
        activeTimerId = undefined;
    }

    return { start, stop };
}
