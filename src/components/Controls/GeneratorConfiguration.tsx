import * as React from "react"
import {ChangeEvent} from "react"
import {Box, Slider, ThemeProvider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DEFAULT_CLUES, MAXIMUM_CLUES, MINIMUM_CLUES} from "../../generator/generator";
import {BOARD_SIZE} from "../../model/Sudoku";
import {withStyles} from "@material-ui/styles";
import intRange from "../../utility/numberRange";
import {SentimentSatisfiedRounded} from "@material-ui/icons";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (event: ChangeEvent<{}>, value: number | number[]) => void,
    numberOfFilledCellsInCurrentPuzzle: number,
}

const NumCluesSlider = withStyles(theme => ({
    root: {
        flexGrow: 1,
    },
}))(Slider);

const marks = intRange(MINIMUM_CLUES + 2, MAXIMUM_CLUES, 4).map(
    value => ({
        value,
        label: value
    })
);


export default (props: GeneratorConfigurationProps) => {
    const showMinClueInfo = () => {
        return props.numberOfClues <= MINIMUM_CLUES && props.numberOfFilledCellsInCurrentPuzzle > MINIMUM_CLUES;
    }
    return <Box p={1}>
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
        <ThemeProvider theme={ksuduoThemeSecond}>
            <Box style={{visibility: showMinClueInfo() ? 'visible' : 'hidden'}}>
                <Typography component='small' variant={'subtitle1'} color={'primary'}
                            style={{lineHeight: '.75'}}>
                    The minimum number of clues for a solvable Sudoku has been proven to be 17!
                </Typography>
                <SentimentSatisfiedRounded color={'primary'} style={{
                    fontSize: '1em',
                    position: 'relative',
                    top: '.125em',
                    marginLeft: '.25em'
                }
                }/>
            </Box>
        </ThemeProvider>
    </Box>
}