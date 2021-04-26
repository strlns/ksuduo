import {
    invalid10Solutions,
    invalid125Solutions,
    invalid2Solutions,
    invalid3Solutions,
    invalid4Solutions
} from "../src/examples/invalidExamples";
import {Puzzle} from "../src/model/Sudoku";
import assert from "../src/utility/assert";
import {hasMultipleSolutionsOrIsUnsolvable} from "../src/validator/hasMultipleSolutionsOrIsUnsolvable";

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
            try {
                assert(hasMultipleSolutionsOrIsUnsolvable(board as Puzzle));
            } catch (e) {
                console.error(`Test failed for ${boardName}, multiple solutions were not recognized.`)
                throw e;
            }
            console.log(`%c Test passed for ${boardName}, recognized as invalid board (not a Sudoku)`, 'color: #00df00')
        }
    );
}

