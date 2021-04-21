/**
 * simple equality test for typed arrays.
 * @param arr1
 * @param arr2
 */
export default function arraysEqualSimple<T>(arr1: T[], arr2: T[]) {
    return arr1.length === arr2.length &&
        arr1.every((val, index) => arr2[index] === val);
}