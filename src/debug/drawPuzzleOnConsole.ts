import {addPossibleValuesToCellDataArray, Puzzle, puzzleToSudoku} from "../model/Sudoku";
import {BOARD_SIZE, BOARD_WIDTH} from "../model/Board";
import arrayChunk from "../utility/arrayChunk";
import {rightPad} from "../utility/stringLib";
import {cellIsEmpty} from "../model/CellData";

export default function drawPuzzle(puzzle: Puzzle) {
    const board = puzzleToSudoku(puzzle, false);
    console.log(`%cFlat: ${board.getFlatValues().join('')}\
        \n${board.getRows().map(row => row.map(cell => cell.value).join(' ')).join(`\n`)}`, 'white-space: pre-wrap');
}

/*
  Draw a board on the console, including the possible values left for each cell.
 */

// noinspection JSUnusedGlobalSymbols
export function drawPuzzleWithPossibilities(puzzle: Puzzle) {
    const board = puzzleToSudoku(puzzle, false);
    const rowsCells = board.getRows()
        .map(row => row.map(cell => `%c  ${cellIsEmpty(cell) ? '?' : cell.value}  %c`)
            .join('  '));

    const styles = [];
    for (let i = 0; i < BOARD_SIZE * 2; i++) {
        styles[i] = i % 2 === 1 ? 'color:grey' : (
            cellIsEmpty(board.getFlatCells()[i / 2]) ? 'font-weight:bold;color:lightblue;border-bottom:1px solid black' :
                'font-weight:bold;color:blue;border-bottom:1px solid black'
        )
    }
    const possibilitiesChunked = board.getRows().map(
        row => addPossibleValuesToCellDataArray(row, board, true).map(
            cell => arrayChunk(cell.possibleValues, 3, 3)
        )
    )
    drawPuzzle(board);
    const boardString = Array(BOARD_WIDTH * 4).fill('').map(
        (v, index) => {
            if (index % 4 === 0) {
                return rowsCells[index / 4];
            } else {
                return possibilitiesChunked[Math.floor(index / 4)]
                    .map((chunkedPsForRow) => {
                            return rightPad(chunkedPsForRow[index % 4 - 1].join(' '), 5)
                        }
                    ).join('  ')
            }
        }
    ).join('\n')

    console.log(boardString, ...styles)
}
