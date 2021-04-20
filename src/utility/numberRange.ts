/**
 * inclusive int range
 * @param start
 * @param end
 * @param step
 */
export default function intRange(start: number, end: number, step = 1) {
    const res = [];
    let i = Math.floor(start);
    while (i <= Math.floor(end)) {
        res.push(i);
        i += step;
    }
    return res;
}