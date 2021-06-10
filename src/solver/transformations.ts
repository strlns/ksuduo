/*
Get cell where a possible value occurs uniquely within
a given array of cells and their possible values
 */
import {CellDataWithPossibilites, NonEmptyCellValues} from "../model/CellData";
import {CellWithNewValue} from "../algorithm/solver/humanTechniques";
import {getCountOfPossibleValues} from "../algorithm/solver/transformations";
import {pickRandomArrayValue} from "../utility/pickRandom";

// export function getCellWithUniquePossibleValue(
//     cellsWithP: CellDataWithPossibilites[],
//     possibilitiesCount?: PossibilityCountHash
// ): CellWithNewValue | undefined {
//     const possibilities = possibilitiesCount ?? getCountOfPossibleValues(cellsWithP);
//     const entriesOccurringOneTime = Object.entries(possibilities).filter(
//         entry => entry[1] === 1
//     );
//     const valueAsString = entriesOccurringOneTime.length > 0 ? entriesOccurringOneTime[0][0] : undefined;
//     if (valueAsString !== undefined) {
//         const value = +valueAsString as CellValue;
//         const cell = cellsWithP.find(cell => cell.possibleValues.includes(value));
//         if (cell === undefined) {
//             throw new Error();
//         }
//         return [cell, value];
//     }
// }

export function getCellWithUniquePossibleValue(
    cellsWithP: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    const entries = getCellsWithUniquePossibleValue(cellsWithP);
    return entries.length > 0 ? pickRandomArrayValue(entries) : undefined;
}

export function getCellsWithUniquePossibleValue(
    cellsWithP: CellDataWithPossibilites[]
): CellWithNewValue[] {
    const res: CellWithNewValue[] = [];
    const counts = getCountOfPossibleValues(cellsWithP);
    for (const val of NonEmptyCellValues) {
        if (counts.get(val) === 1) {
            const cells = cellsWithP.filter(cellWithP => cellWithP.possibleValues.includes(val));
            const cellsWithNewVals = cells.map(cellWithP => ([cellWithP, val] as CellWithNewValue));
            res.push(...cellsWithNewVals)
        }
    }
    return res;
}