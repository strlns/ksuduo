import * as React from "react"
import {useEffect} from "react"
import {Box, FormControl, FormHelperText, InputLabel, NativeSelect, ThemeProvider} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DIFFICULTY_LEVEL} from "../../generator/generator";
import {BOARD_SIZE, DEFAULT_CLUES, MINIMUM_CLUES} from "../../model/Board";
import intRange from "../../utility/numberRange";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {DiscreteRangeSlider} from "../Controls/DiscreteRangeSlider";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {makeStyles} from "@material-ui/core/styles";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (event: React.ChangeEvent<{}>, value: number) => void,
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

const MAXIMUM_CLUES_EASY = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 - 4));
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

    const marks = intRange(MIN_CLUES + 2, MAX_CLUES, 4).map(
        value => ({
            value,
            label: value
        })
    );

    useEffect(
        () => {
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
                props.setNumberOfClues({}, MAX_CLUES);
            } else if (props.numberOfClues < MIN_CLUES) {
                //@ts-ignore
                props.setNumberOfClues({}, MIN_CLUES);
            }
        }, [
            props.difficulty
        ]
    )

    const showMinClueInfo = () => {
        return props.numberOfClues <= MIN_CLUES + 3 &&
            //hide the warning after clicking the generate button.
            (
                props.numberOfFilledCellsInCurrentPuzzle > MIN_CLUES ||
                props.difficulty !== props.difficultyOfCurrentPuzzle
            )
    }

    const infoCollapseClass = infoCollapseStyle().root;

    return <Box p={1}>
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
                <FormHelperText style={{lineHeight: 1, marginBottom: ksuduoThemeNormal.spacing(2)}}>
                    Difficulty changes range of the slider below, but also generator strategy.
                </FormHelperText>
            </FormControl>
        </ThemeProvider>
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
                             aria-labelledby="num-clues"
                             onChange={props.setNumberOfClues}
        />
        <ThemeProvider theme={ksuduoThemeSecond}>
            {/*To do: replace this hideous ad-hoc-solution, maybe with some kind of tooltip*/}
            <Box className={infoCollapseClass} style={{maxHeight: showMinClueInfo() ? '15rem' : '0'}}>
                <Typography component='small' variant={'subtitle1'}
                            style={{lineHeight: '.75'}}>
                    The generator is not optimized for sudokus with a low number of
                    hints. Generating such sudokus might take a while.
                    After trying for some time, the generator will accept a sudoku with more hints than specified.
                    The minimum number of hints for a solvable sudoku has been proven to be 17.
                    But puzzles like that are not in the scope of this generator.
                </Typography>
            </Box>
        </ThemeProvider>
    </Box>
}