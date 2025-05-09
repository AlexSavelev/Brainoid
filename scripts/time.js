export function timestamp() {
    return globalThis.performance && globalThis.performance.now
        ? globalThis.performance.now()
        : new Date().getTime();
}
