import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {persist, LOCALSTORAGE_KEY} from '../src/persistence/localStorage';
import {restoreGameStateOrInitialize} from '../src/persistence/restoreGameStateOrInitialize';
import {DIFFICULTY_LEVEL} from '../src/algorithm/generator/generator';
import {Sudoku} from '../src/model/Sudoku';
import {makeBoard, puzzle, solution} from './fixtures';

let values: Map<string, string>;
beforeEach(() => {
    values = new Map();
    const storage = {getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value)};
    vi.stubGlobal('window', {localStorage: storage});
    vi.stubGlobal('localStorage', storage);
});
afterEach(() => vi.unstubAllGlobals());

it('round trips the existing array format, board, history, solution and all flags', () => {
    const board = makeBoard();
    board.setValue(2, 0, 4);
    const state = {board, secondsElapsed: 73, isPaused: true, timerEnabled: true, currentDifficulty: DIFFICULTY_LEVEL.HARD, solutionShown: false};
    persist(state);
    expect(JSON.parse(values.get(LOCALSTORAGE_KEY)!)).toHaveLength(8);
    const restored = restoreGameStateOrInitialize();
    expect(restored).toEqual(state);
    expect(restored.board).toBeInstanceOf(Sudoku);
    expect(restored.board.getSolution()).toEqual(solution);
    restored.board.undo();
    expect(restored.board.getFlatValues()).toEqual(puzzle);
});

it('reads an older saved game missing optional flags', () => {
    const board = makeBoard();
    values.set(LOCALSTORAGE_KEY, JSON.stringify([board.getFlatCells(), [], solution, 15, false]));
    const restored = restoreGameStateOrInitialize();
    expect(restored.board.getFlatValues()).toEqual(puzzle);
    expect(restored.secondsElapsed).toBe(15);
    expect(restored.timerEnabled).toBe(false);
    expect(restored.currentDifficulty).toBe(DIFFICULTY_LEVEL.EASY_NEW);
    expect(restored.solutionShown).toBe(false);
});

it.each([null, 'broken json', '[]', '[[]]'])('initializes safely with missing or malformed storage: %s', raw => {
    if (raw !== null) values.set(LOCALSTORAGE_KEY, raw);
    const restored = restoreGameStateOrInitialize();
    expect(restored.board.isEmpty()).toBe(true);
    expect(restored.secondsElapsed).toBe(0);
});

it('remains playable when privacy settings block storage', () => {
    const blocked = {getItem() {throw new Error('blocked');}, setItem() {throw new Error('blocked');}};
    vi.stubGlobal('localStorage', blocked);
    expect(restoreGameStateOrInitialize().board.isEmpty()).toBe(true);
    expect(() => persist({board: makeBoard(), secondsElapsed: 0, isPaused: false, timerEnabled: false, currentDifficulty: DIFFICULTY_LEVEL.EASY, solutionShown: false})).not.toThrow();
});
