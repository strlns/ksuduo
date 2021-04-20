import {flatIndexToCoords, Sudoku} from "../model/Sudoku";
import {cloneDeep} from "lodash-es";
let mattsSolver = require('@mattflow/sudoku-solver/index');
/**
 * This function should return all solutions to a sudoku, or an empty array
 * if it is not solvable.
 * @param sudoku
 *
 */
export function solve(sudoku: Sudoku): Sudoku[] {
    throw new Error("Not implemented yet")
}

export enum SOLVERS {
    MATTFLOW
}

export type Solution = Sudoku[] | Sudoku;

export async function solveWithMattsSolver(sudoku: Sudoku): Promise<Solution> {
    try {
        const solutionData: number[] = mattsSolver(sudoku.getFlatValues().map(val => val as number), {outputArray: true});
        const solution = cloneDeep(sudoku);
        solutionData.forEach((value, index) => {
            const [x, y] = flatIndexToCoords(index);
            const cell = solution.getCell(x, y);
            if (!cell.isInitial) {
                cell.value = value;
            }
        });
        return solution;
    }
    finally {
        //solver holds internal state and needs a re-init iff it fails
        mattsSolver = require('@mattflow/sudoku-solver/index');
    }
}