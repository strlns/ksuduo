import {Sudoku} from "../../model/Sudoku";
import {BOARD_SIZE, MINIMUM_CLUES} from "../../model/Board";
import {pickRandomArrayIndex, pickRandomArrayValue} from "../../utility/pickRandom";
import {CellData, cellIsEmpty} from "../../model/CellData";
import {isTriviallySolvable} from "../transformations";
import {isCellFillableUsingHumanTechniques, isSolvableUsingEasyTechniques} from "../solver/solverHumanTechniques";
import {solve, solverResultIsError} from "../solver/solver";
import drawPuzzle from "../../debug/drawPuzzleOnConsole";
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

/**

 * @param board the board.
 * @param cellToClear the cell to clear.
 * @param setUsedTechnique callback to set the "human solving technique" that the cleared cell can be filled with at the current board state
 * @return success
 */
function clearCellIfFillableByHumanTechniques(
    board: Sudoku,
    cellToClear: CellData,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): boolean {
    const clearedCell = board.clearCell(cellToClear);
    console.log(board.getCell(clearedCell.x, clearedCell.y))
    if (
        //no empty blocks, and fillable using human technique after removal
        !board.getCellsInBlock(clearedCell).every(cell => cellIsEmpty(cell)) &&
        isCellFillableUsingHumanTechniques(clearedCell, board, setUsedTechnique)
    ) {
        return true;
    } else {
        // if (IS_DEVELOPMENT) {
        // console.log("UNDO");
        // console.log(`cell to clear before: x:${cellToClear.x}|y:${cellToClear.y}, val: ${cellToClear.value}`)
        // }
        board.undo();
        // if (IS_DEVELOPMENT) {
        //     console.log(`cell to clear after: x:${cellToClear.x}|y:${cellToClear.y}, val: ${cellToClear.value}`)
        // }
        return false;
    }
}


/**
 * See this paper: https://sites.math.washington.edu/~morrow/mcm/team2280.pdf
 *
 * This algo is a piece of trash in comparison, but re-uses some ideas from there
 */
const START_WITH_N_CELLS = 40;

export function generateBoardSolvableUsingEasyTechniques(
    numberOfHints: number, maxNumberOfBoardsToTry: number
): Sudoku {
    if (numberOfHints < MINIMUM_CLUES) throw new Error(`A valid Sudoku with < ${MINIMUM_CLUES} hints is impossible.`);
    const board = new Sudoku();
    let firstRun = true;
    let tries = 0;
    let lastUsed: SOLVING_TECHNIQUE | undefined = undefined;
    // let lastIndex: number | undefined = undefined;
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
        if (IS_DEVELOPMENT) {
            logSuccess('accepted seed board, number of filled cells: ' + board.getNumberOfFilledCells())
        }
        const candidates = board.getFilledCells();

        // noinspection JSMismatchedCollectionQueryUpdate
        /**
         * Currently we cannot really do anything useful with {@link retryCandidates}.
         * Read paper more thouroughly, maybe we can achieve fewer hints.
         *
         */
        const retryCandidates: CellData[] = [];

        let achievedHints = board.getNumberOfFilledCells();
        while (achievedHints > numberOfHints && candidates.length) {
            const indexOfCellToClearInCandidates = pickRandomArrayIndex(candidates);
            const cellToClear = candidates[indexOfCellToClearInCandidates];
            const success = clearCellIfFillableByHumanTechniques(board, cellToClear, setUsedTechnique);
            candidates.splice(indexOfCellToClearInCandidates, 1);
            if (success) {
                achievedHints--;
            } else {
                retryCandidates.push(cellToClear);
            }
        }

        if (IS_DEVELOPMENT) {
            console.log(`achieved ${achievedHints} hints in ${tries + 1}st run`)
        }

        if (board.getNumberOfFilledCells() <= numberOfHints) {
            bestBoardSoFar = board;
            break;
        } else if (achievedHints < minHintsSoFar) {
            bestBoardSoFar = board;
            minHintsSoFar = achievedHints;
        }
        tries++;
    }
    if (IS_DEVELOPMENT) {
        console.assert(!solverResultIsError(solve(bestBoardSoFar)), 'Board is invalid.')
        console.assert(isSolvableUsingEasyTechniques(bestBoardSoFar), 'Board is not solvable using easy techniques');
    }
    return Sudoku.cloneWithoutHistory(bestBoardSoFar);
}