/*
 * @module SudokuGenerator
 */

import {BOARD_SIZE, BOARD_WIDTH, CellIndex, flatIndexToCoords, Puzzle, puzzleToSudoku, Sudoku} from '../model/Sudoku';
import {CellData, cellIsEmpty, CellValue} from "../model/CellData";
import pickRandomArrayValue from "../utility/pickRandom";
import {Solution} from "../solver/solver";
import {wait} from "../utility/debug/synchronousWait";
import {
    hasMultipleSolutionsOrIsUnsolvable,
    InitiallyUnsolvableError
} from "../validator/hasMultipleSolutionsOrIsUnsolvable";

export const verboseGeneratorExplanationText = `Start with a randomly generated, completely filled board.
Then clear cells one at a time - after each removal, use backtracking:
Add legal values, then use Sudoku solver to check for differing
solutions or dead ends.
If such are found, the cell must not be removed and is reverted.
Different legal values are tried for the empty cells at each stage
of the removal process.

If no cell can be removed without rendering the board invalid (multiple solutions),
the fully completed "seed" board is discarded - rinse, repeat until the desired number of cells is cleared.

Different kinds of cells are preferred while deleting at the 3 difficulty levels - in easy mode, the cells that are
cleared tend to be the ones that are easier to fill. In hard mode, cells with greater numbers of possible values are
preferred.
`;

export const MINIMUM_CLUES = 17;
export const DEFAULT_CLUES = Math.floor(BOARD_SIZE / 3) - 3;

export enum DIFFICULTY_LEVEL {
    EASY,
    MEDIUM,
    HARD
}


export default function generateRandomSudoku(numberOfClues: number, difficulty = DIFFICULTY_LEVEL.EASY): Sudoku {
    if (IS_DEVELOPMENT) {
        wait(500);
    }
    // must be at least 2, otherwise infinite loop
    const MAX_TRIES_DISCARD_UNEVEN_BOARDS = 1 << 5;
    let maximumFilledRowsOrCols;
    switch (difficulty) {
        case DIFFICULTY_LEVEL.EASY:
            if (numberOfClues < BOARD_SIZE / 3) {
                maximumFilledRowsOrCols = 0;
            } else if (numberOfClues < BOARD_SIZE / 2 + 2) {
                maximumFilledRowsOrCols = 1;
            } else {
                maximumFilledRowsOrCols = 2;
            }
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
        case DIFFICULTY_LEVEL.HARD:
            maximumFilledRowsOrCols = numberOfClues > BOARD_SIZE / 3 ? 1 : 0;
            break;
        default:
            maximumFilledRowsOrCols = 0;
    }
    numberOfClues = Math.floor(numberOfClues);
    const target = BOARD_SIZE - numberOfClues;
    let achievedNumberOfEmptyCells = 0;
    const MAX_TOPLEVEL_ITERATIONS = 1 << 8;
    let it = 0;
    let board = new Sudoku();
    let boardIsUneven = false;
    while (
        (achievedNumberOfEmptyCells < target || boardIsUneven) && it < MAX_TOPLEVEL_ITERATIONS
        ) {
        boardIsUneven = false;
        if (IS_DEVELOPMENT) {
            console.log("testing a new board. the previous one sucked.");
        }
        board = new Sudoku();
        let numberOfDeleteTries = 0;
        let numberOfDiscardedUnevenBoards = 0;
        board.fillWithRandomCompleteSolution();
        board.setSolution(board.getFlatValues() as Solution);
        while (numberOfDeleteTries < (1 << 8)) {
            clearCellButOnlyIfSolutionsDontExplode(board, difficulty);
            achievedNumberOfEmptyCells = BOARD_SIZE - board.getNumberOfFilledCells();
            //for many initial boards it is impossible to delete the desired number of cells without
            //making the board an invalid sudoku (multiple solutions, or not solvable by algo)
            numberOfDeleteTries++;
            if (achievedNumberOfEmptyCells === target) break;
        }
        // look if the board is nice, discard boards with full rows/cols/blocks if possible
        const numFullRows = numberOfFilledCellsPerRow(board).filter(num => num === BOARD_WIDTH).length;
        const numFullCols = numberOfFilledCellsPerColumn(board).filter(num => num === BOARD_WIDTH).length;
        if (achievedNumberOfEmptyCells === target &&
            numberOfDiscardedUnevenBoards < MAX_TRIES_DISCARD_UNEVEN_BOARDS
            && target > BOARD_WIDTH / 2) {
            if (
                (numFullCols > 0 || numFullRows > 0) ||
                (numberOfDiscardedUnevenBoards > (MAX_TRIES_DISCARD_UNEVEN_BOARDS / 2))
                && (numFullCols > maximumFilledRowsOrCols || numFullRows > maximumFilledRowsOrCols)
            ) {
                if (IS_DEVELOPMENT) {
                    console.log("discard full row/col", numFullRows, numFullCols)
                    console.log(numberOfFilledCellsPerRow(board));
                }
                numberOfDiscardedUnevenBoards++;
                boardIsUneven = true;
                continue;
            }
        }
        it++;
    }
    /**
     * history is used in generator for backtracing. after generating, we clear it.
     */
    board.clearHistory();
    if (achievedNumberOfEmptyCells < target) {
        throw new Error("SORRY ;( The generator couldn't generate a valid Sudoku.");
    }
    return board;
}

function getCellValuePossibilityMap(board: Sudoku, cells: CellData[]) {
    const cellValuePossibilities = new Map<CellData, CellValue[]>();
    cells.forEach(
        cell => cellValuePossibilities.set(
            cell,
            board.getAllowedCellValues(cell)
        )
    );
    return cellValuePossibilities;
}

// noinspection JSUnusedLocalSymbols
/**
 * @deprecated
 * @param sudoku
 * @param coordsGenerator
 */
const clearRandomCell = (sudoku: Sudoku, coordsGenerator: Generator<CellIndex[]>): void => {
    const generatorResult = coordsGenerator.next();
    if (!generatorResult.done) {
        const coords = generatorResult.value;
        sudoku.setValue(coords[0], coords[1], CellValue.EMPTY, false);
    }
}

const clearCellButOnlyIfSolutionsDontExplode = (sudoku: Sudoku, difficulty: DIFFICULTY_LEVEL): void => {
    let maxIterations = 1 << 16;
    const candidates = sudoku.getFilledCells();
    let cellValuePossibilityMap = new Map<CellData, CellValue[]>();
    if (difficulty < DIFFICULTY_LEVEL.HARD) {
        cellValuePossibilityMap = getCellValuePossibilityMap(sudoku, candidates);
    }
    for (let i = 0; i < maxIterations; i++) {
        let cell;
        /**
         * stop considering the number of possibilities in the cells after a while,
         * this leads to nicer boards. Otherwise, the filled cells tend to cluster at the bottom of the
         * board.
         */
        if (candidates.length < (BOARD_SIZE / 3)) {
            cell = pickRandomArrayValue(candidates);
        } else {
            cell = getCellToClearWithDifficulty(candidates, difficulty, cellValuePossibilityMap);
        }
        /**
         * Difficulty level decides which cells we prefer to remove:
         * EASY:   Remove the cell with maximum possible values
         * MEDIUM: Remove the cell with 2nd most possible values (or max. if needed)
         * HARD:   Don't care about the number of possible values when removing cells.
         */
        if (!cell) {
            return;
        }
        //Try to clear the cell. Then we test if the puzzle still (probably) has a unique solution
        sudoku.setValue(cell.x, cell.y, CellValue.EMPTY);
        let isAmbiguousOrInterestinglyUnsolvable: boolean;
        try {
            isAmbiguousOrInterestinglyUnsolvable = hasMultipleSolutionsOrIsUnsolvable(sudoku, difficulty);
        } catch (e) {
            //swap a removed cell with a cell from the solution
            if (e instanceof InitiallyUnsolvableError) {
                const solutionCellsAlreadyRemoved = sudoku.getSolution().map(
                    (cellValue, flatIndex) => sudoku.getCell(...flatIndexToCoords(flatIndex)))
                    .filter(cell => cellIsEmpty(cell));
                const cellToAdd = pickRandomArrayValue(solutionCellsAlreadyRemoved);
                sudoku.setCell(
                    cellToAdd as CellData, false
                );
                /** no need to remove another cell instead.
                 * the cell we re-added is not in the candidates array anymore,
                 and the loop continues to try removing other cells.*/
            }
            isAmbiguousOrInterestinglyUnsolvable = false;
        }

        if (isAmbiguousOrInterestinglyUnsolvable) {
            sudoku.undo();
            //seems like we shouldn't remove this cell.
            candidates.splice(candidates.indexOf(cell), 1);
        } else {
            break;
        }
    }
}

function getCellToClearWithDifficulty(candidates: CellData[], difficulty: DIFFICULTY_LEVEL, cellValuePossibilityMap: Map<CellData, CellValue[]>) {
    let cell;
    switch (difficulty) {
        case DIFFICULTY_LEVEL.HARD:
            cell = pickRandomArrayValue(candidates);
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
        case DIFFICULTY_LEVEL.EASY:
            const candDataDescByPoss = candidates.map((cell, indexInCandidates) => [
                (cellValuePossibilityMap.get(cell) as CellValue[]).length,
                indexInCandidates
            ]).sort((a, b) => {
                return a[0] < b[0] ? 1 : -1
            });
            if (difficulty === DIFFICULTY_LEVEL.MEDIUM && candDataDescByPoss.length > 1) {
                const index = (candDataDescByPoss[candDataDescByPoss.length - 2] as [number, number])[1] || 0;
                cell = candidates[index];
            } else {
                const candData = candDataDescByPoss.pop();
                if (candData !== undefined) {
                    cell = candidates[candData[1]];
                } else {
                    cell = pickRandomArrayValue(candidates);
                }
            }
            break;
        default:
            cell = pickRandomArrayValue(candidates);
            break;
    }
    return cell;
}

export const numberOfFilledCellsInArray = (cells: CellData[]): number => {
    return cells.reduce((prev, curr) => prev + (cellIsEmpty(curr) ? 0 : 1), 0);
}

const numberOfFilledCellsPerRow = (boardToCheck: Puzzle): number[] => {
    const board = puzzleToSudoku(boardToCheck);
    return board.getRows().map(numberOfFilledCellsInArray);
}

const numberOfFilledCellsPerColumn = (boardToCheck: Puzzle): number[] => {
    const board = puzzleToSudoku(boardToCheck);
    return board.getColumns().map(numberOfFilledCellsInArray);
}