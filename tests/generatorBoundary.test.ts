import {afterEach, expect, it, vi} from 'vitest';
import generateRandomSudoku, {DIFFICULTY_LEVEL, GENERATOR_CODE} from '../src/algorithm/generator/generator';
import {generateLogical} from '../src/algorithm/generator/generatorLogical';
import {makeBoard, solution} from './fixtures';
import {Sudoku} from '../src/model/Sudoku';

vi.mock('../src/algorithm/generator/randomizePresentation', () => ({randomizePresentation: (board: Sudoku) => board}));
vi.mock('../src/algorithm/generator/generatorLogical', () => ({generateLogical: vi.fn()}));
afterEach(() => vi.resetAllMocks());

const modes = [DIFFICULTY_LEVEL.EASY, DIFFICULTY_LEVEL.MEDIUM, DIFFICULTY_LEVEL.HARD, DIFFICULTY_LEVEL.EASY_NEW, DIFFICULTY_LEVEL.EXTRA_HARD];
function supply(board: Sudoku, code = GENERATOR_CODE.OK) {
    vi.mocked(generateLogical).mockReturnValue(board);
}
it.each(modes)('rejects an ambiguous final board in mode %i using the real solver', mode => {
    const board = new Sudoku();
    board.initWithNumbers(solution, false);
    for (const [x, y] of [[3, 0], [4, 0], [3, 3], [4, 3]] as const) board.clearCell(board.getCell(x, y), false);
    supply(board);
    const result = generateRandomSudoku(81, mode);
    expect(result[0]).toBe(GENERATOR_CODE.UNKNOWN_ERROR);
    expect(result[1]).toBeUndefined();
    expect(result[2]).toContain('uniqueness');
});
it.each(modes)('preserves a unique final board and its state in mode %i', mode => {
    const board = makeBoard();
    const before = board.getFlatValues();
    supply(board);
    const result = generateRandomSudoku(81, mode);
    expect(result[0]).toBe(GENERATOR_CODE.OK);
    expect(result[1]).toBe(board);
    expect(board.getFlatValues()).toEqual(before);
});
it('also rejects an ambiguous best board when the clue target was missed', () => {
    const board = new Sudoku();
    board.initWithNumbers(solution, false);
    for (const [x, y] of [[3, 0], [4, 0], [3, 3], [4, 3]] as const) board.clearCell(board.getCell(x, y), false);
    supply(board, GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL);
    expect(generateRandomSudoku(24)[1]).toBeUndefined();
    expect(generateRandomSudoku(24)[0]).toBe(GENERATOR_CODE.UNKNOWN_ERROR);
});
it('preserves the clue-target warning for a unique best board', () => {
    const board = makeBoard();
    supply(board, GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL);
    expect(generateRandomSudoku(24)).toEqual([GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL, board, expect.stringContaining('Kept 30 clues')]);
});
it('preserves existing generation errors', () => {
    vi.mocked(generateLogical).mockImplementation(() => {throw new Error('original error');});
    expect(generateRandomSudoku(30)).toEqual([GENERATOR_CODE.UNKNOWN_ERROR, undefined, 'original error']);
});

it('rejects a unique puzzle above the requested difficulty ceiling',()=>{
 const board=new Sudoku();board.initWithNumbers([...'060080200080160070000007000030000000042300910008021307000208000300090000010004060'].map(Number),false);
 supply(board);
 expect(generateRandomSudoku(24,DIFFICULTY_LEVEL.EASY)[0]).toBe(GENERATOR_CODE.UNKNOWN_ERROR);
});
it('reports the achieved grade when a valid puzzle is easier than requested',()=>{
 supply(makeBoard());
 const result=generateRandomSudoku(30,DIFFICULTY_LEVEL.HARD);
 expect(result[0]).toBe(GENERATOR_CODE.OK);
 expect(result[2]).toContain('Rated Easiest');expect(result[2]).toContain('Requested Hard');
});
it.each([NaN, Infinity, -Infinity])('rejects non-finite clue count %s', clues=>{
 expect(generateRandomSudoku(clues)[0]).toBe(GENERATOR_CODE.UNKNOWN_ERROR);
 expect(generateLogical).not.toHaveBeenCalled();
});
it('rejects unknown difficulty values',()=>{
 expect(generateRandomSudoku(28,99 as DIFFICULTY_LEVEL)[0]).toBe(GENERATOR_CODE.UNKNOWN_ERROR);
 expect(generateLogical).not.toHaveBeenCalled();
});
