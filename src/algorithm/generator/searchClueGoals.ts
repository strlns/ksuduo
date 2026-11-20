import {BOARD_SIZE, MINIMUM_CLUES} from '../../model/Board';
import {CellValue} from '../../model/CellData';
import {Sudoku} from '../../model/Sudoku';
import {shuffle} from '../../utility/shuffle';
import {LogicLevel, logicalProfile, solveLogical} from '../solver/logical';
import {findAlternativeSolution} from '../solver/solverBacktracking';
import {generateFullSolution} from './generateFullSolution';

const positions = Array.from({length: BOARD_SIZE}, (_, index) => index);

function uniqueLeaf(solution: CellValue[], floor: number): CellValue[] {
    const values = solution.slice();
    let count = BOARD_SIZE;
    for (const index of shuffle(positions.slice())) {
        values[index] = CellValue.EMPTY;
        if (findAlternativeSolution(values, solution)) values[index] = solution[index];
        else if (--count === floor) break;
    }
    return values;
}

/** Sample unique masks near the target, crossing branches by exchanging clues. */
export function searchClueGoals(original: Sudoku, clues: number, level: LogicLevel, quick: boolean): Sudoku {
    const originalProfile = logicalProfile(original, level);
    if (originalProfile.rating === level && original.getNumberOfHints() === clues) return original;

    const deadline = performance.now() + (quick ? 240 : 1300);
    const probe = new Sudoku();
    let best = original;
    let bestRating = originalProfile.rating ?? -1;
    let bestDistance = Math.abs(original.getNumberOfHints() - clues);
    let bestProfile = originalProfile;

    function consider(values: CellValue[], solution: CellValue[], count: number) {
        probe.initWithNumbers(values, false);
        const profile = logicalProfile(probe, level);
        const {rating} = profile;
        const distance = Math.abs(count - clues);
        const earlier = profile.beforeNonEasy + profile.beforeTarget < bestProfile.beforeNonEasy + bestProfile.beforeTarget;
        const openingFits = level < 3 || distance === 0 ||
            (profile.beforeNonEasy <= bestProfile.beforeNonEasy + 4 * (bestDistance - distance) &&
             profile.beforeTarget <= bestProfile.beforeTarget + 4 * (bestDistance - distance));
        if (rating !== undefined && (rating > bestRating || (rating === bestRating &&
            ((distance < bestDistance && openingFits) || (distance === bestDistance && level >= 3 && earlier))))) {
            best = new Sudoku();
            best.initWithNumbers(values, false);
            best.setSolution(solution.slice());
            bestRating = rating;
            bestDistance = distance;
            bestProfile = profile;
        }
        return rating;
    }

    for (let start = 0; start < (quick ? 18 : 135) && performance.now() < deadline; start++) {
        const solution = start === 0 ? original.getSolution() : generateFullSolution();
        let values = start === 0 ? original.getFlatValues()
            : uniqueLeaf(solution, Math.max(MINIMUM_CLUES, clues - 5));
        let count = values.filter(Boolean).length;
        if (start && clues <= 23 && count > clues + 2 && count > best.getNumberOfHints()) continue;
        let rating = start === 0 ? originalProfile.rating : consider(values, solution, count);

        while (count < clues && performance.now() < deadline) {
            const missing = shuffle(positions.filter(i => !values[i]));
            if (rating === level && level > 0) {
                probe.initWithNumbers(values, false);
                const lower = solveLogical(probe, (level - 1) as LogicLevel, true);
                missing.sort((a, b) => Number(Boolean(lower?.[b])) - Number(Boolean(lower?.[a])));
            }
            let addition: number | undefined;
            let addedRating: LogicLevel | undefined;
            for (const index of missing.slice(0, 8)) {
                if (performance.now() >= deadline) break;
                values[index] = solution[index];
                const candidate = consider(values, solution, count + 1);
                values[index] = CellValue.EMPTY;
                if (candidate === level || (candidate ?? -1) > (addedRating ?? -1) || addition === undefined) {
                    addition = index;
                    addedRating = candidate;
                }
                if (candidate === level) break;
            }
            if (addition === undefined || (rating === level && addedRating !== level)) break;
            values[addition] = solution[addition];
            count++;
            rating = addedRating;
        }
        if (count === clues && rating === level) return best;
        if (count < clues) continue;

        const rounds = start === 0 ? 48 : 12;
        for (let round = 0; round < rounds && performance.now() < deadline; round++) {
            const givens = shuffle(positions.filter(i => values[i]));
            const removed = givens.slice(0, count > clues && round % 3 !== 2 ? 2 : 1);
            const next = values.slice();
            for (const index of removed) next[index] = CellValue.EMPTY;
            const alternative = findAlternativeSolution(next, solution);
            const reducedCount = count - removed.length;
            if (!alternative) {
                if (reducedCount < clues) continue;
                const candidate = consider(next, solution, reducedCount);
                if (candidate === level || rating !== level || round % 4 === 3) {
                    values = next;
                    count = reducedCount;
                    rating = candidate;
                }
            } else {
                // Any repair clue outside this difference leaves the alternative intact.
                const repairs = shuffle(positions.filter(i => !values[i] && alternative[i] !== solution[i]));
                let replacement: number | undefined;
                let replacementRating: LogicLevel | undefined;
                for (const index of repairs.slice(0, 8)) {
                    if (performance.now() >= deadline) break;
                    next[index] = solution[index];
                    if (!findAlternativeSolution(next, solution)) {
                        const candidate = consider(next, solution, reducedCount + 1);
                        if (candidate === level || (candidate ?? -1) > (replacementRating ?? -1) || replacement === undefined) {
                            replacement = index;
                            replacementRating = candidate;
                        }
                    }
                    next[index] = CellValue.EMPTY;
                    if (replacementRating === level) break;
                }
                if (replacement !== undefined && (replacementRating === level || rating !== level || round % 4 === 3)) {
                    next[replacement] = solution[replacement];
                    values = next;
                    count = reducedCount + 1;
                    rating = replacementRating;
                }
            }
            if (bestDistance === 0 && bestRating === level) return best;
        }
    }
    return best;
}
