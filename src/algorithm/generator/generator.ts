/*
 * @module SudokuGenerator
 *
 */

import { Sudoku } from "../../model/Sudoku";
import { MINIMUM_CLUES } from "../../model/Board";
import { generateBoardSolvableUsingEasyTechniques } from "./generatorHumanTechniques";
import { generateSudoku } from "./generatorConstraintBased";
import { isError } from "lodash-es";
import {solveCheckUnique} from "../solver/solverBacktracking";

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
    let result: GeneratorResult;
    if (difficulty === DIFFICULTY_LEVEL.EASY_NEW) {
      /**{@link numberOfClues} is ignored here because the algo is not that good.
       * It seems to achieve 32 hints most of the times so theres no use in trying multiple times at the moment. */
      result = [
        GENERATOR_CODE.OK,
        generateBoardSolvableUsingEasyTechniques(26, 1),
      ];
    }
    else {
      result = generateSudoku(numberOfClues, difficulty, fewerRetries);
    }
    // Check the actual returned board, independently of removal-loop shortcuts.
    // Both worker and synchronous generation pass through this boundary.
    if (result[0] !== GENERATOR_CODE.UNKNOWN_ERROR &&
        (!result[1] || !Array.isArray(solveCheckUnique(result[1])))) {
      return [GENERATOR_CODE.UNKNOWN_ERROR, undefined,
        "Generated puzzle failed the final uniqueness check. Please try again."];
    }
    return result;
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
