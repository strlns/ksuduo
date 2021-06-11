import {BOARD_SIZE} from "../model/Board";
import {Sudoku} from "../model/Sudoku";
import {Solution} from "../algorithm/solver/solver";
import {DIFFICULTY_LEVEL} from "../algorithm/generator/generator";
import {GameStateSerializable, LOCALSTORAGE_KEY, withLocalStorage} from "./localStorage";

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
                currentDifficulty: data[6] ?? DIFFICULTY_LEVEL.EASY_NEW,
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
        currentDifficulty: DIFFICULTY_LEVEL.EASY_NEW,
        solutionShown: false
    };
}