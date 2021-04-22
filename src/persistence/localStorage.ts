/*
 * (c) 2021 Moritz Rehbach. See LICENSE.txt
 */

import {BOARD_SIZE, Sudoku} from "../model/Sudoku";
import {Solution} from "../solver/solver";

export const LOCALSTORAGE_KEY = 'ksuduoState';

export const boardFromLocalStorage = (): Sudoku => {
    if ('localStorage' in (window || globalThis)) {
        try {
            const data: any = JSON.parse(localStorage.getItem(
                LOCALSTORAGE_KEY
            ) as string);
            if (Array.isArray(data[0]) && data[0].length === BOARD_SIZE) {
                const sudoku = new Sudoku();
                const history: any = data[1];
                sudoku.initWithFlatCellData(data[0]);
                sudoku.history = history;
                if (data[2] as Solution) {
                    sudoku.setSolution(data[2]);
                }
                return sudoku;
            }
        } catch {
            //fall through
        }
    }
    return new Sudoku();
}
export const persist = (sudoku: Sudoku): void => {
    if ('localStorage' in (window || globalThis)) {
        try {
            localStorage.setItem(
                LOCALSTORAGE_KEY, JSON.stringify([
                    sudoku.getFlatCells(),//no need to cast CellValue to number, that's implicit.
                    sudoku.history,
                    sudoku.getSolution()
                ])
            );
        } catch {
            /**
             * some browsers throw Exceptions when trying to use localStorage
             * given certain privacy settings.
             */
        }
    }
}
