import {pickRandomDistinctArrayElements} from "../src/utility/pickRandom";
import {gnomeGs4HardSudokus} from "../src/examples/validExamples";
import {solveLogical} from "../src/algorithm/solver/logical";
import {puzzleToSudoku} from "../src/model/Sudoku";
import {solveCheckUnique} from "../src/algorithm/solver/solverBacktracking";
import drawPuzzle from "../src/debug/drawPuzzleOnConsole";
import logSuccess from "../src/debug/consoleSuccess";

export default function testHumanSolvingTechniquesDeliverValidPartialSolutions(numberOfBoardsToTest: number) {
    const boards = pickRandomDistinctArrayElements(gnomeGs4HardSudokus, numberOfBoardsToTest);
    let solved = 0;
    for (const puzzle of boards) {
        const partial = solveLogical(puzzleToSudoku(puzzle), 3, true);
        const solution = solveCheckUnique(puzzle);
        if (!partial || !Array.isArray(solution)) throw new Error('Failed to solve diagnostic fixture.');
        if (partial.some((value, i) => value !== 0 && value !== solution[i])) {
            drawPuzzle(partial, true, false);
            throw new Error('Logical solver filled an incorrect value.');
        }
        if (partial.every((value, i) => value === solution[i])) solved++;
    }
    logSuccess(`Logical solver produced correct partial solutions for ${boards.length} distinct fixtures; ${solved} fully solved.`);
}
