import {describe, expect, it} from 'vitest';
import {cloneDeep} from 'lodash-es';
import {Sudoku, type SudokuStructuredClone} from '../src/model/Sudoku';
import {CellValue} from '../src/model/CellData';
import {makeBoard, puzzle, solution} from './fixtures';

describe('class-based game state contracts', () => {
    it('keeps rows, columns and blocks pointing at the same cell objects', () => {
        const board = makeBoard();
        const cell = board.getCell(0, 0);
        expect(board.getRows()[0][0]).toBe(cell);
        expect(board.getColumns()[0][0]).toBe(cell);
        expect(board.getBlocks()[0].cells).toContain(cell);
        expect(board.getNumberOfHints()).toBe(30);
    });
    it('replaces an edited cell, records history and restores it with undo', () => {
        const board = makeBoard();
        const cell = board.getCell(2, 0);
        board.setValue(2, 0, 4);
        expect(board.getCell(2, 0)).not.toBe(cell);
        expect(board.history).toHaveLength(1);
        expect(board.getCell(2, 0).isInitial).toBe(false);
        board.undo();
        expect(board.getFlatValues()).toEqual(puzzle);
        expect(board.isHistoryEmpty()).toBe(true);
    });
    it('deep clones preserve class methods and isolate rows, cells, solution and history', () => {
        const board = makeBoard();
        board.setValue(2, 0, 4);
        const cloned = cloneDeep(board);
        expect(cloned).toBeInstanceOf(Sudoku);
        cloned.setValue(3, 0, 6);
        cloned.getSolution()[0] = 9;
        expect(board.getCell(3, 0).value).toBe(CellValue.EMPTY);
        expect(board.getSolution()).toEqual(solution);
        cloned.undo();
        expect(board.history).toHaveLength(1);
        expect(cloned.getFlatValues()).toEqual(board.getFlatValues());
    });
    it('clones for solvers isolate cell mutation and deliberately omit history', () => {
        const board = makeBoard();
        board.setValue(2, 0, 4);
        const cloned = Sudoku.cloneWithoutHistory(board);
        cloned.getCell(0, 0).value = 9;
        cloned.getSolution()[0] = 9;
        expect(board.getCell(0, 0).value).toBe(5);
        expect(board.getSolution()).toEqual(solution);
        expect(cloned.isHistoryEmpty()).toBe(true);
    });
    it('rehydrates a structured worker reply into a functioning Sudoku', () => {
        const board = makeBoard();
        board.setValue(2, 0, 4);
        const restored = new Sudoku(structuredClone(board) as unknown as SudokuStructuredClone);
        expect(restored.getFlatValues()).toEqual(board.getFlatValues());
        expect(restored.getSolution()).toEqual(solution);
        restored.undo();
        expect(restored.getFlatValues()).toEqual(puzzle);
    });
    it('shows the solution, keeps original clues, and resets user entries and hints', () => {
        const board = makeBoard();
        board.setValue(2, 0, 4);
        board.setValue(3, 0, 6, true);
        board.showSolution();
        expect(board.getFlatValues()).toEqual(solution);
        expect(board.isSolved()).toBe(true);
        expect(board.getCell(0, 0).isInitial).toBe(true);
        board.reset();
        expect(board.getFlatValues()).toEqual(puzzle);
        expect(board.getNumberOfHints()).toBe(30);
        expect(board.isHistoryEmpty()).toBe(true);
    });
    it('finds conflicting and incorrectly filled cells', () => {
        const board = makeBoard();
        board.setValue(2, 0, 5);
        expect(board.isCellValid(board.getCell(2, 0))).toBe(false);
        expect(board.isCellValid(board.getCell(0, 0))).toBe(false);
        expect(board.getWronglyFilledCells().map(cell => [cell.x, cell.y])).toEqual([[2, 0]]);
    });
});
