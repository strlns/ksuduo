import {Puzzle, Sudoku} from "../../model/Sudoku";
import {CellDataWithPossibilites, CellValue, isEmptyAndNonInitial} from "../../model/CellData";
import {solveCheckUnique, SOLVER_FAILURE} from "./solverBacktracking";
import {addPossibleValuesToCellDataArray} from "./transformations";
import {getCellWithMinimumPossibilites} from "../cellPicker/cellPicker";
import {CellWithNewValue, SOLVING_TECHNIQUE} from "./humanTechniques";

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

export function getCellWithMinPossAndValueFromSolution(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    possibilities?: CellDataWithPossibilites[]
): CellWithNewValue | undefined {
    const cellsWithP = possibilities ? possibilities.filter(cell => isEmptyAndNonInitial(cell)) :
        addPossibleValuesToCellDataArray(
            board.getEmptyCells(), board
        );
    if (cellsWithP.length < 1) {
        return
    }
    const cellToFill = getCellWithMinimumPossibilites(cellsWithP)[0];
    setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.MINPOSS_FROM_SOLUTION)
    return [cellToFill, board.getValueFromSolution(cellToFill.x, cellToFill.y)]
}