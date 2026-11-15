import {Sudoku} from '../../model/Sudoku';
import {CellData, CellValue, NonEmptyCellValues} from '../../model/CellData';

export type LogicLevel = 0 | 1 | 2 | 3;
export interface LogicStep {
    technique: string;
    explanation: string;
    sources: CellData[];
    targets: CellData[];
    value: CellValue;
    placement: boolean;
}
export type Candidates = Map<number, CellValue[]>;
const key = (c: CellData) => c.y * 9 + c.x;
export function candidatesFor(board: Sudoku): Candidates {
    return new Map(board.getEmptyCells().map(c => [key(c), board.getAllowedCellValues(c)]));
}
export function nextLogicStep(board: Sudoku, candidates: Candidates, level: LogicLevel = 3): LogicStep | undefined {
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
    for (const level of [0, 1, 2, 3] as const) if (solveLogically(board, level)) return level;
}
export const logicLevelNames = ['Easiest', 'Easy', 'Medium', 'Hard'] as const;

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
