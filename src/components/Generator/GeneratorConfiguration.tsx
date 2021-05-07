import * as React from "react"
import {useEffect} from "react"
import {
    Box,
    FormControl,
    FormHelperText,
    IconButton,
    InputLabel,
    Modal,
    NativeSelect,
    ThemeProvider
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {DIFFICULTY_LEVEL, verboseGeneratorExplanationText} from "../../generator/generator";
import {BOARD_SIZE, DEFAULT_CLUES, MINIMUM_CLUES} from "../../model/Board";
import intRange from "../../utility/numberRange";
import {CheckCircleRounded, CloseRounded, HelpOutlineRounded, SentimentSatisfiedRounded} from "@material-ui/icons";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {DiscreteRangeSlider} from "../Controls/DiscreteRangeSlider";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {Button} from "../Controls/Button";
import {ModalBaseStyles} from "../Message/ModalBaseStyles";
import {makeStyles} from "@material-ui/core/styles";

interface GeneratorConfigurationProps {
    numberOfClues: number,
    setNumberOfClues: (event: React.ChangeEvent<{}>, value: number) => void,
    difficulty: DIFFICULTY_LEVEL,
    setDifficulty: React.ChangeEventHandler<HTMLSelectElement>,
    numberOfFilledCellsInCurrentPuzzle: number,
}

const infoCollapseStyle = makeStyles({
    root: {
        overflow: 'hidden',
        transition: 'max-height .75s ease-out'
    }
});


const MAXIMUM_CLUES_EASY = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 2 - 4));
const MAXIMUM_CLUES_MEDIUM = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 3 + 2));
const MAXIMUM_CLUES_HARD = Math.min(BOARD_SIZE, Math.floor(BOARD_SIZE / 4 + 4));

const MINIMUM_CLUES_EASY = Math.min(MINIMUM_CLUES + 4, MAXIMUM_CLUES_EASY);

export default (props: GeneratorConfigurationProps) => {
    let MAX_CLUES = MAXIMUM_CLUES_MEDIUM, MIN_CLUES = MINIMUM_CLUES;
    switch (props.difficulty) {
        case DIFFICULTY_LEVEL.EASY:
            MAX_CLUES = MAXIMUM_CLUES_EASY
            MIN_CLUES = MINIMUM_CLUES_EASY
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
                 * b) The underlying {@link Slider} component of
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
        return props.numberOfClues <= MINIMUM_CLUES && props.numberOfFilledCellsInCurrentPuzzle > MINIMUM_CLUES;
    }

    const [isExplanationModalOpen, setExplanationModalOpen] = React.useState(false);

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
            Number of clues (filled cells)
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
            <Box className={infoCollapseClass} style={{maxHeight: showMinClueInfo() ? '6rem' : '0'}}>
                <Typography component='small' variant={'subtitle1'} color={'primary'}
                            style={{lineHeight: '.75'}}>
                    The minimum number of clues for a solvable Sudoku has been proven to be 17!
                </Typography>
                <SentimentSatisfiedRounded color={'primary'} style={{
                    fontSize: '1em',
                    position: 'relative',
                    top: '.25em',
                    marginLeft: '.25em'
                }}/>
            </Box>
        </ThemeProvider>
        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
            <Button fullWidth={true} variant="text" size="small"
                    endIcon={<HelpOutlineRounded/>}
                    onClick={() => setExplanationModalOpen(true)}>
                How does it work
            </Button>
        </Box>
        <Modal open={isExplanationModalOpen}>
            <Box className={ModalBaseStyles().root}>
                <Box display='flex'>
                    <Typography component={'h3'} variant={'h3'} style={{flexGrow: 1}}>
                        Sudoku Generator
                    </Typography>

                    <IconButton edge='end' title="Close" onClick={() => setExplanationModalOpen(false)}>
                        <CloseRounded/>
                    </IconButton>
                </Box>
                <Typography
                    style={{whiteSpace: 'pre-wrap'}}>{verboseGeneratorExplanationText}</Typography>
                <Box onClick={() => setExplanationModalOpen(false)}>
                    <IconButton style={{margin: 'auto', display: 'block'}} title="Close">
                        <CheckCircleRounded color={'primary'}/>
                    </IconButton>
                </Box>
            </Box>
        </Modal>
    </Box>
}