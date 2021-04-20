import {BOARD_SIZE, flatIndexToCoords, Sudoku} from "../model/Sudoku";
import {cloneDeep} from "lodash-es";
import assert from "../utility/assert";
import {CellValue} from "../model/CellData";

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

export type Solution = CellValue[];

export async function solveWithMattsSolver(sudoku: Sudoku): Promise<Solution> {
    try {
        const solution: number[] = mattsSolver(sudoku.getFlatValues().map(val => val as number), {outputArray: true});
        assert(solution.length === BOARD_SIZE);
        return solution;
    }
    finally {
        //solver holds internal state and needs a re-init iff it fails
        mattsSolver = require('@mattflow/sudoku-solver/index');
    }
}