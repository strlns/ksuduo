import {Puzzle, puzzleToSudoku} from "../model/Sudoku";

export default function drawPuzzle(puzzle: Puzzle) {
    const board = puzzleToSudoku(puzzle, false);
    console.log(`%cFlat: ${board.getFlatValues().join('')}\
        \n${board.getRows().map(row => row.map(cell => cell.value).join(' ')).join(`\n`)}`, 'white-space: pre-wrap');
}