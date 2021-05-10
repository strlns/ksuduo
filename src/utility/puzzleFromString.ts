import {CellValue} from "../model/CellData";

export const puzzleFromString = (str: string, emptyCellSymbol = '0'): CellValue[] => str.split('').map(
    (val) => val === emptyCellSymbol ? CellValue.EMPTY : +val as CellValue);