import {CellValue} from "../model/CellData";
import {Solution} from "../solver/solver";

export default function solutionRespectsHints(flatPuzzle: CellValue[], solution: Solution): boolean {
    return flatPuzzle.every(
        (value, index) => value === CellValue.EMPTY || solution[index] === value
    );
}