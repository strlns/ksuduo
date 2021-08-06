import {Puzzle, puzzleToSudoku, Sudoku} from "../../model/Sudoku";
import {getCellWithMinPossAndValueFromSolution, Solution, SolverResult} from "./solver";
import {SOLVER_FAILURE} from "./solverBacktracking";
import drawPuzzle from "../../debug/drawPuzzleOnConsole";
import {
    CellWithNewValue,
    eliminatePossibilitiesByIndirectRowColScanning,
    getCellAndValueByBlock,
    getCellAndValueByCol,
    getCellAndValueByIndirectBlockRowColScanning,
    getCellAndValueByRow,
    SOLVING_TECHNIQUE
} from "./humanTechniques";
import {cloneDeep, shuffle} from "lodash-es";
import {CellData, cellIsEmpty} from "../../model/CellData";
import {addPossibleValuesToCellDataArray} from "../transformations";
import {getCellsWithUniquePossibleValue} from "../cellPicker/getCellsWithUniquePossibleValue";

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
    preferTechnique?: SOLVING_TECHNIQUE
): CellWithNewValue | undefined {
    const cellsWithP = addPossibleValuesToCellDataArray(board.getFlatCells(), board);
    const humanTechFns = shuffle([getCellAndValueByRow, getCellAndValueByCol, getCellAndValueByBlock, getCellAndValueByIndirectBlockRowColScanning]);
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
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_INDIRECT: {
                const index = humanTechFns.indexOf(getCellAndValueByIndirectBlockRowColScanning);
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


// noinspection JSUnusedGlobalSymbols
export function isSolvableUsingEasyTechniques(board: Sudoku): boolean {
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    while (fillCellUsingHumanTechniques(clonedBoard)) {
    }
    return clonedBoard.isSolved();
}

export function isCellFillableUsingHumanTechniques(
    cellToFill: CellData,
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): boolean {
    const cellsWithP = addPossibleValuesToCellDataArray(board.getFlatCells(), board);
    const isCoordsEqual = (cellWithVal: CellWithNewValue, cellToFill: CellData) =>
        cellWithVal[0].x === cellToFill.x && cellWithVal[0].y === cellToFill.y;

    const isFillableBecauseRow = () => {
        return getCellsWithUniquePossibleValue(
            cellsWithP.filter(cell => cellIsEmpty(cell) && cell.y === cellToFill.y)
        ).some(cellWithVal => isCoordsEqual(cellWithVal, cellToFill));
    }

    const isFillableBecauseCol = () => {
        return getCellsWithUniquePossibleValue(
            cellsWithP.filter(cell => cell.x === cellToFill.x)
        ).some(cellWithVal => isCoordsEqual(cellWithVal, cellToFill));
    }

    const isFillableBecauseBlock = () => {
        return getCellsWithUniquePossibleValue(
            cellsWithP.filter(cell => cell.blockIndex === cellToFill.blockIndex)
        ).some(cellWithVal => isCoordsEqual(cellWithVal, cellToFill));
    }

    const isFillableBecauseBlockIndirect = () => {
        const cellsWithPClean = cloneDeep(cellsWithP);
        eliminatePossibilitiesByIndirectRowColScanning(board, cellsWithPClean)
        return getCellsWithUniquePossibleValue(
            cellsWithPClean.filter(cell => cell.blockIndex === cellToFill.blockIndex)
        ).some(cellWithVal => isCoordsEqual(cellWithVal, cellToFill));
    }

    type CurriedPredicateAndSolvingTechnique = [() => boolean, SOLVING_TECHNIQUE];

    const techniques: CurriedPredicateAndSolvingTechnique[] = shuffle(
        [
            [isFillableBecauseRow, SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW],
            [isFillableBecauseCol, SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL],
            [isFillableBecauseBlock, SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK],
            [isFillableBecauseBlockIndirect, SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_INDIRECT],
        ]
    );
    let res = false;
    for (const tech of techniques) {
        if (tech[0].call(null)) {
            setUsedTechnique && setUsedTechnique(tech[1]);
            res = true;
            break;
        }
    }
    return res;
}

/*
 * Does not check for multiple solutions!
 */
export default function solve(puzzle: Puzzle, returnPartialSolution = false): SolverResult {
    const board = puzzleToSudoku(puzzle);
    //if passed puzzle was a Sudoku instance, we don't want to modify it
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    let numFilled = 0;
    while (fillCellUsingHumanTechniques(clonedBoard)) {
        const numFilledNew = clonedBoard.getNumberOfFilledCells()
        if (numFilledNew > numFilled) {
            numFilled = numFilledNew
        } else {
            /** This would indicate a bug in the return value of {@link fillCellUsingHumanTechniques}! */
            if (IS_DEVELOPMENT) {
                console.error('Stuck at:')
                drawPuzzle(clonedBoard, true, false)
            }
            break;
        }
    }
    return clonedBoard.isSolved() || returnPartialSolution ?
        clonedBoard.getFlatValues() as Solution :
        SOLVER_FAILURE.NO_SOLUTION_FOUND;
}

export function fillCellUsingHumanTechniques(
    board: Sudoku,
    preferTechnique?: SOLVING_TECHNIQUE
): boolean {
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
    } else if (IS_DEVELOPMENT && !board.isSolved()) {
        console.error('Could not find a cell to fill')
        drawPuzzle(board, true, false)
    }
    return success
}