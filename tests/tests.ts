import testValidSudokuIsSolved from "./testValidSudokuIsSolved";
import testCoordsFlatIndexConversion from "./testCoordsFlatIndexConversion";
import testValidBoardsAreNotClassifiedAsInvalid from "./testValidBoardsAreNotClassifiedAsInvalid";
import testInvalidBoardsAreRecognized from "./testInvalidBoardsAreRecognized";

testCoordsFlatIndexConversion();
testValidSudokuIsSolved()
testValidBoardsAreNotClassifiedAsInvalid();
testInvalidBoardsAreRecognized();


// const emptyCellsWithP = addPossibleValuesToCellDataArray(board.getEmptyCells(), board);
// drawPuzzleWithPossibilities(board);
