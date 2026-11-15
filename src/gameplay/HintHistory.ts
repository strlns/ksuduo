import type {Sudoku} from '../model/Sudoku';
import type {Candidates, LogicStep} from '../algorithm/solver/logical';
import type {CellData} from '../model/CellData';

export type HintChoice = {kind: 'step'; step: LogicStep} | {kind: 'correction'; cell: CellData};
const position = (board: Sudoku) => `${board.history.length}:${board.getFlatValuesAsString()}`;
const copyCandidates = (candidates: Candidates): Candidates => new Map([...candidates].map(([i, values]) => [i, [...values]]));
interface Entry {
    before: string;
    after: string;
    candidates: Candidates;
    choice: HintChoice;
}

/** Session-only redo path. New entries discard the future; undo preserves it. */
export class HintHistory {
    private past: Entry[] = [];
    private future: Entry[] = [];

    clear() { this.past = []; this.future = []; }

    replay(board: Sudoku): HintChoice | undefined {
        const entry = this.future.at(-1);
        if (entry?.before === position(board)) return entry.choice;
        this.future = [];
    }

    begin(board: Sudoku, candidates: Candidates, choice: HintChoice) {
        return {before: position(board), candidates: copyCandidates(candidates), choice};
    }

    commit(before: Omit<Entry, 'after'>, board: Sudoku) {
        if (this.future.at(-1)?.choice === before.choice) this.future.pop();
        else this.future = [];
        this.past.push({...before, after: position(board)});
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
