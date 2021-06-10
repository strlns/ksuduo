import {pickRandomArrayValue, pickRandomDistinctArrayElements} from "../src/utility/pickRandom";
import {gnomeGs4HardSudokus} from "../src/examples/validExamples";
import solveHuman from "../src/algorithm/solver/solverHumanTechniques";
import {Solution, solve, solverResultIsError} from "../src/algorithm/solver/solver";
import drawPuzzle from "../src/debug/drawPuzzleOnConsole";
import {CellValue} from "../src/model/CellData";
import logSuccess from "../src/debug/consoleSuccess";
import arraysEqualSimple from "../src/utility/arraysEqualSimple";

enum GNOME_DIFFICULTY {
    EASY,
    MEDIUM,
    HARD
}

const getBoards = (n: number, difficulty: GNOME_DIFFICULTY) => {
    switch (difficulty) {
        case GNOME_DIFFICULTY.EASY:
            return pickRandomDistinctArrayElements(gnomeGs4HardSudokus, n)
        case GNOME_DIFFICULTY.MEDIUM:
            return pickRandomDistinctArrayElements(gnomeGs4HardSudokus, n)
        case GNOME_DIFFICULTY.HARD:
        default:
            return pickRandomDistinctArrayElements(gnomeGs4HardSudokus, n)
    }
}
const difficultyWord = (difficulty: GNOME_DIFFICULTY) => {
    switch (difficulty) {
        case GNOME_DIFFICULTY.EASY:
            return 'Easy'
        case GNOME_DIFFICULTY.MEDIUM:
            return 'Medium'
        case GNOME_DIFFICULTY.HARD:
            return 'Hard'
        default:
            return ''
    }
}
export default function testHumanSolvingTechniquesDeliverValidPartialSolutions(numberOfBoardsToTest: number, difficulty = GNOME_DIFFICULTY.MEDIUM) {
    const boards = getBoards(numberOfBoardsToTest, difficulty);
    let numberOfCompletelySolvedBoards = 0;
    console.log(`Testing human solving techniques on ${numberOfBoardsToTest} randomly selected gnomeGs4${difficultyWord(difficulty)}Sudokus.`)
    for (const board of boards) {
        const board = pickRandomArrayValue(gnomeGs4HardSudokus);
        let partialSolution = solveHuman(board, true);
        let realSolution = solve(board);
        if (solverResultIsError(partialSolution) || solverResultIsError(realSolution)) {
            throw new Error('Failed to solve given sudoku')
        }
        partialSolution = partialSolution as Solution;
        realSolution = realSolution as Solution;
        const partialSolutionContainsErrors = (realSolution as Solution).some(
            (val, index) => {
                const partialSolutionElement = (partialSolution as Solution)[index];
                return !(partialSolutionElement === CellValue.EMPTY || partialSolutionElement === val)
            }
        );
        if (partialSolutionContainsErrors) {
            console.error('Correct solution:')
            drawPuzzle(realSolution as Solution, false, false);
            console.error('Generated partial solution:')
            drawPuzzle(partialSolution, true, false);
            throw new Error('(Partial) solution generated using human solving techniques contains an error.')
        }
        if (arraysEqualSimple(partialSolution, realSolution)) {
            numberOfCompletelySolvedBoards++;
        }
    }
    logSuccess(`Human-like solver delivered valid (partial) solutions for ${numberOfBoardsToTest} boards.
${numberOfCompletelySolvedBoards} of these boards could be solved completely.
`)
}