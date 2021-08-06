import {Sudoku} from "../model/Sudoku";
import {CellData, CellDataWithPossibilites, cellIsEmpty, CellValue, NonEmptyCellValues} from "../model/CellData";
import {candidatesSortedDescByPossibilities} from "./cellPicker/getCellsByNumberOfPossibilities";
import {
    BLOCK_HEIGHT,
    BLOCK_WIDTH,
    BLOCKS_PER_BAND,
    BOARD_WIDTH,
    CellIndex,
    coordsToFlatIndex,
    getFlatStartIndexForBlock
} from "../model/Board";

export const getBlockValuesForIndexInFlatPuzzle = (flatPuzzle: CellValue[], cellIndex: number): CellValue[] => {
    if (cellIndex >= flatPuzzle.length) {
        throw new Error('Invalid cell index.');
    }
    const startIndex = getFlatStartIndexForBlock(flatPuzzle, cellIndex);
    const res = [];
    let i = 0;
    let index = startIndex;
    while (i < BLOCK_HEIGHT) {
        index = startIndex + i * BOARD_WIDTH;
        for (let j = 0; j < BLOCK_WIDTH; j++) {
            res.push(flatPuzzle[index + j]);
        }
        i++;
    }
    return res;
}
export const numberOfFilledCellsInArray = (cells: CellData[]): number => {
    return cells.reduce((prev, curr) => prev + (cellIsEmpty(curr) ? 0 : 1), 0);
}
// noinspection JSUnusedGlobalSymbols
export const getValueInFlatPuzzleByCoords = (flatPuzzle: CellValue[], cellX: CellIndex, cellY: CellIndex): CellValue => {
    return flatPuzzle[coordsToFlatIndex(cellX, cellY)];
}
export const addPossibleValuesToCellDataArray =
    (candidates: CellData[], board: Sudoku, onlyEmpty = false): CellDataWithPossibilites[] =>
        candidates.map(
            cell => ({
                ...cell,
                possibleValues: (onlyEmpty && !cellIsEmpty(cell)) ? [] : board.getAllowedCellValues(cell, !onlyEmpty)
            })
        );
/*
 * return an object with the cell values as key and the number of occurrences as a possible value
 * in the given array of cells, for the given board, as value.
 */
export const getCountOfPossibleValues = (cellsWithP: CellDataWithPossibilites[]): Map<CellValue, number> => {
    const res = new Map<CellValue, number>();
    NonEmptyCellValues.forEach(
        val => res.set(val, 0)
    )
    cellsWithP.forEach(
        cellWithP => {
            cellWithP.possibleValues.forEach(
                value => {
                    res.set(value, (res.get(value) as number) + 1)
                }
            )
        }
    )
    return res;
}
export const getBlockIndexForCell = (cell: CellData): number => {
    return getBlockIndexForCoords(cell.x, cell.y);
}
export const getBlockIndexForCoords = (x: CellIndex, y: CellIndex): number => {
    const yPart = Math.floor(y / BLOCK_HEIGHT) * BLOCKS_PER_BAND;
    const xPart = Math.floor(x / BLOCK_WIDTH);
    return yPart + xPart;
}
/**
 * Board is trivially solvable iff
 *
 * a) less than 3 empty cells OR
 *  b1) all remaining empty cells have at most 2 possible values
 *    AND
 *  b2) there is no pair of 2 cells with 2 possible values each where both
 *      cells belong to the same row, column or block AND share at least one possible value.
 */
export const isTriviallySolvable = (board: Sudoku): boolean => {
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    clonedBoard.fillSinglePossibilityCells();
    const emptyCells = clonedBoard.getEmptyCells();
    let res = true;
    /*a) fall through if board has less than 3 empty cells*/
    if (emptyCells.length > 2) {
        const candidates = addPossibleValuesToCellDataArray(emptyCells, clonedBoard);
        /* b1) all remaining empty cells have at most 2 possible values */
        if (candidates.some(
            cell => cell.possibleValues.length > 2
        )) {
            /*b2) no non-trivial possibility pairs*/
            res = !hasNonTrivialPossibilityPairs(candidates)
        }
    }
    return res;
}

function hasNonTrivialPossibilityPairs(candidates: CellDataWithPossibilites[]): boolean {
    const candidatesWithMoreThanOnePossibility = candidatesSortedDescByPossibilities(
        candidates.filter(
            cell => cell.possibleValues.length > 1
        ));
    /*
      there is no pair of 2 cells with 2 possible values each where both
      cells belong to the same row, column or block AND share at least one possible value.
    */
    let res = false;
    for (const cell of candidatesWithMoreThanOnePossibility) {
        const otherCell = candidatesWithMoreThanOnePossibility.find(
            otherCell => otherCell !== cell && (
                //same block, col or row
                otherCell.x === cell.x ||
                otherCell.y === cell.y ||
                otherCell.blockIndex === cell.blockIndex
            ) && (
                //share at least 1 possible value
                otherCell.possibleValues.some(
                    otherPossibleValue => cell.possibleValues.includes(otherPossibleValue)
                )
            )
        );
        if (otherCell) {
            res = true;
            break;
        }
    }
    return res;
}