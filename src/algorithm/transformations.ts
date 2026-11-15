import {Sudoku} from "../model/Sudoku";
import {CellData, CellDataWithPossibilites, cellIsEmpty, CellValue} from "../model/CellData";
import {
    BLOCK_HEIGHT,
    BLOCK_WIDTH,
    BLOCKS_PER_BAND,
    BOARD_WIDTH,
    CellIndex,
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
export const addPossibleValuesToCellDataArray =
    (candidates: CellData[], board: Sudoku, onlyEmpty = false): CellDataWithPossibilites[] =>
        candidates.map(
            cell => ({
                ...cell,
                possibleValues: (onlyEmpty && !cellIsEmpty(cell)) ? [] : board.getAllowedCellValues(cell, !onlyEmpty)
            })
        );
export const getBlockIndexForCell = (cell: CellData): number => {
    return getBlockIndexForCoords(cell.x, cell.y);
}
export const getBlockIndexForCoords = (x: CellIndex, y: CellIndex): number => {
    const yPart = Math.floor(y / BLOCK_HEIGHT) * BLOCKS_PER_BAND;
    const xPart = Math.floor(x / BLOCK_WIDTH);
    return yPart + xPart;
}
/**
 * Regression predicate: every remaining cell must be forced.
 * If singles cannot finish a valid board, the caller must use the uniqueness solver.
 * Used by regression diagnostics; gameplay uses the shared logical solver.
 */
export const isTriviallySolvable = (board: Sudoku): boolean => {
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    while (clonedBoard.fillSinglePossibilityCells() > 0) {
        // A fill can expose more single-candidate cells in the next pass.
    }
    return clonedBoard.isSolved();
};
