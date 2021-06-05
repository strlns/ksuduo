import {Puzzle, Sudoku} from "../../model/Sudoku";
import {addPossibleValuesToCellDataArray, puzzleToSudoku} from "./transformations";
import {getCellWithMinPossAndValueFromSolution, Solution, SolverResult} from "./solver";
import {SOLVER_FAILURE} from "./solverBacktracking";
import drawPuzzle from "../../debug/drawPuzzleOnConsole";
import {
    CellWithNewValue,
    getCellAndValueByBlock,
    getCellAndValueByCol,
    getCellAndValueByRow,
    SOLVING_TECHNIQUE
} from "./humanTechniques";
import {shuffle} from "lodash-es";

/*
  Find a cell to fill using easy techniques that humans also use.
  As a last resort, the value for the cell with the least possible values
  may still be pulled from the (known) solution.

  Next @todo: Add indirect row/col-scanning techniques:
  E.g. when all possible places for a value inside a block are in one column,
  the possible value can discarded in the whole column.

  After that, maybe even add more advanced human-like techniques.
  End-goal: None-backtracking solver for use in generator
 */

export function getNextCellToFill(
    board: Sudoku,
    allowCheatingGuess = false,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void,
    preferTechnique = SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW
): CellWithNewValue | undefined {
    const cellsWithP = addPossibleValuesToCellDataArray(board.getFlatCells(), board);
    const humanTechFns = shuffle([getCellAndValueByRow, getCellAndValueByCol, getCellAndValueByBlock]);
    if (preferTechnique !== undefined) {
        switch (preferTechnique) {
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW: {
                const index = humanTechFns.indexOf(getCellAndValueByRow);
                [humanTechFns[index], humanTechFns[0]] = [humanTechFns[0], humanTechFns[index]]
                break;
            }
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL: {
                const index = humanTechFns.indexOf(getCellAndValueByCol);
                [humanTechFns[index], humanTechFns[0]] = [humanTechFns[0], humanTechFns[index]]
                break;
            }
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK: {
                const index = humanTechFns.indexOf(getCellAndValueByBlock);
                [humanTechFns[index], humanTechFns[0]] = [humanTechFns[0], humanTechFns[index]]
                break;
            }
        }
    }
    for (const fn of humanTechFns) {
        const cellResult = fn.call(null, board, setUsedTechnique, cellsWithP);
        if (cellResult) return cellResult;
    }
    if (allowCheatingGuess) {
        return getCellWithMinPossAndValueFromSolution(board, setUsedTechnique, cellsWithP);
    }
}


export function isSolvableUsingEasyTechniques(board: Sudoku): boolean {
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    while (fillCellUsingHumanTechniques(clonedBoard)) {
    }
    return clonedBoard.isSolved();
}

/*
 * Does not check for multiple solutions!
 */
export default function solve(puzzle: Puzzle): SolverResult {
    const board = puzzleToSudoku(puzzle);
    //if passed puzzle was a Sudoku instance, we don't want to modify it
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    let numFilled = 0;
    let devConsoleSpamPrvt = 0;
    if (IS_DEVELOPMENT) {
        console.log("The puzzle")
        drawPuzzle(board, false);
    }
    while (fillCellUsingHumanTechniques(clonedBoard)) {
        const numFilledNew = clonedBoard.getNumberOfFilledCells()
        if (numFilledNew > numFilled) {
            numFilled = numFilledNew
        } else {
            devConsoleSpamPrvt++
            if (devConsoleSpamPrvt > 4) {
                console.log("Stuck at:")
                drawPuzzle(clonedBoard, false)
                break;
            }
        }
    }
    if (IS_DEVELOPMENT) {
        console.log("The partial solution")
        drawPuzzle(clonedBoard, false);
    }
    return clonedBoard.isSolved() ?
        clonedBoard.getFlatValues() as Solution :
        SOLVER_FAILURE.NO_SOLUTION_FOUND;
}

export function fillCellUsingHumanTechniques(board: Sudoku, preferTechnique?: SOLVING_TECHNIQUE): boolean {
    let technique;
    const cellWithVal = getNextCellToFill(
        board,
        false,
        tech => {
            technique = tech
        },
        preferTechnique
    )
    let success = false
    if (cellWithVal) {
        board.setValue(cellWithVal[0].x, cellWithVal[0].y, cellWithVal[1], false, false)
        success = true
    }
    return success
}