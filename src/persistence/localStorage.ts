import {Sudoku} from "../model/Sudoku";
import {Solution} from "../solver/solver";
import {BOARD_SIZE} from "../model/Board";
import {DIFFICULTY_LEVEL} from "../generator/generator";

export const LOCALSTORAGE_KEY = 'thirtySixState';

export type GameStateSerializable = {
    board: Sudoku,
    secondsElapsed: number,
    isPaused: boolean,
    timerEnabled: boolean,
    currentDifficulty: DIFFICULTY_LEVEL,
    solutionShown: boolean
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
                isPaused: data[4],
                timerEnabled: data[5] ?? false,
                currentDifficulty: data[6] ?? DIFFICULTY_LEVEL.EASY,
                solutionShown: data[7] ?? false
            };
        }
    });
    if (IS_DEVELOPMENT) {
        console.log('localStorage read.', lsResult)
    }
    return lsResult ?? {
        board: new Sudoku(),
        secondsElapsed: 0,
        isPaused: false,
        timerEnabled: false,
        currentDifficulty: DIFFICULTY_LEVEL.EASY,
        solutionShown: false
    };
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