import type {GENERATOR_CODE} from "../algorithm/generator/generator";
import type {SudokuStructuredClone} from "../model/Sudoku";

export enum WORKER_ACTIONS {
    SOLVE,
    GENERATE,
    TEST
}

export const MSGEVT_SOURCE = 'ksuduo';

export type GeneratorResultFromWorker = [GENERATOR_CODE, SudokuStructuredClone]
    | [GENERATOR_CODE, SudokuStructuredClone, string]
