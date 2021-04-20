import {BOARD_SIZE, BOARD_WIDTH, CellIndex, Sudoku} from '../model/Sudoku';
import {CellValue} from "../model/CellData";

//Probably must be increased. Im afraid this app will be too dumb to solve HARD sudokus.
export const MINIMUM_CLUES = 17;
export const DEFAULT_CLUES = Math.floor(BOARD_SIZE / 3) - 3;
export const MAXIMUM_CLUES = Math.min(Math.floor(BOARD_SIZE / 2) + 8, BOARD_SIZE);

export default function generateSudoku(numberOfClues: number): Sudoku {
    numberOfClues = Math.floor(numberOfClues);
    const coordsGenerator = randomCoordinatesGenerator();
    const board = new Sudoku();
    let numDeletedCells = 0;
    board.initializeEmptyBoard();
    board.fillWithRandomCompleteSolution();
    while (BOARD_SIZE - numDeletedCells > numberOfClues) {
        clearRandomCell(board, coordsGenerator);
        numDeletedCells++;
    }
    const firstEmptyCell = board.getFirstEmptyCell();
    if (firstEmptyCell !== undefined) {
        firstEmptyCell.isFirstEmptyCell = true;
    }
    return board;
}

const clearRandomCell = (sudoku: Sudoku, coordsGenerator: Generator<number[]>): void => {
    const generatorResult = coordsGenerator.next();
    if (!generatorResult.done) {
        const coords = generatorResult.value;
        // @ts-ignore
        sudoku.setValue(coords[0], coords[1], CellValue.EMPTY, false);
    }
}

/**
 * Generator for random index pair in specified range.
 * Tried a generator here because we never want to select a coord pair twice.
 * @param max
 * @param min
 */
function* randomCoordinatesGenerator(max: number = BOARD_WIDTH, min: number = 0): Generator<number[]> {
    max = Math.floor(max);
    min = Math.floor(min);
    if (max <= min) throw new Error();

    function makeCoords(): [number, number] {
        return [
            Math.floor(Math.random() * (max - min) - min) as CellIndex,
            Math.floor(Math.random() * (max - min) - min) as CellIndex
        ];
    }

    const usedCoords: string[] = [];
    const coordsSpaceSize = Math.pow(max - min, 2);
    while (true) {
        if (usedCoords.length >= coordsSpaceSize) {
            return;
        }
        let coords = makeCoords();
        while (usedCoords.includes(coords.join())) {
            coords = makeCoords();
        }
        usedCoords.push(coords.join());
        yield coords as [CellIndex, CellIndex];
    }
}