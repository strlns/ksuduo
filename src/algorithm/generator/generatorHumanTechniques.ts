import {Sudoku} from "../../model/Sudoku";
import {BOARD_SIZE, MINIMUM_CLUES} from "../../model/Board";
import {pickRandomArrayIndex, pickRandomArrayValue} from "../../utility/pickRandom";
import {CellValue} from "../../model/CellData";
import {isTriviallySolvable} from "../transformations";
import {isCellFillableUsingHumanTechniques} from "../solver/solverHumanTechniques";
import {solve as solveBacktracking, solverErrorString} from "../solver/solver";
import drawPuzzle from "../../debug/drawPuzzleOnConsole";
import {shuffle} from "lodash-es";
import {SOLVER_FAILURE} from "../solver/solverBacktracking";
import {SOLVING_TECHNIQUE, solvingTechniqueName} from "../solver/humanTechniques";

export function generateTriviallySolvableBoard(): Sudoku {
    const board = new Sudoku();
    board.fillWithRandomCompleteSolution();
    const MAX_ITERATIONS = 32;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        let k = 0;
        while (isTriviallySolvable(board) && k < BOARD_SIZE) {
            const cellToClear = pickRandomArrayValue(board.getFilledCells());
            board.setValue(cellToClear.x, cellToClear.y, CellValue.EMPTY, false, false);
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
        const clearedCell = {...candidates[index], value: CellValue.EMPTY};
        board.setValueUseCell(clearedCell);
        candidates.splice(index, 1);
        if (isCellFillableUsingHumanTechniques(clearedCell, board, setUsedTechnique)) {
            // if (IS_DEVELOPMENT) {
            //     console.log(`Cleared cell ${clearedCell.x}/${clearedCell.y}`)
            // }
            return true;
        } else {
            // if (IS_DEVELOPMENT) console.log("undo")
            board.undo();
        }
    }
    return false;
}

export function generateBoardSolvableUsingEasyTechniques(
    numberOfHints: number, maxNumberOfBoardsToTry: number
): Sudoku {
    if (numberOfHints < MINIMUM_CLUES) throw new Error(`A valid Sudoku with < ${MINIMUM_CLUES} hints is impossible.`);
    const board = new Sudoku();
    let firstRun = true;
    let tries = 0;
    let lastUsed: SOLVING_TECHNIQUE;
    let bestBoardSoFar = board;
    let minHintsSoFar = BOARD_SIZE;
    const setUsedTechnique = (tech: SOLVING_TECHNIQUE) => {
        lastUsed = tech
    };
    let techs = [];
    while (firstRun || tries < maxNumberOfBoardsToTry) {
        firstRun = false;
        // if (IS_DEVELOPMENT) {
        //     board.initWithNumbers('387256419451379268629841357175693824263487591948512736894125673732968145516734982'.split('').map(s => +s), true)
        techs = [];
        // }
        // else {
        board.fillWithRandomCompleteSolution();
        // }
        while (board.getNumberOfFilledCells() > numberOfHints) {
            const success = clearCellFillableByHumanTechniques(board, setUsedTechnique);
            if (!success) {
                if (board.getNumberOfFilledCells() < minHintsSoFar) {
                    bestBoardSoFar = Sudoku.cloneWithoutHistory(board);
                    minHintsSoFar = bestBoardSoFar.getNumberOfFilledCells();
                }
                break;
            } else {
                if (IS_DEVELOPMENT) {
                    //@ts-ignore
                    techs.push(`Cell was fillable using ${solvingTechniqueName(lastUsed)}`)
                }
                if (solveBacktracking(board) === SOLVER_FAILURE.MULTIPLE_SOLUTIONS) {
                    if (IS_DEVELOPMENT) {
                        console.error('At this point, multiple solutions were introduced.')
                        drawPuzzle(board, true, false)
                        board.undo();
                        console.log(`Result before last removal: ${solverErrorString(solveBacktracking(board))}`)
                        //@ts-ignore
                        console.log(`Technique to blame: ${lastUsed}`)
                        break;
                    }
                }
            }
        }
        if (IS_DEVELOPMENT) {
            console.log(techs)
        }
        if (board.getNumberOfFilledCells() === numberOfHints) break;
        tries++;
    }
    return board;
}