import * as React from "react"
import {useEffect, useState} from "react"
import {Box, FormControl, FormHelperText, InputLabel, NativeSelect, ThemeProvider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DIFFICULTY_LEVEL} from "../../algorithm/generator/generator";
import {BOARD_SIZE, DEFAULT_CLUES, MINIMUM_CLUES} from "../../model/Board";
import intRange from "../../utility/numberRange";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {DiscreteRangeSlider} from "../Controls/DiscreteRangeSlider";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {makeStyles} from "@material-ui/core/styles";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (value: number) => void,
    difficulty: DIFFICULTY_LEVEL,
    setDifficulty: React.ChangeEventHandler<HTMLSelectElement>,
    numberOfFilledCellsInCurrentPuzzle: number,
    difficultyOfCurrentPuzzle: DIFFICULTY_LEVEL
}

const infoCollapseStyle = makeStyles({
    root: {
        overflow: 'hidden',
        transition: 'max-height .75s ease-out'
    }
});

const MIN_CLUES = MINIMUM_CLUES + 4;

const MAXIMUM_CLUES_EASY = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 - 3));
const MAXIMUM_CLUES_MEDIUM = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 3 + 2));
const MAXIMUM_CLUES_HARD = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 4 + 4));

export default (props: GeneratorConfigurationProps) => {
    let MAX_CLUES = MAXIMUM_CLUES_MEDIUM;
    switch (props.difficulty) {
        case DIFFICULTY_LEVEL.EASY:
            MAX_CLUES = MAXIMUM_CLUES_EASY
            break;
        case DIFFICULTY_LEVEL.MEDIUM:
            MAX_CLUES = MAXIMUM_CLUES_MEDIUM
            break;
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

    const infoCollapseClass = infoCollapseStyle().root;

    return <Box p={1}>
        <ThemeProvider theme={ksuduoThemeNormal}>
            <FormControl fullWidth={true}>
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
                </NativeSelect>
                <FormHelperText style={{lineHeight: 1, marginBottom: ksuduoThemeNormal.spacing(2)}}>
                    {`${isRangeSliderVisible ? 'Difficulty changes range of the slider below, but also generator strategy.'
                        : 'Puzzle is guaranteed to be solvable without using advanced techniques.'}`}
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
                                     defaultValue={DEFAULT_CLUES}
                                     step={1}
                                     valueLabelDisplay={"auto"}
                                     min={MIN_CLUES}
                                     max={MAX_CLUES}
                                     onChange={(event, value) => props.setNumberOfClues(value as number)}
                /></fieldset> : null}
        <ThemeProvider theme={ksuduoThemeSecond}>
            <Box className={infoCollapseClass} style={{maxHeight: showMinClueInfo() ? '15rem' : '0'}}>
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