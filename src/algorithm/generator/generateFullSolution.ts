import {shuffle} from '../../utility/shuffle';

/** Randomized backtracking; no templates or restart-until-lucky loop. */
export function generateFullSolution(): number[] {
    const values = Array<number>(81).fill(0);
    const rows = Array<number>(9).fill(0), cols = Array<number>(9).fill(0), boxes = Array<number>(9).fill(0);
    const fill = (i: number): boolean => {
        if (i === 81) return true;
        const y = Math.floor(i / 9), x = i % 9, b = Math.floor(y / 3) * 3 + Math.floor(x / 3);
        for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
            const bit = 1 << n;
            if ((rows[y] | cols[x] | boxes[b]) & bit) continue;
            values[i] = n; rows[y] |= bit; cols[x] |= bit; boxes[b] |= bit;
            if (fill(i + 1)) return true;
            values[i] = 0; rows[y] ^= bit; cols[x] ^= bit; boxes[b] ^= bit;
        }
        return false;
    };
    if (!fill(0)) throw new Error('Could not construct a solution.');
    return values;
}
