import {makeStyles, ThemeProvider} from "@material-ui/styles";
import * as React from "react";
import {ChangeEvent, useEffect, useState} from "react";
import {Board, OptionalCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudoku, {
    DEFAULT_CLUES,
    MINIMUM_CLUES,
    verboseGeneratorExplanationText
} from "../../generator/generator";
import {
    CheckCircleRounded,
    EmojiObjectsRounded,
    HelpOutlineRounded,
    HighlightOffRounded,
    HighlightRounded,
    SentimentSatisfiedRounded,
    UndoRounded
} from '@material-ui/icons';
import {
    Box,
    Container,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputLabel,
    Modal,
    NativeSelect,
    Theme,
    Typography
} from "@material-ui/core";
import {Button} from "../Controls/Button";
import GeneratorConfiguration from "../Controls/GeneratorConfiguration";
import {BOARD_SIZE, CouldNotSolveSudokuPassedToConstructorError, Sudoku} from "../../model/Sudoku";
import {SOLVERS} from "../../solver/solver";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";
import {cloneDeep} from "lodash-es";

import SudokuWorker from "worker-loader!../../worker/sudoku.worker";
import {MSGEVT_SOURCE, WORKER_ACTIONS} from "../../worker/sudoku.worker";
import testWorker from "../../worker/testWorkerActuallyWorks";
import {boardFromLocalStorage, persist} from "../../persistence/localStorage";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {GenerateButton} from "../Controls/GenerateButton";
import {ModalBaseStyles} from "../Message/ModalBaseStyles";

let sudokuWorker: Worker;
let useWebWorker = false;

if (window.Worker) {
    try {
        sudokuWorker = new SudokuWorker();
        window.onbeforeunload = () => {
            sudokuWorker.terminate();
        }
    } catch {
        /** Nothing to handle here. See {@link useWebWorker}.*/
    }
}

const checkWebWorkerSupport = async (): Promise<boolean> => {
    return await testWorker();
}
/**
 * jump through some hoops, because presence of window.Worker alone doesn't guarantee that
 * the Worker actually works (CORS, Blockers...). Verify with a test message that the Web Worker works.
 */
checkWebWorkerSupport().then(
    (value => {
        useWebWorker = value;
    })
);

export const Game = () => {
    if (IS_DEVELOPMENT) {
        console.log(useWebWorker ? 'Using web worker, test succeeded.' : 'Falling back to synchronous puzzle generation.')
    }
    const [state, setState] = useState({
        sudoku: boardFromLocalStorage(),
        numberOfClues: DEFAULT_CLUES,
        generatorSolver: SOLVERS.MATTFLOW,
        errorMsg: '',
        highlightedCell: undefined as OptionalCell,
        isWorking: false,
        forceFocus: undefined as OptionalCell,
        solvedByApp: false
    });

    const resetStateCommons = {
        solvedByApp: false,
        errorMsg: '',
        highlightedCell: undefined,
        isWorking: false
    }

    const generateSudoku = () => {
        let invalidInitialSudokuAccidents = 0; //see `catch` below, should happen very rarely
        if (useWebWorker) {
            if (state.isWorking) return;
            setState(prevState => ({...prevState, isWorking: true}));
            sudokuWorker.postMessage({
                source: MSGEVT_SOURCE,
                data: [WORKER_ACTIONS.GENERATE, state.numberOfClues]
            });
            const listener = (event: MessageEvent) => {
                try {
                    setState(prevState =>
                        ({
                            ...prevState,
                            isWorking: false,
                            sudoku: new Sudoku(event.data)
                        })
                    );
                    sudokuWorker.removeEventListener("message", listener);
                } catch (e) {
                    //in RARE cases, the generator still produces unsolvable Sudokus.
                    //this is currently hard to handle in the correct place, so we retry here.
                    //warts and all - it works.
                    if (e instanceof CouldNotSolveSudokuPassedToConstructorError) {
                        console && console.error(e);
                        invalidInitialSudokuAccidents++;
                        //set isWorking to false to circumvent early return in recursive call.
                        setState(prevState => ({...prevState, isWorking: false}));
                        if (invalidInitialSudokuAccidents > 16) return;
                        sudokuWorker.terminate();
                        sudokuWorker = new SudokuWorker();
                        generateSudoku();
                    }
                }
            }
            sudokuWorker.addEventListener('message', listener);
        } else {
            if (IS_DEVELOPMENT) {
                console.log("Falling back to synchronous generation.");
            }
            setState(prevState => ({...prevState, isWorking: true}));
            const sudoku = generateRandomSudoku(state.numberOfClues);
            setState(prevState =>
                ({
                    ...prevState,
                    isWorking: false,
                    sudoku
                })
            );
        }
    }

    //no Sudoku in localStorage
    if (state.sudoku.isEmpty()) {
        generateSudoku();
    }

    const updateNumberOfClues = (e: ChangeEvent, numberOfClues: number): void => {
        setState(prevState => {
            return ({
                ...prevState,
                numberOfClues
            });
        })
    };

    const resetSudoku = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.reset();
        setState(prevState => ({
            ...prevState,
            sudoku: sudoku,
            ...resetStateCommons
        }));
        if (state.sudoku.isEmpty()) {
            generateSudoku();
        }
    }

    const showSolution = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.showSolution();
        setState(prevState => ({...prevState, sudoku, ...resetStateCommons, solvedByApp: true}));
    }

    const updateCallback = () => {
        setState(prevState => ({...prevState, errorMsg: '', isWorking: false}));
        if (!state.sudoku.isEmpty()) {
            persist(state.sudoku);
        }
    }

    useEffect(updateCallback, [state.highlightedCell, state.generatorSolver, state.sudoku]);

    const selectSolver: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        setState(prevState => ({...prevState, solver: +event.target.value as SOLVERS}))
    }

    const showMinClueInfo = () => {
        return state.numberOfClues <= MINIMUM_CLUES && state.sudoku.getNumberOfFilledCells() > MINIMUM_CLUES;
    }

    const MinClueInfo = () => {
        return showMinClueInfo() ? <Typography component={"legend"} style={{color: '#aa0000'}}>
                The minimum number of clues for a solvable Sudoku has been proven to be 17! <SentimentSatisfiedRounded/>
            </Typography> :
            null;
    }

    const giveHint = () => {
        if (!(state.sudoku.isSolved() || state.isWorking)) {
            const cell = state.sudoku.getRandomEmptyOrInvalidCell();
            const value = state.sudoku.getValueFromSolution(cell.x, cell.y);
            if (value !== undefined) {
                const sudoku = cloneDeep(state.sudoku);
                sudoku.setValue(cell.x, cell.y, value);
                setState(prevState => ({
                    ...prevState,
                    sudoku,
                    highlightedCell: cell,
                    forceFocus: cell,
                    solvedByApp: prevState.sudoku.getNumberOfFilledCells() === BOARD_SIZE - 1
                }));
                setTimeout(() => {
                    setState(prevState => ({...prevState, highlightedCell: undefined, forceFocus: undefined}))
                }, 250);
            }
        }
    }

    const undo = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.undo();
        setState(prevState => ({
            ...prevState,
            sudoku,
            solvedByApp: false
        }));
    }

    /**
     * I don't know about the perfomance implications of 1 "god" state object VS multiple useState hooks.
     * A separate hook is more convenient here.*/
    const [isExplanationModalOpen, setExplanationModalOpen] = React.useState(false);

    const percentFilled = () => `
        ${+(state.sudoku.getNumberOfFilledCells() / BOARD_SIZE * 100).toFixed(1)}%`;

    const wFullMarginTop = makeStyles((theme: Theme) => ({
        root: {
            marginTop: theme.spacing(2),
            width: '100%'
        }
    }));

    return <Container style={{position: 'relative'}}>
        <Grid container spacing={3} justify={"center"}>
            <Grid item xs={12}>
                <h1>Ksuduo</h1>
                <h2>Sudoku Toy Project</h2>
            </Grid>
            <Grid item xs={12} md={8} lg={6} justify={"center"} container>
                <PaperBox p={[1, 2]} maxWidth={"100%"} display={"flex"} flexDirection={"column"}>
                    <Typography component={'small'} style={{marginLeft: '.5rem'}}>
                        {state.sudoku.getNumberOfFilledCells()} / {BOARD_SIZE} ({percentFilled()})
                    </Typography>
                    <Board
                        solutionIsFromApp={state.solvedByApp}
                        sudoku={state.sudoku}
                        cellCallback={updateCallback}
                        highlightedCell={state.highlightedCell}
                        forceFocus={state.forceFocus}
                    />

                    <Box p={1} marginTop={[1, 2, 3]} display={"flex"} justifyContent={"space-between"}
                         flexWrap={"wrap"}>
                        <ThemeProvider theme={ksuduoThemeSecond}>
                            <Button endIcon={<UndoRounded/>} variant="outlined"
                                    disabled={state.sudoku.isHistoryEmpty()} onClick={undo}>
                                Undo
                            </Button>
                            <Button endIcon={<HighlightOffRounded/>} style={{flexBasis: '45%'}} onClick={resetSudoku}
                                    variant="outlined"
                                    color={"primary"}>
                                Reset
                            </Button>
                            <Button endIcon={<EmojiObjectsRounded/>}
                                    style={{flexBasis: '45%'}} color="secondary" onClick={giveHint} variant="outlined">
                                Hint
                            </Button>
                        </ThemeProvider>
                    </Box>

                </PaperBox>
            </Grid>
            <Grid item xs alignItems={"stretch"} direction={"column"} container>
                <Grid item>
                    {/*padding is not symmetric here because the range slider
                    maintains whitespace for its value label at the top*/}
                    <PaperBox px={[2, 4]} pt={0} pb={[2, 4]}>
                        <GeneratorConfiguration setNumberOfClues={updateNumberOfClues}/>
                        {showMinClueInfo() ?
                            <MinClueInfo/> : null
                        }
                        <GenerateButton onClick={generateSudoku} isWorking={state.isWorking}/>

                        <Button variant="text" startIcon={<HelpOutlineRounded/>}
                                onClick={() => setExplanationModalOpen(true)}>
                            <Typography component={"small"}>How does it work?</Typography>
                        </Button>
                        <Modal open={isExplanationModalOpen}>
                            <Box className={ModalBaseStyles().root}>
                                <Typography
                                    style={{whiteSpace: 'pre-wrap'}}>{verboseGeneratorExplanationText}</Typography>
                                <IconButton style={{margin: 'auto', display: 'block'}} title="Close"
                                            onClick={() => setExplanationModalOpen(false)}>
                                    <CheckCircleRounded/>
                                </IconButton>
                            </Box>
                        </Modal>
                    </PaperBox>
                </Grid>
                <Grid item>
                    <PaperBox p={[2, 4]} mt={[1, 2]}>
                        <Button endIcon={<HighlightRounded/>}
                                disabled={state.sudoku.isSolved() || !state.sudoku.hasSolutionSet()}
                                onClick={showSolution} variant="contained">
                            Show Solution
                        </Button>
                        {state.errorMsg.length ?
                            <Typography style={{color: 'red', fontWeight: 'bold'}}>{state.errorMsg}</Typography>
                            : null}
                    </PaperBox>
                </Grid>
                <Grid item>
                    <PaperBox p={[2, 4]} mt={[1, 2]}>
                        <FormControl className={wFullMarginTop().root}>
                            <InputLabel htmlFor="solver-select">Solver</InputLabel>
                            <NativeSelect
                                value={state.generatorSolver}
                                onChange={selectSolver}
                                inputProps={{
                                    name: 'solver',
                                    id: 'solver-select',
                                }}
                            >
                                <option value={SOLVERS.MATTFLOW}>@mattflow/sudoku-solver</option>
                            </NativeSelect>
                            <FormHelperText>Select a solver algorithm to assist with Sudoku generation</FormHelperText>
                        </FormControl>
                    </PaperBox>
                </Grid>
            </Grid>
        </Grid>
    </Container>
}