import * as React from "react"
import {ChangeEvent} from "react"
import {Box, Slider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DEFAULT_CLUES, MAXIMUM_CLUES, MINIMUM_CLUES} from "../../generator/generator";
import {BOARD_SIZE} from "../../model/Sudoku";
import {withStyles} from "@material-ui/styles";
import intRange from "../../utility/numberRange";

interface createNewProps {
    setNumberOfClues: (event: ChangeEvent<{}>, value: number | number[]) => void,
}

const NumCluesSlider = withStyles({
    root: {
        marginTop: '48px',
        flexGrow: 1
    }
})(Slider);

const marks = intRange(MINIMUM_CLUES, MAXIMUM_CLUES, 4).map(
    value => ({
        value,
        label: value
    })
);
export default (props: createNewProps) =>
    <Box p={1}>
        <NumCluesSlider marks={marks}
                        defaultValue={DEFAULT_CLUES}
                        step={1}
                        valueLabelDisplay={"auto"}
                        min={MINIMUM_CLUES}
                        max={Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 + 8))}
                        aria-labelledby="num-clues"
                        onChange={props.setNumberOfClues}
        />
        <Typography id="num-clues">
            Number of clues (filled cells)
        </Typography>
    </Box>