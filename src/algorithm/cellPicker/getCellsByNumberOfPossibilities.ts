import {CellDataWithPossibilites} from "../../model/CellData";
import {pickRandomArrayValue} from "../../utility/pickRandom";

/**
 * An array with two values:
 *
 * 0: the selected cell, enriched with the possible values for this cell
 * 1: index of the cell in a previously given arbitrary array of cells.
 */
export type CellDataAndIndex = [CellDataWithPossibilites, number];

/**
 * This function does not care about board geometry, so the `candidates`
 * argument may be an arbitrary subset of cells.
 * @param candidates
 */
export function getCellWithMinimumPossibilites(candidates: CellDataWithPossibilites[]): CellDataAndIndex {
    // Sort candidates by number of possible values (ignoring the value currently set).
    // Save original index in given array for later.
    const candidatesSortedDesc = candidatesSortedDescByPossibilitiesKeepOriginalIndex(candidates);
    //@ts-ignore This array has at least one member, checked before call.
    return candidatesSortedDesc.pop();
}

export const candidatesSortedDescByPossibilitiesKeepOriginalIndex = (candidates: CellDataWithPossibilites[]): CellDataAndIndex[] => candidates.map(
    (cell, index) => [cell, index] as CellDataAndIndex
).sort(
    (a, b) =>
        a[0].possibleValues.length < b[0].possibleValues.length ? 1 : -1
);

export const candidatesSortedDescByPossibilities = (candidates: CellDataWithPossibilites[]): CellDataWithPossibilites[] => candidates.slice().sort(
    (a, b) =>
        a.possibleValues.length < b.possibleValues.length ? 1 : -1
);

/**
 * This function does not care about board geometry, so the `candidates`
 * argument may be an arbitrary subset of cells.
 * @param candidates
 * @return CellDataAndIndex
 */
export function getCellWithFewPossibilites(candidates: CellDataWithPossibilites[]): CellDataAndIndex {
    // Sort candidates by number of possible values (ignoring the value currently set).
    // Save original index in given array for later.
    const candidatesSortedDesc = candidatesSortedDescByPossibilitiesKeepOriginalIndex(candidates);

    // MEDIUM: pick one of the two cells with min. possibilities, if possible
    if (candidatesSortedDesc.length > 1) {
        return candidatesSortedDesc.length > 1 ?
            pickRandomArrayValue(candidatesSortedDesc.slice(
                -2, candidatesSortedDesc.length
            )) : candidatesSortedDesc[0];
    }
    //@ts-ignore This array has at least one member, checked before call.
    return candidatesSortedDesc.pop();
}
