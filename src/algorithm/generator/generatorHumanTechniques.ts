import {Sudoku} from "../../model/Sudoku";
import {BOARD_SIZE, MINIMUM_CLUES} from "../../model/Board";
import {pickRandomArrayIndex, pickRandomArrayValue} from "../../utility/pickRandom";
import {cellIsEmpty} from "../../model/CellData";
import {isTriviallySolvable} from "../transformations";
import {isCellFillableUsingHumanTechniques, isSolvableUsingEasyTechniques} from "../solver/solverHumanTechniques";
import {solve, solverResultIsError} from "../solver/solver";
import drawPuzzle from "../../debug/drawPuzzleOnConsole";
import {shuffle} from "lodash-es";
import {SOLVING_TECHNIQUE} from "../solver/humanTechniques";
import randomCoordinatesGenerator from "../../utility/randomCoordsGenerator";
import {getValueInFlatPuzzleByCoords} from "../solver/transformations";
import logSuccess from "../../debug/consoleSuccess";
import {LOGLEVEL_VERBOSE} from "../../loglevels";

export function generateTriviallySolvableBoard(): Sudoku {
    const board = new Sudoku();
    board.fillWithRandomCompleteSolution();
    const MAX_ITERATIONS = 32;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        let k = 0;
        while (isTriviallySolvable(board) && k < BOARD_SIZE) {
            const cellToClear = pickRandomArrayValue(board.getFilledCells());
            board.clearCell(cellToClear, false)
            k++
        }
        board.fillSinglePossibilityCells();
    }
    return board;
}

function clearCellFillableByHumanTechniques(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): boolean {
    const candidates = IS_DEVELOPMENT ? board.getFilledCells() : shuffle(board.getFilledCells());
    if (candidates.length < 1) return false;
    let index = 0;
    while (candidates.length > 0) {
        if (IS_DEVELOPMENT) {
            index = candidates.length - 1;
        } else {
            index = pickRandomArrayIndex(candidates);
        }
        const clearedCell = board.clearCell(candidates[index]);
        candidates.splice(index, 1);
        if (
            //no empty blocks, and fillable using human technique after removal
            !board.getCellsInBlock(clearedCell).every(cell => cellIsEmpty(cell)) &&
            isCellFillableUsingHumanTechniques(clearedCell, board, setUsedTechnique)
        ) {
            return true;
        } else {
            board.undo();
        }
    }
    return false;
}


/**
 * See this paper: https://sites.math.washington.edu/~morrow/mcm/team2280.pdf
 *
 * This algo is a piece of trash in comparison, but re-uses some ideas from there
 */
const START_WITH_N_CELLS = 48;

export function generateBoardSolvableUsingEasyTechniques(
    numberOfHints: number, maxNumberOfBoardsToTry: number
): Sudoku {
    if (numberOfHints < MINIMUM_CLUES) throw new Error(`A valid Sudoku with < ${MINIMUM_CLUES} hints is impossible.`);
    const board = new Sudoku();
    let firstRun = true;
    let tries = 0;
    let lastUsed: SOLVING_TECHNIQUE | undefined = undefined;
    let bestBoardSoFar = board;
    let minHintsSoFar = BOARD_SIZE;
    const setUsedTechnique = (tech: SOLVING_TECHNIQUE) => {
        lastUsed = tech
    };
    while (firstRun || tries < maxNumberOfBoardsToTry) {
        firstRun = false;
        let seedBoardIsInvalid = true;
        while (seedBoardIsInvalid) {
            const solution = Sudoku.getFullLatinSquare();
            board.clearBoard();
            const randomCoordsGenerator = randomCoordinatesGenerator();
            for (let k = 0; k < START_WITH_N_CELLS; k++) {
                const coords = randomCoordsGenerator.next();
                if (coords.done) {
                    if (IS_DEVELOPMENT) console.error('exhausted coords')
                    /**exhausted coordinates, impossible because {@link START_WITH_N_CELLS} < {@link BOARD_SIZE}*/
                    break;
                } else {
                    const [x, y] = coords.value;
                    board.setValue(x, y, getValueInFlatPuzzleByCoords(solution, x, y), true, false);
                }
            }
            if (!solverResultIsError(solve(board))) {
                seedBoardIsInvalid = false;
            } else if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
                console.error('invalid seed board')
                drawPuzzle(board, true);
            }
        }
        if (IS_DEVELOPMENT && LOG_LEVEL >= LOGLEVEL_VERBOSE) {
            logSuccess('accepted seed board, number of filled cells: ' + board.getNumberOfFilledCells())
        }
        while (board.getNumberOfFilledCells() > numberOfHints) {
            const success = clearCellFillableByHumanTechniques(board, setUsedTechnique);
            if (!success) {
                const achievedNumberOfHints = board.getNumberOfFilledCells();
                if (IS_DEVELOPMENT) {
                    console.log(`achieved ${achievedNumberOfHints} hints in ${tries + 1}st run`)
                }
                if (achievedNumberOfHints < minHintsSoFar) {
                    bestBoardSoFar = Sudoku.cloneWithoutHistory(board);
                    minHintsSoFar = achievedNumberOfHints;
                }
                break;
            }
        }
        if (bestBoardSoFar.getNumberOfFilledCells() <= numberOfHints) break;
        tries++;
    }
    if (IS_DEVELOPMENT) {
        console.assert(!solverResultIsError(solve(bestBoardSoFar)), 'Board is invalid.')
        console.assert(isSolvableUsingEasyTechniques(bestBoardSoFar), 'Board is not solvable using easy techniques');
        console.log(clearCellFillableByHumanTechniques(board))
    }
    return bestBoardSoFar;
}