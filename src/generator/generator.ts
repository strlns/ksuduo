/*
 * @module SudokuGenerator
 */

export const verboseGeneratorExplanationText = `Start with a randomly generated, completely filled board. 
Then clear cells one at a time - after each removal, use backtracking:
Add legal values, then use Sudoku solver to check for differing
solutions or dead ends.
If such are found, the cell must not be removed and is reverted.
Different legal values are tried for the empty cells in each stage 
of the removal process.

If no cell can be removed without making the board invalid (multiple solutions),
the fully completed "seed" board is discarded - rinse, repeat until the desired number of cells are cleared.`;

import {BOARD_SIZE, BOARD_WIDTH, CellIndex, coordsToFlatIndex, flatIndexToCoords, Sudoku} from '../model/Sudoku';
import {CellData, cellIsEmpty, CellValue} from "../model/CellData";
import assert from "../utility/assert";
import intRange from "../utility/numberRange";
import pickRandomArrayValue from "../utility/pickRandom";
import {Solution, solve, solveWithMattsSolver} from "../solver/solver";
import arraysEqualSimple from "../utility/arraysEqualSimple";
import {wait} from "../utility/debug/synchronousWait";

export const MINIMUM_CLUES = 17;
export const DEFAULT_CLUES = Math.floor(BOARD_SIZE / 3) - 3;
export const MAXIMUM_CLUES = Math.min(Math.floor(BOARD_SIZE / 2) + 8, BOARD_SIZE);

class InitiallyUnsolvableError extends Error {

}

export default function generateRandomSudoku(numberOfClues: number): Sudoku {
    if (IS_DEVELOPMENT) {
        wait(1000);
    }
    numberOfClues = Math.floor(numberOfClues);
    const target = BOARD_SIZE - numberOfClues;
    let achievedNumberOfEmptyCells = 0;
    const MAX_TOPLEVEL_ITERATIONS = 1 << 8;
    let it = 0;
    let board = new Sudoku();
    while (achievedNumberOfEmptyCells < target && it < MAX_TOPLEVEL_ITERATIONS) {
        // console.log("testing a new board. the previous one sucked.");
        board = new Sudoku();
        let numberOfDeleteTries = 0;
        board.fillWithRandomCompleteSolution();
        board.setSolution(board.getFlatValues() as Solution);
        // const coordsGenerator = randomCoordinatesGenerator(true);
        while (numberOfDeleteTries < (1 << 8)) {
            clearCellButOnlyIfSolutionsDontExplode(board);
            achievedNumberOfEmptyCells = BOARD_SIZE - board.getNumberOfFilledCells();
            //for many initial boards it is impossible to delete the desired number of cells without
            //making the board an invalid sudoku (multiple solutions, or not solvable by algo)
            numberOfDeleteTries++;
            if (achievedNumberOfEmptyCells === target) break;
            // console.log("achieved", achievedNumberOfEmptyCells, "target", target);
        }
        it++;
    }
    /**
     * history is used in generator for backtracing. after generating, we clear it.
     */
    board.clearHistory();
    if (achievedNumberOfEmptyCells < target) {
        console.error("SORRY ;( I couldn't generate a valid Sudoku.")
    }
    return board;
}

/**
 * Try to estimate if a puzzle has multiple solutions. (a valid Sudoku must have only 1 solution).
 * Add a legal value to a Puzzle, then check if the solution differs from the original.
 * Combinatorial explosion in JavaScript is a GREAT idea, I know <3
 */
function hasMultipleSolutionsOrIsUnsolvable(board: Sudoku, maxIterations = (1 << 8)): boolean {
    assert(!board.isSolved());
    const flatPuzzle = board.getFlatValues().slice();
    try {
        solve(flatPuzzle)
    } catch (e) {
        /**
         * Already unsolvable without filling any more cells.
         *"Unsolvable" means that the algo can't solve it (so a human can't either.)
         * Instead of returning true, we throw a special Error.
         * That's useful because we can cheat in the generator by adding a cell from the solution
         * and removing another cell instead of starting over with a completely fresh board.
         */
        throw new InitiallyUnsolvableError();
    }
    const solution = board.getSolution();
    const cellValuePossibilities = new Map<CellData, CellValue[]>();
    const emptyCells = board.getEmptyCells();
    emptyCells.forEach(
        cell => cellValuePossibilities.set(
            cell,
            board.getAllowedCellValues(cell)
        )
    );
    let deadEndCount = 0;
    for (let i = 0; i < maxIterations; i++) {
        const cell = pickRandomArrayValue(emptyCells);
        if (!cell) {
            break; //no more cells left (unlikely considering the combinatorial explosion...)
        }
        //cast needed because TypeScript can't analyze the populated Map
        const possibleValuesForThisCell = cellValuePossibilities.get(cell) as CellValue[];
        const newLegalValue = possibleValuesForThisCell.pop();
        // //the new length of the array after pop === the index of the value we obtained.
        // //avoids another indexOf call later.
        // const currentCellValuePossibilityIndex = possibleValuesForThisCell.length;
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
            const solutionAfterAdd = solveWithMattsSolver(flatPuzzle);
            //if we found a new solution after adding a legal value,
            //we have multiple solutions and can return!
            if (!arraysEqualSimple(solution, solutionAfterAdd)) {
                // console.log("found a 2nd solution, backtracking")
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
            //I'm not sure yet what to do in this case.
            //It doesn't mean that the puzzle is unsolvable.
            //(you can add lots of legal values that lead to dead ends)
            deadEndCount++;
        }
    }
    return false;
}

// noinspection JSUnusedLocalSymbols
/**
 * @deprecated
 * @param sudoku
 * @param coordsGenerator
 */
const clearRandomCell = (sudoku: Sudoku, coordsGenerator: Generator<CellIndex[]>): void => {
    const generatorResult = coordsGenerator.next();
    if (!generatorResult.done) {
        const coords = generatorResult.value;
        sudoku.setValue(coords[0], coords[1], CellValue.EMPTY, false);
    }
}

const clearCellButOnlyIfSolutionsDontExplode = (sudoku: Sudoku): void => {
    let maxIterations = 1 << 16;
    const candidates = sudoku.getFilledCells();
    for (let i = 0; i < maxIterations; i++) {
        const cell = pickRandomArrayValue(candidates);
        if (!cell) {
            return;
        }
        //Try to clear the cell. Then we test if the puzzle still (probably) has a unique solution
        sudoku.setValue(cell.x, cell.y, CellValue.EMPTY);
        let isAmbiguousOrInterestinglyUnsolvable: boolean;
        try {
            isAmbiguousOrInterestinglyUnsolvable = hasMultipleSolutionsOrIsUnsolvable(sudoku);
        } catch (e) {
            //swap a removed cell with a cell from the solution
            if (e instanceof InitiallyUnsolvableError) {
                const solutionCellsAlreadyRemoved = sudoku.getSolution().map(
                    (cellValue, flatIndex) => sudoku.getCell(...flatIndexToCoords(flatIndex)))
                    .filter(cell => cellIsEmpty(cell));
                const cellToAdd = pickRandomArrayValue(solutionCellsAlreadyRemoved);
                sudoku.setCell(
                    cellToAdd as CellData, false
                );
                /** no need to remove another cell instead.
                 * the cell we re-added is not in the candidates array anymore,
                 and the loop continues to try removing other cells.*/
            }
            isAmbiguousOrInterestinglyUnsolvable = false;
        }

        if (isAmbiguousOrInterestinglyUnsolvable) {
            sudoku.undo();
            //seems like we shouldnt remove this cell.
            candidates.splice(candidates.indexOf(cell), 1);
        } else {
            break;
        }
    }
}


// noinspection JSUnusedLocalSymbols
/**
 * Generator for random index pair in specified range.
 * Tried a generator here because we never want to select a coord pair twice. (except when infinite=true)
 * @param max
 * @param min
 * @param infinite
 * @deprecated
 */
function* randomCoordinatesGenerator(infinite = false,
                                     max: number = BOARD_WIDTH - 1,
                                     min: number = 0): Generator<[CellIndex, CellIndex]> {
    max = Math.floor(max);
    min = Math.floor(min);
    assert(max > min);
    const range = intRange(min, max);

    function makeCoords(): [CellIndex, CellIndex] {
        return [
            pickRandomArrayValue(range) as CellIndex,
            pickRandomArrayValue(range) as CellIndex
        ];
    }

    const usedCoords: string[] = [];
    const coordsSpaceSize = Math.pow(max - min, 2);
    while (true) {
        if (usedCoords.length >= coordsSpaceSize) {
            if (infinite) {
                usedCoords.length = 0;
            } else return;
        }
        let coords = makeCoords();
        while (usedCoords.includes(coords.join())) {
            coords = makeCoords();
        }
        usedCoords.push(coords.join());
        yield coords;
    }
}
