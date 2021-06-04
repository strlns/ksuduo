import {Sudoku} from "../model/Sudoku";
import {DIFFICULTY_LEVEL} from "../algorithm/generator/generator";

export const LOCALSTORAGE_KEY = 'ksuduoState';

export type GameStateSerializable = {
    board: Sudoku,
    secondsElapsed: number,
    isPaused: boolean,
    timerEnabled: boolean,
    currentDifficulty: DIFFICULTY_LEVEL,
    solutionShown: boolean
}

export const withLocalStorage = (func: Function) => {
    if ('localStorage' in (window || globalThis)) {
        try {
            return func.call(null);
        } catch {
            /**
             * some browsers throw Exceptions when trying to use localStorage
             * given certain privacy settings. No need for further error handling here,
             * localStorage just doesn't work in this case.
             */
        }
    }
}

/**
 * Persisted JSON contains board, solution, history and timer state.
 * Separating the timer/elapsed seconds from the rest could help performance a little
 * but is currently unneeded.
 * Persisting is triggered by game actions and on page hide.
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
                    state.isPaused,
                    state.timerEnabled,
                    state.currentDifficulty,
                    state.solutionShown
                ])
            );
        }
    );
}