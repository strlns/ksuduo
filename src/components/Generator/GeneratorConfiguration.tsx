import * as React from "react"
import {useEffect, useState} from "react"
import {Box, FormControl, FormHelperText, InputLabel, NativeSelect, ThemeProvider} from "@mui/material";
import Typography from "@mui/material/Typography";
import {DIFFICULTY_LEVEL} from "../../algorithm/generator/generator";
import {BOARD_SIZE, DEFAULT_CLUES, MINIMUM_CLUES} from "../../model/Board";
import intRange from "../../utility/numberRange";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {DiscreteRangeSlider} from "../Controls/DiscreteRangeSlider";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (value: number) => void,
    difficulty: DIFFICULTY_LEVEL,
    setDifficulty: React.ChangeEventHandler<HTMLSelectElement>,
    numberOfFilledCellsInCurrentPuzzle: number,
    difficultyOfCurrentPuzzle: DIFFICULTY_LEVEL
}

const MIN_CLUES = MINIMUM_CLUES + 4;

const MAXIMUM_CLUES_EASY = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 - 3));
const MAXIMUM_CLUES_MEDIUM = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 3 + 2));
const MAXIMUM_CLUES_HARD = 28;

export default (props: GeneratorConfigurationProps) => {
    let MAX_CLUES = MAXIMUM_CLUES_MEDIUM;
    switch (props.difficulty) {
        case DIFFICULTY_LEVEL.EASY:
            MAX_CLUES = MAXIMUM_CLUES_EASY
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
            MAX_CLUES = MAXIMUM_CLUES_MEDIUM
            break;
        case DIFFICULTY_LEVEL.EXTRA_HARD:
        case DIFFICULTY_LEVEL.HARD:
            MAX_CLUES = MAXIMUM_CLUES_HARD
            break;
    }

    const marks = intRange(MIN_CLUES, MAX_CLUES, Math.ceil((MAX_CLUES - MIN_CLUES) / 4), true).map(
        value => ({
            value,
            label: value
        })
    );
    const shouldShowRangeSlider = () => props.difficulty !== DIFFICULTY_LEVEL.EASY_NEW;
    const [isRangeSliderVisible, setRangeSliderVisible] = useState(shouldShowRangeSlider())

    useEffect(
        () => {
            setRangeSliderVisible(shouldShowRangeSlider());

            if (props.numberOfClues > MAX_CLUES) {
                /**
                 * Reason for @ts-ignore.
                 *
                 * Wrapping a prop of type ((value: number) => void) in ((event: React.ChangeEvent, value: number) => void)
                 * triggers an infinite loop, even when not calling useEffect.
                 * a) The event parameter cannot be made optional.
                 * b) The underlying Slider component of
                 * {@link DiscreteRangeSlider} does not expose a ref to its input to avoid that either.
                 * c) atm I am unable to construct a type to work around the issue
                 *
                 * So we need just need to ignore the TS compiler here.
                 */
                //@ts-ignore
                props.setNumberOfClues(MAX_CLUES);
            } else if (props.numberOfClues < MIN_CLUES) {
                //@ts-ignore
                props.setNumberOfClues(MIN_CLUES);
            }
        }, [
            props.difficulty
        ]
    )

    const showMinClueInfo = () => {
        return props.numberOfClues <= MIN_CLUES + 3 &&
            //hide warning if the specified number of hints was achieved.
            (
                props.numberOfFilledCellsInCurrentPuzzle >= props.numberOfClues ||
                props.difficulty !== props.difficultyOfCurrentPuzzle
            )
    }

    return <Box sx={{p: 1}}>
        <ThemeProvider theme={ksuduoThemeNormal}>
            <FormControl fullWidth={true} variant="standard">
                <InputLabel htmlFor="generator-difficulty">Difficulty</InputLabel>
                <NativeSelect
                    value={props.difficulty}
                    onChange={props.setDifficulty}
                    inputProps={{
                        name: 'difficulty',
                        id: 'generator-difficulty',
                    }}
                >
                    <option value={DIFFICULTY_LEVEL.EASY_NEW}>Easiest</option>
                    <option value={DIFFICULTY_LEVEL.EASY}>Easy</option>
                    <option value={DIFFICULTY_LEVEL.MEDIUM}>Medium</option>
                    <option value={DIFFICULTY_LEVEL.HARD}>Hard</option>
                    <option value={DIFFICULTY_LEVEL.EXTRA_HARD}>Extra Hard</option>
                </NativeSelect>
                <FormHelperText style={{lineHeight: 1, marginBottom: ksuduoThemeNormal.spacing(2)}}>
                    {props.difficulty === DIFFICULTY_LEVEL.EASY_NEW ? 'Solvable with naked singles alone. Hints prefer row, column or block explanations (hidden singles) for the same forced digits.' : props.difficulty === DIFFICULTY_LEVEL.EASY ? 'Naked and hidden singles only.' : props.difficulty === DIFFICULTY_LEVEL.MEDIUM ? 'Singles and locked candidates (pointing / claiming).' : props.difficulty === DIFFICULTY_LEVEL.HARD ? 'Singles, locked candidates and naked pairs.' : 'All Hard techniques, plus X-Wing, XY-Wing and Swordfish.'}
                    {' These are technique limits; a puzzle may be easier. More clues may be kept to respect the limit.'}
                </FormHelperText>
            </FormControl>
        </ThemeProvider>
        {isRangeSliderVisible ?
            <fieldset aria-label={"Number of hints (filled cells)"}>
                <InputLabel htmlFor="difficulty-select" style={{fontSize: '.75rem'}}>
                    Number of hints (filled cells)
                </InputLabel>
                <DiscreteRangeSlider id={"difficulty-select"}
                                     marks={marks}
                                     value={props.numberOfClues}
                                     step={1}
                                     valueLabelDisplay={"auto"}
                                     min={MIN_CLUES}
                                     max={MAX_CLUES}
                                     onChange={(event, value) => props.setNumberOfClues(value as number)}
                /></fieldset> : null}
        <ThemeProvider theme={ksuduoThemeSecond}>
            <Box sx={{overflow: "hidden", transition: "max-height .75s ease-out", maxHeight: showMinClueInfo() ? "15rem" : "0"}}>
                <Typography component='small' variant={'subtitle1'}
                            style={{lineHeight: '.75'}}>
                    Generating sudokus with a few hints and/or high difficulty can take some time.
                    <br/>
                    After trying for a while, the generator might accept a sudoku with more hints than specified.
                    The minimum number of hints for a solvable sudoku has been proven to be 17.
                    But puzzles like that are not in the scope of this generator.
                </Typography>
            </Box>
        </ThemeProvider>
    </Box>
}