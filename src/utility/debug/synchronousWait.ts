// noinspection JSUnusedGlobalSymbols
/**
 * should not be used anywhere except for debugging.
 * @param ms
 */
export const busyWait = (ms: number) => {
    const start = Date.now();
    let now = start;
    while (now - start < ms) {
        now = Date.now();
    }
}