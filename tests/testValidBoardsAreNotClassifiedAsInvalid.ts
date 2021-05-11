import assert from "../src/utility/assert";
import {almostDailyNightmareSudokus, gnomeGs4HardSudokus} from "../src/examples/validExamples";
import {solveCheckUnique, SOLVER_FAILURE} from "../src/solver/solverAlgo";

export default function testValidBoardsAreNotClassifiedAsInvalid() {
    console.log("Testing that valid boards are not being classified as invalid.");
    [...gnomeGs4HardSudokus, ...gnomeGs4HardSudokus, ...almostDailyNightmareSudokus].forEach(
        (board, index) => {
            const result = solveCheckUnique(board);
            assert(result !== SOLVER_FAILURE.MULTIPLE_SOLUTIONS, 'Puzzle was classified as having multiple solutions, which is not the case.');
            assert(result !== SOLVER_FAILURE.NO_SOLUTION_FOUND, 'Puzzle could not be solved, but it should be solvable.');
        }
    );
    console.log(`%c Test passed.`, 'color: #00df00')
}

