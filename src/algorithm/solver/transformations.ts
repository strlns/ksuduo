import {CellData, CellDataWithPossibilites, cellIsEmpty, CellValue, NonEmptyCellValues} from "../../model/CellData";
import {
    BLOCK_HEIGHT,
    BLOCK_WIDTH,
    BLOCKS_PER_BAND,
    BOARD_WIDTH,
    CellIndex,
    coordsToFlatIndex,
    getFlatStartIndexForBlock
} from "../../model/Board";
import {fromPairs} from "lodash-es";
import {Puzzle, Sudoku} from "../../model/Sudoku";

export const puzzleToSudoku = (puzzle: Puzzle, solvePuzzle = true) => {
    if (puzzle instanceof Sudoku) {
        return puzzle;
    }
    const res = new Sudoku();
    res.initWithNumbers(puzzle as number[], solvePuzzle);
    return res;
}
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
export type PossibilityCountHash = {
    [value in CellValue]: number
};

/*
 * return an object with the cell values as key and the number of occurrences as a possible value
 * in the given array of cells, for the given board, as value.
 */
export const getCountOfPossibleValues = (cellsWithP: CellDataWithPossibilites[]): PossibilityCountHash => {
    const res = fromPairs(NonEmptyCellValues.map(val => [val, 0]));
    for (const cell of cellsWithP) {
        for (const value of cell.possibleValues) {
            res[value] += 1;
        }
    }
    return res as PossibilityCountHash;
}
export const getBlockIndexForCell = (cell: CellData): number => {
    return getBlockIndexForCoords(cell.x, cell.y);
}
export const getBlockIndexForCoords = (x: CellIndex, y: CellIndex): number => {
    const yPart = Math.floor(y / BLOCK_HEIGHT) * BLOCKS_PER_BAND;
    const xPart = Math.floor(x / BLOCK_WIDTH);
    return yPart + xPart;
}