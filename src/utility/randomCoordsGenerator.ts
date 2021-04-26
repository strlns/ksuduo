import {BOARD_WIDTH, CellIndex} from "../model/Sudoku";
import assert from "./assert";
import intRange from "./numberRange";
import pickRandomArrayValue from "./pickRandom";

// noinspection JSUnusedGlobalSymbols
/**
 * Generator for random index pair in specified range.
 * Not used anymore, kept here because of utility hoarder syndrome
 * @param max
 * @param min
 * @param infinite
 * @deprecated
 */
export default function* randomCoordinatesGenerator(infinite = false,
                                                    max: number = BOARD_WIDTH - 1,
                                                    min: number = 0): Generator<[CellIndex, CellIndex]> {
    max = Math.floor(max);
    min = Math.floor(min);
    assert(max > min);
    const range = intRange(min, max);

    function makeCoords(): [CellIndex, CellIndex] {
        return [
            pickRandomArrayValue(range) as CellIndex,
            pickRandomArrayValue(range) as CellIndex
        ];
    }

    const usedCoords: string[] = [];
    const coordsSpaceSize = Math.pow(max - min, 2);
    while (true) {
        if (usedCoords.length >= coordsSpaceSize) {
            if (infinite) {
                usedCoords.length = 0;
            } else return;
        }
        let coords = makeCoords();
        while (usedCoords.includes(coords.join())) {
            coords = makeCoords();
        }
        usedCoords.push(coords.join());
        yield coords;
    }
}
