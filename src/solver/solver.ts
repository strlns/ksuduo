import {Puzzle, Sudoku} from "../model/Sudoku";
import assert from "../utility/assert";
import {CellValue} from "../model/CellData";
import {BOARD_SIZE} from "../model/Board";
import {solve as solveByBacktracking} from "./solverAlgo";
import {LOGLEVEL_VERBOSE} from "../loglevels";

let callsToSolver = 0;

export function getCallsToSolver() {
    return callsToSolver;
}

export function resetCallsToSolver() {
    callsToSolver = 0;
}

export function solve(sudoku: Puzzle, solver: SOLVERS = SOLVERS.MATTFLOW): Solution {
    if (IS_DEVELOPMENT) {
        callsToSolver++;
    }
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
        const solution: number[] = mattsSolver(
            flatPuzzle,
            {outputArray: true, maxIterations}
        );
        if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
            assert(solution.length === BOARD_SIZE);
        }
        return solution;
    } finally {
        //solver holds internal state and needs a re-init if it fails
        //THIS DOESN'T SEEM TO WORK. Generation differs between runs.
        mattsSolver = require('@mattflow/sudoku-solver/index');
    }
}
