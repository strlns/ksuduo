import * as React from "react"
import {ChangeEvent} from "react"
import {Box, FormControl, FormHelperText, InputLabel, NativeSelect, Slider, ThemeProvider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DEFAULT_CLUES, DIFFICULTY_LEVEL, MAXIMUM_CLUES, MINIMUM_CLUES} from "../../generator/generator";
import {BOARD_SIZE} from "../../model/Sudoku";
import {withStyles} from "@material-ui/styles";
import intRange from "../../utility/numberRange";
import {SentimentSatisfiedRounded} from "@material-ui/icons";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (event: ChangeEvent<{}>, value: number | number[]) => void,
    difficulty: DIFFICULTY_LEVEL,
    setDifficulty: React.ChangeEventHandler<HTMLSelectElement>,
    numberOfFilledCellsInCurrentPuzzle: number,
}

const NumCluesSlider = withStyles({
    root: {
        marginBottom: ksuduoThemeNormal.spacing(4),
        flexGrow: 1,
    },
})(Slider);

const marks = intRange(MINIMUM_CLUES + 2, MAXIMUM_CLUES, 4).map(
    value => ({
        value,
        label: value
    })
);

const MinNumCluesInfoBox = withStyles({
    root: {
        overflow: 'hidden',
        transition: 'max-height .75s ease-out'
    }
})(Box);


export default (props: GeneratorConfigurationProps) => {
    const showMinClueInfo = () => {
        return props.numberOfClues <= MINIMUM_CLUES && props.numberOfFilledCellsInCurrentPuzzle > MINIMUM_CLUES;
    }
    return <Box p={1}>
        <InputLabel htmlFor="difficulty-select" style={{fontSize: '.75rem'}}>
            Number of clues (filled cells)
        </InputLabel>
        <NumCluesSlider id={"difficulty-select"}
                        marks={marks}
                        defaultValue={DEFAULT_CLUES}
                        step={1}
                        valueLabelDisplay={"auto"}
                        min={MINIMUM_CLUES}
                        max={Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 + 8))}
                        aria-labelledby="num-clues"
                        onChange={props.setNumberOfClues}
        />
        <ThemeProvider theme={ksuduoThemeSecond}>
            {/*To do: replace this hideous ad-hoc-solution, maybe with some kind of tooltip*/}
            <MinNumCluesInfoBox style={{maxHeight: showMinClueInfo() ? '6rem' : '0'}}>
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
            </MinNumCluesInfoBox>
            <FormControl fullWidth={true}>
                <InputLabel htmlFor="difficulty-select">Difficulty</InputLabel>
                <NativeSelect
                    value={props.difficulty}
                    onChange={props.setDifficulty}
                    inputProps={{
                        name: 'difficulty',
                        id: 'difficulty-select',
                    }}
                >
                    <option value={DIFFICULTY_LEVEL.EASY}>Easy</option>
                    <option value={DIFFICULTY_LEVEL.MEDIUM}>Medium</option>
                    <option value={DIFFICULTY_LEVEL.HARD}>Hard</option>
                </NativeSelect>
                <FormHelperText>Select the difficulty level for the puzzle to generate</FormHelperText>
                <Typography component='small' variant={'subtitle1'} color={'primary'}
                            style={{lineHeight: '.75'}}>
                    Not implemented yet (no effect)
                </Typography>
            </FormControl>
        </ThemeProvider>
    </Box>
}