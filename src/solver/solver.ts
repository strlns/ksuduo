import {Puzzle, Sudoku} from "../model/Sudoku";
import assert from "../utility/assert";
import {CellValue} from "../model/CellData";
import {BOARD_SIZE} from "../model/Board";
import {solve as solveByBacktracking} from "./solverAlgo";

/**
 * @param sudoku
 * @param solver
 */
export function solve(sudoku: Puzzle, solver: SOLVERS = SOLVERS.MATTFLOW): Solution {
    const flatPuzzle = (sudoku instanceof Sudoku ? sudoku.getFlatValues() : sudoku) as number[];
    switch (solver) {
        case SOLVERS.MATTFLOW:
            return solveWithMattsSolver(flatPuzzle);
        case SOLVERS.BACKTRACKING_GENERAL:
            return solveByBacktracking(flatPuzzle);
        default:
            throw new Error()
    }
}

export enum SOLVERS {
    MATTFLOW,
    BACKTRACKING_GENERAL
}

export type Solution = CellValue[];

let mattsSolver = require('@mattflow/sudoku-solver/index');

export function solveWithMattsSolver(flatPuzzle: CellValue[], maxIterations = 1 << 24): Solution {
    try {
        // commented out because this leads to seriously slowdown of puzzle generation
        // if (IS_DEVELOPMENT) {
        //     console.log(`attempting to solve puzzle: ${arrayChunk(flatPuzzle, BOARD_WIDTH).map(row => row.join()).join('\n')}`)
        // }
        const solution: number[] = mattsSolver(
            flatPuzzle,
            {outputArray: true, maxIterations}
        );
        if (IS_DEVELOPMENT) {
            assert(solution.length === BOARD_SIZE);
        }
        return solution;
    } finally {
        //solver holds internal state and needs a re-init if it fails
        mattsSolver = require('@mattflow/sudoku-solver/index');
    }
}
