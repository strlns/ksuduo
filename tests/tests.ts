import {pickRandomArrayValue} from "../src/utility/pickRandom";
import {gnomeGs4HardSudokus} from "../src/examples/validExamples";
import solve from "../src/algorithm/solver/solverHumanTechniques";
import {puzzleToSudoku} from "../src/algorithm/solver/transformations";

// testCoordsFlatIndexConversion();
// testValidSudokuIsSolved();
// testValidBoardsAreNotClassifiedAsInvalid();
// testTriviallySolvableBoardsHaveOneSolution(8);
// testInvalidBoardsAreRecognized();

const board = puzzleToSudoku(pickRandomArrayValue(gnomeGs4HardSudokus));
console.log(solve(board));
