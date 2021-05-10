import {Puzzle} from "../model/Sudoku";
import {CellValue} from "../model/CellData";
import {solveCheckUnique, SOLVER_FAILURE} from "./solverAlgo";

let callsToSolver = 0;

export function getCallsToSolver() {
    return callsToSolver;
}

export function resetCallsToSolver() {
    callsToSolver = 0;
}

export function solve(sudoku: Puzzle): Solution | SOLVER_FAILURE {
    if (IS_DEVELOPMENT) {
        callsToSolver++;
    }
    return solveCheckUnique(sudoku);
}

export type Solution = CellValue[];

export type SolverResult = Solution | SOLVER_FAILURE;

export const solverResultIsError = (result: SolverResult) => !Array.isArray(result);
