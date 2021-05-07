/**
 * Simple backtracking Sudoku solver.
 * Based on @mattflow/sudoku-solver.
 */
import {CellValue, NonEmptyCellValues} from "../model/CellData";
import {getCallsToSolver, Solution} from "./solver";
import {BOARD_SIZE, BOARD_WIDTH, MINIMUM_CLUES} from "../model/Board";
import {getBlockValuesForIndexInFlatPuzzle} from "../model/Sudoku";
import {LOGLEVEL_ERROR, LOGLEVEL_NORMAL, LOGLEVEL_VERBOSE} from "../loglevels";
import {cloneDeep} from "lodash-es";

function checkRow(flatPuzzle: CellValue[], candidate: CellValue, flatIndex: number) {
    const start = Math.floor(flatIndex / BOARD_WIDTH) * BOARD_WIDTH;
    for (let i = 0; i < BOARD_WIDTH; i++) {
        if (flatPuzzle[start + i] === candidate) {
            return false;
        }
    }
    return true;
}

function checkCol(flatPuzzle: CellValue[], candidate: CellValue, flatIndex: number) {
    const start = flatIndex % BOARD_WIDTH;
    for (let i = 0; i < BOARD_WIDTH; i += 1) {
        if (flatPuzzle[start + (i * BOARD_WIDTH)] === candidate) {
            return false;
        }
    }
    return true;
}

function checkBlock(flatPuzzle: CellValue[], candidate: CellValue, index: number) {
    if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
        const values = getBlockValuesForIndexInFlatPuzzle(flatPuzzle, index);
        if (getCallsToSolver() < 4) {
            console.log(flatPuzzle, values, index);
        }
        return !values.includes(candidate);
    }
    return !getBlockValuesForIndexInFlatPuzzle(flatPuzzle, index).includes(candidate);
}

function check(flatPuzzle: CellValue[], candidate: CellValue, index: number) {
    if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
        const row = checkRow(flatPuzzle, candidate, index);
        const col = checkCol(flatPuzzle, candidate, index);
        const block = checkBlock(flatPuzzle, candidate, index);
        if (!row) {
            console.log(`${candidate} failed test ROW at ${index}`)
        } else if (!col) {
            console.log(`${candidate} failed test COL at ${index}`)
        } else if (!block) {
            console.log(`${candidate} failed test BLOCK at ${index}`)
        }
        return row && col && block;
    }
    return checkRow(flatPuzzle, candidate, index) &&
        checkCol(flatPuzzle, candidate, index) &&
        checkBlock(flatPuzzle, candidate, index);
}

const solveWithBacktracking = (flatPuzzle: CellValue[], maxIterations: number): CellValue[] | false => {
    let iteration = 0;
    let board = cloneDeep(flatPuzzle);
    return recursiveSolve(board, 0, maxIterations) ? board : false;

    //mutates argument and returns a boolean value indicating success/failure.
    function recursiveSolve(flatPuzzle: CellValue[], index: number, maxIterations: number): boolean {
        if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
            console.log(`${iteration}-th iteration of backtracking solver.`)
        }
        iteration++;
        //max. iterations reached. (0 = unlimited)
        if (maxIterations !== 0 && iteration > maxIterations) {
            if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_ERROR) {
                console.error(`Throwing after ${iteration} iterations.`)
            }
            throw new Error('Max iterations reached. No solution found.');
        }
        //exhausted board.
        if (index >= BOARD_SIZE) {
            if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_NORMAL) {
                console.log(`Exiting recursive solve because index ${index} exceeds board size (${BOARD_SIZE}).`)
            }
            //this should mean that the solution is complete and valid.
            return true;
            //non-empty value at index, proceed with next cell.
        } else if (flatPuzzle[index] !== CellValue.EMPTY) {
            return recursiveSolve(flatPuzzle, index + 1, maxIterations);
        }

        for (let number of NonEmptyCellValues) {
            if (check(flatPuzzle, number, index)) {
                flatPuzzle[index] = number;
                if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
                    console.log(`Accepted ${number} at ${index}`)
                }
                if (recursiveSolve(flatPuzzle, index + 1, maxIterations)) {
                    return true;
                }
            } else if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
                console.log(`Discarding number ${number} at ${index}`)
            }
        }
        //clear cell, because none of the tested values were valid.
        flatPuzzle[index] = CellValue.EMPTY;
        return false;
    }
}


export function solve(flatPuzzle: CellValue[], maxIterations: number = 1 << 20): Solution {
    if (flatPuzzle.length !== BOARD_SIZE) {
        throw new Error('Puzzle has invalid size.');
    }

    const hints = flatPuzzle.filter(cellValue => cellValue !== CellValue.EMPTY).length;

    if (hints < MINIMUM_CLUES) {
        throw new Error(`Puzzle has less than the minimum required number of hints (${MINIMUM_CLUES})`);
    }
    const result = solveWithBacktracking(flatPuzzle, maxIterations);
    if (!result) {
        /*
        This should be probably reworked to use exit codes instead of exceptions.
        Reason: exceptions are used for control flow in generator (BAD).
        On the other hand, i'm not sure HOW expensive JS exceptions really are in 2021
        */
        throw new Error('Puzzle could not be solved.');
    }

    return flatPuzzle as Solution;
}