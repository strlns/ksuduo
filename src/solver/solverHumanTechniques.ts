import {addPossibleValuesToCellDataArray, getCountOfPossibleValues, Sudoku} from "../model/Sudoku";
import {CellData, CellDataWithPossibilites, CellValue} from "../model/CellData";

export type CellWithNewValue = [CellData, CellValue];

export function getCellWithPossibleValueUniqueInRow(board: Sudoku): CellWithNewValue | undefined {
    for (const row of board.getRows()) {
        const cellsWithP = addPossibleValuesToCellDataArray(row, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithPossibleValueUniqueInCol(board: Sudoku): CellWithNewValue | undefined {
    for (const col of board.getColumns()) {
        const cellsWithP = addPossibleValuesToCellDataArray(col, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithPossibleValueUniqueInBlock(board: Sudoku): CellWithNewValue | undefined {
    for (const block of board.getBlocks()) {
        const cellsWithP = addPossibleValuesToCellDataArray(block.cells, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

function getCellWithUniquePossibleValue(cellsWithP: CellDataWithPossibilites[]): CellWithNewValue | undefined {
    const possibilities = getCountOfPossibleValues(cellsWithP);
    const entriesOccuringOneTime = Object.entries(possibilities).filter(
        entry => entry[1] === 1
    );
    const valueAsString = entriesOccuringOneTime.length > 0 ? entriesOccuringOneTime[0][0] : undefined;
    if (valueAsString !== undefined) {
        const value = +valueAsString as CellValue;
        const cell = cellsWithP.find(cell => cell.possibleValues.includes(value));
        if (cell === undefined) {
            throw new Error();
        }
        return [cell, value];
    }
}