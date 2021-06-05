import {Sudoku} from "../../model/Sudoku";
import {BOARD_SIZE} from "../../model/Board";
import {pickRandomArrayValue} from "../../utility/pickRandom";
import {CellValue} from "../../model/CellData";
import {isTriviallySolvable} from "../transformations";

export function generateTriviallySolvableBoard(): Sudoku {
    const board = new Sudoku();
    board.fillWithRandomCompleteSolution();
    const MAX_ITERATIONS = 32;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        let k = 0;
        while (isTriviallySolvable(board) && k < BOARD_SIZE) {
            const cellToClear = pickRandomArrayValue(board.getFilledCells());
            board.setValue(cellToClear.x, cellToClear.y, CellValue.EMPTY, false, false);
            k++
        }
        board.fillSinglePossibilityCells();
    }
    return board;
}

/**
 * @todo
 */
export function generateBoardSolvableUsingEasyTechniques(): Sudoku {
    const board = new Sudoku();
    board.fillWithRandomCompleteSolution();
    // const MAX_ITERATIONS = 32;
    // for (let i=0; i<MAX_ITERATIONS; i++) {
    //     let k = 0;
    //     while (isTriviallySolvable(board) && k < BOARD_SIZE) {
    //         const cellToClear = pickRandomArrayValue(board.getFilledCells());
    //         board.setValue(cellToClear.x, cellToClear.y, CellValue.EMPTY, false, false);
    //         k++
    //     }
    //     board.fillSinglePossibilityCells();
    // }
    return board;
}

// function clearCellUsingHumanTechniques(board: Sudoku): boolean {
//     const cellWithVal = getNextEasyToFillCell(board)
//     if (cellWithVal) {
//         board.clearCellNoHistory(cellWithVal[0]);
//         return true;
//     }
//     return false;
// }