/*
 * (c) 2021 Moritz Rehbach. See LICENSE.txt
 */

import {BOARD_SIZE, BOARD_WIDTH, CellIndex, coordsToFlatIndex, Sudoku} from '../model/Sudoku';
import {CellValue} from "../model/CellData";
import assert from "../utility/assert";
import intRange from "../utility/numberRange";
import pickRandomArrayValue from "../utility/pickRandom";
import {Solution, solveWithMattsSolver} from "../solver/solver";
import arraysEqualSimple from "../utility/arraysEqualSimple";
import {Simulate} from "react-dom/test-utils";
import waiting = Simulate.waiting;

export const MINIMUM_CLUES = 17;
export const DEFAULT_CLUES = Math.floor(BOARD_SIZE / 3) - 3;
export const MAXIMUM_CLUES = Math.min(Math.floor(BOARD_SIZE / 2) + 8, BOARD_SIZE);

/**
 * @param numberOfClues
 */

export default function generateRandomSudoku(numberOfClues: number): Sudoku {
    numberOfClues = Math.floor(numberOfClues);
    const target = BOARD_SIZE - numberOfClues;
    let achievedNumberOfEmptyCells = 0;
    let board = new Sudoku();
    const MAX_TOPLEVEL_ITERATIONS = BOARD_SIZE;
    let it = 0;
    while (achievedNumberOfEmptyCells < target && it < MAX_TOPLEVEL_ITERATIONS) {
        board.initializeEmptyBoard();
        let numberOfDeleteTries = 0;
        board.fillWithRandomCompleteSolution();
        board.setSolution(board.getFlatValues() as Solution);
        const coordsGenerator = randomCoordinatesGenerator(true);
        while (BOARD_SIZE - numberOfDeleteTries > numberOfClues) {
            clearCellButOnlyIfSolutionsDontExplode(board, coordsGenerator);
            //for the majority of initial boards it is impossible to delete the desired number of cells without
            //making the board an invalid sudoku (multiple solutions, or not solvable by algo)
            numberOfDeleteTries++;
        }
        achievedNumberOfEmptyCells = BOARD_SIZE - board.getNumberOfFilledCells();
        it++;
    }
    if (achievedNumberOfEmptyCells < target) {
        console.error("SORRY :( I couldn't generate a valid Sudoku.")
    }
    return board;
}

/**
 * Try to estimate if a puzzle has multiple solutions. (a valid Sudoku must have only 1 solution).
 * Add a legal value to a Puzzle, then check if the solution differs from the original.
 * If the maxIterations parameter is kept at its default, EXTREME combinatorial explosion happens.
 */
function hasMultipleSolutionsOrIsUnsolvable(board: Sudoku, maxIterations = 1 << 8): boolean {
    assert(!board.isSolved());
    const flatPuzzle = board.getFlatValues().slice();
    const solution = board.getSolution();
    // const triedCoords: string[] = []
    for (let i = 0; i < maxIterations; i++) {
        const currentCell = board.getRandomEmptyOrInvalidCell();
        const currentCoords: [CellIndex, CellIndex] = [currentCell.x, currentCell.y]; //type inference doesnt work here for some reason
        const newLegalValue = board.getAllowedCellValue(...currentCoords);
        const currentFlatIndex = coordsToFlatIndex(...currentCoords);
        flatPuzzle[currentFlatIndex] = newLegalValue;
        try {
            const solutionAfterAdd = solveWithMattsSolver(flatPuzzle, 1 << 10);
            //if we found a new solution after adding a legal value,
            //we have multiple solutions - bad.
            if (!arraysEqualSimple(solution, solutionAfterAdd)) {
                // console.log("found a 2nd solution");
                return true;
            }
            //if the solution didn't change, reset the modified cell and continue trying
            else {
                flatPuzzle[currentFlatIndex] = CellValue.EMPTY;
            }
        } catch (e) {
            //sudoku solver couldn't solve it. call it unsolvable.
            return true;
        }
    }
    return false;
}

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
/**
 *
 * @param sudoku
 * @param coordsGenerator
 */
const clearCellButOnlyIfSolutionsDontExplode = (sudoku: Sudoku, coordsGenerator: Generator<[CellIndex, CellIndex]>): void => {
    const coords = coordsGenerator.next();
    if (!coords.done) {
        //maybe try to work on flat puzzles here (performance, this is done often)
        sudoku.setValue(coords.value[0], coords.value[1], CellValue.EMPTY, false);
        if (hasMultipleSolutionsOrIsUnsolvable(sudoku)) {
            try {
                sudoku.undo();
            }
            catch (e) {
                //its hopeless, even after undo
            }
        }
    } else {
        //currently obsolete since generator is set to infinite
        throw new Error("could not clear interesting cell, coordinates exhausted");
    }
}


/**
 * Generator for random index pair in specified range.
 * Tried a generator here because we never want to select a coord pair twice. (except when infinite=true)
 * @param max
 * @param min
 * @param infinite
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
