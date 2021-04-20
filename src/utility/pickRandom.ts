/**
 * pick a random array value. note that the domain of Math.random() does NOT include 1,
 * so for a correct distribution (disregarding the bad PRNG), NEVER subtract 1 from arr.length.
 * @param arr
 */
export default function pickRandomArrayValue<T>(arr: T[]): T|undefined {
    if (!arr.length) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}