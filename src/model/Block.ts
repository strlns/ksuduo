import {CellIndex} from "./Sudoku";
import {Cell} from "./Cell";
import arrayChunk from "../utility/arrayChunk";

export default class {
    public leftTopX: CellIndex;
    public leftTopY: CellIndex;
    public cells: Cell[];
    constructor() {
        this.cells = [];
    }
    getRows(): Cell[][] {
        return arrayChunk(this.cells, 3);
    }

}