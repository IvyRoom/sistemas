export const STUDY_MODULE_TOPIC_COUNTS = Object.freeze([
    13, 17, 21, 20, 19, 10, 14, 24, 19, 14
]);

export const STUDY_TOPIC_COUNT = STUDY_MODULE_TOPIC_COUNTS.reduce(
    (total, count) => total + count,
    0
);

export function createStudyState(initial = {}) {
    const observers = new Set();
    const values = {
        authoritativeSessionStatus: undefined,
        openModule: undefined,
        verifiedIndex: undefined,
        fullName: undefined,
        firstName: undefined,
        email: undefined,
        accessDeadline: undefined,
        loginStatus: undefined,
        completedTopics: undefined,
        moduleGrades: undefined,
        accumulatedGrade: undefined,
        certificateId: undefined,
        player: undefined,
        playerUi: undefined,
        playerLoaded: false,
        ...initial
    };

    const state = new Proxy(values, {
        set(target, property, value) {
            target[property] = value;
            observers.forEach(observer => observer(property, value));
            return true;
        }
    });

    return {
        observe(observer) {
            observers.add(observer);
            return () => observers.delete(observer);
        },
        snapshot() {
            return {
                ...values,
                moduleGrades: Array.isArray(values.moduleGrades)
                    ? [...values.moduleGrades]
                    : values.moduleGrades
            };
        },
        state
    };
}
