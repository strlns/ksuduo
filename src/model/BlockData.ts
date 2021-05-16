import {CellData} from "./CellData";
import arrayChunk from "../utility/arrayChunk";
import {BLOCK_WIDTH} from "./Board";

export class BlockData {
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