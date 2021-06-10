import {generateBoardSolvableUsingEasyTechniques} from "../src/algorithm/generator/generatorHumanTechniques";
import drawPuzzle from "../src/debug/drawPuzzleOnConsole";
import {solve, solverErrorString, solverResultIsError} from "../src/algorithm/solver/solver";
import logSuccess from "../src/debug/consoleSuccess";

export default function testGeneratorHumanTechniques(
    numberOfHints: number, maxTopLevelIterations = 4
) {
    const board = generateBoardSolvableUsingEasyTechniques(numberOfHints, maxTopLevelIterations);
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