/*
 * @module SudokuGenerator
 */

import {getCandidatesWithPossibilites, Sudoku} from '../model/Sudoku';
import {CellData, CellDataWithPossibilites, CellValue} from "../model/CellData";
import {pickRandomArrayIndex, pickRandomArrayValue} from "../utility/pickRandom";
import {getCallsToSolver, resetCallsToSolver, solve, solverResultIsError} from "../solver/solver";
import {BOARD_SIZE, MINIMUM_CLUES} from "../model/Board";
import {LOGLEVEL_NORMAL, LOGLEVEL_VERBOSE} from "../loglevels";

export enum DIFFICULTY_LEVEL {
    EASY,
    MEDIUM,
    HARD
}

export enum GENERATOR_CODE {
    OK,
    COULD_NOT_ACHIEVE_CLUES_GOAL
}

export type GeneratorResult = [GENERATOR_CODE, Sudoku]
    | [GENERATOR_CODE, Sudoku, string]

export default function generateRandomSudoku(numberOfClues: number, difficulty = DIFFICULTY_LEVEL.EASY): GeneratorResult {
    if (numberOfClues < MINIMUM_CLUES) {
        numberOfClues = MINIMUM_CLUES;
    }
    const target = BOARD_SIZE - numberOfClues;

    if (IS_DEVELOPMENT) {
        console.log(`target are ${target} empty cells, board size is ${BOARD_SIZE}`)
    }

    let achievedNumberOfEmptyCells = 0;
    const MAX_TOPLEVEL_ITERATIONS = 4;
    let it = 0;
    let board = new Sudoku();
    while (achievedNumberOfEmptyCells < target && it < MAX_TOPLEVEL_ITERATIONS) {
        if (IS_DEVELOPMENT && it > 0) {
            console.log("testing a new board. the previous one sucked.");
            if (LOG_LEVEL >= LOGLEVEL_VERBOSE) {
                console.log(`discarded board: ${board.getFlatValues()}`)
            }
        }
        board.fillWithRandomCompleteSolution();
        achievedNumberOfEmptyCells = 0;
        const MAX_UNDOS = difficulty > DIFFICULTY_LEVEL.MEDIUM ? 20 : (difficulty > DIFFICULTY_LEVEL.EASY ? 8 : 4);
        let undos = 0;
        const candidates = board.getFilledCells();
        while (achievedNumberOfEmptyCells < target && undos < MAX_UNDOS) {
            const candidatesWithPossibilites = getCandidatesWithPossibilites(candidates, board);
            if (IS_DEVELOPMENT) {
                console.log("achieved " + achievedNumberOfEmptyCells, ' candidates left: ' + candidatesWithPossibilites.length)
            }
            if (candidatesWithPossibilites.length < target - achievedNumberOfEmptyCells) {
                if (IS_DEVELOPMENT) {
                    console.log("break, not enough candidates left.")
                }
                break;
            }
            const cellIndex = (candidatesWithPossibilites.length > target / 2) ?
                getIndexOfCellToClear(candidatesWithPossibilites, difficulty) : pickRandomArrayIndex(candidatesWithPossibilites);

            const cell = candidatesWithPossibilites[cellIndex];

            candidates.splice(cellIndex, 1);

            board.setCell({...cell, value: CellValue.EMPTY, isInitial: false});
            if (achievedNumberOfEmptyCells < 4) {
                // At least 4 empty cells are needed to make the board invalid.
                // More optimization is needed here to call the solver less often.
                achievedNumberOfEmptyCells++;
                continue;
            }
            const solverResult = solve(board);
            if (solverResultIsError(solverResult)) {
                board.undo();
                undos++;
                if (IS_DEVELOPMENT) {
                    console.log("undo")
                }
            } else {
                achievedNumberOfEmptyCells++;
            }
        }
        it++;
    }
    /**
     * history is used in generator for backtracking. after generating, we clear it.
     */
    board.clearHistory();
    if (achievedNumberOfEmptyCells < target) {
        const msg = `Could not generate a valid Sudoku (unique solution) with the desired number of empty cells. Achieved ${achievedNumberOfEmptyCells} empty cells, goal was ${target}.`;
        return [GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL, board, msg];
    }
    if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_NORMAL) {
        console.log(achievedNumberOfEmptyCells, target);
        console.log(`${getCallsToSolver()} calls to solver algorithm while generating.`)
        resetCallsToSolver();
    }
    return [GENERATOR_CODE.OK, board];
}

function getIndexOfCellToClear(candidates: CellDataWithPossibilites[], difficulty: DIFFICULTY_LEVEL): number {
    if (candidates.length === 0) {
        throw new Error('No candidates, cannot get a cell to clear.');
    }
    let result = 0;
    type CellDataAndIndex = [CellDataWithPossibilites, number];
    switch (difficulty) {
        case DIFFICULTY_LEVEL.HARD:
            result = pickRandomArrayIndex(candidates);
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
        case DIFFICULTY_LEVEL.EASY:
            const candidatesSortedDescendingByNumberOfPossibleValues = candidates.map(
                (cell, index) => [cell, index] as CellDataAndIndex //save original index for later.
            ).sort(
                (a, b) =>
                    a[0].possibleValues.length < b[0].possibleValues.length ? 1 : -1
            );

            //MEDIUM: pick one of the two cells with min. possibilities, if possible
            if (difficulty === DIFFICULTY_LEVEL.MEDIUM && candidatesSortedDescendingByNumberOfPossibleValues.length > 1) {
                const pickedCellWithOriginalIndex = candidatesSortedDescendingByNumberOfPossibleValues.length > 1 ?
                    pickRandomArrayValue(candidatesSortedDescendingByNumberOfPossibleValues.slice(
                        candidatesSortedDescendingByNumberOfPossibleValues.length - 2, -2
                    )) : candidatesSortedDescendingByNumberOfPossibleValues[0];
                result = pickedCellWithOriginalIndex[1];
            } else {
                //EASY: always pick the two cell with min. possibilities, if possible
                // @ts-ignore - this array has at least 1 member, see above.
                result = candidatesSortedDescendingByNumberOfPossibleValues.pop()[1];
            }
            break;
        default:
            result = pickRandomArrayIndex(candidates);
            break;
    }
    return result;
}

function getCellToClear(candidates: CellDataWithPossibilites[], difficulty: DIFFICULTY_LEVEL): CellData {
    if (candidates.length === 0) {
        throw new Error('No candidates, cannot get a cell to clear.');
    }
    let result;
    switch (difficulty) {
        case DIFFICULTY_LEVEL.HARD:
            result = pickRandomArrayValue(candidates);
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
        case DIFFICULTY_LEVEL.EASY:
            const candidatesSortedDescendingByNumberOfPossibleValues = candidates.sort(
                (a, b) =>
                    a.possibleValues.length < b.possibleValues.length ? 1 : -1
            );

            //MEDIUM: pick one of the two cells with min. possibilities, if possible
            if (difficulty === DIFFICULTY_LEVEL.MEDIUM && candidatesSortedDescendingByNumberOfPossibleValues.length > 1) {
                result = candidatesSortedDescendingByNumberOfPossibleValues.length > 1 ?
                    pickRandomArrayValue(candidatesSortedDescendingByNumberOfPossibleValues.slice(
                        candidatesSortedDescendingByNumberOfPossibleValues.length - 2, -2
                    )) : candidatesSortedDescendingByNumberOfPossibleValues[0];
            } else {
                //EASY: always pick the two cell with min. possibilities, if possible
                // @ts-ignore - this array has at least 1 member, see above.
                result = candidatesSortedDescendingByNumberOfPossibleValues.pop();
            }
            break;
        default:
            result = pickRandomArrayValue(candidates);
            break;
    }
    return result as CellData;
}

// export const numberOfFilledCellsInArray = (cells: CellData[]): number => {
//     return cells.reduce((prev, curr) => prev + (cellIsEmpty(curr) ? 0 : 1), 0);
// }

// const numberOfFilledCellsPerRow = (boardToCheck: Puzzle): number[] => {
//     const board = puzzleToSudoku(boardToCheck);
//     return board.getRows().map(numberOfFilledCellsInArray);
// }
//
// const numberOfFilledCellsPerColumn = (boardToCheck: Puzzle): number[] => {
//     const board = puzzleToSudoku(boardToCheck);
//     return board.getColumns().map(numberOfFilledCellsInArray);
// }