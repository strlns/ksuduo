import {Cell, CellValue, CellValues} from "./Cell";
import Block from "./Block";
import arrayChunk from "../utility/arrayChunk";

export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

//All possible cell indices on x- or y-axis, meaning [0,1,...,8]
//Sudoku must be symmetrical.
export const CELL_INDICES =
    Array(9).fill(0).map((v, i) => i as CellIndex);

export const BOARD_SIZE = CELL_INDICES.length;
export const BOARD_SIZE_NUM_CELLS = Math.pow(BOARD_SIZE, 2);

export const BLOCK_SIZE = 3;

export class Sudoku {

    private rows: CellValue[][] = [];

    constructor() {
        this.initializeEmptyBoard();
    }

    public initializeEmptyBoard() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            this.rows[i] = Array(BOARD_SIZE).fill(CellValue.EMPTY);
        }
    }

    public fillWithRandomCompleteSolution() {
        let itsUnsolvable = false;
        this.rows.forEach((row, rowIndex) => {
            if (itsUnsolvable) {
                return;
            }
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const val = this.getRandomAllowedCellValue(rowIndex as CellIndex, colIndex as CellIndex);
                if (val === CellValue.EMPTY) {
                    itsUnsolvable = true;
                    break;
                } else {
                    this.setValue(rowIndex as CellIndex, colIndex as CellIndex, val);
                }
            }
        });
        if (itsUnsolvable) {
            this.initializeEmptyBoard();
            this.fillWithRandomCompleteSolution();
        }
    }

    public setValue(i: CellIndex, j: CellIndex, v: CellValue) {
        this.rows[i][j] = v;
    }

    public getRows(): readonly CellValue[][] {
        return Object.freeze(this.rows);
    }

    public getValuesFlat(): readonly CellValue[] {
        const res: CellValue[] = [];
        this.rows.forEach(row => {
            res.push(...row);
        })
        return res;
    }

    public getBlocks(): readonly Block[] {
        const blocks: Block[] = [];
        //fill the blocks array
        //Array(9).fill(new Block()) would use the same instance for every slot
        const numberOfBlocks = BOARD_SIZE_NUM_CELLS / Math.pow(BLOCK_SIZE, 2); //This must result in an int (field is a square).
        for (let i = 0; i < numberOfBlocks; i++) {
            blocks.push(new Block());
        }
        for (let i = 0; i < this.rows.length; i++) {
            const chunks: CellValue[][] = arrayChunk(this.rows[i], BLOCK_SIZE);
            chunks.forEach((chunk, chunkIndex) => {
                const blockIndexForChunk = Math.floor(i / BLOCK_SIZE) * BLOCK_SIZE + chunkIndex;
                blocks[blockIndexForChunk].cells
                    .push(...chunk.map(
                        (cellVal, indexInChunk) => new Cell(
                            cellVal,
                            (chunkIndex * BLOCK_SIZE + indexInChunk) as CellIndex,
                            i as CellIndex
                        )
                        )
                    );
            });
        }
        return blocks;
    }

    /**
     * To do: cache this.
     */
    public getValuesByColumn(): readonly CellValue[][] {
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

    public getValue(i: CellIndex, j: CellIndex): CellValue {
        return this.rows[i][j];
    }

    public getRow(i: CellIndex): CellValue[] {
        return this.rows[i];
    }

    public getColumn(j: CellIndex): CellValue[] {
        return Object.keys(this.rows)
            .map(
                rowIndex => this.rows[Number(rowIndex) as CellIndex][j]
            )
    }

    public getRandomAllowedCellValue(i: CellIndex, j: CellIndex): CellValue {
        let candidates = CellValues.filter(
            value => !(
                value === CellValue.EMPTY ||
                this.getRow(i).includes(value) ||
                this.getColumn(j).includes(value)
                || this.getFlatBlockValuesForCell(i, j).includes(value)
            )
        );
        // console.log(candidates);
        if (candidates.length === 0) {
            return CellValue.EMPTY;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    private getFlatBlockValuesForCell(i: CellIndex, j: CellIndex): CellValue[] {
        let x0 = i;
        while (x0 % 3 !== 0) {
            x0--;
        }
        let y0 = j;
        while (y0 % 3 !== 0) {
            y0--;
        }
        const res: CellValue[] = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                res.push(this.rows[x0 + i][y0 + j]);
            }
        }
        return res;
    }
}