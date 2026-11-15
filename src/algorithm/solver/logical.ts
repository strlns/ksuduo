import {Sudoku} from '../../model/Sudoku';
import {CellData, CellValue, NonEmptyCellValues} from '../../model/CellData';

export type LogicLevel = 0 | 1 | 2 | 3 | 4;
export interface LogicStep {
    technique: string;
    explanation: string;
    sources: CellData[];
    targets: CellData[];
    value: CellValue;
    placement: boolean;
    fish?: {orientation: 'rows' | 'columns'; bases: number[]; covers: number[]};
}
export type Candidates = Map<number, CellValue[]>;
const key = (c: CellData) => c.y * 9 + c.x;
export function candidatesFor(board: Sudoku): Candidates {
    return new Map(board.getEmptyCells().map(c => [key(c), board.getAllowedCellValues(c)]));
}
export function nextLogicStep(board: Sudoku, candidates: Candidates, level: LogicLevel = 4): LogicStep | undefined {
    const cells = board.getEmptyCells();
    const units = [...board.getRows(), ...board.getColumns(), ...board.getBlocks().map(b => b.cells)];
    const values = (c: CellData) => candidates.get(key(c)) ?? [];
    const at = (c: CellData) => `r${c.y + 1}c${c.x + 1}`;
    for (const c of cells) if (values(c).length === 1) return {
        technique: 'Naked single', explanation: `${at(c)} has only one candidate: ${values(c)[0]}.`,
        sources: [c], targets: [c], value: values(c)[0], placement: true,
    };
    if (level === 0) return;
    const unitSingle = unitSingleSteps(board, candidates, true)[0];
    if (unitSingle) return unitSingle;
    if (level < 2) return;
    // Unit intersection covers pointing (box -> line) and claiming (line -> box).
    for (const [i, unit] of units.entries()) for (const value of NonEmptyCellValues) {
        const places = unit.filter(c => !c.value && values(c).includes(value));
        if (places.length < 2) continue;
        for (const [j, other] of units.entries()) {
            if ((i < 18) === (j < 18)) continue;
            if (!places.every(c => other.includes(c))) continue;
            const targets = other.filter(c => !c.value && !unit.includes(c) && values(c).includes(value));
            if (targets.length) return {technique: 'Locked candidates',
                explanation: `${value} is confined to ${places.map(at).join(', ')} in their ${i < 9 ? 'row' : i < 18 ? 'column' : 'block'}. Remove ${value} from ${targets.map(at).join(', ')} in the intersecting ${j < 9 ? 'row' : j < 18 ? 'column' : 'block'}.`,
                sources: places, targets, value, placement: false};
        }
    }
    if (level < 3) return;
    for (const unit of units) for (const c of unit) {
        const pair = values(c);
        if (c.value || pair.length !== 2) continue;
        const sources = unit.filter(d => !d.value && values(d).length === 2 && values(d).every(v => pair.includes(v)));
        if (sources.length !== 2) continue;
        for (const value of pair) {
            const targets = unit.filter(d => !d.value && !sources.includes(d) && values(d).includes(value));
            if (targets.length) return {technique: 'Naked pair',
                explanation: `${sources.map(at).join(' and ')} must contain ${pair.join(' and ')}. Remove ${value} from ${targets.map(at).join(', ')} in their shared unit.`,
                sources, targets, value, placement: false};
        }
    }
    if (level >= 4) return findFish(board, candidates, 2) ?? findXYWing(board, candidates) ?? findFish(board, candidates, 3);
}
export function applyLogicStep(board: Sudoku, candidates: Candidates, step: LogicStep, recordHistory = false): void {
    if (step.placement) {
        const c = step.targets[0];
        board.setValue(c.x, c.y, step.value, false, recordHistory);
        candidates.delete(key(c));
        for (const cell of board.getEmptyCells()) {
            const allowed = board.getAllowedCellValues(cell);
            candidates.set(key(cell), (candidates.get(key(cell)) ?? allowed).filter(v => allowed.includes(v)));
        }
    } else for (const c of step.targets) candidates.set(key(c), (candidates.get(key(c)) ?? []).filter(v => v !== step.value));
}
export function solveLogical(input: Sudoku, level: LogicLevel, returnPartial = false): CellValue[] | undefined {
    const board = Sudoku.cloneWithoutHistory(input);
    const candidates = candidatesFor(board);
    for (let i = 0; i < 810; i++) {
        if (board.isSolved()) return board.getFlatValues();
        if ([...candidates.values()].some(v => !v.length)) return;
        const step = nextLogicStep(board, candidates, level);
        if (!step) return returnPartial ? board.getFlatValues() : undefined;
        applyLogicStep(board, candidates, step);
    }
    return returnPartial ? board.getFlatValues() : undefined;
}

/** A complete logical solve, preserving the input board. */
export function solveLogically(input: Sudoku, level: LogicLevel): boolean {
    return solveLogical(input, level) !== undefined;
}

/** Lowest ceiling that completes the puzzle with this app's deterministic techniques. */
export function rateLogical(board: Sudoku): LogicLevel | undefined {
    for (const level of [0, 1, 2, 3, 4] as const) if (solveLogically(board, level)) return level;
}
export const logicLevelNames = ['Easiest', 'Easy', 'Medium', 'Hard', 'Extra Hard'] as const;

/** All only-place explanations, with equal treatment of blocks, rows and columns. */
export function unitSingleSteps(board: Sudoku, candidates: Candidates, firstOnly = false): LogicStep[] {
    const units = [...board.getRows(), ...board.getColumns(), ...board.getBlocks().map(b => b.cells)];
    const steps: LogicStep[] = [];
    for (const [i, unit] of units.entries()) for (const value of NonEmptyCellValues) {
        const places = unit.filter(c => !c.value && candidates.get(key(c))?.includes(value));
        if (places.length === 1) {
            const c = places[0];
            steps.push({technique: 'Hidden single', explanation: `${value} can only go at r${c.y + 1}c${c.x + 1} in ${i < 9 ? 'row' : i < 18 ? 'column' : 'block'} ${i % 9 + 1}.`,
                sources: unit, targets: places, value, placement: true});
            if (firstOnly) return steps;
        }
    }
    return steps;
}

/** Presentation chooses freely among unit explanations; grading stays deterministic. */
export function nextHintStep(board: Sudoku, candidates: Candidates): LogicStep | undefined {
    const steps = unitSingleSteps(board, candidates);
    return steps.length ? steps[Math.floor(Math.random() * steps.length)] : nextLogicStep(board, candidates);
}

/** Two short teaching sentences, alongside the concrete deduction. */
export function techniqueExplanation(step: LogicStep): string {
    switch (step.technique) {
        case 'Naked single': return 'A naked single leaves just one possible digit in a cell after its row, column and block are checked. The highlighted cell can therefore take the remaining candidate.';
        case 'Hidden single': return 'A hidden single is the only place for a digit in one row, column or block, even if that cell has other candidates. The highlighted unit rules out every other position for this digit.';
        case 'Locked candidates': return 'When all positions for a digit in a block lie on one line, that digit is reserved on their intersection; the same reasoning works from a line into a block. The highlighted source cells therefore exclude the crossed-out digit from the rest of the intersecting unit.';
        case 'Naked pair': return 'Two cells with the same two candidates reserve both digits between them, whichever order they take. Other cells in their shared unit cannot use either digit, so the marked candidate is removed.';
        case 'XY-Wing': return 'The double-outlined pivot has two candidates; each choice forces one of its two wings to contain the eliminated digit. Any cell that sees both wings cannot contain that digit, even when it does not see the pivot.';
        case 'X-Wing': return 'Two parallel lines restrict this digit to the same two crossing lines, so each crossing line must receive it from the highlighted pattern. Remove the digit from other cells on those crossing lines; the mint and amber coordinate labels identify the two line sets.';
        case 'Swordfish': return 'Three parallel lines restrict this digit to three crossing lines; each crossing line must receive one of those three placements. The pattern can have missing corners, but candidates outside it on the amber crossing lines are impossible.';
        default: return '';
    }
}

/** Basic fish only (no fins): N base lines reserve N distinct crossing lines. */
export function findFish(board: Sudoku, candidates: Candidates, size: 2 | 3): LogicStep | undefined {
    for (const orientation of ['rows', 'columns'] as const) {
        const lines = orientation === 'rows' ? board.getRows() : board.getColumns();
        const cross = (c: CellData) => orientation === 'rows' ? c.x : c.y;
        for (const value of NonEmptyCellValues) {
            const eligible = lines.map((line, index) => ({index,
                cells: line.filter(c => !c.value && candidates.get(key(c))?.includes(value))
            })).filter(line => line.cells.length >= 2 && line.cells.length <= size);
            for (let a = 0; a < eligible.length; a++) for (let b = a + 1; b < eligible.length; b++) {
                const thirds = size === 2 ? [-1] : eligible.map((_, i) => i).filter(i => i > b);
                for (const c of thirds) {
                    const chosen = [eligible[a], eligible[b], ...(c < 0 ? [] : [eligible[c]])];
                    const sources = chosen.flatMap(line => line.cells);
                    const covers = [...new Set(sources.map(cross))].sort((a, b) => a - b);
                    if (covers.length !== size) continue;
                    const bases = chosen.map(line => line.index);
                    const targets = lines.flatMap((line, i) => bases.includes(i) ? [] :
                        line.filter(cell => !cell.value && covers.includes(cross(cell)) && candidates.get(key(cell))?.includes(value)));
                    if (!targets.length) continue;
                    const other = orientation === 'rows' ? 'columns' : 'rows';
                    return {technique: size === 2 ? 'X-Wing' : 'Swordfish', value, placement: false,
                        sources, targets, fish: {orientation, bases, covers},
                        explanation: `${value} in ${orientation} ${bases.map(i => i + 1).join(', ')} is confined to ${other} ${covers.map(i => i + 1).join(', ')}. Remove ${value} from ${targets.map(cell => `r${cell.y + 1}c${cell.x + 1}`).join(', ')}.`};
                }
            }
        }
    }
}

/** A bivalue pivot AB sees wings AC and BC; common wing peers cannot contain C. */
export function findXYWing(board: Sudoku, candidates: Candidates): LogicStep | undefined {
    const values = (c: CellData) => candidates.get(key(c)) ?? [];
    const sees = (a: CellData, b: CellData) => a !== b && (a.x === b.x || a.y === b.y || a.blockIndex === b.blockIndex);
    const cells = board.getEmptyCells();
    const pairs = cells.filter(c => values(c).length === 2);
    for (const pivot of pairs) {
        const [a,b] = values(pivot);
        const wings = pairs.filter(c => sees(pivot,c));
        for (const first of wings) {
            const pair = values(first);
            if (!pair.includes(a) || pair.includes(b)) continue;
            const other = pair.find(v => v !== a)!;
            for (const second of wings) {
                if (second === first || !values(second).includes(b) || !values(second).includes(other)) continue;
                const sources = [pivot,first,second];
                const targets = cells.filter(c => !sources.includes(c) && sees(c,first) && sees(c,second) && values(c).includes(other));
                if (!targets.length) continue;
                const at = (c: CellData) => `r${c.y+1}c${c.x+1}`;
                return {technique:'XY-Wing',placement:false,value:other,sources,targets,
                    explanation:`Pivot ${at(pivot)} is ${a}/${b}; wings ${at(first)} (${a}/${other}) and ${at(second)} (${b}/${other}) force ${other} into one wing. Remove ${other} from ${targets.map(at).join(', ')}.`};
            }
        }
    }
}
