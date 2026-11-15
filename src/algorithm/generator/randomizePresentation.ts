import {Sudoku} from '../../model/Sudoku';
import {shuffle} from '../../utility/shuffle';

/** Sudoku automorphisms: permute digits, bands/stacks and rows/columns within them. */
export function randomizePresentation(input: Sudoku): Sudoku {
    const axis = () => shuffle([0,1,2]).flatMap(group => shuffle([0,1,2]).map(i => group*3+i));
    const rows=axis(), columns=axis(), transpose=Math.random()<.5;
    const digits=[0,...shuffle([1,2,3,4,5,6,7,8,9])];
    const transform = (values: number[]) => Array.from({length:81},(_,i) => {
        const x=columns[i%9],y=rows[Math.floor(i/9)];
        return digits[values[transpose ? x*9+y : y*9+x]];
    });
    const board=new Sudoku();
    board.initWithNumbers(transform(input.getFlatValues()),false);
    board.setSolution(transform(input.getSolution()));
    return board;
}
