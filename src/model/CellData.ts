import {CellIndex} from "./Sudoku";

export const EMPTY_CELL_VALUE: null = null;

export enum CellValue {
    EMPTY = 0,
    ONE = 1,
    TWO,
    THREE,
    FOUR,
    FIVE,
    SIX,
    SEVEN,
    EIGHT,
    NINE
}

/**
 * never again will I be so stupid to check
 * `if (excludeColumn)` expecting an index or false.
 * I am converted (ha ha). Never use type coercion in if statements
 * (except when checking for object/array existance)
 */
export const EXCLUDE_NOTHING = false;


const CellValueEnumAsArray = Object.values(CellValue);
const numOfPossibleCellValues = CellValueEnumAsArray.length / 2;

export const CellValues: CellValue[] = Object.entries(CellValue).slice(numOfPossibleCellValues).map(entry => entry[1]) as CellValue[];

export class CellData {
    public value: CellValue;
    public x: CellIndex;
    public y: CellIndex;
    public isInitial: boolean;
    public isValid: boolean;
    public isFirstEmptyCell: boolean;

    constructor(value: CellValue, x: CellIndex, y: CellIndex, isInitial = false) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.isInitial = isInitial;
        this.isValid = true
        this.isFirstEmptyCell = false;
    }
}