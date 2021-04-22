import {BOARD_SIZE, Sudoku} from "../model/Sudoku";
import assert from "../utility/assert";
import {CellValue} from "../model/CellData";

export type Puzzle = Sudoku|CellValue[]|number[];

let mattsSolver = require('@mattflow/sudoku-solver/index');
/**
 * This function should return all solutions to a sudoku, or an empty array
 * if it is not solvable.
 * @param sudoku
 * @param solver
 */
export function solve(sudoku: Puzzle, solver: SOLVERS = SOLVERS.MATTFLOW): Solution {
    switch (solver) {
        case SOLVERS.MATTFLOW:
            return solveWithMattsSolver(sudoku);
            break;
        case SOLVERS.FOO:
            return [];
        default:
            throw new Error()
    }
}

export enum SOLVERS {
    MATTFLOW,
    FOO
}

export type Solution = CellValue[];

export function solveWithMattsSolver(sudoku: Sudoku|CellValue[], maxIterations = 1<<20): Solution {
    try {
        const values = sudoku instanceof Sudoku ? sudoku.getFlatValues().map(val => val as number) :
            sudoku.map(cellVal => cellVal as number);
        const solution: number[] = mattsSolver(
            values,
            {outputArray: true, maxIterations}
            );
        assert(solution.length === BOARD_SIZE);
        return solution;
    }
    finally {
        //solver holds internal state and needs a re-init if it fails
        mattsSolver = require('@mattflow/sudoku-solver/index');
    }
}