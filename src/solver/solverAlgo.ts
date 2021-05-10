/**
 * Backtracking Sudoku solver that also detects non-uniqueness of the solution.
 *
 * Based on
 * @mattflow/sudoku-solver and
 * https://stackoverflow.com/questions/24343214/determine-whether-a-sudoku-has-a-unique-solution
 */
import {CellValue, NonEmptyCellValues} from "../model/CellData";
import {Solution} from "./solver";
import {BOARD_SIZE, BOARD_WIDTH, MINIMUM_CLUES} from "../model/Board";
import {getBlockValuesForIndexInFlatPuzzle, Puzzle, Sudoku} from "../model/Sudoku";
import {LOGLEVEL_VERBOSE} from "../loglevels";

export enum SOLVER_FAILURE {
    NO_SOLUTION_FOUND = 0,
    MULTIPLE_SOLUTIONS = 1
}

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
        return !values.includes(candidate);
    }
    return !getBlockValuesForIndexInFlatPuzzle(flatPuzzle, index).includes(candidate);
}

function check(flatPuzzle: CellValue[], candidate: CellValue, index: number) {
    return checkRow(flatPuzzle, candidate, index) &&
        checkCol(flatPuzzle, candidate, index) &&
        checkBlock(flatPuzzle, candidate, index);
}

const solveWithBacktrackingCheckUnique = (flatPuzzle: CellValue[], maxIterations: number): Solution | SOLVER_FAILURE => {
    let iteration = 0;
    const puzzle = flatPuzzle.slice(); //recursive inner function works in-place. outer function preserves argument.
    /*
      because we continue backtracking in search of a 2nd solution,
      the solution must be assigned to a temporary variable when finishing
      the first backtracking run.
     */
    let solution: Solution | undefined;

    /*
     * inspired by https://stackoverflow.com/questions/24343214/determine-whether-a-sudoku-has-a-unique-solution
     * NOT a pure function, this mutates the argument `puzzle` and works in-place.
     */
    function recursiveSolveWithCount(puzzle: CellValue[], index: number, solutionCount: number = 0): number {
        if (maxIterations !== 0 && iteration > maxIterations) {
            if (IS_DEVELOPMENT) {
                console.error("Maximum iterations reached, no solution found.");
                return solutionCount;
            }
        }
        if (index >= BOARD_SIZE) {
            solution = puzzle.slice();
            return solutionCount + 1;
        }
        if (puzzle[index] !== CellValue.EMPTY) {
            return recursiveSolveWithCount(puzzle, index + 1, solutionCount);
        }

        for (let value of NonEmptyCellValues) {
            if (solutionCount > 1) {
                break;
            }
            if (check(puzzle, value, index)) {
                puzzle[index] = value;
                solutionCount = recursiveSolveWithCount(puzzle, index, solutionCount);
            }
        }
        //Backtracking
        puzzle[index] = CellValue.EMPTY;
        return solutionCount;
    }

    const solutionCount = recursiveSolveWithCount(puzzle, 0);
    if (solutionCount === 1 && solution !== undefined) {
        return solution as Solution;
    } else if (solutionCount > 1) {
        return SOLVER_FAILURE.MULTIPLE_SOLUTIONS;
    }
    return SOLVER_FAILURE.NO_SOLUTION_FOUND;

}

export function solveCheckUnique(puzzle: Puzzle, maxIterations: number = 1 << 20): Solution | SOLVER_FAILURE {
    const flatPuzzle = puzzle instanceof Sudoku ? puzzle.getFlatValues() : puzzle as CellValue[];
    if (flatPuzzle.length !== BOARD_SIZE) {
        throw new Error('Puzzle has invalid size.');
    }

    const hints = flatPuzzle.filter(cellValue => cellValue !== CellValue.EMPTY).length;

    if (hints < MINIMUM_CLUES) {
        throw new Error(`Puzzle has less than the minimum required number of hints (${MINIMUM_CLUES})`);
    }
    return solveWithBacktrackingCheckUnique(flatPuzzle, maxIterations);
}