import {gnomeGs4HardSudokus} from "../src/examples/validExamples";
import {puzzleToSudoku} from "../src/algorithm/solver/transformations";

// testCoordsFlatIndexConversion();
// testValidSudokuIsSolved();
// testValidBoardsAreNotClassifiedAsInvalid();
// testTriviallySolvableBoardsHaveOneSolution(8);
// testInvalidBoardsAreRecognized();

const board = puzzleToSudoku(gnomeGs4HardSudokus[4]);

