import {CellData, cellIsEmpty, CellValue, CellValues, EXCLUDE_NOTHING} from "./CellData";
import {BlockData} from "./BlockData";
import arrayChunk from "../utility/arrayChunk";
import {cloneDeep} from "lodash-es";
import {pickRandomArrayValue} from "../utility/pickRandom";
import assert from "../utility/assert";
import {Solution, solve, solverResultIsError} from "../solver/solver";
import {
    BLOCK_HEIGHT,
    BLOCK_SIZE,
    BLOCK_WIDTH,
    BOARD_SIZE,
    BOARD_WIDTH,
    CELL_INDICES,
    CellIndex,
    coordsToFlatIndex,
    flatIndexToCoords,
    getFlatStartIndexForBlock
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
    private readonly rows: CellData[][] = [];

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
            this.setValue(solutionData.cell.x, solutionData.cell.y, solutionData.val, false, false);
        }
    }

    public getValueFromSolution(x: CellIndex, y: CellIndex): CellValue | undefined {
        if (this.solution !== undefined) {
            return this.solution[coordsToFlatIndex(x, y)];
        }
    }

    public initWithNumbers(values: number[], solvePuzzle = true) {
        values.forEach((value, index) => {
            const [x, y] = flatIndexToCoords(index);
            const cell = this.getCell(x, y);
            cell.value = value;
            if (value as CellValue !== CellValue.EMPTY) {
                cell.isInitial = true;
            }
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

    public initializeEmptyBoard() {
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
                        isInitial: true,
                        isValid: true
                    } as CellData
                );
            }
        }
    }

    /*
     Get a random completely filled initial board.
     Uses naive brute-force approach - discard "impossible" boards and try again,
     don't think about blocks at all while filling the board.
     Could be improved for better performance.
    */
    public fillWithRandomCompleteSolution() {
        let invalid = false;
        let tries = 0;
        while (invalid || !this.isFilled()) {
            if (IS_DEVELOPMENT) {
                tries++;
            }
            this.initializeEmptyBoard();
            invalid = false;
            for (const [y, row] of this.rows.entries()) {
                for (let x = 0; x < row.length; x++) {
                    const val = this.getAllowedCellValue(x as CellIndex, y as CellIndex);
                    if (val === CellValue.EMPTY) {
                        invalid = true;
                        break;
                    } else {
                        this.setValue(x as CellIndex, y as CellIndex, val, true);
                    }
                }
            }
        }
        if (IS_DEVELOPMENT) {
            console.log(`Tried ${tries} times to find an initial completed board.`)
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
        const numberOfBlocks = BOARD_SIZE / BLOCK_SIZE; //This must result in an int (field is a square).
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
        const candidates = getCandidatesWithPossibilites(
            this.getFlatCells().filter(cell => cellIsEmpty(cell) || !cell.isValid),
            this
        ).sort(
            (a, b) =>
                a.possibleValues.length < b.possibleValues.length ? 1 : -1
        );
        return candidates.pop() as CellData
    }

    public getAllowedCellValue(x: CellIndex, y: CellIndex): CellValue {
        if (this.getAllowedCellValuesByCoords(x, y).length === 0) {
            return CellValue.EMPTY;
        }
        return pickRandomArrayValue(this.getAllowedCellValuesByCoords(x, y)) || CellValue.EMPTY;
    }

    public getAllowedCellValues(cell: CellData, ignoreSelf = false): CellValue[] {
        return this.getAllowedCellValuesByCoords(cell.x, cell.y, ignoreSelf);
    }

    public getAllowedCellValuesByCoords(x: CellIndex, y: CellIndex, ignoreSelf = false): CellValue[] {
        return CellValues.filter(
            value => !(
                value === CellValue.EMPTY ||
                this.getRowValues(y, ignoreSelf ? x : EXCLUDE_NOTHING).includes(value) ||
                this.getColumnValues(x, ignoreSelf ? y : EXCLUDE_NOTHING).includes(value)
                || this.getFlatBlockValuesForCoords(x, y, ignoreSelf).includes(value)
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
        while (x0 % BLOCK_WIDTH !== 0) {
            x0--;
        }
        while (y0 % BLOCK_HEIGHT !== 0) {
            y0--;
        }
        //add values
        const res: CellValue[] = [];
        for (let i = 0; i < BLOCK_WIDTH; i++) {
            for (let j = 0; j < BLOCK_HEIGHT; j++) {
                const x = (x0 + j) as CellIndex;
                const y = (y0 + i) as CellIndex;
                if (excludeSelf && y === cellY && x === cellX) {
                    continue;
                }
                if (IS_DEVELOPMENT) {
                    try {
                        res.push(this.rows[y][x].value);
                    } catch (e) {
                        console.error(e)
                    }
                } else {
                    try {
                        res.push(this.rows[y][x].value);
                    } catch {
                    }
                }

            }
        }
        return res;
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
        for (let cell of this.getFlatCells()) {
            if (!cell.isInitial) {
                cell.value = CellValue.EMPTY;
                this.setCell(cell, false);
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

export const getValueInFlatPuzzleByCoords = (flatPuzzle: CellValue[], cellX: CellIndex, cellY: CellIndex): CellValue => {
    return flatPuzzle[coordsToFlatIndex(cellX, cellY)];
}
export const getCandidatesWithPossibilites = (candidates: CellData[], board: Sudoku) => candidates.map(
    cell => ({...cell, possibleValues: board.getAllowedCellValues(cell, true)})
);