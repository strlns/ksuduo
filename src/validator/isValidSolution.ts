import {Solution} from "../solver/solver";
import {Puzzle, puzzleToSudoku} from "../model/Sudoku";
import {uniq} from "lodash-es";

export default function solutionIsValid(solution: Solution): boolean {
    const sudoku = puzzleToSudoku(solution as Puzzle, false);
    return sudoku.getRows().every(row => (uniq(row).length === row.length)) &&
        sudoku.getColumns().every(col => (uniq(col).length === col.length)) &&
        sudoku.getBlocks().every(block => {
            const cells = block.cells.map(cell => cell.value);
            return uniq(cells).length === cells.length;
        });
}