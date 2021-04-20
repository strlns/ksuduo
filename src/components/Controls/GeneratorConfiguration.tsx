import * as React from "react"
import {Box, Button, Container, Grid, Paper, Slider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {MINIMUM_CLUES} from "../../generator/generator";
import {BOARD_SIZE} from "../../model/Sudoku";
import {withStyles} from "@material-ui/styles";
import {ChangeEvent} from "react";

interface createNewProps {
    setNumberOfClues: (event: ChangeEvent<{}>, value: number | number[]) => void,
}

export const DEFAULT_NUMBER_OF_CLUES = 24;

const NumCluesSlider = withStyles({
    root: {
        marginTop: '48px',
        flexGrow: 1
    }
})(Slider);


export default (props: createNewProps) =>
    <div>
        <NumCluesSlider marks={true}
                        defaultValue={DEFAULT_NUMBER_OF_CLUES}
                        step={1}
                        valueLabelDisplay={"on"}
                        min={MINIMUM_CLUES}
                        max={Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 + 8))}
                        aria-labelledby="num-clues"
                        onChange={props.setNumberOfClues}
        />
        <Typography id="num-clues">
            Number of clues (filled cells)
        </Typography>
    </div>