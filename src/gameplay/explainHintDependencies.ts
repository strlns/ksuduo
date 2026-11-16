import type {Candidates, LogicStep} from '../algorithm/solver/logical';
import type {Sudoku} from '../model/Sudoku';

/** Only cite eliminations still needed for this particular placement on this board. */
export function explainHintDependencies(board: Sudoku, candidates: Candidates, step: LogicStep, earlier: LogicStep[]): LogicStep {
    if (!step.placement || !['Naked single', 'Hidden single'].includes(step.technique)) return step;
    const target = step.targets[0];
    const relevant = (step.technique === 'Naked single' ? [target] : step.sources.filter(c => c.x !== target.x || c.y !== target.y))
        .filter(cell => !board.getCell(cell.x, cell.y).value);
    const missing = relevant.flatMap(cell => {
        const current = candidates.get(cell.y * 9 + cell.x) ?? [];
        return board.getAllowedCellValues(board.getCell(cell.x, cell.y))
            .filter(value => !current.includes(value) && (step.technique === 'Naked single' || value === step.value))
            .map(value => ({cell, value}));
    });
    const reasons = earlier.filter(previous => !previous.placement && missing.some(({cell, value}) =>
        previous.value === value && previous.targets.some(c => c.x === cell.x && c.y === cell.y)));
    const priorEliminations = [...new Set(reasons.map(reason => reason.technique))];
    return priorEliminations.length ? {...step, priorEliminations} : step;
}
