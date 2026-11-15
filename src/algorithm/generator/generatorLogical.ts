import {Sudoku} from '../../model/Sudoku';
import {shuffle} from '../../utility/shuffle';
import {generateFullSolution} from './generateFullSolution';
import {LogicLevel, solveLogically, rateLogical, solveLogical} from '../solver/logical';

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

function refineDifficulty(input: Sudoku, clues: number, level: LogicLevel, budget: number): Sudoku {
    const board = Sudoku.cloneWithoutHistory(input);
    const values = board.getSolution();
    const deadline = performance.now() + budget;
    const original = Sudoku.cloneWithoutHistory(board);
    // Probe deeper removals, then restore clues around the lower tier's stall.
    // A successful intermediate is always kept rather than lost to a random walk.
    if (level >= 2 && rateLogical(board) !== level && performance.now() < deadline) {
        const remaining = shuffle(board.getFlatCells().filter(c => c.value));
        for (const cell of remaining) {
            if (board.getNumberOfHints() <= 21 || performance.now() >= deadline) break;
            board.clearCell(cell, false);
            if (!solveLogically(board, level)) { board.setValueUseCell(cell, false); continue; }
            if (rateLogical(board) !== level) continue;
            // Reverse-pick clues: restore only cells that do not remove the need
            // for the requested technique. Keep the advanced intermediate too.
            const partial = solveLogical(board, (level - 1) as LogicLevel, true)!;
            const restore = shuffle(board.getEmptyCells());
            restore.sort((a, b) => Number(!!partial[b.y * 9 + b.x]) - Number(!!partial[a.y * 9 + a.x]));
            for (const empty of restore) {
                if (board.getNumberOfHints() >= clues || performance.now() >= deadline) break;
                board.setValue(empty.x, empty.y, values[empty.y * 9 + empty.x], true, false);
                if (solveLogically(board, (level - 1) as LogicLevel)) board.clearCell(board.getCell(empty.x, empty.y), false);
            }
            return Sudoku.cloneWithoutHistory(board);
        }
    }
    // An unsuccessful search must retain the original count goal.
    return original;
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
    return bestRating < level && level >= 2
        ? refineDifficulty(best!, clues, level, attempts > 1 ? 3000 : 750)
        : best!;
}
