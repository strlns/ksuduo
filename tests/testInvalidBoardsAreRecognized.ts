import {
    invalid10Solutions,
    invalid125Solutions,
    invalid2Solutions,
    invalid3Solutions,
    invalid4Solutions
} from "../src/examples/invalidExamples";
import {Puzzle} from "../src/model/Sudoku";
import assert from "../src/utility/assert";
import {solveCheckUnique, SOLVER_FAILURE} from "../src/solver/solverBacktracking";

export default function testInvalidBoards() {
    console.log("Testing invalid boards with non-unique solutions.");
    [
        [invalid2Solutions, "invalid2Solutions"],
        [invalid3Solutions, "invalid3Solutions"],
        [invalid4Solutions, "invalid4Solutions"],
        [invalid10Solutions, "invalid10Solutions"],
        [invalid125Solutions, "invalid125Solutions"],
    ].forEach(
        ([board, boardName]) => {
            const solverResult = solveCheckUnique(board as Puzzle);
            assert(solverResult === SOLVER_FAILURE.MULTIPLE_SOLUTIONS, 'Invalid board with multiple solutions was not recognized.');
            console.log(`%c Test passed for ${boardName}`, 'color: #00df00')
        }
    );
}

