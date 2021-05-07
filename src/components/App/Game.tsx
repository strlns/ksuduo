import {ThemeProvider} from "@material-ui/styles";
import * as React from "react";
import {ChangeEvent, useCallback, useEffect, useState} from "react";
import {Board, OptionalCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudoku, {DIFFICULTY_LEVEL} from "../../generator/generator";
import {
    CheckCircleRounded,
    EmojiObjectsRounded,
    HighlightOffRounded,
    HighlightRounded,
    ThumbUp,
    UndoRounded
} from '@material-ui/icons';
import {Box, Container, FormControlLabel, Grid, Icon, IconButton, Modal, Switch, Typography} from "@material-ui/core";
import {Button, Button45Mt} from "../Controls/Button";
import GeneratorConfiguration from "../Generator/GeneratorConfiguration";
import {Sudoku} from "../../model/Sudoku";
import {PaperBox, paperBoxDefaultLayoutProps} from "../MaterialUiTsHelper/PaperBox";
import {cloneDeep} from "lodash-es";

import SudokuWorker from "worker-loader!../../worker/sudoku.worker";
import {MSGEVT_SOURCE, WORKER_ACTIONS} from "../../worker/sudoku.worker";
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
    numberOfClues: number,
    difficulty: DIFFICULTY_LEVEL,
    highlightedCell: OptionalCell,
    isWorking: boolean,
    forceFocus: OptionalCell,
    solvedByApp: boolean,
    isPaused: boolean, //paused by user
    secondsElapsed: number,
    timerEnabled: boolean
}

// only used to detect initial render for timer.
interface GameProps {
}

/**
 * This component wraps way too much state,
 * this causes unneeded re-renders and uneeded localStorage access each time
 * the Timer interval callback is called.
 *
 * @todo unwrap child components. Done: Board.tsx doesn't re-render every 1000ms.
 */
export const Game = (props: GameProps) => {
    const {
        board: initialBoard,
        secondsElapsed: initialSeconds,
        isPaused,
        timerEnabled
    } = restoreGameStateOrInitialize();
    const [state, setState] = useState({
        sudoku: initialBoard,
        numberOfClues: DEFAULT_CLUES,
        difficulty: DIFFICULTY_LEVEL.EASY,
        highlightedCell: undefined as OptionalCell,
        isWorking: false,
        forceFocus: undefined as OptionalCell,
        // do not repeat congratulation on reload.
        solvedByApp: initialBoard.isSolved(),
        secondsElapsed: initialSeconds,
        isPaused,
        timerEnabled,
    } as GameState);

    const resetStateCommons = {
        solvedByApp: false,
        highlightedCell: undefined,
        isWorking: false,
        isPaused: false,
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
        timer.start();
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
        setState(prevState => ({...prevState, sudoku, ...resetStateCommons, solvedByApp: true}));
    }

    const persistState = () => {
        const {sudoku: board, isPaused} = state;
        const gameState = {
            board, isPaused, secondsElapsed: state.secondsElapsed, timerEnabled: state.timerEnabled
        } as GameStateSerializable
        persist(gameState);
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
            setWinnerModalOpen(state.sudoku.isSolved() && !state.solvedByApp);
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

    const percentFilled = () => `
        ${+(state.sudoku.getNumberOfFilledCells() / BOARD_SIZE * 100).toFixed(1)}%`;

    return <Container style={{position: 'relative', zIndex: 3}}>
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
                        togglePaused={togglePaused}
                        supportsInputMode={supportsInputModeAttribute}
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
                            secondsElapsed={state.secondsElapsed}
                            isPaused={state.isPaused}
                            togglePaused={togglePaused}
                            isWorking={state.isWorking}
                            solvedByApp={state.solvedByApp}
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
                        </Box>
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
                                                setDifficulty={selectDifficulty}
                                                numberOfFilledCellsInCurrentPuzzle={state.sudoku.getNumberOfFilledCells()}
                        />

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