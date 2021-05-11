import {ThemeProvider} from "@material-ui/styles";
import * as React from "react";
import {ChangeEvent, useCallback, useEffect, useState} from "react";
import {Board, OptionalCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudoku, {DIFFICULTY_LEVEL, GENERATOR_CODE} from "../../generator/generator";
import {
    CheckCircleRounded,
    EmojiObjectsRounded,
    HighlightOffRounded,
    HighlightRounded,
    ThumbUp,
    UndoRounded
} from '@material-ui/icons';
import {
    Box,
    Container,
    FormControlLabel,
    Grid,
    Icon,
    IconButton,
    LinearProgress,
    Modal,
    Switch,
    Typography
} from "@material-ui/core";
import {Button, Button45Mt} from "../Controls/Button";
import GeneratorConfiguration from "../Generator/GeneratorConfiguration";
import {Sudoku} from "../../model/Sudoku";
import {PaperBox, paperBoxDefaultLayoutProps} from "../MaterialUiTsHelper/PaperBox";
import {cloneDeep} from "lodash-es";

import SudokuWorker from "worker-loader!../../worker/sudoku.worker";
import {GeneratorResultFromWorker, MSGEVT_SOURCE, WORKER_ACTIONS} from "../../worker/sudoku.worker";
import testWorker from "../../worker/testWorkerActuallyWorks";
import {GameStateSerializable, persist, restoreGameStateOrInitialize} from "../../persistence/localStorage";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {GenerateButton} from "../Generator/GenerateButton";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {Clock} from "../Board/Clock";
import isInputModeAttributeSupported from "../../utility/isInputModeAttributeSupported";
import {BOARD_SIZE, DEFAULT_CLUES} from "../../model/Board";
import {ksuduoThemeSecondWinnerModal} from "../Theme/WinnerModalTheme";
import {WinnerMessage} from "../Message/WinnerMessage";
import {formatTime} from "../../utility/formatTime";
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

let timer = new Timer();

export interface GameState {
    sudoku: Sudoku,
    msg: string,
    numberOfClues: number,
    difficulty: DIFFICULTY_LEVEL,
    currentDifficulty: DIFFICULTY_LEVEL,
    highlightedCell: OptionalCell,
    isWorking: boolean,
    forceFocus: OptionalCell,
    solutionShown: boolean,
    isPaused: boolean, //paused by user
    secondsElapsed: number,
    timerEnabled: boolean
}

// only used to detect initial render for timer.
interface GameProps {
}

/**
 * This component wraps way too much state
 * @todo unwrap child components.
 * Done: Board.tsx doesn't re-render every 1000ms.
 */

const {
    board: initialBoard,
    secondsElapsed: initialSeconds,
    isPaused: initialIsPaused,
    timerEnabled: initialTimerEnabled,
    currentDifficulty
} = restoreGameStateOrInitialize();

console.log(currentDifficulty);

export const Game = (props: GameProps) => {
    const [state, setState] = useState({
        sudoku: initialBoard,
        numberOfClues: DEFAULT_CLUES,
        currentDifficulty,
        difficulty: DIFFICULTY_LEVEL.EASY,
        highlightedCell: undefined as OptionalCell,
        isWorking: false,
        msg: '',
        forceFocus: undefined as OptionalCell,
        // do not repeat congratulation on reload.
        solutionShown: initialBoard.isSolved(),
        secondsElapsed: initialSeconds,
        isPaused: initialIsPaused,
        timerEnabled: initialTimerEnabled,
    } as GameState);

    const resetStateCommons = {
        solutionShown: false,
        highlightedCell: undefined,
        isWorking: false,
        isPaused: false,
        msg: '',
        secondsElapsed: 0,
    };

    const [supportsInputModeAttribute, setSupportsInputModeAttribute] = useState(false);

    const [winnerModalOpen, setWinnerModalOpen] = React.useState(false);

    const generateSudoku = () => {
        if (IS_DEVELOPMENT) {
            console.log(useWebWorker ? 'Using web worker, test succeeded.' : 'Falling back to synchronous puzzle generation.')
        }
        if (useWebWorker) {
            if (state.isWorking) return;
            setState(prevState => ({...prevState, isWorking: true, msg: ''}));
            sudokuWorker.postMessage({
                source: MSGEVT_SOURCE,
                data: [WORKER_ACTIONS.GENERATE, state.numberOfClues]
            });
            const listener = (event: MessageEvent) => {
                const result = event.data as GeneratorResultFromWorker;
                sudokuWorker.removeEventListener("message", listener);
                if (!Array.isArray(event.data)) {
                    throw new Error('Unexpected response');
                }
                setState(prevState =>
                    ({
                        ...prevState,
                        ...resetStateCommons,
                        currentDifficulty: state.difficulty,
                        sudoku: new Sudoku(result[1]),
                        ...(result[0] === GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL ? {msg: result[2]} : {})
                    })
                );
                timer.start();
            }
            sudokuWorker.addEventListener('message', listener);
        } else {
            if (IS_DEVELOPMENT) {
                console.log("Falling back to synchronous generation.");
            }
            setState(prevState => ({...prevState, isWorking: true}));
            const result = generateRandomSudoku(state.numberOfClues);
            setState(prevState =>
                ({
                    ...prevState,
                    ...resetStateCommons,
                    currentDifficulty: state.difficulty,
                    sudoku: result[1],
                    ...(result[0] === GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL ? {msg: result[2]} : {})
                })
            );
            timer.start();
        }
    }

    //no Sudoku in localStorage
    if (state.sudoku.isEmpty()) {
        generateSudoku();
    }

    const updateNumberOfClues = (e: ChangeEvent | {}, numberOfClues: number): void => {
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
        timer.start();
    }

    const showSolution = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.showSolution();
        setState(prevState => ({...prevState, sudoku, ...resetStateCommons, solutionShown: true}));
    }

    const persistState = () => {
        const {sudoku: board, isPaused, secondsElapsed, timerEnabled, currentDifficulty} = state;
        persist({
            board, isPaused, secondsElapsed, timerEnabled, currentDifficulty
        } as GameStateSerializable);
    }
    /**
     * Terminate service worker before unload, pause the timer
     * (This is NOT the same as pausing the game. It's only to stop time tracking earlier.)
     * Persist before unload, including the timer state.
     *
     * @todo replace beforeunload event with visibilitychange event
     */
    window.onbeforeunload = () => {
        timer.pause();
        sudokuWorker.terminate();
        setState(
            prevState => ({
                ...prevState
            })
        );
        persistState();
    }

    const updateCallback = useCallback(() => {
        setState(prevState => ({...prevState, isWorking: false}));
        if (!state.sudoku.isEmpty()) {
            persistState();
        }
    }, [
        state.sudoku.getFlatValuesAsString()
    ]);

    const togglePaused = useCallback(() => {
        setState(prevState => ({...prevState, isPaused: !prevState.isPaused}));
        if (!state.isPaused) {
            timer.resume();
        } else {
            timer.pause();
        }
    }, [
        state.isPaused
    ]);

    /**
     * Duties on initial render.
     */
    useEffect(
        () => {
            setSupportsInputModeAttribute(isInputModeAttributeSupported());
            if (!state.isPaused) {
                timer.start(state.secondsElapsed)
            }
            timer.secondsElapsed = state.secondsElapsed;
            timer.callback = () => setState(prevState => ({
                ...prevState,
                secondsElapsed: timer.secondsElapsed
            }));
        }, [props]
    )

    useEffect(
        () => {
            if (state.isPaused) {
                timer.pause();
            } else {
                timer.resume();
            }
        }, [state.isPaused]
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
            setWinnerModalOpen(state.sudoku.isSolved() && !state.solutionShown);
            if (state.sudoku.isSolved()) {
                timer.pause();
            } else if (!state.isPaused) {
                // keep it consistent when jumping between solution and undo etc.
                timer.resume();
            }
        },
        [
            state.sudoku.isSolved(),
        ]
    )

    const selectDifficulty: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        setState(prevState => ({...prevState, difficulty: +event.target.value as DIFFICULTY_LEVEL}))
    }

    let hintTimeout: number;

    const giveHint = () => {
        if (!(state.sudoku.isSolved() || state.isWorking)) {
            const cell = state.sudoku.getEmptyOrInvalidCellWithMinimumPossibilites();
            if (cell) {
                const value = state.sudoku.getValueFromSolution(cell.x, cell.y);
                if (value !== undefined) {
                    const sudoku = cloneDeep(state.sudoku);
                    sudoku.setCell({...cell, value, isInitial: true});
                    setState(prevState => ({
                        ...prevState,
                        sudoku,
                        highlightedCell: cell,
                        forceFocus: cell,
                        solutionShown: prevState.sudoku.getNumberOfFilledCells() === BOARD_SIZE - 1
                    }));
                    if (hintTimeout !== undefined) {
                        clearTimeout(hintTimeout);
                    }
                    hintTimeout = window.setTimeout(() => {
                        setState(prevState => ({...prevState, highlightedCell: undefined, forceFocus: undefined}))
                    }, 5000);
                }
            }
        }
    }

    const undo = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.undo();
        setState(prevState => ({
            ...prevState,
            sudoku,
            solutionShown: false
        }));
    }

    const percentFilled = () => state.sudoku.getNumberOfCorrectlyFilledCells() / BOARD_SIZE * 100
    const difficultyLabel = () => {
        switch (state.currentDifficulty) {
            case DIFFICULTY_LEVEL.EASY:
                return 'Easy';
            case DIFFICULTY_LEVEL.MEDIUM:
                return 'Medium';
            default:
                return 'Hard';
        }
    }

    return <Container style={{padding: 0}}>
        <Grid container spacing={3} justify={"center"}
              style={{padding: 0, position: 'relative', zIndex: 3}}
              className={`game${state.isWorking ? ' working' : ''}`}>
            <Grid item xs={12}>
                <h1>Ksuduo</h1>
                <h2>Sudoku Toy Project</h2>
            </Grid>
            <Grid item xs={12} md={8} lg={6} justify={"center"} container>
                <PaperBox {...paperBoxDefaultLayoutProps} width={'100%'}>
                    <Box p={1}>
                        <LinearProgress value={percentFilled()} variant={'determinate'} style={{marginTop: '12px'}}/>
                        <Typography component={'small'}
                                    style={{
                                        textAlign: 'center',
                                        marginBottom: ksuduoThemeNormal.spacing(1),
                                        fontSize: '.75em',
                                    }}>
                            {state.sudoku.getNumberOfCorrectlyFilledCells()} / {BOARD_SIZE} ({`${percentFilled().toFixed(1)}%`})
                        </Typography>
                    </Box>
                    <Board
                        solutionIsFromApp={state.solutionShown}
                        sudoku={state.sudoku}
                        cellCallback={updateCallback}
                        highlightedCell={state.highlightedCell}
                        forceFocus={state.forceFocus}
                        isPaused={state.isPaused}
                        togglePaused={togglePaused}
                        supportsInputMode={supportsInputModeAttribute}
                    />
                    <Box p={1} display={'flex'} justifyContent={'space-between'} style={{
                        fontSize: '.75em',
                    }}>
                        <Typography component={'small'}
                        >
                            Current difficulty: {difficultyLabel()}
                        </Typography>
                        <Typography component={'small'}>
                            Hints: {state.sudoku.getFilledCells().filter(cell => cell.isInitial).length}
                        </Typography>
                    </Box>
                </PaperBox>
            </Grid>
            <Grid item xs container alignItems={"stretch"} alignContent={"flex-start"}>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps}>
                        <Clock
                            secondsElapsed={state.secondsElapsed}
                            isPaused={state.isPaused}
                            togglePaused={togglePaused}
                            isWorking={state.isWorking}
                            solutionShown={state.solutionShown}
                            solved={state.sudoku.isSolved()}
                            visible={state.timerEnabled}
                        />
                        <Box justifyContent={'center'} display={'flex'}>
                            <FormControlLabel
                                control={
                                    <Switch checked={state.timerEnabled}
                                            onChange={(event, value: boolean) => {
                                                setState(prevState => ({...prevState, timerEnabled: value}))
                                            }}/>
                                }
                                label={`${state.timerEnabled ? 'Hide timer' : 'Show timer'}`}
                                labelPlacement={`${state.timerEnabled ? 'start' : 'end'}` as ('end' | 'start')}
                            />
                            {/*the changing label placement is a funny idea, but also a bad idea. switch should not jump around */}
                        </Box>
                    </PaperBox>
                </Grid>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} marginTop={[1, 2, 3]} flexDirection={"row"}
                              justifyContent={"space-between"}
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
                                Add Hint
                            </Button45Mt>
                        </ThemeProvider>
                    </PaperBox>
                </Grid>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} mt={[1, 2]}>
                        <Button endIcon={<HighlightRounded/>}
                                disabled={state.sudoku.isSolved() || !state.sudoku.hasSolutionSet()}
                                onClick={showSolution} variant="contained">
                            Show Solution
                        </Button>
                    </PaperBox>
                </Grid>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} mt={[1, 2]}>
                        <GenerateButton onClick={generateSudoku} isWorking={state.isWorking}/>
                        <GeneratorConfiguration numberOfClues={state.numberOfClues}
                                                setNumberOfClues={updateNumberOfClues}
                                                difficulty={state.difficulty}
                                                difficultyOfCurrentPuzzle={state.currentDifficulty}
                                                setDifficulty={selectDifficulty}
                                                numberOfFilledCellsInCurrentPuzzle={state.sudoku.getNumberOfFilledCells()}
                        />
                        {state.msg.length > 0 ? <Typography>
                                {state.msg}
                            </Typography>
                            : null}
                    </PaperBox>
                </Grid>
            </Grid>
        </Grid>
        <ThemeProvider theme={ksuduoThemeSecondWinnerModal}>
            <Modal
                open={winnerModalOpen}
                onClose={() => setWinnerModalOpen(false)}>
                <WinnerMessage>
                    <Box display={"flex"} justifyContent={"center"}>
                        <Icon children={<ThumbUp/>} fontSize={"large"}/>
                        <Icon children={<ThumbUp/>} fontSize={"large"}/>
                        <Icon children={<ThumbUp/>} fontSize={"large"}/>
                    </Box>
                    <Typography component={'h3'} variant={'h3'}>
                        Congratulations!
                    </Typography>
                    <Typography style={{margin: '1em 0'}}>
                        You successfully completed the Sudoku
                        {state.timerEnabled ? `in ${formatTime(state.secondsElapsed)}.` : ''}
                    </Typography>

                    <Box onClick={() => setWinnerModalOpen(false)}>
                        <IconButton style={{margin: 'auto', display: 'block'}} title="OK">
                            <CheckCircleRounded color={'secondary'}/>
                        </IconButton>
                    </Box>
                </WinnerMessage>
            </Modal>
        </ThemeProvider>
    </Container>
}