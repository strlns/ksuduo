import testCoordsFlatIndexConversion from "./testCoordsFlatIndexConversion";
import testValidSudokuIsSolved from "./testValidSudokuIsSolved";
import testValidBoardsAreNotClassifiedAsInvalid from "./testValidBoardsAreNotClassifiedAsInvalid";
import testTriviallySolvableBoardsHaveOneSolution from "./testTriviallySolvableBoardsHaveOneSolution";
import testInvalidBoardsAreRecognized from "./testInvalidBoardsAreRecognized";
import testHumanSolvingTechniquesDeliverValidPartialSolutions
    from "./testHumanSolvingTechniquesDeliverValidPartialSolutions";
import testGeneratorHumanTechniques from "./testGeneratorHumanTechniques";

testCoordsFlatIndexConversion();
testValidSudokuIsSolved();
testValidBoardsAreNotClassifiedAsInvalid();
testTriviallySolvableBoardsHaveOneSolution(8);
testInvalidBoardsAreRecognized();

testHumanSolvingTechniquesDeliverValidPartialSolutions(4);

testGeneratorHumanTechniques(32, 4);