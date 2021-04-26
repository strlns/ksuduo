import * as React from "react"
import {useEffect} from "react"
import {Box, FormControl, FormHelperText, InputLabel, NativeSelect, ThemeProvider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DEFAULT_CLUES, DIFFICULTY_LEVEL, MINIMUM_CLUES} from "../../generator/generator";
import {BOARD_SIZE} from "../../model/Sudoku";
import {withStyles} from "@material-ui/styles";
import intRange from "../../utility/numberRange";
import {SentimentSatisfiedRounded} from "@material-ui/icons";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {DiscreteRangeSlider} from "./DiscreteRangeSlider";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (event: React.ChangeEvent<{}>, value: number) => void,
    difficulty: DIFFICULTY_LEVEL,
    setDifficulty: React.ChangeEventHandler<HTMLSelectElement>,
    numberOfFilledCellsInCurrentPuzzle: number,
}

const MinNumCluesInfoBox = withStyles({
    root: {
        overflow: 'hidden',
        transition: 'max-height .75s ease-out'
    }
})(Box);

export const MAXIMUM_CLUES_EASY = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 + 4));
export const MAXIMUM_CLUES_HARD = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 3 + 4));

export default (props: GeneratorConfigurationProps) => {
    const MAX_CLUES = props.difficulty < DIFFICULTY_LEVEL.HARD ? MAXIMUM_CLUES_EASY : MAXIMUM_CLUES_HARD;

    const marks = intRange(MINIMUM_CLUES + 2, MAX_CLUES, 4).map(
        value => ({
            value,
            label: value
        })
    );

    useEffect(
        () => {
            if (props.numberOfClues > MAX_CLUES) {
                // @ts-ignore
                /**
                 * Reason for @ts-ignore.
                 *
                 * Wrapping a prop of type ((value: number) => void) in ((event: React.ChangeEvent, value: number) => void)
                 * triggers an infinite loop, even when not calling useEffect.
                 * a) The event parameter cannot be made optional.
                 * b) The underlying {@link Slider} component of
                 * {@link DiscreteRangeSlider} does not expose a ref to its input to avoid that either.
                 * c) atm I am unable to construct a type to work around the issue
                 *
                 * So we need just need to ignore the TS compiler here.
                 */
                //@ts-ignore
                props.setNumberOfClues({}, MAX_CLUES);
            }
        }, [
            props.difficulty
        ]
    )

    const showMinClueInfo = () => {
        return props.numberOfClues <= MINIMUM_CLUES && props.numberOfFilledCellsInCurrentPuzzle > MINIMUM_CLUES;
    }
    return <Box p={1}>
        <InputLabel htmlFor="difficulty-select" style={{fontSize: '.75rem'}}>
            Number of clues (filled cells)
        </InputLabel>
        <DiscreteRangeSlider id={"difficulty-select"}
                             marks={marks}
                             defaultValue={DEFAULT_CLUES}
                             step={1}
                             valueLabelDisplay={"auto"}
                             min={MINIMUM_CLUES}
                             max={MAX_CLUES}
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
                    top: '.25em',
                    marginLeft: '.25em'
                }
                }/>
            </MinNumCluesInfoBox>
            <ThemeProvider theme={ksuduoThemeNormal}>
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
                </FormControl>
            </ThemeProvider>
        </ThemeProvider>
    </Box>
}