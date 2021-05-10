import testInvalidBoardsAreRecognized from "./testInvalidBoardsAreRecognized";
import testValidBoardsAreNotClassifiedAsInvalid from "./testValidBoardsAreNotClassifiedAsInvalid";
import testValidSudokuIsSolved from "./testValidSudokuIsSolved";
import testCoordsFlatIndexConversion from "./testCoordsFlatIndexConversion";

testCoordsFlatIndexConversion();
testValidSudokuIsSolved()
testValidBoardsAreNotClassifiedAsInvalid();
testInvalidBoardsAreRecognized();