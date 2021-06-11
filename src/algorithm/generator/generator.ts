/*
 * @module SudokuGenerator
 *
 */

import {Sudoku} from '../../model/Sudoku';
import {CellDataWithPossibilites, cellIsEmpty} from "../../model/CellData";
import {pickRandomArrayIndex} from "../../utility/pickRandom";
import {getCallsToSolver, resetCallsToSolver, solve, solverResultIsError} from "../solver/solver";
import {BLOCK_SIZE, BOARD_SIZE, BOARD_WIDTH, MINIMUM_CLUES} from "../../model/Board";
import {LOGLEVEL_NORMAL} from "../../loglevels";
import {cloneDeep} from "lodash-es";
import {getCellWithFewPossibilites, getCellWithMinimumPossibilites} from "../cellPicker/cellPicker";
import {addPossibleValuesToCellDataArray} from "../solver/transformations";
import {isTriviallySolvable} from "../transformations";
import {generateBoardSolvableUsingEasyTechniques} from "./generatorHumanTechniques";

export enum DIFFICULTY_LEVEL {
    EASY,
    MEDIUM,
    HARD,
    EASY_NEW
}

export enum GENERATOR_CODE {
    OK,
    COULD_NOT_ACHIEVE_CLUES_GOAL,
    UNKNOWN_ERROR
}

export type GeneratorResult = [GENERATOR_CODE, Sudoku]
    | [GENERATOR_CODE, Sudoku, string] | [GENERATOR_CODE, undefined, string]

export default function generateRandomSudoku(numberOfClues: number, difficulty = DIFFICULTY_LEVEL.EASY, fewerRetries = false): GeneratorResult {
    try {
        return generateSudoku(numberOfClues, difficulty, fewerRetries);
    } catch (e) {
        if (IS_DEVELOPMENT) {
            console.error(...(e.message && e.message.length ? [e.message] : []), e.stack);
        }
        return [GENERATOR_CODE.UNKNOWN_ERROR, undefined, e.message && e.message.length ? e.message : 'Unknown error!']
    }
}

function generateSudoku(numberOfClues: number, difficulty = DIFFICULTY_LEVEL.EASY, fewerRetries = false): GeneratorResult {
    if (numberOfClues < MINIMUM_CLUES) {
        numberOfClues = MINIMUM_CLUES;
    }
    if (difficulty === DIFFICULTY_LEVEL.EASY_NEW) {
        /**{@link numberOfClues} is ignored here because the algo is pretty bad atm.*/
        return [GENERATOR_CODE.OK, generateBoardSolvableUsingEasyTechniques(32, 4)]
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

    let it = 0;
    let achievedNumberOfEmptyCells = 0;
    let undos = 0;
    let board = new Sudoku();
    let numberOfDiscardedUnevenBoards = 0;
    let boardIsUneven = false
    const MAX_TOPLEVEL_ITERATIONS = fewerRetries ? 2 : (difficulty >= DIFFICULTY_LEVEL.MEDIUM ? 4 : 8);
    const MAX_UNDOS = fewerRetries ? 4 : (difficulty >= DIFFICULTY_LEVEL.MEDIUM ? 16 : 8);
    const MAX_DISCARDED_UNEVEN_BOARDS = 4;
    let bestBoardSoFar;
    let bestAchievedEmptyCellsSoFar = 0;
    while (
        (achievedNumberOfEmptyCells < target && it < MAX_TOPLEVEL_ITERATIONS)
        || (boardIsUneven && numberOfDiscardedUnevenBoards < MAX_DISCARDED_UNEVEN_BOARDS)
        ) {
        if (IS_DEVELOPMENT && it > 0) {
            console.log(`Testing a new board. Achieved ${BOARD_SIZE - achievedNumberOfEmptyCells} hints in previous board (target was ${numberOfClues}) and undo-ing ${undos} times`)
        }
        board.fillWithRandomCompleteSolution();
        const candidates = board.getFlatCells();
        boardIsUneven = false;
        achievedNumberOfEmptyCells = 0;
        undos = 0;

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

            if (achievedNumberOfEmptyCells > BLOCK_SIZE) {
                const numEmptyCellsInBlock = board.getCellsInBlock(cell).filter(cell => cellIsEmpty(cell)).length;
                if (numEmptyCellsInBlock === BLOCK_SIZE - 1) {
                    if (IS_DEVELOPMENT) {
                        console.log("don't remove last cell in block");
                    }
                    continue; //don't remove the last cell in a block.
                }
            }

            board.clearCell(cell)

            if (achievedNumberOfEmptyCells < 4 || isTriviallySolvable(board)) {
                // At least 4 empty cells are needed to make the board invalid.
                // So we can skip the following logic.
                achievedNumberOfEmptyCells++;
                continue;
            }
            /*
             * It would be nice if it was possible to pass the known solution to the backtracking algorithm
             * to speed up detection of invalid boards.
             * This would require to integrate some of the generator logic into the algorithm and might be impossible.
             */
            const solverResult = solve(board);
            if (solverResultIsError(solverResult)) {
                //we don't need to use the history feature here, we know which cell to restore.
                board.setValueUseCell({
                    ...cell,
                    value: board.getValueFromSolution(cell.x, cell.y),
                    isInitial: true
                }, false);
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
            continue;
        }

        if (achievedNumberOfEmptyCells > bestAchievedEmptyCellsSoFar) {
            bestAchievedEmptyCellsSoFar = achievedNumberOfEmptyCells;
            bestBoardSoFar = cloneDeep(board);
            if (IS_DEVELOPMENT) {
                console.log(`New best board has ${BOARD_SIZE - bestAchievedEmptyCellsSoFar} hints. (${bestBoardSoFar.getNumberOfFilledCells()})`)
            }
        }

        it++;
    }
    if (bestAchievedEmptyCellsSoFar < target) {
        const msg = `Could not generate a valid Sudoku (unique solution) with the desired number of hints. Achieved ${BOARD_SIZE - bestAchievedEmptyCellsSoFar} hints (instead of ${numberOfClues}).`;
        return [GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL, bestBoardSoFar, msg];
    }
    if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_NORMAL) {
        console.log(`${getCallsToSolver()} calls to solver algorithm while generating.`)
        resetCallsToSolver();
        console.assert(!solverResultIsError(solve(board)));
    }
    if (bestBoardSoFar === undefined) {
        // This should never happen if at least 1 cell can be cleared
        throw new Error()
    }
    return [GENERATOR_CODE.OK, bestBoardSoFar];
}

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
    } else if (achievedEmptyCells > BOARD_SIZE / 2) {
        return getCellWithMinimumPossibilites(candidates)[1];
    }
    let result = 0;
    switch (difficulty) {
        case DIFFICULTY_LEVEL.HARD:
            result = pickRandomArrayIndex(candidates);
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
            result = getCellWithFewPossibilites(candidates)[1];
            break;
        case DIFFICULTY_LEVEL.EASY:
            result = getCellWithMinimumPossibilites(candidates)[1];
            break;
    }
    return result;
}

