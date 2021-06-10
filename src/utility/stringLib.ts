// noinspection JSUnusedGlobalSymbols

import {CellData, CellValue} from "../model/CellData";

export const substrCount = (str: string, substr: string): number => {
    let res = -1;
    let slice = str;
    let index;
    // noinspection JSUnusedAssignment
    while (index !== -1) {
        index = slice.indexOf(substr);
        slice = slice.slice(index + substr.length);
        res++;
    }
    return res;
}

export const rightPad = (str: string, len: number): string => {
    if (str.length > len) {
        return str;
    }
    return str.concat(Array(len - str.length).fill(' ').join(''));
}

export const formatCell = (cell: CellData, newValue?: CellValue): string => rightPad(
    `(${cell.x}|${cell.y}): ${newValue ?? cell.value}`, 16
)