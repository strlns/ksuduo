import {afterEach, expect, it, vi} from 'vitest';
import {Sudoku} from '../src/model/Sudoku';
import {isTriviallySolvable} from '../src/algorithm/transformations';
import {generateLogical} from '../src/algorithm/generator/generatorLogical';
import generateSudoku, {DIFFICULTY_LEVEL, GENERATOR_CODE} from '../src/algorithm/generator/generator';
import {applyLogicStep, candidatesFor, logicalProfile, nextHintStep, solveLogical} from '../src/algorithm/solver/logical';
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

it('uses the lower-tier stall to retain a Hard puzzle at 28 clues (seed 18)', async () => {
    const {rateLogical, solveLogically} = await import('../src/algorithm/solver/logical');
    // Remove machine speed from this bounded search regression.
    vi.spyOn(performance, 'now').mockReturnValue(0);
    let seed = 18;
    vi.spyOn(Math, 'random').mockImplementation(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
    const board = generateLogical(28, 3);
    expect(board.getNumberOfHints()).toBe(28);
    expect(rateLogical(board)).toBe(3);
    expect(solveLogically(board, 2)).toBe(false);
    expect(solveCheckUnique(board)).toEqual(board.getSolution());
}, 30000);

it.each([
    [DIFFICULTY_LEVEL.EASY_NEW, 0, 23, 1],
    [DIFFICULTY_LEVEL.EASY, 1, 21, 4],
    [DIFFICULTY_LEVEL.MEDIUM, 2, 29, 2],
    [DIFFICULTY_LEVEL.HARD, 3, 23, 2],
    [DIFFICULTY_LEVEL.EXTRA_HARD, 4, 23, 3],
] as const)('hits both goals and supports hint replay for mode %i, grade %i, %i clues, seed %i', (
    difficulty, level, clues, seed,
) => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    let state: number = seed;
    vi.spyOn(Math, 'random').mockImplementation(() =>
        (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);

    const [code, board] = generateSudoku(clues, difficulty);
    expect(code).toBe(GENERATOR_CODE.OK);
    expect(board!.getNumberOfHints()).toBe(clues);
    expect(logicalProfile(board!, level).rating).toBe(level);
    const solution = board!.getSolution();
    expect(solveCheckUnique(board!)).toEqual(solution);

    const candidates = candidatesFor(board!);
    for (let i = 0; i < 810 && !board!.isSolved(); i++) {
        const step = nextHintStep(board!, candidates);
        expect(step).toBeDefined();
        for (const cell of step!.targets) {
            expect(step!.value === solution[cell.y * 9 + cell.x]).toBe(step!.placement);
        }
        applyLogicStep(board!, candidates, step!);
    }
    expect(board!.getFlatValues()).toEqual(solution);
}, 30000);

it.each([79, 80, 81])('keeps the count on a nearly full board with %i clues', clues => {
    const [code, board, details] = generateSudoku(clues, DIFFICULTY_LEVEL.EXTRA_HARD);
    expect(code).toBe(GENERATOR_CODE.OK);
    expect(board!.getNumberOfHints()).toBe(clues);
    expect(logicalProfile(board!, 4).rating).toBe(0);
    expect(details).toContain('Requested Extra Hard');
});

it('recovers Hard by repairing a minimal unique leaf after the ordinary search misses (seed 34)', async () => {
    const {rateLogical, solveLogically} = await import('../src/algorithm/solver/logical');
    vi.spyOn(performance, 'now').mockReturnValue(0);
    let seed = 34;
    vi.spyOn(Math, 'random').mockImplementation(() => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32));
    const board = generateLogical(24, 3);
    expect(rateLogical(board)).toBe(3);
    expect(solveLogically(board, 2)).toBe(false);
    expect(solveCheckUnique(board)).toEqual(board.getSolution());
    expect(board.getNumberOfHints()).toBeLessThanOrEqual(27);
}, 30000);

it('generates a genuine Extra Hard puzzle with the expanded catalogue (seed 54)', async () => {
    const {rateLogical,solveLogically} = await import('../src/algorithm/solver/logical');
    vi.spyOn(performance, 'now').mockReturnValue(0);
    let seed=54;
    vi.spyOn(Math,'random').mockImplementation(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32));
    const board=generateLogical(24,4);
    expect(rateLogical(board)).toBe(4);
    expect(solveLogically(board,3)).toBe(false);
    expect(solveCheckUnique(board)).toEqual(board.getSolution());
    expect(board.getNumberOfHints()).toBeLessThanOrEqual(28);
},30000);

it.each([
    {seed: 4, maxClues: 25, firstNonEasy: 38, firstExtraHard: 42},
    {seed: 7, maxClues: 26, firstNonEasy: 38, firstExtraHard: 40},
])('finds an earlier Extra Hard opening at the minimum clue goal (seed $seed)', ({
    seed, maxClues, firstNonEasy, firstExtraHard,
}) => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.spyOn(Math, 'random').mockImplementation(() =>
        (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);

    const [code, board] = generateSudoku(21, DIFFICULTY_LEVEL.EXTRA_HARD);
    expect(code).not.toBe(GENERATOR_CODE.UNKNOWN_ERROR);
    expect(board!.getNumberOfHints()).toBeGreaterThanOrEqual(21);
    expect(board!.getNumberOfHints()).toBeLessThanOrEqual(maxClues);
    expect(solveCheckUnique(board!)).toEqual(board!.getSolution());

    const profile = logicalProfile(board!, 4);
    expect(profile.rating).toBe(4);
    expect(profile.beforeNonEasy).toBe(solveLogical(board!, 1, true)?.filter(Boolean).length);
    expect(profile.beforeTarget).toBe(solveLogical(board!, 3, true)?.filter(Boolean).length);
    expect(profile.beforeNonEasy).toBeLessThanOrEqual(firstNonEasy);
    expect(profile.beforeTarget).toBeLessThanOrEqual(firstExtraHard);
}, 30000);
