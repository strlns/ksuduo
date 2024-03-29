import {almostDailyNightmareSudokus} from "../src/examples/validExamples";
import {Solution, solverResultIsError} from "../src/algorithm/solver/solver";
import solutionIsValid from "../src/validator/isValidSolution";
import solutionRespectsHints from "../src/debug/solutionRespectsHints";
import drawPuzzle from "../src/debug/drawPuzzleOnConsole";
import {pickRandomArrayValue} from "../src/utility/pickRandom";
import {solveCheckUnique} from "../src/algorithm/solver/solverBacktracking";
import logSuccess from "../src/debug/consoleSuccess";

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
        if (!solutionRespectsHints(puzzle, solution)) {
            throw new Error('Solution is invalid, it does not respect the given hints.');
        }
        if (!solutionIsValid(solution)) {
            drawPuzzle(solution);
            throw new Error('Solution is invalid.');
        }
        logSuccess(`Test passed.`)
    }
}