/*
Get cell where a possible value occurs uniquely within
a given array of cells and their possible values
 */
import {CellDataWithPossibilites, CellValue} from "../model/CellData";
import {getCountOfPossibleValues, PossibilityCountHash} from "../algorithm/solver/transformations";
import {CellWithNewValue} from "../algorithm/solver/humanTechniques";

export function getCellWithUniquePossibleValue(
    cellsWithP: CellDataWithPossibilites[],
    possibilitiesCount?: PossibilityCountHash
): CellWithNewValue | undefined {
    const possibilities = possibilitiesCount ?? getCountOfPossibleValues(cellsWithP);
    const entriesOccurringOneTime = Object.entries(possibilities).filter(
        entry => entry[1] === 1
    );
    const valueAsString = entriesOccurringOneTime.length > 0 ? entriesOccurringOneTime[0][0] : undefined;
    if (valueAsString !== undefined) {
        const value = +valueAsString as CellValue;
        const cell = cellsWithP.find(cell => cell.possibleValues.includes(value));
        if (cell === undefined) {
            throw new Error();
        }
        return [cell, value];
    }
}