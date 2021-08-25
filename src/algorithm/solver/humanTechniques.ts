import {Sudoku} from "../../model/Sudoku";
import {
    CellData,
    CellDataWithPossibilites,
    cellIsEmpty,
    CellValue,
    CellValues,
    isEmptyAndNonInitial
} from "../../model/CellData";
import {CellIndex} from "../../model/Board";
import {BlockData, BlockIndex} from "../../model/BlockData";
import {addPossibleValuesToCellDataArray} from "../transformations";
import {getCellWithUniquePossibleValue} from "../cellPicker/getCellsWithUniquePossibleValue";

export type CellWithNewValue = [CellData, CellValue];

export function getCellWithPossibleValueUniqueInRow(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[],
    includeInitial = false
): CellWithNewValue | undefined {
    const filterFn = includeInitial ?
        (cell: CellData, rowIndex: number) => cellIsEmpty(cell) && rowIndex === cell.y
        : (cell: CellData, rowIndex: number) => isEmptyAndNonInitial(cell) && rowIndex === cell.y;

    for (let rowIndex = 0, length = board.getRows().length; rowIndex < length; rowIndex++) {
        const row = board.getRows()[rowIndex];
        const cellsWithP = possibilities ?
            possibilities.filter(cell => filterFn(cell, rowIndex))
            : addPossibleValuesToCellDataArray(row, board, true);
        const res = getCellWithUniquePossibleValue(cellsWithP);
        if (res) return res;
    }
}

export function getCellWithPossibleValueUniqueInCol(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[],
    includeInitial = false
): CellWithNewValue | undefined {
    const filterFn = includeInitial ?
        (cell: CellData, colIndex: number) => cellIsEmpty(cell) && colIndex === cell.x
        : (cell: CellData, colIndex: number) => isEmptyAndNonInitial(cell) && colIndex === cell.x;

    for (let colIndex = 0, length = board.getColumns().length; colIndex < length; colIndex++) {
        const col = board.getColumns()[colIndex];
        const cellsWithP = possibilities ?
            possibilities.filter(cell => filterFn(cell, colIndex))
            : addPossibleValuesToCellDataArray(col, board, true);
        const res = getCellWithUniquePossibleValue(cellsWithP);
        if (res) return res;
    }
}

export function getCellWithPossibleValueUniqueInBlock(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[],
    includeInitial = false
): CellWithNewValue | undefined {
    const filterFn = includeInitial ?
        (cell: CellData, blockIndex: number) => cellIsEmpty(cell) && blockIndex === cell.blockIndex
        : (cell: CellData, blockIndex: number) => isEmptyAndNonInitial(cell) && blockIndex === cell.blockIndex;

    for (let blockIndex = 0, length = board.getBlocks().length; blockIndex < length; blockIndex++) {
        const block = board.getBlocks()[blockIndex];
        const cellsWithP = possibilities ?
            possibilities.filter(cell => filterFn(cell, block.blockIndex))
            : addPossibleValuesToCellDataArray(block.cells, board, true);
        const cell = getCellWithUniquePossibleValue(cellsWithP);
        if (cell) return cell;
    }
}

/**
 * If a possible value inside a block only occurs in one row or col,
 * it can be excluded in this row/col in other blocks as well.
 */
type ExcludedValueByDeduction = {
    row?: CellIndex,
    col?: CellIndex,
    valueToExclude: CellValue,
    exceptInBlock: BlockIndex
}

const cellWithPMatchesExclusion = (cell: CellDataWithPossibilites, exclusion: ExcludedValueByDeduction) => {
    return cell.possibleValues.includes(exclusion.valueToExclude) &&
        cell.y !== exclusion.row
        && cell.x !== exclusion.col
        && cell.blockIndex !== exclusion.exceptInBlock
}

export function eliminatePossibilitiesByIndirectRowColScanning(
    board: Sudoku,
    possibilities: CellDataWithPossibilites[]
): void {
    for (const block of board.getBlocks()) {
        const cellsWithP = possibilities.filter(
            cell => isEmptyAndNonInitial(cell) && cell.blockIndex === block.blockIndex
        );
        const exclusions = scanBlock(block, cellsWithP);
        for (const exclusion of exclusions) {
            possibilities.forEach(cell => {
                if (cellWithPMatchesExclusion(cell, exclusion)) {
                    const indexOfValueToRemove = cell.possibleValues.indexOf(exclusion.valueToExclude);
                    cell.possibleValues.splice(indexOfValueToRemove, 1)
                }
            })
        }
    }
}

/**
 * @param board
 * @param possibilities Should cover the whole board for this function to work properly.
 */
export function getCellWithValueByIndirectBlockRowColScanning(
    board: Sudoku,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    const cellsWithP = possibilities ?? addPossibleValuesToCellDataArray(board.getFlatCells(), board);
    eliminatePossibilitiesByIndirectRowColScanning(board, cellsWithP);
    return getCellWithUniquePossibleValue(cellsWithP);

}

function scanBlock(block: BlockData, cellsWithP: CellDataWithPossibilites[]): ExcludedValueByDeduction[] {
    const exclusions: ExcludedValueByDeduction[] = [];
    for (const value of CellValues) {
        const cellsWithThisPossibleValue = cellsWithP.filter(
            cell => cell.possibleValues.includes(value)
        );
        if (cellsWithThisPossibleValue.length > 0) {
            if (cellsWithThisPossibleValue.every(
                cell => cell.y === cellsWithThisPossibleValue[0].y
            )) {
                const exemplaryCell = cellsWithThisPossibleValue[0];
                exclusions.push(
                    {
                        row: exemplaryCell.y,
                        valueToExclude: exemplaryCell.value,
                        exceptInBlock: block.blockIndex
                    }
                )
            }
            if (cellsWithThisPossibleValue.every(
                cell => cell.x === cellsWithThisPossibleValue[0].x
            )) {
                const exemplaryCell = cellsWithThisPossibleValue[0];
                exclusions.push(
                    {
                        col: exemplaryCell.x,
                        valueToExclude: exemplaryCell.value,
                        exceptInBlock: block.blockIndex
                    }
                )
            }
        }
    }
    return exclusions
}


export enum SOLVING_TECHNIQUE {
    HUMAN_UNIQPOSS_ROW,
    HUMAN_UNIQPOSS_COL,
    HUMAN_UNIQPOSS_BLOCK,
    HUMAN_UNIQPOSS_INDIRECT,
    MINPOSS_FROM_SOLUTION,
    NONE
}

export const solvingTechniqueName = (val: SOLVING_TECHNIQUE | undefined) => {
    switch (val) {
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW:
            return 'ROW'
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL:
            return 'COL'
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK:
            return 'BLOCK'
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_INDIRECT:
            return 'INDIRECT'
        case SOLVING_TECHNIQUE.MINPOSS_FROM_SOLUTION:
            return 'SOLUTION'
        default:
            return 'INVALID/UNDEFINED'
    }
}

export const hintExplanation = (cell: CellData, technique: SOLVING_TECHNIQUE) => {
    switch (technique) {
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW:
            return `Filled a ${cell.value} at the only allowed place in row ${cell.y + 1}.`
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL:
            return `Filled a ${cell.value} at the only allowed place in row ${cell.x + 1}.`
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK:
            return `Filled a ${cell.value} at the only allowed place in block ${cell.blockIndex + 1}.`
        case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_INDIRECT:
            return `Filled a ${cell.value} using indirect row/col scanning at (${cell.x + 1}|${cell.y + 1}).`
        case SOLVING_TECHNIQUE.MINPOSS_FROM_SOLUTION:
            return `Value ${cell.value} at (${cell.x + 1}|${cell.y + 1}) was filled in from solution.`
        default:
            return `Unknown solving technique.`
    }
}

export function getCellAndValueByRow(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[],
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
    possibilities?: CellDataWithPossibilites[],
    includeInitial = false
): CellWithNewValue | undefined {
    const cellWithVal = getCellWithPossibleValueUniqueInBlock(board, possibilities, includeInitial)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK)
        return cellWithVal;
    }
}


export function getCellAndValueByIndirectBlockRowColScanning(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    const cellWithVal = getCellWithValueByIndirectBlockRowColScanning(board, possibilities)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_INDIRECT)
        return cellWithVal;
    }
}

