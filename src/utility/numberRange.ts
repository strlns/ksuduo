/*
 * inclusive int range
 */
export default function intRange(start: number, end: number, step = 1, forceIncludeEnd = false) {
    const res = [];
    let i = Math.floor(start);
    while (i <= Math.floor(end)) {
        res.push(i);
        i += step;
    }
    if (forceIncludeEnd && step !== 1 && res.length > 0 && res[res.length - 1] !== end) {
        res.push(end);
    }
    return res;
}