import {afterEach, expect, it, vi} from 'vitest';
import drawPuzzle, {drawPuzzleWithPossibilities} from '../src/debug/drawPuzzleOnConsole';
import {makeBoard} from './fixtures';
import {Sudoku} from '../src/model/Sudoku';
import {isTriviallySolvable} from '../src/algorithm/transformations';
import {solveCheckUnique, SOLVER_FAILURE} from '../src/algorithm/solver/solverBacktracking';

afterEach(() => vi.restoreAllMocks());
it('draws readable stdout puzzles, including possibilities, without browser CSS', () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    drawPuzzleWithPossibilities(makeBoard());
    const messages = output.mock.calls.map(args => args.join(' ')).join('\n');
    expect(messages).toContain('Flat: 530070000');
    expect(messages).toContain('| 5 3 · |');
    expect(messages).toContain('?');
    expect(messages).not.toContain('%c');
    expect(messages).not.toContain('white-space');
    output.mockClear();
    drawPuzzle(makeBoard(), true, false);
    expect(output.mock.calls[0][0]).not.toContain('Flat:');
});
it('retains the multiple-solution diagnostic captured during migration', () => {
    const ambiguous = [...'423000581576481392918532467091370245752149638034000179269710850185000720347825916'].map(Number);
    expect(solveCheckUnique(ambiguous)).toBe(SOLVER_FAILURE.MULTIPLE_SOLUTIONS);
    const board = new Sudoku();
    board.initWithNumbers(ambiguous, false);
    expect(isTriviallySolvable(board)).toBe(false);
});
