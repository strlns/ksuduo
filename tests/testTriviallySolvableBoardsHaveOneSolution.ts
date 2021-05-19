import {drawPuzzleWithPossibilities} from "../src/debug/drawPuzzleOnConsole";
import {isTriviallySolvable, Sudoku} from "../src/model/Sudoku";
import {BOARD_SIZE} from "../src/model/Board";
import {pickRandomArrayValue} from "../src/utility/pickRandom";
import {CellValue} from "../src/model/CellData";
import {solve, solverErrorString, solverResultIsError} from "../src/solver/solver";

export default function testTriviallySolvableBoardsHaveOneSolution() {
    console.log("Testing for 16 random boards that boards always have 1 solution if classified as trivially solvable.")
    for (let k = 0; k < 8; k++) {
        const board = new Sudoku();
        board.fillWithRandomCompleteSolution();
        let i = 0;
        while (isTriviallySolvable(board) && i < BOARD_SIZE) {
            const solverResult = solve(board);
            if (solverResultIsError(solverResult)) {
                drawPuzzleWithPossibilities(board);
                console.error(solverErrorString(solverResult));
                throw new Error('Board was classified as trivially solvable, but in fact it is not solvable at all!');
            }
            const cellToClear = pickRandomArrayValue(board.getFilledCells());
            board.setValue(cellToClear.x, cellToClear.y, CellValue.EMPTY, false, false);
            i++;
        }
    }
    console.log(`%c Test passed.`, 'color: #00df00')
}