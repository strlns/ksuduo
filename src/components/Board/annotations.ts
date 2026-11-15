import type {Sudoku} from '../../model/Sudoku';
import type {CellData} from '../../model/CellData';
import type {LogicStep} from '../../algorithm/solver/logical';
export type AnnotationScope = 'explanation' | 'row' | 'column' | 'block' | 'all';
export interface AnnotationRequest {id: number; scope: AnnotationScope}
export function annotationsFor(board: Sudoku, selected: CellData, scope: AnnotationScope,
    step?: LogicStep, candidates?: Record<string, number[]>): Record<string, number[]> {
    const related = [...(step?.sources ?? []), ...(step?.targets ?? [])];
    return Object.fromEntries(board.getEmptyCells().filter(cell => scope === 'all' ||
        (scope === 'row' && cell.y === selected.y) ||
        (scope === 'column' && cell.x === selected.x) ||
        (scope === 'block' && cell.blockIndex === selected.blockIndex) ||
        (scope === 'explanation' && related.some(c => c.x === cell.x && c.y === cell.y)))
        .map(cell => {
            const key = `${cell.x},${cell.y}`, allowed = board.getAllowedCellValues(cell);
            return [key, (candidates?.[key] ?? allowed).filter(n => allowed.includes(n))];
        }));
}
