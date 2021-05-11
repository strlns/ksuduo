import {almostDailyNightmareSudokus} from "../src/examples/validExamples";
import {Solution, solverResultIsError} from "../src/solver/solver";
import solutionIsValid from "../src/validator/isValidSolution";
import assert from "../src/utility/assert";
import solutionRespectsHints from "../src/debug/solutionRespectsHints";
import drawPuzzle from "../src/debug/puzzleAsTableOnConsole";
import {pickRandomArrayValue} from "../src/utility/pickRandom";
import {solveCheckUnique} from "../src/solver/solverAlgo";

export default function testValidSudokuIsSolved() {
    console.log('Testing that a sudoku is correctly solved.')
    const puzzle = pickRandomArrayValue(almostDailyNightmareSudokus);
    if (puzzle === undefined) {
        throw new Error('No example found.')
    }
    const solverResult = solveCheckUnique(puzzle);
    if (solverResultIsError(solverResult)) {
        throw new Error('Could not solve valid sudoku.');
    } else {
        const solution = solverResult as Solution;
        assert(solutionRespectsHints(puzzle, solution), 'Solution is invalid, it does not respect the given hints.');
        if (!solutionIsValid(solution)) {
            drawPuzzle(solution);
            throw new Error('Solution is invalid.');
        }
        console.log(`%c Test passed.`, 'color: #00df00')
    }
}