import {Sudoku} from '../../model/Sudoku';
import {shuffle} from '../../utility/shuffle';
import {generateFullSolution} from './generateFullSolution';
import {LogicLevel, solveLogically, rateLogical} from '../solver/logical';

/** Bounded removal: every accepted puzzle has a complete logical solving path. */
function generateAttempt(clues: number, level: LogicLevel): Sudoku {
    const board = new Sudoku();
    const values = generateFullSolution();
    board.initWithNumbers(values, false);
    board.setSolution(values.slice());
    for (const cell of shuffle(board.getFlatCells())) {
        if (board.getNumberOfHints() <= clues) break;
        board.clearCell(cell, false);
        if (!solveLogically(board, level)) board.setValueUseCell(cell, false);
    }
    return Sudoku.cloneWithoutHistory(board);
}

/** Prefer the requested grade; cap work and report an easier grade honestly. */
export function generateLogical(clues: number, level: LogicLevel, attempts = 3): Sudoku {
    let best: Sudoku | undefined;
    let bestRating = -1;
    for (let i = 0; i < Math.max(1, Math.min(3, attempts)); i++) {
        const board = generateAttempt(clues, level);
        const rating = rateLogical(board);
        if (rating === undefined || rating > level) throw new Error('Generated puzzle exceeds its technique limit.');
        if (!best || rating > bestRating || (rating === bestRating && board.getNumberOfHints() < best.getNumberOfHints())) {
            best = board;
            bestRating = rating;
        }
        if (rating === level && board.getNumberOfHints() <= clues) break;
    }
    return best!;
}
