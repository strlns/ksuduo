/**
 * Backtracking Sudoku solver that searches for a second completion.
 * Earlier implementation based on @mattflow/sudoku-algorithm and
 * https://stackoverflow.com/questions/24343214/determine-whether-a-sudoku-has-a-unique-solution
 */
import {CellValue, NonEmptyCellValues} from '../../model/CellData';
import {
    BLOCK_HEIGHT, BLOCK_WIDTH, BLOCKS_PER_BAND, BOARD_SIZE, BOARD_WIDTH, flatIndexToCoords, MINIMUM_CLUES,
} from '../../model/Board';
import {Puzzle, Sudoku} from '../../model/Sudoku';
import type {Solution} from './solver';

export enum SOLVER_FAILURE {
    NO_SOLUTION_FOUND = 0,
    MULTIPLE_SOLUTIONS = 1
}

const allDigits = NonEmptyCellValues.reduce((mask, digit) => mask | (1 << digit), 0);
const digitCount = new Uint8Array(allDigits + 1);
for (let mask = 1; mask <= allDigits; mask++) {
    digitCount[mask] = 1 + digitCount[mask & (mask - 1)];
}
const locations = Array.from({length: BOARD_SIZE}, (_, index) => {
    const [column, row] = flatIndexToCoords(index);
    const block = Math.floor(row / BLOCK_HEIGHT) * BLOCKS_PER_BAND + Math.floor(column / BLOCK_WIDTH);
    return {row, column, block};
});

/** Return false on an exhausted budget. The visitor can stop after a witness. */
function searchCompletions(
    input: CellValue[], visit: (solution: CellValue[]) => boolean, minimumClues = 0, maxIterations = 0,
): boolean {
    if (input.length !== BOARD_SIZE) throw new Error('Puzzle has invalid size.');
    const puzzle = input.slice();

    const rows = new Uint16Array(BOARD_WIDTH);
    const columns = new Uint16Array(BOARD_WIDTH);
    const blocks = new Uint16Array(BOARD_WIDTH);
    const empty: number[] = [];
    for (let index = 0; index < BOARD_SIZE; index++) {
        const digit = puzzle[index];
        if (!Number.isInteger(digit) || digit < 0 || digit > 9) return true;
        if (!digit) {
            empty.push(index);
            continue;
        }
        const {row, column, block} = locations[index];
        const bit = 1 << digit;
        if ((rows[row] | columns[column] | blocks[block]) & bit) return true;
        rows[row] |= bit;
        columns[column] |= bit;
        blocks[block] |= bit;
    }
    if (BOARD_SIZE - empty.length < minimumClues) {
        throw new Error(`Puzzle has less than the minimum required number of hints (${minimumClues})`);
    }
    let iterations = 0;
    let stopped = false;
    return search(0);

    function search(depth: number): boolean {
        if (maxIterations !== 0 && ++iterations > maxIterations) return false;
        if (depth === empty.length) {
            stopped = visit(puzzle);
            return true;
        }

        // Branch on the blank with the fewest legal digits.
        let best = depth;
        let candidates = allDigits;
        for (let i = depth; i < empty.length; i++) {
            const {row, column, block} = locations[empty[i]];
            const available = allDigits & ~(rows[row] | columns[column] | blocks[block]);
            if (!available) return true;
            if (digitCount[available] < digitCount[candidates]) {
                best = i;
                candidates = available;
                if (digitCount[candidates] === 1) break;
            }
        }

        const index = empty[best];
        empty[best] = empty[depth];
        empty[depth] = index;
        const {row, column, block} = locations[index];
        while (candidates && !stopped) {
            const bit = candidates & -candidates;
            candidates ^= bit;
            puzzle[index] = 31 - Math.clz32(bit);
            rows[row] |= bit;
            columns[column] |= bit;
            blocks[block] |= bit;
            if (!search(depth + 1)) return false;
            rows[row] ^= bit;
            columns[column] ^= bit;
            blocks[block] ^= bit;
        }
        puzzle[index] = CellValue.EMPTY;
        empty[depth] = empty[best];
        empty[best] = index;
        return true;
    }
}

export function solveCheckUnique(input: Puzzle, maxIterations = 0): Solution | SOLVER_FAILURE {
    const puzzle = input instanceof Sudoku ? input.getFlatValues() : input;
    let solution: Solution | undefined;
    let multiple = false;
    const finished = searchCompletions(puzzle, completion => {
        if (solution) {
            multiple = true;
            return true;
        }
        solution = completion.slice();
        return false;
    }, MINIMUM_CLUES, maxIterations);
    if (!finished) return SOLVER_FAILURE.NO_SOLUTION_FOUND;
    return multiple ? SOLVER_FAILURE.MULTIPLE_SOLUTIONS : solution ?? SOLVER_FAILURE.NO_SOLUTION_FOUND;
}

/** Find a completion that a clue exchange must rule out. The known solution fits the givens. */
export function findAlternativeSolution(puzzle: CellValue[], known: CellValue[]): Solution | undefined {
    let alternative: Solution | undefined;
    searchCompletions(puzzle, completion => {
        if (!completion.some((value, index) => value !== known[index])) return false;
        alternative = completion.slice();
        return true;
    });
    return alternative;
}
