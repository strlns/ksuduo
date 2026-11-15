import {afterEach, expect, it, vi} from 'vitest';
import {Sudoku} from '../src/model/Sudoku';
import {isTriviallySolvable} from '../src/algorithm/transformations';
import {generateLogical} from '../src/algorithm/generator/generatorLogical';
import {solveCheckUnique, SOLVER_FAILURE} from '../src/algorithm/solver/solverBacktracking';
import {makeBoard, solution} from './fixtures';

afterEach(() => vi.restoreAllMocks());

it('never accepts an ambiguous four-cell rectangle as trivially solvable', () => {
    const board = new Sudoku();
    board.initWithNumbers(solution, false);
    // The 6/7 rectangle can be swapped to make two complete solutions.
    for (const [x, y] of [[3, 0], [4, 0], [3, 3], [4, 3]] as const) board.clearCell(board.getCell(x, y), false);
    expect(solveCheckUnique(board)).toBe(SOLVER_FAILURE.MULTIPLE_SOLUTIONS);
    const before = board.getFlatValues();
    expect(isTriviallySolvable(board)).toBe(false);
    expect(board.getFlatValues()).toEqual(before);
});

it('recognizes a chain of single-candidate fills without mutating the input', () => {
    const board = makeBoard();
    const before = board.getFlatValues();
    expect(isTriviallySolvable(board)).toBe(true);
    expect(board.getFlatValues()).toEqual(before);
});

it('rejects a filled but conflicting board', () => {
    const board = new Sudoku();
    board.initWithNumbers(solution, false);
    board.setValue(0, 0, 3, true, false);
    expect(isTriviallySolvable(board)).toBe(false);
});

it.each([1, 2, 3, 42])('current Easiest generator preserves uniqueness and singles solvability for seed %i', seed => {
    let state = seed;
    vi.spyOn(Math, 'random').mockImplementation(() => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    });
    const board = generateLogical(28, 0, 1);
    expect(isTriviallySolvable(board)).toBe(true);
    expect(solveCheckUnique(board)).toEqual(board.getSolution());
});

it.each([
    [0, 37, 1], [0, 37, 42],
    [1, 29, 1], [1, 29, 42],
    [2, 24, 1], [2, 24, 42],
])('gameplay difficulty %i with %i clues and seed %i keeps a unique solution', async (difficulty, clues, seed) => {
    const {default: generateSudoku} = await import('../src/algorithm/generator/generator');
    const {GENERATOR_CODE} = await import('../src/algorithm/generator/generator');
    let state = seed;
    vi.spyOn(Math, 'random').mockImplementation(() => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    });
    // Missing the requested hint count is an existing supported result; ambiguity is not.
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = generateSudoku(clues, difficulty, true);
    expect(result[0]).not.toBe(GENERATOR_CODE.UNKNOWN_ERROR);
    expect(result[1]).toBeInstanceOf(Sudoku);
    expect(solveCheckUnique(result[1]!)).toEqual(result[1]!.getSolution());
});
