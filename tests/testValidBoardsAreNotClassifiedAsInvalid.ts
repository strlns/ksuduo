import {almostDailyNightmareSudokus, gnomeGs4HardSudokus} from "../src/examples/validExamples";
import {solveCheckUnique, SOLVER_FAILURE} from "../src/algorithm/solver/solverBacktracking";
import logSuccess from "../src/debug/consoleSuccess";

export default function testValidBoardsAreNotClassifiedAsInvalid() {
    console.log("Testing that valid boards are not being classified as invalid.");
    [...gnomeGs4HardSudokus, ...gnomeGs4HardSudokus, ...almostDailyNightmareSudokus].forEach(
        (board) => {
            const result = solveCheckUnique(board);
            console.assert(result !== SOLVER_FAILURE.MULTIPLE_SOLUTIONS, 'Puzzle was classified as having multiple solutions, which is not the case.');
            console.assert(result !== SOLVER_FAILURE.NO_SOLUTION_FOUND, 'Puzzle could not be solved, but it should be solvable.');
        }
    );
    logSuccess(`Test passed.`)
}

