import generateRandomSudoku, {DIFFICULTY_LEVEL, GENERATOR_CODE} from "../src/algorithm/generator/generator";
import {solveLogically} from "../src/algorithm/solver/logical";
import drawPuzzle from "../src/debug/drawPuzzleOnConsole";
import {solve, solverErrorString, solverResultIsError} from "../src/algorithm/solver/solver";
import logSuccess from "../src/debug/consoleSuccess";

export default function testGeneratorHumanTechniques(
    numberOfHints: number
) {
    const result = generateRandomSudoku(numberOfHints, DIFFICULTY_LEVEL.EASY, true);
    if (result[0] === GENERATOR_CODE.UNKNOWN_ERROR || !result[1]) throw new Error(result[2]);
    const board = result[1];
    if (!solveLogically(board, 1)) throw new Error('Generated Easy puzzle exceeds singles techniques.');
    const solverResult = solve(board);
    //make sure there is no error that makes the board invalid. (safety belt)
    console.log(solverErrorString(solverResult));
    if (solverResultIsError(solverResult)) {
        drawPuzzle(board, true);
        throw new Error('Generator with human-like techniques produced invalid board.')
    } else {
        drawPuzzle(board);
        logSuccess('Generator with human-like techniques produced valid board.')
    }
}