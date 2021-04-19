import {BLOCK_WIDTH, CellIndex, Sudoku} from "./Sudoku";
import {CellData} from "./CellData";
import arrayChunk from "../utility/arrayChunk";

export class BlockData {
    public leftTopX: CellIndex;
    public leftTopY: CellIndex;
    public cells: CellData[];
    public blockIndex: number;
    constructor(blockIndex: number) {
        this.cells = [];
        this.blockIndex = blockIndex;
    }
    public getRows(): CellData[][] {
        return arrayChunk(this.cells, BLOCK_WIDTH);
    }
}