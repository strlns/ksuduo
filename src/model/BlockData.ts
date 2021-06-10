import {CellData} from "./CellData";
import arrayChunk from "../utility/arrayChunk";
import {BLOCK_WIDTH} from "./Board";

/**
 * This does not protect from using invalid indices.
 * So it seemingly has no tangible benefit over using `number`,
 * just makes source easier to read for me
 */
export type BlockIndex = number;

export class BlockData {
    public cells: CellData[];
    public blockIndex: BlockIndex;

    constructor(blockIndex: BlockIndex) {
        this.cells = [];
        this.blockIndex = blockIndex;
    }

    public getRows(): CellData[][] {
        return arrayChunk(this.cells, BLOCK_WIDTH);
    }
}