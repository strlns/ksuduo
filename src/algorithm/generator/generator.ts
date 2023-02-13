/*
 * @module SudokuGenerator
 *
 */

import { Sudoku } from "../../model/Sudoku";
import { MINIMUM_CLUES } from "../../model/Board";
import { generateBoardSolvableUsingEasyTechniques } from "./generatorHumanTechniques";
import { generateSudoku } from "./generatorConstraintBased";
import { isError } from "lodash-es";

export enum DIFFICULTY_LEVEL {
  EASY,
  MEDIUM,
  HARD,
  EASY_NEW,
}

export enum GENERATOR_CODE {
  OK,
  COULD_NOT_ACHIEVE_CLUES_GOAL,
  UNKNOWN_ERROR,
}

export type GeneratorResult =
  | [GENERATOR_CODE, Sudoku]
  | [GENERATOR_CODE, Sudoku, string]
  | [GENERATOR_CODE, undefined, string];

export default function generateRandomSudoku(
  numberOfClues: number,
  difficulty = DIFFICULTY_LEVEL.EASY,
  fewerRetries = false
): GeneratorResult {
  try {
    if (numberOfClues < MINIMUM_CLUES) {
      numberOfClues = MINIMUM_CLUES;
    }
    if (difficulty === DIFFICULTY_LEVEL.EASY_NEW) {
      /**{@link numberOfClues} is ignored here because the algo is not that good.
       * It seems to achieve 32 hints most of the times so theres no use in trying multiple times at the moment. */
      return [
        GENERATOR_CODE.OK,
        generateBoardSolvableUsingEasyTechniques(26, 1),
      ];
    }
    return generateSudoku(numberOfClues, difficulty, fewerRetries);
  } catch (e) {
    if (isError(e)) {
      if (IS_DEVELOPMENT) {
        console.error(
          ...(e.message && e.message.length ? [e.message] : []),
          e.stack
        );
      }
      return [
        GENERATOR_CODE.UNKNOWN_ERROR,
        undefined,
        e.message && e.message.length ? e.message : "Unknown error!",
      ];
    }
    throw e;
  }
}
