/**
 * not very precise because of function nesting and other factors,
 * but good enough for a rough A/B comparison
 */
export default function measureRepeatedExecution(fn: Function, n: number, name: string): number {
    performance.mark(`${name}A`);
    for (let i = 0; i < n; i++) {
        fn();
    }
    performance.mark(`${name}B`);
    performance.measure(name, `${name}A`, `${name}B`)
    const res = performance.getEntriesByName(name)[0].duration;
    performance.clearMarks();
    performance.clearMeasures();
    return res;
}