import {expect, it} from 'vitest';
import {HintHistory, type HintChoice} from '../src/gameplay/HintHistory';
import {Sudoku} from '../src/model/Sudoku';
import {applyLogicStep, candidatesFor, nextLogicStep} from '../src/algorithm/solver/logical';
import {makeBoard} from './fixtures';

it('replays a complete mixed placement/elimination path with the exact earlier candidate state', () => {
    const board = new Sudoku();
    board.initWithNumbers([...'010050080500603007006000500070060090600204001020030040002000400700106003080020060'].map(Number), false);
    const history = new HintHistory();
    let candidates = candidatesFor(board);
    const entries: {choice: HintChoice; candidates: typeof candidates; values: number[]}[] = [];
    while (!board.isSolved()) {
        const step = nextLogicStep(board, candidates)!;
        expect(step).toBeDefined();
        const choice: HintChoice = {kind: 'step', step};
        entries.push({choice, candidates: structuredClone(candidates), values: board.getFlatValues()});
        const before = history.begin(board, candidates, choice);
        applyLogicStep(board, candidates, step, true);
        history.commit(before, board);
    }
    expect(entries.some(e => e.choice.kind === 'step' && !e.choice.step.placement)).toBe(true);
    for (const entry of [...entries].reverse()) {
        const step = entry.choice.kind === 'step' ? entry.choice.step : undefined;
        candidates = history.undo(board, !step!.placement)!;
        if (step!.placement) board.undo();
        expect(board.getFlatValues()).toEqual(entry.values);
        expect(candidates).toEqual(entry.candidates);
    }
    for (const entry of entries) {
        const choice = history.replay(board)!;
        expect(choice).toBe(entry.choice);
        expect(candidates).toEqual(entry.candidates);
        if (choice.kind !== 'step') throw new Error('Expected solving step');
        const before = history.begin(board, candidates, choice);
        applyLogicStep(board, candidates, choice.step, true);
        history.commit(before, board);
    }
    expect(board.isSolved()).toBe(true);
});

it('does not replay a stale hint on a different board or after discarding the path', () => {
    const board = makeBoard(), candidates = candidatesFor(board), history = new HintHistory();
    const choice: HintChoice = {kind: 'step', step: nextLogicStep(board, candidates)!};
    const before = history.begin(board, candidates, choice);
    applyLogicStep(board, candidates, choice.step, true);
    history.commit(before, board);
    history.undo(board, false);
    board.undo();
    expect(history.replay(board)).toBe(choice);
    board.setValue(2, 0, 4);
    expect(history.replay(board)).toBeUndefined();
    board.undo();
    expect(history.replay(board)).toBeUndefined();
    history.clear();
    expect(history.undo(board, false)).toBeUndefined();
});

it('retains detached board and candidate snapshots and hides undone future hints from review', () => {
    const board=makeBoard(), candidates=candidatesFor(board), history=new HintHistory();
    for (let i=0;i<2;i++) {
        const step=nextLogicStep(board,candidates)!;
        const before=history.begin(board,candidates,{kind:'step',step});
        applyLogicStep(board,candidates,step,true); history.commit(before,board,candidates);
    }
    expect(history.hints).toHaveLength(2);
    const first=history.hints[0], saved=first.board.getFlatValues();
    expect(first.board.history).toHaveLength(0);
    expect(saved).not.toEqual(board.getFlatValues());
    history.undo(board,false);board.undo();
    expect(history.hints).toHaveLength(1);
    expect(history.hints[0]).toBe(first);
    expect(first.board.getFlatValues()).toEqual(saved);
    board.setValue(2,0,1);
    expect(first.board.getFlatValues()).toEqual(saved);
    history.clear();expect(history.hints).toHaveLength(0);
});
