import {expect, it} from 'vitest';
import {Sudoku} from '../src/model/Sudoku';
import {candidatesFor, findFish, nextLogicStep, applyLogicStep} from '../src/algorithm/solver/logical';

function pattern(size: 2 | 3, transpose = false) {
    const board = new Sudoku(), candidates = candidatesFor(board);
    const rows = size === 2 ? [0, 3] : [0, 3, 6];
    const positions = size === 2 ? [[1,4], [1,4]] : [[1,4], [4,7], [1,7]];
    rows.forEach((row, i) => {
        for (let col = 0; col < 9; col++) if (!positions[i].includes(col)) {
            candidates.set(transpose ? col * 9 + row : row * 9 + col, [2,3,4,5,6,7,8,9]);
        }
    });
    return {board,candidates};
}

it.each([2,3] as const)('finds size-%i fish in both orientations, independently validating every elimination', size => {
    for (const transpose of [false,true]) {
        const {board,candidates} = pattern(size, transpose);
        const step = findFish(board,candidates,size)!;
        expect(step.technique).toBe(size === 2 ? 'X-Wing' : 'Swordfish');
        expect(step.fish?.orientation).toBe(transpose ? 'columns' : 'rows');
        expect(step.sources).toHaveLength(size * 2);
        expect(step.targets.length).toBeGreaterThan(0);
        // Independent matching oracle: enumerate every placement of digit 1 with
        // one per row/column. Even without box constraints, no target can hold it.
        let completions = 0;
        const possible = new Set<number>();
        const visit = (row: number, used: number, chosen: number[]) => {
            if (row === 9) {completions++; chosen.forEach(i => possible.add(i)); return;}
            for (let col = 0; col < 9; col++) if (!(used & (1 << col)) && candidates.get(row*9+col)?.includes(1))
                visit(row+1, used | (1 << col), [...chosen,row*9+col]);
        };
        visit(0,0,[]);
        expect(completions).toBeGreaterThan(0);
        for (const target of step.targets) expect(possible.has(target.y*9+target.x)).toBe(false);
        expect(nextLogicStep(board,candidates,3)).toBeUndefined();
        expect(nextLogicStep(board,candidates,4)?.technique).toBe(step.technique);
        applyLogicStep(board,candidates,step);
        for (const target of step.targets) expect(candidates.get(target.y*9+target.x)).not.toContain(1);
        expect(board.getNumberOfFilledCells()).toBe(0);
    }
});

it.each([2,3] as const)('rejects size-%i near-fish with an extra crossing line', size => {
    const {board,candidates} = pattern(size);
    candidates.set(2,[1,2,3,4,5,6,7,8,9]);
    expect(findFish(board,candidates,size)).toBeUndefined();
});

it('does not invent eliminations when all crossing candidates are inside the fish', () => {
    const {board,candidates} = pattern(2);
    for (let row=0;row<9;row++) if (![0,3].includes(row)) for (const col of [1,4]) candidates.set(row*9+col,[2,3,4,5,6,7,8,9]);
    expect(findFish(board,candidates,2)).toBeUndefined();
});
