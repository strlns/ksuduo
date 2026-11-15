import {describe, expect, it} from 'vitest';
import {almostDailyNightmareSudokus, gnomeGs4HardSudokus} from '../src/examples/validExamples';
import {invalid2Solutions, invalid3Solutions, invalid4Solutions, invalid10Solutions, invalid125Solutions} from '../src/examples/invalidExamples';
import {solveCheckUnique, SOLVER_FAILURE} from '../src/algorithm/solver/solverBacktracking';
import {solverResultIsError} from '../src/algorithm/solver/solver';
import {solveLogical} from '../src/algorithm/solver/logical';
import {puzzleToSudoku} from '../src/model/Sudoku';
import solutionRespectsHints from '../src/debug/solutionRespectsHints';
import {coordsToFlatIndex, flatIndexToCoords, CellIndex} from '../src/model/Board';
import {puzzle, solution} from './fixtures';

it('maps every coordinate to its flat index and back', () => {
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
        expect(coordsToFlatIndex(x as CellIndex, y as CellIndex)).toBe(y * 9 + x);
        expect(flatIndexToCoords(y * 9 + x)).toEqual([x, y]);
    }
});

it('solves a fixed puzzle exactly without changing the input', () => {
    const before = puzzle.slice();
    expect(solveCheckUnique(puzzle)).toEqual(solution);
    expect(puzzle).toEqual(before);
});

describe('original fixed valid fixtures', () => {
    [...gnomeGs4HardSudokus, ...almostDailyNightmareSudokus].forEach((board, index) => {
        it(`finds a unique valid solution for fixture ${index + 1}`, () => {
            const result = solveCheckUnique(board);
            expect(solverResultIsError(result)).toBe(false);
            if (typeof result === 'number') throw new Error('Solver failed');
            expect(solutionRespectsHints(board, result)).toBe(true);
            // Check all three constraints independently of the app validator.
            const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            for (let n = 0; n < 9; n++) {
                expect(result.slice(n * 9, n * 9 + 9).sort()).toEqual(digits);
                expect(Array.from({length: 9}, (_, y) => result[y * 9 + n]).sort()).toEqual(digits);
                const start = Math.floor(n / 3) * 27 + (n % 3) * 3;
                expect(Array.from({length: 9}, (_, i) => result[start + Math.floor(i / 3) * 9 + i % 3]).sort()).toEqual(digits);
            }
        });
    });
});

it.each([invalid2Solutions, invalid3Solutions, invalid4Solutions, invalid10Solutions, invalid125Solutions])('rejects an original multiple-solution fixture %#', (...values) => {
    expect(solveCheckUnique(values)).toBe(SOLVER_FAILURE.MULTIPLE_SOLUTIONS);
});

describe('human solver fixed regressions', () => {
    gnomeGs4HardSudokus.forEach((board, index) => {
        it(`only fills correct values in hard fixture ${index + 1}`, () => {
            const expected = solveCheckUnique(board);
            const partial = solveLogical(puzzleToSudoku(board), 3, true);
            if (typeof expected === 'number' || !partial) throw new Error('Solver failed');
            partial.forEach((value, i) => expect(value === 0 || value === expected[i]).toBe(true));
        });
    });
});
