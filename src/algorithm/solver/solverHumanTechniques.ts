import {Puzzle, Sudoku} from "../../model/Sudoku";
import {CellData, CellDataWithPossibilites, cellIsEmpty, CellValue} from "../../model/CellData";
import {getCellWithMinimumPossibilites} from "../../cellPicker/cellPicker";
import {
    addPossibleValuesToCellDataArray,
    getCountOfPossibleValues,
    PossibilityCountHash,
    puzzleToSudoku
} from "./transformations";
import {Solution, SolverResult, SOLVING_TECHNIQUE} from "./solver";
import {SOLVER_FAILURE} from "./solverBacktracking";
import drawPuzzle from "../../debug/drawPuzzleOnConsole";
import {BOARD_SIZE} from "../../model/Board";

export type CellWithNewValue = [CellData, CellValue];

export function getCellWithPossibleValueUniqueInRow(board: Sudoku, possibilities?: CellDataWithPossibilites[]): CellWithNewValue | undefined {
    //we need the index anyway, so there s no point in using for..of
    for (let rowIndex = 0, length = board.getRows().length; rowIndex < length; rowIndex++) {
        const row = board.getRows()[rowIndex];
        const cellsWithP = possibilities ? possibilities.filter(cell => cellIsEmpty(cell) && rowIndex === cell.y) :
            addPossibleValuesToCellDataArray(row, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithPossibleValueUniqueInCol(board: Sudoku): CellWithNewValue | undefined {
    for (const col of board.getColumns()) {
        const cellsWithP = addPossibleValuesToCellDataArray(col, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue !== undefined) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithPossibleValueUniqueInBlock(board: Sudoku): CellWithNewValue | undefined {
    for (const block of board.getBlocks()) {
        const cellsWithP = addPossibleValuesToCellDataArray(block.cells, board, true);
        const cellWithUniqueValue = getCellWithUniquePossibleValue(cellsWithP);
        if (cellWithUniqueValue) {
            return cellWithUniqueValue;
        }
    }
}

export function getCellWithUniquePossibleValue(cellsWithP: CellDataWithPossibilites[], possibilitiesCount?: PossibilityCountHash): CellWithNewValue | undefined {
    const possibilities = possibilitiesCount ?? getCountOfPossibleValues(cellsWithP);
    const entriesOccurringOneTime = Object.entries(possibilities).filter(
        entry => entry[1] === 1
    );
    const valueAsString = entriesOccurringOneTime.length > 0 ? entriesOccurringOneTime[0][0] : undefined;
    if (valueAsString !== undefined) {
        const value = +valueAsString as CellValue;
        const cell = cellsWithP.find(cell => cell.possibleValues.includes(value));
        if (cell === undefined) {
            throw new Error();
        }
        return [cell, value];
    }
}

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
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): CellWithNewValue | undefined {
    return (
        getEasyToFillCellByRow(board, setUsedTechnique) ||
        getEasyToFillCellByCol(board, setUsedTechnique) ||
        getEasyToFillCellByBlock(board, setUsedTechnique) ||
        getCellToFillByMinimumPossibilities(board, setUsedTechnique)
    )
}

function getEasyToFillCellByRow(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithPossibleValueUniqueInRow(board)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW)
        return cellWithVal;
    }
}

function getEasyToFillCellByCol(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithPossibleValueUniqueInCol(board)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL)
        return cellWithVal;
    }
}

function getEasyToFillCellByBlock(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): CellWithNewValue | undefined {
    let cellWithVal = getCellWithPossibleValueUniqueInBlock(board)
    if (cellWithVal) {
        setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK)
        return cellWithVal;
    }
}

export function getCellToFillByMinimumPossibilities(
    board: Sudoku,
    setUsedTechnique?: (technique: SOLVING_TECHNIQUE) => void
): CellWithNewValue | undefined {
    const emptyCells = board.getEmptyCells();
    if (emptyCells.length < 1) {
        const invalidCells = board.getFilledCells().filter(cell => !cell.isValid);
        if (invalidCells.length > 0) {
            if (IS_DEVELOPMENT) {
                console.error('reset an invalid cell while looking for cell with min. poss. in a filled board.')
            }
            board.setValueUseCell({...invalidCells[0], value: CellValue.EMPTY});
        } else {
            //board is solved, what do you expect
            throw new Error();
        }
    }
    const cellToFill = getCellWithMinimumPossibilites(
        addPossibleValuesToCellDataArray(
            emptyCells, board
        )
    )[0];
    setUsedTechnique && setUsedTechnique(SOLVING_TECHNIQUE.MINPOSS_FROM_SOLUTION)
    return [cellToFill, board.getValueFromSolution(cellToFill.x, cellToFill.y)]
}


export function isSolvableUsingEasyTechniques(board: Sudoku): boolean {
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    while (fillCellUsingHumanTechniques(clonedBoard)) {
    }
    if (IS_DEVELOPMENT) {
        const numberOfFilledCells = clonedBoard.getNumberOfFilledCells();
        const numberOfHints = clonedBoard.getNumberOfHints();
        console.log(`${numberOfFilledCells - numberOfHints} cells filled by solver, 
        ${numberOfHints} were given. Total filled : ${numberOfFilledCells} / ${BOARD_SIZE}`)
    }
    return clonedBoard.isSolved();
}

/*
 * Does not check for multiple solutions!
 */
export default function solve(puzzle: Puzzle): SolverResult {
    const board = puzzleToSudoku(puzzle);
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    while (fillCellUsingHumanTechniques(clonedBoard)) {
    }
    if (IS_DEVELOPMENT) {
        drawPuzzle(board, false);
        drawPuzzle(clonedBoard, false);
    }
    return clonedBoard.isSolved() ?
        clonedBoard.getFlatValues() as Solution :
        SOLVER_FAILURE.NO_SOLUTION_FOUND;
}

export function fillCellUsingHumanTechniques(board: Sudoku): boolean {
    const cellWithVal = getNextCellToFill(board)
    let success = false
    if (cellWithVal) {
        board.setValue(cellWithVal[0].x, cellWithVal[0].y, cellWithVal[1], false, false);
        success = true;
    }
    return success;
}