import {CellData, cellIsEmpty, CellValue, CellValues, EXCLUDE_NOTHING, NonEmptyCellValues,} from "./CellData";
import {BlockData} from "./BlockData";
import {fromPairs, shuffle} from "lodash-es";
import {pickRandomArrayValue} from "../utility/pickRandom";
import assert from "../utility/assert";
import {Solution, solve, solverResultIsError} from "../solver/solver";
import {
    BLOCK_HEIGHT,
    BLOCK_WIDTH,
    BLOCKS_PER_BAND,
    BOARD_SIZE,
    BOARD_WIDTH,
    CELL_INDICES,
    CellIndex,
    coordsToFlatIndex,
    flatIndexToCoords,
    getFlatStartIndexForBlock,
    NUMBER_OF_BLOCKS
} from "./Board";

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
    private rows: CellData[][] = [];

    /**
     * history stored as array of flat board states (2nd dimension contains Array(81)<CellData>).
     * history is only filled for user input and hints and cleared on reset.
     */
    public history: CellData[][];

    private solution: Solution = [];

    constructor(structuredCloneInitializer?: SudokuStructuredClone) {
        if (structuredCloneInitializer) {
            this.rows = structuredCloneInitializer.rows;
            this.solution = structuredCloneInitializer.solution;
            this.history = structuredCloneInitializer.history;
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
            this.setValue(solutionData.cell.x, solutionData.cell.y, solutionData.val, false, false);
        }
    }

    public getValueFromSolution(x: CellIndex, y: CellIndex): CellValue {
        if (!this.hasSolutionSet()) {
            throw new Error();
        }
        return this.solution[coordsToFlatIndex(x, y)];
    }

    public initWithNumbers(values: number[], solvePuzzle = true) {
        values.forEach((value, index) => {
            const [x, y] = flatIndexToCoords(index);
            const cell = this.getCell(x, y);
            cell.value = value;
            cell.isInitial = !cellIsEmpty(cell);
        });
        if (solvePuzzle) {
            const solverResult = solve(values);
            if (solverResultIsError(solverResult)) {
                throw new Error('Could not solve puzzle passed to initializer');
            }
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

    public getNumberOfCorrectlyFilledCells(): number {
        //isValid is also set to false for conflicting cells in the initial puzzle when the user enters wrong values.
        return this.getFilledCells().filter(cell => cell.isValid || cell.isInitial).length;
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

    /**
     * This may only be called from the constructor.
     * Changing references inside this.rows directly leads to
     * direct mutation of React state (which is not allowed).
     */
    private initializeEmptyBoard() {
        this.setSolution([]);
        this.clearHistory();
        for (let y = 0; y < BOARD_WIDTH; y++) {
            this.rows[y] = Array(BOARD_WIDTH).fill(null);
            for (let x = 0; x < this.rows[y].length; x++) {
                this.addCell(
                    {
                        value: CellValue.EMPTY,
                        x: x as CellIndex,
                        y: y as CellIndex,
                        isInitial: false,
                        isValid: true,
                        blockIndex: getBlockIndexForCoords(x as CellIndex, y as CellIndex)
                    } as CellData
                );
            }
        }
    }

    public clearBoard() {
        this.setSolution([]);
        this.clearHistory();
        this.getFlatCells().forEach(
            cell => this.setCell({...cell, value: CellValue.EMPTY, isInitial: false, isValid: true}, false)
        );
    }

    /*
     Get a random completely filled initial board.
     Uses naive brute-force approach - discard "impossible" boards and try again.
     Could be improved for better performance.
    */
    public fillWithRandomCompleteSolution() {
        let deadEnd = false;
        while (deadEnd || !this.isFilled()) {
            this.clearBoard();
            const blocks = this.getBlocks();
            const middleBlock = blocks[Math.floor(blocks.length / 2)];
            deadEnd = false;
            const middleValues = shuffle(NonEmptyCellValues);
            let i = 0;
            for (const cell of middleBlock.cells) {
                cell.value = middleValues[i];
                cell.isInitial = true;
                i++;
            }
            for (const cell of this.getFlatCells()) {
                if (middleBlock.cells.includes(cell)) {
                    continue;
                }
                const val = this.getAllowedCellValue(cell.x, cell.y);
                if (val === CellValue.EMPTY) {
                    deadEnd = true;
                    break;
                }
                cell.value = val;
                cell.isInitial = true;
            }
        }
        this.setSolution(this.getFlatValues());
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
        const newCell = {
            ...this.rows[y][x],
            isInitial: fixed,
            value
        };
        this.rows[y][x] = newCell;
    }

    public setCell(cell: CellData, useHistory = true): void {
        this.setValue(cell.x, cell.y, cell.value, cell.isInitial, useHistory);
    }

    public getRows(): readonly CellData[][] {
        return Object.freeze(this.rows);
    }

    public getFlatValues(): CellValue[] {
        return this.rows.reduce((prev, curr) => {
            return prev.concat(curr);
        }, []).map(cellData => cellData.value);
    }

    public getFlatCells(): CellData[] {
        return this.rows.reduce((prev, curr) => {
            return prev.concat(curr);
        }, []);
    }

    public getBlocks(): BlockData[] {
        const blocks: BlockData[] = [];
        for (let i = 0; i < NUMBER_OF_BLOCKS; i++) {
            blocks.push(new BlockData(i));
        }
        for (const cell of this.getFlatCells()) {
            blocks[getBlockIndexForCell(cell)].cells.push(cell);
        }
        return blocks;
    }

    public getColumns(): readonly CellData[][] {
        const indicesToMap: string[] = this.rows.length > 0 && this.rows[0].length === CELL_INDICES.length ?
            CELL_INDICES.map(i => `${i}`) : Object.keys(this.rows[0]);
        return indicesToMap.map(
            colIndex => {
                return Object.keys(this.rows)
                    .map(
                        rowIndex => this.rows[Number(rowIndex) as CellIndex]
                            [Number(colIndex) as CellIndex]
                    )
            }
        )
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

    public getEmptyOrInvalidCellWithMinimumPossibilites(): CellData | undefined {
        const candidates = addPossibleValuesToCellDataArray(
            this.getFlatCells().filter(cell => cellIsEmpty(cell) || !cell.isValid),
            this
        ).sort(
            (a, b) =>
                a.possibleValues.length < b.possibleValues.length ? 1 : -1
        );
        return candidates.pop() as CellData
    }

    public getAllowedCellValue(x: CellIndex, y: CellIndex): CellValue {
        const allowedValues = this.getAllowedCellValuesByCoords(x, y);
        if (allowedValues.length === 0) {
            return CellValue.EMPTY;
        }
        return pickRandomArrayValue(allowedValues);
    }

    public getAllowedCellValues(cell: CellData, ignoreSelf = true): CellValue[] {
        return this.getAllowedCellValuesByCoords(cell.x, cell.y, ignoreSelf);
    }

    public getAllowedCellValuesByCoords(x: CellIndex, y: CellIndex, ignoreSelf = true): CellValue[] {
        return CellValues.filter(
            value => !(
                value === CellValue.EMPTY ||
                this.getRowValues(y, ignoreSelf ? x : EXCLUDE_NOTHING).includes(value) ||
                this.getColumnValues(x, ignoreSelf ? y : EXCLUDE_NOTHING).includes(value)
                || this.getFlatBlockValuesForCoords(x, y, ignoreSelf).includes(value)

            )
        );
    }

    private getFlatBlockValuesForCoords(cellX: CellIndex, cellY: CellIndex, excludeSelf = false): CellValue[] {
        const cell = this.getCell(cellX, cellY);
        let blockCells = this.getBlocks()[cell.blockIndex].cells;
        if (excludeSelf) {
            blockCells = blockCells.slice();
            blockCells.splice(blockCells.indexOf(cell))
        }
        return blockCells.map(cell => cell.value);
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

    public isFilled(): boolean {
        return this.getFilledCells().length === BOARD_SIZE;
        // return this.getFilledCells().length === this.getFlatCells().length;
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
        if (this.history.length > 0) {
            this.initWithFlatCellData(this.history[0]);
        } else {
            for (let cell of this.getFlatCells()) {
                if (!cell.isInitial) {
                    cell.value = CellValue.EMPTY;
                    this.setCell(cell, false);
                }
            }
        }
        this.clearHistory();
    }

    /**
     * "hidden" solution should always be present,
     * this is not the same as {@link isSolved}
     */
    public hasSolutionSet(): boolean {
        return this.solution.length === BOARD_SIZE;
    }

    public getFlatValuesAsString() {
        return this.getFlatValues().join()
    }

    public numberOfFilledCellsPerRow(): number[] {
        //careful, callback fn passed directly because it takes only 1 parameter
        return this.getRows().map(numberOfFilledCellsInArray);
    }

    public numberOfFilledCellsPerColumn(): number[] {
        //careful, callback fn passed directly because it takes only 1 parameter
        return this.getColumns().map(numberOfFilledCellsInArray);
    }

    public getCellsInBlock(cell: CellData): CellData[] {
        return this.getBlocks()[getBlockIndexForCell(cell)].cells;
    }

}

export type Puzzle = Sudoku | CellValue[] | number[];

export const puzzleToSudoku = (puzzle: Puzzle, solvePuzzle = true) => {
    if (puzzle instanceof Sudoku) {
        return puzzle;
    }
    const res = new Sudoku();
    res.initWithNumbers(puzzle as number[], solvePuzzle);
    return res;
}

export const getBlockValuesForIndexInFlatPuzzle = (flatPuzzle: CellValue[], cellIndex: number): CellValue[] => {
    if (cellIndex >= flatPuzzle.length) {
        throw new Error('Invalid cell index.');
    }
    const startIndex = getFlatStartIndexForBlock(flatPuzzle, cellIndex);
    const res = [];
    let i = 0;
    let index = startIndex;
    while (i < BLOCK_HEIGHT) {
        index = startIndex + i * BOARD_WIDTH;
        for (let j = 0; j < BLOCK_WIDTH; j++) {
            res.push(flatPuzzle[index + j]);
        }
        i++;
    }
    return res;
}

export const numberOfFilledCellsInArray = (cells: CellData[]): number => {
    return cells.reduce((prev, curr) => prev + (cellIsEmpty(curr) ? 0 : 1), 0);
}

export const getValueInFlatPuzzleByCoords = (flatPuzzle: CellValue[], cellX: CellIndex, cellY: CellIndex): CellValue => {
    return flatPuzzle[coordsToFlatIndex(cellX, cellY)];
}
export const addPossibleValuesToCellDataArray = (candidates: CellData[], board: Sudoku, onlyEmpty = false) => candidates.map(
    cell => ({
        ...cell,
        possibleValues: (onlyEmpty && !cellIsEmpty(cell)) ? [] : board.getAllowedCellValues(cell, !onlyEmpty)
    })
);
type PossibilityCountHash = {
    [value in CellValue]: number
};

/*
 *
 * return an object with the cell values as key and the number of occurrences as a possible value
 * in the given array of cells, for the given board, as value.
 * Currently unused, could be useful for detection of BUG situations
 */
// noinspection JSUnusedGlobalSymbols
export const getPossibleValuesInCellsWithCount = (cells: CellData[], board: Sudoku): PossibilityCountHash => {
    const res = fromPairs(NonEmptyCellValues.map(val => [val, 0]));
    const cellsWithP = addPossibleValuesToCellDataArray(cells, board, false);
    for (const cell of cellsWithP) {
        for (const value of cell.possibleValues) {
            res[value] += 1;
        }
    }
    return res as PossibilityCountHash;
}

export const getBlockIndexForCell = (cell: CellData): number => {
    return getBlockIndexForCoords(cell.x, cell.y);
}
export const getBlockIndexForCoords = (x: CellIndex, y: CellIndex): number => {
    const yPart = Math.floor(y / BLOCK_HEIGHT) * BLOCKS_PER_BAND;
    const xPart = Math.floor(x / BLOCK_WIDTH);
    return yPart + xPart;
}