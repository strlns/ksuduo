import {drawPuzzleWithPossibilities} from "../src/debug/drawPuzzleOnConsole";
import {solve, solverErrorString, solverResultIsError} from "../src/algorithm/solver/solver";
import {generateTriviallySolvableBoard} from "../src/algorithm/generator/generatorHumanTechniques";
import logSuccess from "../src/debug/consoleSuccess";

export default function testTriviallySolvableBoardsHaveOneSolution(numberOfBoardsToGenerateAndTest = 8) {
    console.log(`Testing for ${numberOfBoardsToGenerateAndTest} random boards that boards always have 1 solution if classified as trivially solvable.`)
    for (let k = 0; k < numberOfBoardsToGenerateAndTest; k++) {
        const board = generateTriviallySolvableBoard();
        const solverResult = solve(board);
        if (solverResultIsError(solverResult)) {
            drawPuzzleWithPossibilities(board);
            console.error(solverErrorString(solverResult));
            throw new Error('Board was classified as trivially solvable, but in fact it is not solvable at all!');
        }
    }
    logSuccess(`Test passed.`)
}