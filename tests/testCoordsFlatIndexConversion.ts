import {Sudoku} from "../src/model/Sudoku";
import {coordsToFlatIndex, flatIndexToCoords} from "../src/model/Board";
import logSuccess from "../src/debug/consoleSuccess";
import assert from "./assert";

export default function testCoordsFlatIndexConversion() {
    console.log("Testing that flat index and coordinates are correctly converted using a random board.")
    const puzzle = new Sudoku();
    puzzle.fillWithRandomCompleteSolution();
    const flatPuzzle = puzzle.getFlatValues();
    for (let j = 0; j < flatPuzzle.length; j++) {
        const coords = flatIndexToCoords(j);
        const valueFromCoords = puzzle.getCell(...coords).value;
        assert(
            flatPuzzle[j] === valueFromCoords,
            `flatIndexToCoords returned wrong result for index ${j}. \
                Expected ${flatPuzzle[j]}, got ${valueFromCoords}.\
                Calculated coordinates: (${coords[0]}, ${coords[1]})`
        );
    }
    for (let cell of puzzle.getFlatCells()) {
        const index = coordsToFlatIndex(cell.x, cell.y);
        const valueFromIndex = flatPuzzle[index];
        assert(
            cell.value === valueFromIndex,
            `coordsToFlatIndex returned wrong result for (${cell.x}, ${cell.y})\                    
                    Expected ${cell.value}, got ${valueFromIndex}.\
                    Calculated index: ${index}.`
        );
    }

    logSuccess(`Test passed.`)
}