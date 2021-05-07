import {CellValue, NUM_POSSIBLE_VALUES} from "./CellData";

export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

//All possible cell indices on x- or y-axis (board is a square)
export const CELL_INDICES =
    Array(NUM_POSSIBLE_VALUES - 1).fill(0).map((v, i) => i as CellIndex);

export const BOARD_WIDTH = CELL_INDICES.length;
export const BOARD_SIZE = Math.pow(BOARD_WIDTH, 2);
export const BLOCK_WIDTH = 3;
export const BLOCK_HEIGHT = 3;
export const BLOCK_SIZE = BLOCK_WIDTH * BLOCK_HEIGHT;
export const MINIMUM_CLUES = 17;
export const DEFAULT_CLUES = 24;

export const flatIndexToCoords = (index: number): [CellIndex, CellIndex] => {
    const x = index % BOARD_WIDTH as CellIndex;
    const y = Math.floor(index / BOARD_WIDTH) as CellIndex;
    return [x, y];
}

export const coordsToFlatIndex = (x: CellIndex, y: CellIndex): number => {
    return y * BOARD_WIDTH + x;
}

/**
 * get start index of the block that a given cell/index belongs to, in a flat puzzle.
 */
export const getFlatStartIndexForBlock = (flatPuzzle: CellValue[], flatIndex: number): number => {
    return flatIndex -
        //subtract from index to reach x0 of block
        (Math.floor(flatIndex % BLOCK_SIZE) % BLOCK_WIDTH)
        //subtract from index to reach y0 of block
        - ((Math.floor(flatIndex / BLOCK_SIZE) % BLOCK_HEIGHT) * BLOCK_SIZE);
}