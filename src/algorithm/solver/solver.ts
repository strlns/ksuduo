import {Puzzle} from "../../model/Sudoku";
import {CellValue} from "../../model/CellData";
import {solveCheckUnique, SOLVER_FAILURE} from "./solverBacktracking";

let callsToSolver = 0;

export function getCallsToSolver() {
    return callsToSolver;
}

export function resetCallsToSolver() {
    callsToSolver = 0;
}

export function solve(sudoku: Puzzle): SolverResult {
    if (IS_DEVELOPMENT) {
        callsToSolver++;
    }
    return solveCheckUnique(sudoku);
}



export type Solution = CellValue[];

export type SolverResult = Solution | SOLVER_FAILURE;

export const solverResultIsError = (result: SolverResult) => !Array.isArray(result);

export const solverErrorString = (result: SolverResult): string => {
    if (solverResultIsError(result)) {
        switch (result) {
            case SOLVER_FAILURE.MULTIPLE_SOLUTIONS:
                return 'MULTIPLE_SOLUTIONS'
            case SOLVER_FAILURE.NO_SOLUTION_FOUND:
                return 'NO_SOLUTION_FOUND'
            default:
                return 'UNKNOWN_ERROR';
        }
    } else {
        return 'OK';
    }
}

enum CHEATER_SOLVING_TECHNIQUE {
    BACKTRACKING
}

export enum SOLVING_TECHNIQUE {
    HUMAN_UNIQPOSS_ROW,
    HUMAN_UNIQPOSS_COL,
    HUMAN_UNIQPOSS_BLOCK,
    MINPOSS_FROM_SOLUTION
}