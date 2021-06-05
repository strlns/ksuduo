import {Sudoku} from "../../model/Sudoku";
import {CellData, CellDataWithPossibilites, CellValue, isEmptyAndNonInitial} from "../../model/CellData";
import {addPossibleValuesToCellDataArray} from "./transformations";
import {getCellWithUniquePossibleValue} from "../../solver/transformations";

export type CellWithNewValue = [CellData, CellValue];

export function getCellWithPossibleValueUniqueInRow(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    //we need the index anyway, so there s no point in using for..of
    for (let rowIndex = 0, length = board.getRows().length; rowIndex < length; rowIndex++) {
        const row = board.getRows()[rowIndex];
        const cellsWithP = possibilities ?
            possibilities.filter(
                cell => isEmptyAndNonInitial(cell) && rowIndex === cell.y
            ) : addPossibleValuesToCellDataArray(row, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithPossibleValueUniqueInCol(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    //we need the index anyway, so there s no point in using for..of
    for (let colIndex = 0, length = board.getColumns().length; colIndex < length; colIndex++) {
        const col = board.getColumns()[colIndex];
        const cellsWithP = possibilities ?
            possibilities.filter(
                cell => isEmptyAndNonInitial(cell) && cell.y === colIndex
            ) : addPossibleValuesToCellDataArray(col, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithPossibleValueUniqueInBlock(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    //we need the index anyway, so there s no point in using for..of
    for (let blockIndex = 0, length = board.getBlocks().length; blockIndex < length; blockIndex++) {
        const block = board.getBlocks()[blockIndex];
        const cellsWithP = possibilities ?
            possibilities.filter(
                cell => isEmptyAndNonInitial(cell) && cell.blockIndex === block.blockIndex
            ) : addPossibleValuesToCellDataArray(block.cells, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithValueByIndirectBlockRowColScanning(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    throw new Error('not iplemented yet')
}


export enum SOLVING_TECHNIQUE {
    HUMAN_UNIQPOSS_ROW,
    HUMAN_UNIQPOSS_COL,
    HUMAN_UNIQPOSS_BLOCK,
    MINPOSS_FROM_SOLUTION
}

export function getCellAndValueByRow(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithPossibleValueUniqueInRow(board, possibilities)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW)
        return cellWithVal;
    }
}

export function getCellAndValueByCol(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithPossibleValueUniqueInCol(board, possibilities)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL)
        return cellWithVal;
    }
}

export function getCellAndValueByBlock(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithPossibleValueUniqueInBlock(board, possibilities)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK)
        return cellWithVal;
    }
}


export function getCellAndValueByRowOrColIndirectly(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithValueByIndirectBlockRowColScanning(board, possibilities)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW)
        return cellWithVal;
    }
}

