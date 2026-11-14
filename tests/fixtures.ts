import {Sudoku} from '../src/model/Sudoku';

// Fixed puzzle and solution, independent of either solver or random generation.
export const puzzle = [...'530070000600195000098000060800060003400803001700020006060000280000419005000080079'].map(Number);
export const solution = [...'534678912672195348198342567859761423426853791713924856961537284287419635345286179'].map(Number);
export function makeBoard(): Sudoku {
    const board = new Sudoku();
    board.initWithNumbers(puzzle, false);
    board.setSolution(solution.slice());
    return board;
}
