import {CellDataWithPossibilites, NonEmptyCellValues} from "../../model/CellData";
import {CellWithNewValue} from "../solver/humanTechniques";
import {pickRandomArrayValue} from "../../utility/pickRandom";
import {getCountOfPossibleValues} from "../transformations";

/**
 Get cell where a possible value occurs uniquely within
 a given array of cells and their possible values
 */
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