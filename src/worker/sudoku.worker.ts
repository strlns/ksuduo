import generateRandomSudoku from "../generator/generator";
import {solve} from "../solver/solver";

const ctx: Worker = self as any;

export enum WORKER_ACTIONS {
    SOLVE,
    GENERATE,
    TEST
}

export const MSGEVT_SOURCE = 'ksuduo';

ctx.addEventListener("message", (msgEvent: MessageEvent) => {
    if (msgEvent.data.source !== MSGEVT_SOURCE) return;
    switch (msgEvent.data.data[0]) {
        case WORKER_ACTIONS.SOLVE:
            ctx.postMessage(
                solve(msgEvent.data.data[1])
            )
            break;
        case WORKER_ACTIONS.GENERATE:
            const sudoku = generateRandomSudoku(msgEvent.data.data[1]);
            ctx.postMessage(sudoku);
            break;
        case WORKER_ACTIONS.TEST:
            ctx.postMessage("Test successful.");
            break;
        default:
            console.error(msgEvent);
            throw new Error("Could not process message")
    }
});
