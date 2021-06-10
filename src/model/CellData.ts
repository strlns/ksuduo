import {CellIndex} from "./Board";
import {BlockIndex} from "./BlockData";

// noinspection JSUnusedGlobalSymbols
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
 * This is used to express that no row or column shall be excluded
 * in methods that provide a parameter to exclude some row/col.
 */
export const EXCLUDE_NOTHING = false;

const CellValueEnumAsArray = Object.values(CellValue);

export const NUM_POSSIBLE_VALUES = CellValueEnumAsArray.length / 2;

export const CellValues: CellValue[] = Object.entries(CellValue).slice(NUM_POSSIBLE_VALUES).map(entry => entry[1]) as CellValue[];

export const NonEmptyCellValues: CellValue[] = CellValues.filter(val => val !== CellValue.EMPTY);

export const cellIsEmpty = (cell: CellData): boolean => cell.value === CellValue.EMPTY;

export type CellData = {
    value: CellValue,
    x: CellIndex,
    y: CellIndex,
    isInitial: boolean,
    isValid: boolean,
    blockIndex: BlockIndex
}
export type CellDataWithPossibilites = CellData & {
    possibleValues: CellValue[]
}

// noinspection JSUnusedGlobalSymbols
export const countFilledCells = (cells: CellData[]): number =>
    cells.reduce((prev, curr) => prev + (cellIsEmpty(curr) ? 1 : 0), 0);

export const isEmptyAndNonInitial = (cell: CellData) => cellIsEmpty(cell) && !cell.isInitial;