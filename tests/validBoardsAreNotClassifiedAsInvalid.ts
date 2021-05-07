import {Puzzle} from "../src/model/Sudoku";
import assert from "../src/utility/assert";
import {
    hasMultipleSolutionsOrIsUnsolvable,
    InitiallyUnsolvableError
} from "../src/validator/hasMultipleSolutionsOrIsUnsolvable";
import drawPuzzle from "../src/debug/puzzleAsTableOnConsole";
import {easySudoku, hardSudoku} from "../src/examples/validExamples";

export default function testValidBoards() {
    console.log("Testing that valid boards are not being classified as invalid.");

    [
        [easySudoku, "easySudoku"],
        [hardSudoku, "hardSudoku"],
    ].forEach(
        ([board, boardName]) => {
            try {
                drawPuzzle(board as Puzzle);
                assert(!hasMultipleSolutionsOrIsUnsolvable(board as Puzzle));
            } catch (e) {
                console.error(`Test failed for ${boardName}.`)
                if (e instanceof InitiallyUnsolvableError) {
                    console.error(`${boardName} was classified as unsolvable.`)
                } else {
                    console.error(`${boardName} was classified as having multiple solutions, which is not the case.`)
                }
                throw e;
            }
            console.log(`%c Test passed for ${boardName}, recognized as invalid board (not a Sudoku)`, 'color: #00df00')
        }
    );
}

