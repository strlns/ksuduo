import {CellData, CellValue, CellValues, EXCLUDE_NOTHING} from "./CellData";
import {BlockData} from "./BlockData";
import arrayChunk from "../utility/arrayChunk";
import {cloneDeep} from "lodash-es";

export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

//All possible cell indices on x- or y-axis, meaning [0,1,...,8]
export const CELL_INDICES =
    Array(9).fill(0).map((v, i) => i as CellIndex);

export const BOARD_WIDTH = CELL_INDICES.length;
export const BOARD_SIZE = Math.pow(BOARD_WIDTH, 2);
export const BLOCK_WIDTH = 3;

export class Sudoku {

    private rows: CellData[][] = [];
    /**
     * shortcut to make the constant calls to {@link isComplete} less wasteful
     */
    private numberOfFilledCells = 0;

    constructor() {
        this.initializeEmptyBoard();
    }

    public getNumberOfFilledCells(): number {
        return this.numberOfFilledCells;
    }

    public initializeEmptyBoard() {
        for (let y = 0; y < BOARD_WIDTH; y++) {
            this.rows[y] = Array(BOARD_WIDTH).fill(null);
            for (let x = 0; x < this.rows[y].length; x++) {
                this.rows[y][x] = new CellData(CellValue.EMPTY, x as CellIndex, y as CellIndex);
            }
        }
        this.numberOfFilledCells = 0;
    }

    public fillWithRandomCompleteSolution() {
        let itsUnsolvable = false;
        this.rows.forEach((row, y) => {
            if (itsUnsolvable) {
                return;
            }
            for (let x = 0; x < row.length; x++) {
                const val = this.getRandomAllowedCellValue(y as CellIndex, x as CellIndex);
                if (val === CellValue.EMPTY) {
                    itsUnsolvable = true;
                    break;
                } else {
                    this.setValue(y as CellIndex, x as CellIndex, val, true);
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

    public setValue(i: CellIndex, j: CellIndex, value: CellValue, fixed = false) {
        const cell = cloneDeep(this.rows[i][j]);
        const wasFilled = cell.value !== CellValue.EMPTY;
        cell.isInitial = fixed;
        cell.value = value;
        this.rows[i][j] = cell;
        if (wasFilled && value === CellValue.EMPTY) {
            this.numberOfFilledCells--;
        }
        else if (!wasFilled && value !== CellValue.EMPTY) {
            this.numberOfFilledCells++;
        }
    }

    public getRows(): readonly CellData[][] {
        return Object.freeze(this.rows);
    }

    public getFlatValues(): readonly CellValue[] {
        const res: CellValue[] = [];
        this.rows.forEach(row => {
            res.push(...row.map(cell => cell.value));
        })
        return res;
    }

    public getFlatCells(): readonly CellData[] {
        return this.rows.reduce((prev, curr) => {
            return prev.concat(curr);
        }, []);
    }

    public getBlocks(): BlockData[] {
        const blocks: BlockData[] = [];
        //fill the blocks array
        const numberOfBlocks = BOARD_SIZE / Math.pow(BLOCK_WIDTH, 2); //This must result in an int (field is a square).
        // Gotcha time:
        // Array.prototype.fill(new Block()) would use the same instance for every slot.
        // Array.prototype.map and filter ignore empty slots.
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

    public getValue(y: CellIndex, x: CellIndex): CellValue {
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

    public getRandomAllowedCellValue(y: CellIndex, x: CellIndex): CellValue {
        let candidates = CellValues.filter(
            value => !(
                value === CellValue.EMPTY ||
                this.getRowValues(y).includes(value) ||
                this.getColumnValues(x).includes(value)
                || this.getFlatBlockValuesForCoords(x, y).includes(value)
            )
        );
        if (candidates.length === 0) {
            return CellValue.EMPTY;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

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

    private isCellValueValid(cellValue: CellValue, x: CellIndex, y: CellIndex) {
        return cellValue === CellValue.EMPTY ||
            !(this.getRowValues(y, x).includes(cellValue) ||
                this.getColumnValues(x, y).includes(cellValue)
                || this.getFlatBlockValuesForCoords(x, y, true).includes(cellValue)
            );
    }

    public isCellValid(cell: CellData): boolean {
        return cell.value === CellValue.EMPTY || this.isCellValueValid(cell.value, cell.x, cell.y);
    }

    public isComplete(): boolean {
        return this.numberOfFilledCells === BOARD_SIZE &&
            this.getFlatCells().every(
                cell => cell.value !== CellValue.EMPTY && this.isCellValid(cell)
            );
    }

    public getFirstEmptyCell(): CellData {
        let cell;
        let x = 0 as CellIndex, y = 0 as CellIndex;
        cell = this.getCell(x,y);
        let i = 0;
        while (cell.value !== CellValue.EMPTY && i < BOARD_SIZE) {
            x++;
            if (x > BOARD_WIDTH - 1) {
                x = 0;
                y++;
            }
            cell = this.getCell(x as CellIndex, y as CellIndex);
        }
        return cell;
    }
}