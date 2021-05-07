import {Puzzle, Sudoku} from "../model/Sudoku";
import {BOARD_WIDTH} from "../model/Board";
import arrayChunk from "../utility/arrayChunk";

export default function drawPuzzle(puzzle: Puzzle) {
    //don't use "puzzleToSudoku" because that triggers the solver that we might want to debug...
    if (puzzle instanceof Sudoku) {
        console.table(puzzle.getRows());
    } else {
        console.table(arrayChunk(puzzle, BOARD_WIDTH));
    }
}