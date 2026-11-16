import {expect, it} from 'vitest';
import {Sudoku} from '../src/model/Sudoku';
import {candidatesFor, type LogicStep} from '../src/algorithm/solver/logical';
import {explainHintDependencies} from '../src/gameplay/explainHintDependencies';
import {makeBoard} from './fixtures';

it('identifies only the retained eliminations needed by a naked single and leaves the solver classification intact', () => {
    const board = makeBoard(), target = board.getCell(2, 0), candidates = candidatesFor(board);
    candidates.set(2, [4]);
    const single: LogicStep = {technique: 'Naked single', placement: true, sources: [target], targets: [target], value: 4, explanation: 'Only 4 remains.'};
    const locked: LogicStep = {...single, technique: 'Locked candidates', placement: false, value: 1};
    const pair: LogicStep = {...locked, technique: 'Naked pair', value: 2};
    const unrelated: LogicStep = {...locked, technique: 'X-Wing', targets: [board.getCell(3, 0)]};
    expect(explainHintDependencies(board, candidates, single, [locked, pair, unrelated])).toEqual({...single, priorEliminations: ['Locked candidates', 'Naked pair']});
    // A later placement already excludes 1, so that old elimination is no longer a prerequisite.
    board.setValue(2, 1, 1, false, false);
    expect(explainHintDependencies(board, candidates, single, [locked, pair]).priorEliminations).toEqual(['Naked pair']);
});

it('also recognizes eliminations that make a hidden single unique in its unit', () => {
    const board = new Sudoku(), target = board.getCell(2, 0), candidates = candidatesFor(board);
    const others = board.getRows()[0].filter(cell => cell !== target);
    for (const cell of others) candidates.set(cell.x, [2,3,4,5,6,7,8,9]);
    const single: LogicStep = {technique: 'Hidden single', placement: true, sources: board.getRows()[0], targets: [target], value: 1, explanation: 'Only place for 1.'};
    const previous: LogicStep = {...single, technique: 'Swordfish', placement: false, targets: others};
    expect(explainHintDependencies(board, candidates, single, [previous]).priorEliminations).toEqual(['Swordfish']);
    expect(explainHintDependencies(board, candidatesFor(board), single, [previous])).toBe(single);
});
