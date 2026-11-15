/*
 * @module SudokuGenerator
 *
 */

import { Sudoku } from "../../model/Sudoku";
import { MINIMUM_CLUES } from "../../model/Board";
import {generateLogical} from "./generatorLogical";
import { isError } from "lodash-es";
import {rateLogical, logicLevelNames} from "../solver/logical";
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
    if (!Number.isFinite(numberOfClues)) throw new Error("Invalid clue count.");
    if (![DIFFICULTY_LEVEL.EASY_NEW, DIFFICULTY_LEVEL.EASY, DIFFICULTY_LEVEL.MEDIUM, DIFFICULTY_LEVEL.HARD].includes(difficulty)) throw new Error("Invalid difficulty.");
    const level = difficulty === DIFFICULTY_LEVEL.EASY_NEW ? 0 :
      difficulty === DIFFICULTY_LEVEL.EASY ? 1 : difficulty === DIFFICULTY_LEVEL.MEDIUM ? 2 : 3;
    const target = Math.max(MINIMUM_CLUES, Math.min(81, Math.floor(numberOfClues)));
    const board = generateLogical(target, level, fewerRetries ? 1 : 3);
    const actual = board.getNumberOfHints();
    const code = actual > target ? GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL : GENERATOR_CODE.OK;
    // Check the actual returned board, independently of removal-loop shortcuts.
    // Both worker and synchronous generation pass through this boundary.
    if (!Array.isArray(solveCheckUnique(board))) {
      return [GENERATOR_CODE.UNKNOWN_ERROR, undefined,
        "Generated puzzle failed the final uniqueness check. Please try again."];
    }
    const rating = rateLogical(board);
    if (rating === undefined || rating > level) {
      return [GENERATOR_CODE.UNKNOWN_ERROR, undefined, "Generated puzzle exceeds its solving-technique limit. Please try again."];
    }
    const ratingMessage = `Rated ${logicLevelNames[rating]} by the app's solving techniques.`;
    const details = actual > target ? ` Kept ${actual} clues (requested ${target}).` : '';
    const easier = rating < level ? ` Requested ${logicLevelNames[level]}; try again for a more demanding puzzle.` : '';
    return [code, board, ratingMessage + details + easier];
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
