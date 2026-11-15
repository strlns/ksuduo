import {Puzzle, Sudoku} from "../../model/Sudoku";
import {CellData, CellValue, isEmptyAndNonInitial} from "../../model/CellData";
import {solveCheckUnique, SOLVER_FAILURE} from "./solverBacktracking";
export function solve(sudoku: Puzzle): SolverResult {
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

/** Explicit reveal fallback for older saves outside the supported logical techniques. */
export function getCellWithMinPossAndValueFromSolution(board: Sudoku): [CellData, CellValue] | undefined {
    const cells = board.getEmptyCells().filter(isEmptyAndNonInitial);
    if (!cells.length) return;
    const cell = cells.reduce((best, candidate) =>
        board.getAllowedCellValues(candidate).length < board.getAllowedCellValues(best).length ? candidate : best);
    return [cell, board.getValueFromSolution(cell.x, cell.y)];
}
