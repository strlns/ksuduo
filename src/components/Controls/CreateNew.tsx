import * as React from "react"
import {Button, Slider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {MINIMUM_CLUES} from "../../generator/generator";
import {BOARD_SIZE_NUM_CELLS} from "../../model/Sudoku";
import {withStyles} from "@material-ui/styles";
import {ChangeEvent} from "react";

type createNewProps = {
    setNumberOfClues: (event: ChangeEvent<{}>, value: number | number[]) => void,
    submit: Function
}

export const DEFAULT_NUMBER_OF_CLUES = 24;

const NumCluesSlider = withStyles({
    root: {
        marginTop: '48px',
        flexGrow: 1,
        maxWidth: '24rem'
    }
})(Slider);

const GenerateButton = withStyles({
    root: {
        marginTop: '2rem',
        width: '100%'
    }
})(Button)

// @ts-ignore
export default (props: createNewProps) => <div className={"app-create"}>
    <div style={{display: 'inline-flex', flexGrow: 1, flexWrap: 'wrap'}}>
        <div style={{flexBasis: '100%'}}>
            <NumCluesSlider marks={true}
                            defaultValue={DEFAULT_NUMBER_OF_CLUES}
                            step={1}
                            valueLabelDisplay={"on"}
                            min={MINIMUM_CLUES}
                            max={Math.floor(BOARD_SIZE_NUM_CELLS / 2 + 8)}
                            aria-labelledby="num-clues"
                            onChange={props.setNumberOfClues}
            />
            <Typography id="num-clues">
                Number of clues (filled cells)
            </Typography>
        </div>
        <GenerateButton onClick={() => props.submit()} variant="contained" color="primary">
            Generate Sudoku
        </GenerateButton>
    </div>
</div>