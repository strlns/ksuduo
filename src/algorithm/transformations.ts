import {Sudoku} from "../model/Sudoku";
import {addPossibleValuesToCellDataArray} from "./solver/transformations";
import {CellDataWithPossibilites} from "../model/CellData";
import {candidatesSortedDescByPossibilities} from "./cellPicker/cellPicker";

/**
 * Board is trivially solvable iff
 *
 * a) less than 3 empty cells OR
 *  b1) all remaining empty cells have at most 2 possible values
 *    AND
 *  b2) there is no pair of 2 cells with 2 possible values each where both
 *      cells belong to the same row, column or block AND share at least one possible value.
 */
export const isTriviallySolvable = (board: Sudoku): boolean => {
    const clonedBoard = Sudoku.cloneWithoutHistory(board);
    clonedBoard.fillSinglePossibilityCells();
    const emptyCells = clonedBoard.getEmptyCells();
    let res = true;
    /*a) fall through if board has less than 3 empty cells*/
    if (emptyCells.length > 2) {
        const candidates = addPossibleValuesToCellDataArray(emptyCells, clonedBoard);
        /* b1) all remaining empty cells have at most 2 possible values */
        if (candidates.some(
            cell => cell.possibleValues.length > 2
        )) {
            /*b2) no non-trivial possibility pairs*/
            res = !hasNonTrivialPossibilityPairs(candidates)
        }
    }
    return res;
}

function hasNonTrivialPossibilityPairs(candidates: CellDataWithPossibilites[]): boolean {
    const candidatesWithMoreThanOnePossibility = candidatesSortedDescByPossibilities(
        candidates.filter(
            cell => cell.possibleValues.length > 1
        ));
    /*
      there is no pair of 2 cells with 2 possible values each where both
      cells belong to the same row, column or block AND share at least one possible value.
    */
    let res = false;
    for (const cell of candidatesWithMoreThanOnePossibility) {
        const otherCell = candidatesWithMoreThanOnePossibility.find(
            otherCell => otherCell !== cell && (
                //same block, col or row
                otherCell.x === cell.x ||
                otherCell.y === cell.y ||
                otherCell.blockIndex === cell.blockIndex
            ) && (
                //share at least 1 possible value
                otherCell.possibleValues.some(
                    otherPossibleValue => cell.possibleValues.includes(otherPossibleValue)
                )
            )
        );
        if (otherCell) {
            res = true;
            break;
        }
    }
    return res;
}