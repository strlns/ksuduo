import {Sudoku} from '../../model/Sudoku';
import {solveCheckUnique} from '../solver/solverBacktracking';
import {shuffle} from '../../utility/shuffle';
import {generateFullSolution} from './generateFullSolution';
import {LogicLevel, solveLogically, rateLogical, solveLogical} from '../solver/logical';

/** Ordinary digging preserves the logical ceiling; exploratory digging preserves uniqueness. */
function generateAttempt(clues: number, level: LogicLevel, uniqueDigging = false): Sudoku {
    const board = new Sudoku();
    const values = generateFullSolution();
    board.initWithNumbers(values, false);
    board.setSolution(values.slice());
    for (const cell of shuffle(board.getFlatCells())) {
        if (board.getNumberOfHints() <= (uniqueDigging ? 17 : clues)) break;
        board.clearCell(cell, false);
        if (uniqueDigging ? !Array.isArray(solveCheckUnique(board)) : !solveLogically(board, level)) board.setValueUseCell(cell, false);
    }
    if (uniqueDigging && !solveLogically(board, level)) {
        // A unique puzzle beyond our ceiling can still lead to a useful sibling:
        // restore different clues, rather than reject that removal permanently.
        for (const cell of shuffle(board.getEmptyCells())) {
            board.setValue(cell.x, cell.y, values[cell.y * 9 + cell.x], true, false);
            if (solveLogically(board, level)) break;
        }
        // Remove redundant repair clues without exceeding the ceiling again.
        for (const cell of shuffle(board.getFlatCells().filter(c => c.value))) {
            if (board.getNumberOfHints() <= clues) break;
            board.clearCell(cell, false);
            if (!solveLogically(board, level)) board.setValueUseCell(cell, false);
        }
    }
    if (uniqueDigging && rateLogical(board) === level) {
        for (const cell of shuffle(board.getEmptyCells())) {
            if (board.getNumberOfHints() >= clues) break;
            board.setValue(cell.x, cell.y, values[cell.y * 9 + cell.x], true, false);
            if (rateLogical(board) !== level) board.clearCell(board.getCell(cell.x, cell.y), false);
        }
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
    const result = bestRating < level && level >= 2
        ? refineDifficulty(best!, clues, level, attempts > 1 ? 3000 : 750)
        : best!;
    if (level !== 3 || rateLogical(result) === level) return result;
    const deadline = performance.now() + (attempts > 1 ? 4000 : 750);
    // Preserve the original search result; explore at most four new paths.
    for (let i = 0; i < (attempts > 1 ? 4 : 1) && performance.now() < deadline; i++) {
        const alternative = generateAttempt(clues, level, true);
        const rating = rateLogical(alternative);
        if (rating === level) return alternative;
    }
    return result;
}
