/*
 * pick a random array value or index. note that the domain of Math.random() does NOT include 1,
 * so for a correct distribution (disregarding the bad PRNG), NEVER subtract 1 from arr.length.
 */

export function pickRandomArrayValue<T>(arr: T[]): T {
    if (arr.length < 1) throw new Error();
    return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomArrayIndex(arr: any[]): number {
    return Math.floor(Math.random() * arr.length);
}