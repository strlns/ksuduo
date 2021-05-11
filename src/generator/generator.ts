/*
 * @module SudokuGenerator
 *
 */

import {addPossibleValuesToCellDataArray, Sudoku} from '../model/Sudoku';
import {CellData, CellDataWithPossibilites, cellIsEmpty, CellValue} from "../model/CellData";
import {pickRandomArrayIndex, pickRandomArrayValue} from "../utility/pickRandom";
import {getCallsToSolver, resetCallsToSolver, solve, solverResultIsError} from "../solver/solver";
import {BLOCK_SIZE, BOARD_SIZE, BOARD_WIDTH, MINIMUM_CLUES} from "../model/Board";
import {LOGLEVEL_NORMAL, LOGLEVEL_VERBOSE} from "../loglevels";
import {SOLVER_FAILURE} from "../solver/solverAlgo";
import assert from "../utility/assert";

export enum DIFFICULTY_LEVEL {
    EASY,
    MEDIUM,
    HARD
}

export enum GENERATOR_CODE {
    OK,
    COULD_NOT_ACHIEVE_CLUES_GOAL,
    UNKNOWN_ERROR
}

export type GeneratorResult = [GENERATOR_CODE, Sudoku]
    | [GENERATOR_CODE, Sudoku, string] | [GENERATOR_CODE, undefined, string]

export default function generateRandomSudoku(numberOfClues: number, difficulty = DIFFICULTY_LEVEL.EASY): GeneratorResult {
    try {
        return generateSudoku(numberOfClues, difficulty);
    } catch (e) {
        if (IS_DEVELOPMENT) {
            console.error(...(e.message && e.message.length ? [e.message] : []), e.stack);
        }
        return [GENERATOR_CODE.UNKNOWN_ERROR, undefined, e.message && e.message.length ? e.message : 'Unknown error!']
    }
}

function generateSudoku(numberOfClues: number, difficulty = DIFFICULTY_LEVEL.EASY): GeneratorResult {
    if (numberOfClues < MINIMUM_CLUES) {
        numberOfClues = MINIMUM_CLUES;
    }
    const target = BOARD_SIZE - numberOfClues;

    if (IS_DEVELOPMENT) {
        console.log(`difficulty: ${
            difficulty === DIFFICULTY_LEVEL.EASY ? 'Easy' :
                (difficulty === DIFFICULTY_LEVEL.MEDIUM ? 'Medium'
                        : 'Hard'
                )
        }`);
        console.log(`target are ${target} empty cells, board size is ${BOARD_SIZE}`)
    }

    let achievedNumberOfEmptyCells = 0;
    const MAX_TOPLEVEL_ITERATIONS = 8;
    const MAX_UNDOS = difficulty >= DIFFICULTY_LEVEL.EASY ? 8 : 16;
    const MAX_DISCARDED_UNEVEN_BOARDS = 4;
    let it = 0;
    let board = new Sudoku();
    let numberOfDiscardedUnevenBoards = 0;
    let boardIsUneven = false;
    while (
        (achievedNumberOfEmptyCells < target && it < MAX_TOPLEVEL_ITERATIONS)
        || (boardIsUneven && numberOfDiscardedUnevenBoards < MAX_DISCARDED_UNEVEN_BOARDS)
        ) {

        if (IS_DEVELOPMENT && it > 0) {
            console.log("testing a new board. the previous one sucked. ");
            if (LOG_LEVEL >= LOGLEVEL_VERBOSE) {
                console.log(`discarded board: ${board.getFlatValues()}`)
            }
        }
        board.fillWithRandomCompleteSolution();
        const candidates = board.getFlatCells();
        boardIsUneven = false;
        achievedNumberOfEmptyCells = 0;
        let undos = 0;

        while (achievedNumberOfEmptyCells < target && undos < MAX_UNDOS) {
            const candidatesWithPossibilites = addPossibleValuesToCellDataArray(candidates, board, false);
            if (candidatesWithPossibilites.length < target - achievedNumberOfEmptyCells) {
                if (IS_DEVELOPMENT) {
                    console.log("break, not enough candidates left.")
                }
                break;
            }

            const cellIndex = getIndexOfCellToClear(
                candidatesWithPossibilites,
                difficulty,
                achievedNumberOfEmptyCells
            );

            // Remove the cell from candidates, because it either will be removed,
            // or removal leads to an invalid board.
            const cell = candidatesWithPossibilites[cellIndex];
            candidates.splice(cellIndex, 1);

            const numEmptyCellsInBlock = board.getCellsInBlock(cell).filter(cell => cellIsEmpty(cell)).length;
            if (numEmptyCellsInBlock === BLOCK_SIZE - 1) {
                if (IS_DEVELOPMENT) {
                    console.log("don't remove last cell in block");
                }
                continue; //don't remove the last cell in a block.
            }

            board.setCell({...cell, value: CellValue.EMPTY, isInitial: false}, false);
            // board.setCell({...cell, value: CellValue.EMPTY, isInitial: false});

            if (achievedNumberOfEmptyCells < 4) {
                // At least 4 empty cells are needed to make the board invalid.
                // So we can skip the following logic.
                achievedNumberOfEmptyCells++;
                continue;
            }
            /*
             * It would be nice if it was possible to pass the known solution to the backtracking solver
             * to speed up detection of invalid boards.
             * This would require to integrate some of the generator logic into the solver and might be impossible.
             */
            const solverResult = solve(board);
            if (solverResultIsError(solverResult)) {
                if (IS_DEVELOPMENT) {
                    console.log(`UNDO after clearing ${achievedNumberOfEmptyCells + 1}th cell. Reason: ${
                        solverResult === SOLVER_FAILURE.MULTIPLE_SOLUTIONS ? 'MULTIPLE SOLUTIONS' : 'NO SOLUTION'
                    }`);
                }
                // board.undo();
                board.setCell({...cell, value: board.getValueFromSolution(cell.x, cell.y), isInitial: true}, false);
                undos++;
            } else {
                achievedNumberOfEmptyCells++;
            }
        }

        const numFullRows = board.numberOfFilledCellsPerRow().filter(num => num === BOARD_WIDTH).length;
        const numFullCols = board.numberOfFilledCellsPerColumn().filter(num => num === BOARD_WIDTH).length;

        if (numFullRows > 0 || numFullCols > 0) {
            if (IS_DEVELOPMENT) {
                console.log("board contains at least 1 full row or column. discard.")
            }
            boardIsUneven = true;
            numberOfDiscardedUnevenBoards++;
        }

        it++;
    }
    /**
     * history is used in generator for backtracking. after generating, we clear it.
     */
    board.clearHistory();
    if (achievedNumberOfEmptyCells < target) {
        const msg = `Could not generate a valid Sudoku (unique solution) with the desired number of hints. Achieved ${BOARD_SIZE - achievedNumberOfEmptyCells} hints (instead of ${numberOfClues}).`;
        return [GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL, board, msg];
    }
    if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_NORMAL) {
        console.log(`${getCallsToSolver()} calls to solver algorithm while generating.`)
        resetCallsToSolver();
        assert(!solverResultIsError(solve(board)));
    }
    return [GENERATOR_CODE.OK, board];
}

type CellDataAndIndex = [CellDataWithPossibilites, number];

const THRESHOLD_USE_DIFFICULTY = BLOCK_SIZE;

function getIndexOfCellToClear(
    candidates: CellDataWithPossibilites[],
    difficulty: DIFFICULTY_LEVEL,
    achievedEmptyCells: number
): number {
    if (candidates.length === 0) {
        throw new Error('No candidates, cannot get a cell to clear.');
    }
    if (achievedEmptyCells < THRESHOLD_USE_DIFFICULTY) {
        return pickRandomArrayIndex(candidates);
    } else if (achievedEmptyCells > BOARD_SIZE / 3) {
        return getCellToClearWithMinimumPossibilites(candidates)[1];
    }
    let result = 0;
    switch (difficulty) {
        case DIFFICULTY_LEVEL.HARD:
            result = pickRandomArrayIndex(candidates);
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
            result = getCellToClearWithFewPossibilites(candidates)[1];
            break;
        case DIFFICULTY_LEVEL.EASY:
            result = getCellToClearWithMinimumPossibilites(candidates)[1];
            break;
    }
    return result;
}

function getCellToClearWithMinimumPossibilites(candidates: CellData[]): CellDataAndIndex {
    // Sort candidates by number of possible values (ignoring the value currently set).
    // Save original index in given array for later.
    const candidatesSortedDesc = candidates.map(
        (cell, index) => [cell, index] as CellDataAndIndex
    ).sort(
        (a, b) =>
            a[0].possibleValues.length < b[0].possibleValues.length ? 1 : -1
    )
    //@ts-ignore This array has at least one member, checked before call.
    return candidatesSortedDesc.pop();
}

function getCellToClearWithFewPossibilites(candidates: CellData[]): CellDataAndIndex {
    // Sort candidates by number of possible values (ignoring the value currently set).
    // Save original index in given array for later.
    const candidatesSortedDesc = candidates.map(
        (cell, index) => [cell, index] as CellDataAndIndex
    ).sort(
        (a, b) =>
            a[0].possibleValues.length < b[0].possibleValues.length ? 1 : -1
    );

    // MEDIUM: pick one of the two cells with min. possibilities, if possible
    if (candidatesSortedDesc.length > 1) {
        return candidatesSortedDesc.length > 1 ?
            pickRandomArrayValue(candidatesSortedDesc.slice(
                -2, candidatesSortedDesc.length
            )) : candidatesSortedDesc[0];
    }
    //@ts-ignore This array has at least one member, checked before call.
    return candidatesSortedDesc.pop();
}