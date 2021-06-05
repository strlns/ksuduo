import {Puzzle} from "../model/Sudoku";
import {CellData, cellIsEmpty} from "../model/CellData";
import {addPossibleValuesToCellDataArray, puzzleToSudoku} from "../algorithm/solver/transformations";
import {BLOCK_HEIGHT, BLOCK_WIDTH, BOARD_SIZE, BOARD_WIDTH} from "../model/Board";
import arrayChunk from "../utility/arrayChunk";
import {rightPad} from "../utility/stringLib";
/*
  Draw a puzzle on the console to debug algorithmic issues without having to
  use the game itself
 */
export default function drawPuzzle(puzzle: Puzzle, prependFlatRepresantation = true) {
    const board = puzzleToSudoku(puzzle, false);
    const flatStr = `Flat: ${board.getFlatValues().join('')}`
    const cellValStr = (cell: CellData) => cellIsEmpty(cell) ? '·' : cell.value;
    const cellStr = (cell: CellData, i: number) => {
        if (i % BLOCK_WIDTH === 0) return `| ${cellValStr(cell)}`
        if (i === BOARD_WIDTH - 1) return `${cellValStr(cell)} |`
        return `${cellValStr(cell)}`
    }
    const hLine = `${'―'.repeat(BOARD_WIDTH * 3 - 2)}\n`;
    console.log(`%c${prependFlatRepresantation ? flatStr + '\n' : ''}${
            hLine}${
            board.getRows().map(
                row => {
                    return row.map((cell, i) =>
                        cellStr(cell, i))
                        .join(' ')
                })
                .reduce(
                    (acc, curr, index) => {
                        return acc + ((index % BLOCK_HEIGHT === 0) ? ('\n' + hLine)
                            : '\n') + curr
                    })
        }\n${hLine}`,
        'white-space: pre-wrap;font-size:1.25rem');
}

/*
  Draw a board on the console, including the possible values left for each cell.
 */

// noinspection JSUnusedGlobalSymbols
export function drawPuzzleWithPossibilities(puzzle: Puzzle) {
    const board = puzzleToSudoku(puzzle, false);
    const rowsCells = board.getRows()
        .map(row => row.map(cell =>

            `%c  ${cellIsEmpty(cell) ? '?' : cell.value}  %c`
        )
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
