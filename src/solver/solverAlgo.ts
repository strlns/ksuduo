/**
 * Simple backtracking Sudoku solver.
 * Was originally based on @mattflow/sudoku-solver
 */
import {CellValue, CellValues} from "../model/CellData";
import {Solution} from "./solver";
import {BOARD_SIZE, BOARD_WIDTH, MINIMUM_CLUES} from "../model/Board";
import {getBlockValuesForIndexInFlatPuzzle} from "../model/Sudoku";

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
    return !getBlockValuesForIndexInFlatPuzzle(flatPuzzle, index).includes(candidate);
}

function check(flatPuzzle: CellValue[], candidate: CellValue, index: number) {
    return checkRow(flatPuzzle, candidate, index) &&
        checkCol(flatPuzzle, candidate, index) &&
        checkBlock(flatPuzzle, candidate, index);
}

const solveWithBacktracking = (flatPuzzle: CellValue[], maxIterations: number): CellValue[] | false => {
    let iteration = 0;
    return recursiveSolve(flatPuzzle, 0, maxIterations);

    function recursiveSolve(flatPuzzle: CellValue[], index: number, maxIterations: number): CellValue[] | false {
        if (maxIterations !== 0 && ++iteration > maxIterations) {
            throw new Error('Max iterations reached. No solution found.');
        }
        if (index >= BOARD_SIZE) {
            return flatPuzzle;
        } else if (flatPuzzle[index] !== 0) {
            return recursiveSolve(flatPuzzle, index + 1, maxIterations);
        }

        for (let number of CellValues) {
            if (check(flatPuzzle, number, index)) {
                flatPuzzle[index] = number;
                if (recursiveSolve(flatPuzzle, index + 1, maxIterations)) {
                    return flatPuzzle;
                }
            }
        }

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

    if (!solveWithBacktracking(flatPuzzle, maxIterations)) {
        throw new Error('Puzzle could not be solved.');
    }

    return flatPuzzle as Solution;
}