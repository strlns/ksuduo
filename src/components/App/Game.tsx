import {makeStyles, ThemeProvider} from "@material-ui/styles";
import * as React from "react";
import {ChangeEvent, useEffect, useState} from "react";
import {Board, OptionalCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudoku, {
    DEFAULT_CLUES,
    DIFFICULTY_LEVEL,
    verboseGeneratorExplanationText
} from "../../generator/generator";
import {
    CheckCircleRounded,
    CloseRounded,
    EmojiObjectsRounded,
    HelpOutlineRounded,
    HighlightOffRounded,
    HighlightRounded,
    UndoRounded
} from '@material-ui/icons';
import {Box, Container, Grid, IconButton, Modal, Theme, Typography} from "@material-ui/core";
import {Button, Button45Mt} from "../Controls/Button";
import GeneratorConfiguration from "../Controls/GeneratorConfiguration";
import {BOARD_SIZE, Sudoku} from "../../model/Sudoku";
import {PaperBox, paperBoxDefaultLayoutProps} from "../MaterialUiTsHelper/PaperBox";
import {cloneDeep} from "lodash-es";

import SudokuWorker from "worker-loader!../../worker/sudoku.worker";
import {MSGEVT_SOURCE, WORKER_ACTIONS} from "../../worker/sudoku.worker";
import testWorker from "../../worker/testWorkerActuallyWorks";
import {GameStateSerializable, persist, restoreGameStateOrInitialize} from "../../persistence/localStorage";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {GenerateButton} from "../Controls/GenerateButton";
import {ModalBaseStyles} from "../Message/ModalBaseStyles";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {Clock} from "../Board/Clock";
import {Timer} from "../../model/Timer";

let sudokuWorker: Worker;
let useWebWorker = false;
if (window.Worker) {
    try {
        sudokuWorker = new SudokuWorker();
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

export interface GameState {
    sudoku: Sudoku,
    numberOfClues: number,
    difficulty: DIFFICULTY_LEVEL,
    errorMsg: string,
    highlightedCell: OptionalCell,
    isWorking: boolean,
    forceFocus: OptionalCell,
    solvedByApp: boolean,
    timer: Timer,
    isPaused: boolean
}

// only used to detect initial render for timer.
interface GameProps {
}

export const Game = (props: GameProps) => {
    const {board: initialBoard, secondsElapsed: initialSeconds, isPaused} = restoreGameStateOrInitialize();
    const [state, setState] = useState({
        sudoku: initialBoard,
        numberOfClues: DEFAULT_CLUES,
        difficulty: DIFFICULTY_LEVEL.EASY,
        errorMsg: '',
        highlightedCell: undefined as OptionalCell,
        isWorking: false,
        forceFocus: undefined as OptionalCell,
        // do not repeat congratulation on reload.
        solvedByApp: initialBoard.isSolved(),
        timer: new Timer(() => setState(
            prevState => ({...prevState, timer: state.timer})
        )),
        isPaused: isPaused
    } as GameState);

    const resetStateCommons = {
        solvedByApp: false,
        errorMsg: '',
        highlightedCell: undefined,
        isWorking: false,
        isPaused: false,
        timer: new Timer(() => setState(
            prevState => ({...prevState, timer: state.timer})
        ))
    };

    const generateSudoku = () => {
        if (IS_DEVELOPMENT) {
            console.log(useWebWorker ? 'Using web worker, test succeeded.' : 'Falling back to synchronous puzzle generation.')
        }
        if (useWebWorker) {
            if (state.isWorking) return;
            setState(prevState => ({...prevState, isWorking: true}));
            sudokuWorker.postMessage({
                source: MSGEVT_SOURCE,
                data: [WORKER_ACTIONS.GENERATE, state.numberOfClues]
            });
            const listener = (event: MessageEvent) => {
                setState(prevState =>
                    ({
                        ...prevState,
                        sudoku: new Sudoku(event.data),
                        ...resetStateCommons
                    })
                );
                sudokuWorker.removeEventListener("message", listener);
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
                    sudoku,
                    ...resetStateCommons
                })
            );
        }
        state.timer.start(0);
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
        state.timer.start(0);
    }

    const showSolution = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.showSolution();
        state.timer.secondsElapsed = 0;
        state.timer.pause();
        setState(prevState => ({...prevState, sudoku, ...resetStateCommons, solvedByApp: true}));
    }

    const persistState = () => {
        const {sudoku: board, isPaused} = state;
        const gameState = {board, isPaused, secondsElapsed: state.timer.secondsElapsed} as GameStateSerializable
        persist(gameState);
    }
    /**
     * Terminate service worker before unload, pause the timer
     * (This is NOT the same as pausing the game. It's only to stop time tracking earlier.)
     * Persist before unload, including the timer state.
     */
    window.onbeforeunload = () => {
        sudokuWorker.terminate();
        if (state.timer !== undefined) {
            state.timer.pause();
        }
        persistState();
    }

    const updateCallback = () => {
        setState(prevState => ({...prevState, errorMsg: '', isWorking: false}));
        if (!state.sudoku.isEmpty()) {
            persistState();
        }
    }
    /**
     * Start timer on initial render (if game is not paused.)
     * `props` is empty and only used to detect initial render.
     * timer object inside state is accessed directly because it is "special"
     * and manages the state hooks by itself.
     * *{@link Timer.callback}
     */
    useEffect(
        () => {
            if (state.isPaused) {
                state.timer.secondsElapsed = initialSeconds;
            } else {
                state.timer.start(initialSeconds);
            }
        }, [props]
    )
    /*Trigger persisting. */
    useEffect(updateCallback,
        [
            state.highlightedCell,
            state.difficulty,
            state.sudoku,
            state.isPaused
        ]
    )

    /*Stop timer on completion. */
    useEffect(() => {
            if (state.sudoku.isSolved()) {
                state.timer.pause();
            } else if (!state.isPaused) {
                // keep it consistent when jumping between solution and undo etc.
                state.timer.resume();
            }
        },
        [
            state.sudoku.isSolved(),
        ]
    )

    const selectDifficulty: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        setState(prevState => ({...prevState, difficulty: +event.target.value as DIFFICULTY_LEVEL}))
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

    const togglePlayPause = (pauseVal: boolean) => {
        const timer = state.timer;
        if (pauseVal) timer.pause();
        else {
            timer.resume();
        }
        setState(prevState => ({...prevState, isPaused: pauseVal, timer}))
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
                <PaperBox {...paperBoxDefaultLayoutProps} width={'100%'}>
                    <Typography component={'small'}
                                style={{
                                    textAlign: 'center',
                                    marginBottom: ksuduoThemeNormal.spacing(1),
                                    fontSize: '.75em'
                                }}>
                        {state.sudoku.getNumberOfFilledCells()} / {BOARD_SIZE} ({percentFilled()})
                    </Typography>
                    <Board
                        solutionIsFromApp={state.solvedByApp}
                        sudoku={state.sudoku}
                        cellCallback={updateCallback}
                        highlightedCell={state.highlightedCell}
                        forceFocus={state.forceFocus}
                        isPaused={state.isPaused}
                        setPaused={togglePlayPause}
                        timer={state.timer}
                    />

                    <Box p={1} marginTop={[1, 2, 3]} display={"flex"} justifyContent={"space-between"}
                         flexWrap={"wrap"}>
                        <ThemeProvider theme={ksuduoThemeSecond}>
                            <Button endIcon={<UndoRounded/>} variant="outlined"
                                    disabled={state.sudoku.isHistoryEmpty()} onClick={undo}>
                                Undo
                            </Button>
                            <Button45Mt endIcon={<HighlightOffRounded/>} onClick={resetSudoku}
                                        variant="outlined"
                                        color={"primary"}>
                                Reset
                            </Button45Mt>
                            <Button45Mt endIcon={<EmojiObjectsRounded/>}
                                        color="secondary" onClick={giveHint} variant="outlined">
                                Hint
                            </Button45Mt>
                        </ThemeProvider>
                    </Box>

                </PaperBox>
            </Grid>
            <Grid item xs container alignItems={"stretch"} alignContent={"flex-start"}>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps}>
                        <Clock
                            seconds={state.timer.secondsElapsed}
                            isPaused={state.isPaused}
                            setPaused={togglePlayPause}
                        />
                    </PaperBox>
                </Grid>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} mt={[1, 2]}>
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
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} mt={[1, 2]}>
                        <GenerateButton onClick={generateSudoku} isWorking={state.isWorking}/>
                        <GeneratorConfiguration numberOfClues={state.numberOfClues}
                                                setNumberOfClues={updateNumberOfClues}
                                                difficulty={state.difficulty}
                                                setDifficulty={selectDifficulty}
                                                numberOfFilledCellsInCurrentPuzzle={state.sudoku.getNumberOfFilledCells()}
                        />
                        <Button className={wFullMarginTop().root} variant="text" size="small"
                                endIcon={<HelpOutlineRounded/>}
                                onClick={() => setExplanationModalOpen(true)}>
                            How does it work
                        </Button>
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
                    </PaperBox>
                </Grid>
            </Grid>
        </Grid>
    </Container>
}