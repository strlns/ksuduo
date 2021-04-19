import {BLOCK_SIZE, CellIndex, Sudoku} from "./Sudoku";
import {CellData} from "./CellData";
import arrayChunk from "../utility/arrayChunk";

export class BlockData {
    private sudoku: Sudoku;
    public leftTopX: CellIndex;
    public leftTopY: CellIndex;
    public cells: CellData[];
    constructor() {
        this.cells = [];
    }
    public getRows(): CellData[][] {
        return arrayChunk(this.cells, BLOCK_SIZE);
    }
}