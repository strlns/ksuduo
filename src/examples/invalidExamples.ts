/**
 * This puzzle has at least 2 solutions, which SHOULD be detected by
 * {@link hasMultipleSolutionsOrIsUnsolvable}
 *
 * encountered in previous version of my generator
 */
import {Puzzle} from "../model/Sudoku";

export const bugPuzzle = [
    4, 3, 0, 2, 0, 5, 9, 7, 0,
    1, 7, 8, 0, 4, 0, 0, 0, 0,
    9, 0, 0, 7, 0, 0, 0, 4, 0,
    8, 0, 0, 0, 5, 9, 1, 0, 0,
    0, 2, 4, 0, 0, 0, 0, 5, 0,
    0, 1, 0, 0, 8, 0, 6, 0, 0,
    0, 0, 3, 6, 9, 0, 0, 0, 0,
    2, 4, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0
]

const puzzleFromSudopediaString = (str: string): Puzzle => str.split('').map(
    (val) => val === '.' ? 0 : +val);

/**
 * http://sudopedia.enjoysudoku.com/Invalid_Test_Cases.html#Not_Unique_.E2.80.94_2_Solutions
 */
export const invalid2Solutions =
    puzzleFromSudopediaString('.39...12....9.7...8..4.1..6.42...79...........91...54.5..1.9..3...8.5....14...87.');

/**
 * http://sudopedia.enjoysudoku.com/Invalid_Test_Cases.html#Not_Unique_.E2.80.94_3_Solutions
 */
export const invalid3Solutions =
    puzzleFromSudopediaString('..3.....6...98..2.9426..7..45...6............1.9.5.47.....25.4.6...785...........');

/**
 * http://sudopedia.enjoysudoku.com/Invalid_Test_Cases.html#Not_Unique_.E2.80.94_4_Solutions
 */
export const invalid4Solutions =
    puzzleFromSudopediaString('....9....6..4.7..8.4.812.3.7.......5..4...9..5..371..4.5..6..4.2.17.85.9.........');

/**
 * http://sudopedia.enjoysudoku.com/Invalid_Test_Cases.html#Not_Unique_.E2.80.94_10_Solutions
 */
export const invalid10Solutions =
    puzzleFromSudopediaString('59.....486.8...3.7...2.1.......4.....753.698.....9.......8.3...2.6...7.934.....65')

/**
 * http://sudopedia.enjoysudoku.com/Invalid_Test_Cases.html#Not_Unique_.E2.80.94_125_Solutions
 */
export const invalid125Solutions =
    puzzleFromSudopediaString('...3165..8..5..1...1.89724.9.1.85.2....9.1....4.263..1.5.....1.1..4.9..2..61.8...')