import generateRandomSudoku, {GENERATOR_CODE} from "../algorithm/generator/generator";
import {solveCheckUnique} from "../algorithm/solver/solverBacktracking";
import {SudokuStructuredClone} from "../model/Sudoku";

const ctx: Worker = self as any;

export enum WORKER_ACTIONS {
    SOLVE,
    GENERATE,
    TEST
}

export const MSGEVT_SOURCE = 'ksuduo';

export type GeneratorResultFromWorker = [GENERATOR_CODE, SudokuStructuredClone]
    | [GENERATOR_CODE, SudokuStructuredClone, string]

ctx.addEventListener("message", (msgEvent: MessageEvent) => {
    if (msgEvent.data.source !== MSGEVT_SOURCE) return;
    switch (msgEvent.data.data[0]) {
        case WORKER_ACTIONS.SOLVE:
            ctx.postMessage(
                solveCheckUnique(msgEvent.data.data[1])
            )
            break;
        case WORKER_ACTIONS.GENERATE:
            const result = generateRandomSudoku(msgEvent.data.data[1], msgEvent.data.data[2]);
            ctx.postMessage(result);
            break;
        case WORKER_ACTIONS.TEST:
            ctx.postMessage("Test successful.");
            break;
        default:
            console.error(msgEvent);
            throw new Error("Could not process message")
    }
});
