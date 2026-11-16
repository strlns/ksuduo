import {Sudoku} from '../model/Sudoku';
import type {Candidates, LogicStep} from '../algorithm/solver/logical';
import type {CellData} from '../model/CellData';

export type HintChoice = {kind: 'step'; step: LogicStep} | {kind: 'correction'; cell: CellData};
const position = (board: Sudoku) => `${board.history.length}:${board.getFlatValuesAsString()}`;
const copyCandidates = (candidates: Candidates): Candidates => new Map([...candidates].map(([i, values]) => [i, [...values]]));
export interface HintView {
    step: LogicStep;
    board: Sudoku;
    notes: Record<string, number[]>;
}
interface Entry {
    before: string;
    after: string;
    candidates: Candidates;
    choice: HintChoice;
    view?: HintView;
}

/** Session-only redo path. New entries discard the future; undo preserves it. */
export class HintHistory {
    private past: Entry[] = [];
    private future: Entry[] = [];

    get hints(): HintView[] { return this.past.flatMap(entry => entry.view ? [entry.view] : []); }

    clear() { this.past = []; this.future = []; }

    replay(board: Sudoku): HintChoice | undefined {
        const entry = this.future.at(-1);
        if (entry?.before === position(board)) return entry.choice;
        this.future = [];
    }

    begin(board: Sudoku, candidates: Candidates, choice: HintChoice) {
        return {before: position(board), candidates: copyCandidates(candidates), choice};
    }

    commit(before: Pick<Entry, 'before' | 'candidates' | 'choice'>, board: Sudoku, candidates?: Candidates) {
        if (this.future.at(-1)?.choice === before.choice) this.future.pop();
        else this.future = [];
        const view = before.choice.kind === 'step' ? {
            step: before.choice.step,
            board: Sudoku.cloneWithoutHistory(board),
            notes: Object.fromEntries([...before.choice.step.sources, ...before.choice.step.targets].map(cell => {
                const allowed = board.getAllowedCellValues(board.getCell(cell.x, cell.y));
                return [`${cell.x},${cell.y}`, (candidates ?? before.candidates).get(cell.y * 9 + cell.x)?.filter(n => allowed.includes(n)) ?? []];
            })),
        } : undefined;
        this.past.push({...before, after: position(board), view});
    }

    undo(board: Sudoku, notesUndone: boolean): Candidates | undefined {
        const entry = this.past.at(-1);
        const elimination = entry?.choice.kind === 'step' && !entry.choice.step.placement;
        if (!entry || entry.after !== position(board) || elimination !== notesUndone) {
            this.clear();
            return;
        }
        this.past.pop();
        this.future.push(entry);
        return copyCandidates(entry.candidates);
    }
}
