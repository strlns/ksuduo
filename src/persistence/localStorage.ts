import {BOARD_SIZE, Sudoku} from "../model/Sudoku";
import {Solution} from "../solver/solver";

export const LOCALSTORAGE_KEY = 'ksuduoState';

export type GameStateSerializable = {
    board: Sudoku,
    secondsElapsed: number,
    isPaused: boolean
}

const withLocalStorage = (func: Function) => {
    if ('localStorage' in (window || globalThis)) {
        try {
            return func.call(null);
        } catch {
            /**
             * some browsers throw Exceptions when trying to use localStorage
             * given certain privacy settings.
             */
        }
    }
}

export const restoreGameStateOrInitialize = (): GameStateSerializable => {
    const lsResult = withLocalStorage(() => {
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
            return {
                board: sudoku,
                secondsElapsed: data[3],
                isPaused: data[4]
            };
        }
    });
    return lsResult ?? {
        board: new Sudoku(),
        secondsElapsed: 0,
        isPaused: false
    };
}
/**
 * Persisted JSON contains board, soluton, history and timer state.
 * Separating the timer/elapsed seconds from the rest could help performance a little
 * but is currently unneeded.
 * Persisting is triggered by game actions and on beforeUnload.
 *
 * @param state
 */
export const persist = (state: GameStateSerializable): void => {
    withLocalStorage(
        () => {
            localStorage.setItem(
                LOCALSTORAGE_KEY, JSON.stringify([
                    state.board.getFlatCells(),//no need to cast CellValue to number, that's implicit.
                    state.board.history,
                    state.board.getSolution(),
                    state.secondsElapsed,
                    state.isPaused
                ])
            );
        }
    );
}