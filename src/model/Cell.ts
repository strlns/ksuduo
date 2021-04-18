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

const CellValueEnumAsArray = Object.values(CellValue);
const numOfPossibleCellValues = CellValueEnumAsArray.length / 2;

export const CellValues: CellValue[] = Object.entries(CellValue).slice(numOfPossibleCellValues).map(entry => entry[1]) as CellValue[];

export class Cell {
    public value: CellValue;
    public x: CellIndex;
    public y: CellIndex;
    constructor(value: CellValue, x: CellIndex, y: CellIndex) {
        this.value = value;
        this.x = x;
        this.y = y;
    }
}