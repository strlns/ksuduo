import intRange from "./numberRange";
import {BOARD_WIDTH, CellIndex} from "../model/Board";
import {cartesian} from "./cartesianProduct";
import {shuffle} from "lodash-es";

/**
 * Generator for random index pair in specified range.
 * @param max
 * @param min
 * @param infinite
 */
export default function* randomCoordinatesGenerator(infinite = false,
                                                    max: number = BOARD_WIDTH - 1,
                                                    min: number = 0): Generator<[CellIndex, CellIndex]> {
    max = Math.floor(max);
    min = Math.floor(min);
    console.assert(max > min);
    const range = intRange(min, max);
    const coords = shuffle(
        cartesian(range, range)
    );
    while (coords.length > 0) {
        yield coords.pop()
    }

    return;
}
