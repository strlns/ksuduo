import {Puzzle, puzzleToSudoku} from "../model/Sudoku";
import assert from "../utility/assert";
import {solve} from "../solver/solver";
import {CellData, CellValue, NUM_POSSIBLE_VALUES} from "../model/CellData";
import pickRandomArrayValue from "../utility/pickRandom";
import arraysEqualSimple from "../utility/arraysEqualSimple";
import {DIFFICULTY_LEVEL} from "../generator/generator";
import {coordsToFlatIndex} from "../model/Board";
import {LOGLEVEL_NORMAL} from "../loglevels";
import drawPuzzle from "../debug/puzzleAsTableOnConsole";
import {cloneDeep} from "lodash-es";

export class InitiallyUnsolvableError extends Error {

}

/**
 * Try to estimate if a puzzle has multiple solutions. (a valid Sudoku must have only 1 solution).
 * Add a legal value to a Puzzle, then check if the solution differs from the original.
 * Combinatorial explosion in JavaScript is a GREAT idea, I know <3
 */
export function hasMultipleSolutionsOrIsUnsolvable(boardToTest: Puzzle, difficulty?: DIFFICULTY_LEVEL): boolean {
    const board = puzzleToSudoku(boardToTest);
    assert(!board.isSolved());
    const MAX_DEAD_ENDS = Math.pow(board.getEmptyCells().length, NUM_POSSIBLE_VALUES);
    const MAX_ITERATIONS = difficulty && difficulty > DIFFICULTY_LEVEL.MEDIUM ? (1 << 16) : (1 << 14);
    const flatPuzzle = board.getFlatValues().slice();
    try {
        solve(flatPuzzle)
    } catch (e) {
        /**
         * Already unsolvable without filling any more cells.
         * "Unsolvable" means that the algo can't solve it (so a human can't either.)
         * Instead of returning true, we throw a special Error.
         * That's useful because we can cheat in the generator by adding a cell from the solution
         * and removing another cell instead of starting over with a completely fresh board.
         */
        throw new InitiallyUnsolvableError();
    }
    const solution = cloneDeep(board.getSolution());
    const cellValuePossibilities = new Map<CellData, CellValue[]>();
    const emptyCells = board.getEmptyCells();
    const populateMap = () => {
        emptyCells.forEach(
            cell => cellValuePossibilities.set(
                cell,
                board.getAllowedCellValues(cell)
            )
        );
    }
    populateMap();
    let deadEndCount = 0;
    for (let i = 0; i < MAX_ITERATIONS && deadEndCount < MAX_DEAD_ENDS; i++) {
        const cell = pickRandomArrayValue(emptyCells);
        if (!cell) {
            break; //no more cells left
        }
        const possibleValuesForThisCell = cellValuePossibilities.get(cell) as CellValue[];
        const newLegalValue = pickRandomArrayValue(possibleValuesForThisCell);
        if (newLegalValue === undefined) {
            //possible values exhausted, again relatively unlikely.
            //in this case, the cell is not interesting anymore
            emptyCells.splice(emptyCells.indexOf(cell), 1);
            continue;
        }
        const currentFlatIndex = coordsToFlatIndex(cell.x, cell.y);
        //try out a new legal value to test for a new solution.
        flatPuzzle[currentFlatIndex] = newLegalValue;
        try {
            const solutionAfterAdd = solve(flatPuzzle);
            //if we found a new solution after adding a legal value,
            //we have multiple solutions and can return!
            if (!arraysEqualSimple(solution, solutionAfterAdd)) {
                if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_NORMAL) {
                    /**
                     Problem - solution 2 might be nonsense even if using @mattflow solver.
                     (currently the case with {@link hardSudoku}
                     This code is currently wrong.
                     */
                    console.log("found a 2nd solution. Solution 1:");
                    drawPuzzle(solution)
                    console.log("Solution 2:");
                    drawPuzzle(solutionAfterAdd)
                }
                return true;
            }
                //if the solution didn't change, we can ignore this possible value and unset it.
                //we assume that a new solution arises from ONE added cell.
            //so we revert the cell to empty if the tested new value didn't lead to a new solution.
            else {
                flatPuzzle[currentFlatIndex] = CellValue.EMPTY;
            }
        } catch (e) {
            //sudoku solver couldn't solve it.
            //It doesn't mean that the puzzle is unsolvable.
            //(you can add lots of legal values that lead to dead ends)
            deadEndCount++;
            flatPuzzle[currentFlatIndex] = CellValue.EMPTY;
        }
    }
    return false;
}