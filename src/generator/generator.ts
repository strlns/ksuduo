import {BOARD_SIZE, BOARD_SIZE_NUM_CELLS, CellIndex, Sudoku} from '../model/Sudoku';
import {CellValue} from "../model/Cell";

//Probably must be increased. Im afraid this app will be too dumb to solve HARD sudokus.
export const MINIMUM_CLUES = 17;

export default function generateSudoku(numberOfClues: number): Sudoku {
    numberOfClues = sanitizeNumberOfClues(numberOfClues);
    const coordsGenerator = randomCoordinatesGenerator();
    const board = new Sudoku();
    let numDeletedCells = 0;
    board.initializeEmptyBoard();
    board.fillWithRandomCompleteSolution();
    while (BOARD_SIZE_NUM_CELLS - numDeletedCells > numberOfClues) {
        clearRandomCell(board, coordsGenerator);
        numDeletedCells++;
    }
    return board;
}

const sanitizeNumberOfClues = (numberOfClues: number): number => {
    const numClues = Math.floor(numberOfClues);
    if (numClues < MINIMUM_CLUES) throw new Error(`I am dumb and I refuse to work with less than ${MINIMUM_CLUES}.
    Also, Sudokus with less than 17 clues have been proven to not be uniquely solvable in general.
    `)
    return numClues;
}

const clearRandomCell = (sudoku: Sudoku, coordsGenerator: Generator<number[]>): void => {
    const generatorResult = coordsGenerator.next();
    if (!generatorResult.done) {
        const coords = generatorResult.value;
        // @ts-ignore
        sudoku.setValue(coords[0], coords[1], CellValue.EMPTY);
    }
}

/**
 * Generator for random index pair in specified range.
 * Tried a generator here because we never want to select a coord pair twice.
 * @param max
 * @param min
 */
function* randomCoordinatesGenerator(max: number = BOARD_SIZE, min: number = 0): Generator<number[]> {
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