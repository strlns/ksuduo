import {CellData, cellIsEmpty, CellValue, CellValues, EXCLUDE_NOTHING} from "./CellData";
import {BlockData} from "./BlockData";
import arrayChunk from "../utility/arrayChunk";
import {cloneDeep} from "lodash-es";
import pickRandomArrayValue from "../utility/pickRandom";
import assert from "../utility/assert";
import {Solution, solve} from "../solver/solver";

export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

//All possible cell indices on x- or y-axis, meaning [0,1,...,8]
export const CELL_INDICES =
    Array(9).fill(0).map((v, i) => i as CellIndex);

export const BOARD_WIDTH = CELL_INDICES.length;
export const BOARD_SIZE = Math.pow(BOARD_WIDTH, 2);
export const BLOCK_WIDTH = 3;

export const flatIndexToCoords = (index: number): [CellIndex, CellIndex] => {
    const x = index % BOARD_WIDTH as CellIndex;
    const y = Math.floor(index / BOARD_WIDTH) as CellIndex;
    return [x, y];
}

export const coordsToFlatIndex = (x: CellIndex, y: CellIndex): number => {
    return y * BOARD_WIDTH + x;
}

export class CouldNotSolveSudokuPassedToConstructorError extends Error {

}

/**
 * We rely on the structured clone algorithm to result in this type when serializing a
 * {@link Sudoku} instance.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 */
export class SudokuStructuredClone {
    rows: CellData[][];
    solution: Solution;
    history: CellData[][];
}

export class Sudoku {
    /**
     * main source of truth.
     * @private
     */
    private readonly rows: CellData[][];

    /**
     * history stored as array of flat board states (2nd dimension contains Array(81)<CellData>).
     * history is only filled for user input and hints and cleared on reset.
     */
    public history: CellData[][];

    private solution: Solution = [];

    constructor(structuredCloneInializer?: SudokuStructuredClone) {
        if (structuredCloneInializer) {
            this.rows = structuredCloneInializer.rows;
            this.solution = structuredCloneInializer.solution;
            this.history = structuredCloneInializer.history;
        } else {
            this.rows = [];
            this.history = [];
            this.initializeEmptyBoard();
        }
    }

    public setSolution(solution: Solution) {
        this.solution = solution;
    }

    public getSolution(): Solution {
        return this.solution;
    }

    public clearHistory(): void {
        this.history.length = 0;
    }

    public isHistoryEmpty(): boolean {
        return this.history.length === 0;
    }

    public showSolution(): void {

        for (let solutionData of this.getSolution().map(
            (val, index) =>
                ({
                    cell: this.getCell(...flatIndexToCoords(index)),
                    val
                })
        ).filter(data => !data.cell.isInitial)) {
            this.setValue(solutionData.cell.x, solutionData.cell.y, solutionData.val, false);
        }
    }

    public getValueFromSolution(x: CellIndex, y: CellIndex): CellValue | undefined {
        if (this.solution !== undefined) {
            return this.solution[coordsToFlatIndex(x, y)];
        }
    }

    public initWithNumbers(values: number[]) {
        values.forEach((value, index) => {
            const [x, y] = flatIndexToCoords(index);
            const cell = this.getCell(x, y);
            cell.value = value;
            if (value as CellValue !== CellValue.EMPTY) {
                cell.isInitial = true;
            }
        });
        try {
            this.solution = solve(values);
        } catch (e) {
            throw e;
        }

    }

    public initWithFlatCellData(cells: CellData[]) {
        cells.forEach((cell) => {
            this.setCell(cell, false);
        });
    }

    public undo() {
        assert(this.history.length > 0, 'Cannot undo, history empty.');
        const values = this.history.pop();
        // cast needed because TypeScript doesn't understand my custom assert()
        // (which guarantees the result of pop() cannot be undefined)
        this.initWithFlatCellData(values as CellData[]);
    }

    /**
     * Previously, I did this with a dedicated variable keeping track of the filled cells.
     * But this "functional" approach is way less error-prone.
     * The many array iterations are not optimized -
     * in practise it does not impact performance at all here. Array chaining methods FTW!
     */
    public getNumberOfFilledCells(): number {
        return this.getFilledCells().length;
    }

    public getFilledCells(): CellData[] {
        return this.getFlatCells().filter(cell => cell.value !== CellValue.EMPTY);
    }

    /**
     * Add a cell. The cell object contains its coordinates, if another Cell
     * with the same coordinates is present, it is replaced
     * @param cell
     * @private
     */
    private addCell(cell: CellData) {
        this.rows[cell.y][cell.x] = cell;
    }

    public initializeEmptyBoard() {
        for (let y = 0; y < BOARD_WIDTH; y++) {
            this.rows[y] = Array(BOARD_WIDTH).fill(null);
            for (let x = 0; x < this.rows[y].length; x++) {
                this.addCell(
                    {
                        value: CellValue.EMPTY,
                        x: x as CellIndex,
                        y: y as CellIndex,
                        isInitial: true,
                        isValid: true
                    } as CellData
                );
            }
        }
    }

    public fillWithRandomCompleteSolution() {
        let itsUnsolvable = false;
        this.rows.forEach((row, y) => {
            if (itsUnsolvable) {
                return;
            }
            for (let x = 0; x < row.length; x++) {
                const val = this.getAllowedCellValue(x as CellIndex, y as CellIndex);
                if (val === CellValue.EMPTY) {
                    itsUnsolvable = true;
                    break;
                } else {
                    this.setValue(x as CellIndex, y as CellIndex, val, true);
                }
            }
        });
        if (itsUnsolvable) {
            this.initializeEmptyBoard();
            this.fillWithRandomCompleteSolution();
        }
    }

    public getCell(x: CellIndex, y: CellIndex) {
        return this.rows[y][x];
    }

    /**
     * set a new cell value by coordinates.
     * The previous cell object is replaced to trigger a re-render.
     * @param x column index
     * @param y row index
     * @param value cell value
     * @param fixed if the cell was part of the initial puzzle
     * @param useHistory if the operation should be saved to history
     */
    public setValue(x: CellIndex, y: CellIndex, value: CellValue, fixed = false, useHistory = true) {
        if (useHistory) {
            this.history.push(this.getFlatCells().slice());
        }
        const cell = this.rows[y][x];
        const newCell = cloneDeep(cell);
        newCell.isInitial = fixed;
        newCell.value = value;
        this.rows[y][x] = newCell;
    }

    public setCell(cell: CellData, useHistory = true): void {
        this.setValue(cell.x, cell.y, cell.value, cell.isInitial, useHistory);
    }

    public getRows(): readonly CellData[][] {
        return Object.freeze(this.rows);
    }

    public getFlatValues(): readonly CellValue[] {
        return this.rows.reduce((prev, curr) => {
            return prev.concat(curr);
        }, []).map(cellData => cellData.value);
    }

    public getFlatCells(): readonly CellData[] {
        return this.rows.reduce((prev, curr) => {
            return prev.concat(curr);
        }, []);
    }

    public getBlocks(): BlockData[] {
        const blocks: BlockData[] = [];
        const numberOfBlocks = BOARD_SIZE / Math.pow(BLOCK_WIDTH, 2); //This must result in an int (field is a square).
        for (let i = 0; i < numberOfBlocks; i++) {
            blocks.push(new BlockData(i));
        }
        for (let i = 0; i < this.rows.length; i++) {
            const chunks: CellData[][] = arrayChunk(this.rows[i], BLOCK_WIDTH);
            chunks.forEach((chunk, chunkIndex) => {
                const blockIndexForChunk = Math.floor(i / BLOCK_WIDTH) * BLOCK_WIDTH + chunkIndex;
                const block = blocks[blockIndexForChunk];
                block.cells.push(...chunk);
                block.leftTopX = chunkIndex * BLOCK_WIDTH as CellIndex;
                block.leftTopY = (Math.floor(i / BLOCK_WIDTH) * BLOCK_WIDTH) as CellIndex;
            });
        }
        return blocks;
    }

    /**
     * To do: cache this. (??? or maybe not. )
     */
    public getColumn(): readonly CellData[][] {
        if (this.rows !== undefined) {
            return Object.keys(this.rows[0]).map(
                colIndex => {
                    return Object.keys(this.rows)
                        .map(
                            rowIndex => this.rows[Number(rowIndex) as CellIndex]
                                [Number(colIndex) as CellIndex]
                        )
                }
            )
        }
        return [];
    }

    public isEmpty(): boolean {
        return this.getEmptyCells().length === BOARD_SIZE;
    }

    // noinspection JSUnusedLocalSymbols
    /**
     *
     * @param x
     * @param y
     * @private
     * @deprecated
     */
    private getValue(x: CellIndex, y: CellIndex): CellValue {
        return this.rows[y][x].value;
    }

    public getRow(y: CellIndex): CellData[] {
        return this.rows[y];
    }

    public getRowValues(y: CellIndex, excludeCol: CellIndex | false = EXCLUDE_NOTHING): CellValue[] {
        if (excludeCol !== EXCLUDE_NOTHING) {
            return this.getRow(y)
                .filter((v, i) => i as CellIndex !== excludeCol)
                .map(cell => cell.value);

        }
        return this.getRow(y).map(cell => cell.value);
    }

    public getColumnValues(x: CellIndex, excludeRow: CellIndex | false = EXCLUDE_NOTHING): CellValue[] {
        if (excludeRow !== false) {
            return Object.keys(this.rows)
                .filter(i => Number(i) as CellIndex !== excludeRow)
                .map(
                    rowIndex => this.rows[+rowIndex as CellIndex][x].value
                )
        }
        return Object.keys(this.rows)
            .map(
                rowIndex => this.rows[+rowIndex as CellIndex][x].value
            )
    }

    public getEmptyCells(): CellData[] {
        return this.getFlatCells().filter(cell => cellIsEmpty(cell));
    }

    public getRandomEmptyOrInvalidCell(): CellData {
        assert(!this.isSolved(), "Sudoku is already completed, there are no empty cells");
        const res = pickRandomArrayValue(this.getEmptyCells()) ||
            this.getFlatCells().find(cell => !cell.isValid);
        if (!res) {
            throw new Error("Oops, no invalid cells, no empty cells and not solved??")
        }
        return res;
    }

    public getAllowedCellValue(x: CellIndex, y: CellIndex): CellValue {
        return pickRandomArrayValue(this.getAllowedCellValuesByCoords(x, y)) || CellValue.EMPTY;
    }

    public getAllowedCellValues(cell: CellData): CellValue[] {
        return this.getAllowedCellValuesByCoords(cell.x, cell.y);
    }

    public getAllowedCellValuesByCoords(x: CellIndex, y: CellIndex): CellValue[] {
        return CellValues.filter(
            value => !(
                value === CellValue.EMPTY ||
                this.getRowValues(y).includes(value) ||
                this.getColumnValues(x).includes(value)
                || this.getFlatBlockValuesForCoords(x, y).includes(value)
            )
        );
    }

    // noinspection JSUnusedLocalSymbols
    private getFlatBlockValuesForCell(cell: CellData) {
        return this.getFlatBlockValuesForCoords(cell.x, cell.y);
    }

    private getFlatBlockValuesForCoords(cellX: CellIndex, cellY: CellIndex, excludeSelf = false): CellValue[] {
        //find top left block corner
        let x0 = cellX;
        let y0 = cellY;
        while (x0 % 3 !== 0) {
            x0--;
        }
        while (y0 % 3 !== 0) {
            y0--;
        }
        //add 9 values
        const res: CellValue[] = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const x = (x0 + j) as CellIndex;
                const y = (y0 + i) as CellIndex;
                if (excludeSelf && y === cellY && x === cellX) {
                    continue;
                }
                try {
                    res.push(this.rows[y][x].value);
                } catch {
                    debugger;
                }

            }
        }
        return res;
    }

    public permutate() {

    }

    private isCellValueValid(cellValue: CellValue, x: CellIndex, y: CellIndex) {
        return cellValue === CellValue.EMPTY ||
            !(this.getRowValues(y, x).includes(cellValue) ||
                this.getColumnValues(x, y).includes(cellValue)
                || this.getFlatBlockValuesForCoords(x, y, true).includes(cellValue)
            );
    }

    public isCellValid(cell: CellData): boolean {
        return cellIsEmpty(cell) || this.isCellValueValid(cell.value, cell.x, cell.y);
    }

    public isSolved(): boolean {
        return this.getFlatCells().every(
            cell => cell.value !== CellValue.EMPTY && this.isCellValid(cell)
        );
    }

    public getInitialFocusCell(): CellData {
        let cell;
        let x = 0 as CellIndex, y = 0 as CellIndex;
        cell = this.getCell(x, y);
        while (!cellIsEmpty(cell) && y < BOARD_WIDTH - 1) {
            if (x > BOARD_WIDTH - 1) {
                x = 0;
                y++;
            }
            assert(x < BOARD_WIDTH && y < BOARD_WIDTH, `${x} is not a valid row index and / or ${y} is not a valid col index`);
            cell = this.getCell(x as CellIndex, y as CellIndex);
            x++;
        }
        // assert(cellIsEmpty(cell), 'No empty cell found.');
        if (!cellIsEmpty(cell)) {
            return this.getCell(0, 0);
        }
        return cell;
    }

    /**
     * Clear user input / hints.
     */
    public reset(): void {
        for (let cell of this.getFlatCells()) {
            if (!cell.isInitial) {
                cell.value = CellValue.EMPTY;
                this.setCell(cell, false);
            }
        }
        this.clearHistory();
    }

    public hasSolutionSet(): boolean {
        return this.solution.length === BOARD_SIZE;
    }
}


