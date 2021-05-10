import {Solution} from "../solver/solver";
import assert from "../utility/assert";
import {CellValue} from "../model/CellData";

export default function assertSolutionsAreDifferentAndComplete(solution: Solution, solution2: Solution) {
    assert(
        [solution, solution2].every(solution => solution.every(
            (value, index) => value !== CellValue.EMPTY
        )),
        'One of the two given solutions is incomplete.'
    );
    assert(
        solution.some(
            (value, index) => value !== solution2[index]
        ),
        'Two solutions assumed to be different are identical.'
    );
}