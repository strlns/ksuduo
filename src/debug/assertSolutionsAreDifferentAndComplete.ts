import {Solution} from "../algorithm/solver/solver";
import {CellValue} from "../model/CellData";

// noinspection JSUnusedGlobalSymbols
export default function assertSolutionsAreDifferentAndComplete(solution: Solution, solution2: Solution) {
    console.assert(
        [solution, solution2].every(solution => solution.every(
            (value) => value !== CellValue.EMPTY
        )),
        'One of the two given solutions is incomplete.'
    );
    console.assert(
        solution.some(
            (value, index) => value !== solution2[index]
        ),
        'Two solutions assumed to be different are identical.'
    );
}