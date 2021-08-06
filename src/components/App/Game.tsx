import {ThemeProvider} from "@material-ui/styles";
import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import {Board, OptionalCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudoku, {
    DIFFICULTY_LEVEL,
    GENERATOR_CODE,
    GeneratorResult
} from "../../algorithm/generator/generator";
import {
    CheckCircleRounded,
    EmojiObjectsRounded,
    HighlightOffRounded,
    HighlightRounded,
    InfoOutlined,
    ThumbUp,
    UndoRounded
} from '@material-ui/icons';
import {Box, Container, Grid, Icon, IconButton, LinearProgress, Modal, Switch, Typography} from "@material-ui/core";
import {Button, Button45Mt} from "../Controls/Button";
import GeneratorConfiguration from "../Generator/GeneratorConfiguration";
import {Sudoku} from "../../model/Sudoku";
import {PaperBox, paperBoxDefaultLayoutProps} from "../MaterialUiTsHelper/PaperBox";
import {cloneDeep} from "lodash-es";

import SudokuWorker from "worker-loader!../../worker/sudoku.worker";
import {GeneratorResultFromWorker, MSGEVT_SOURCE, WORKER_ACTIONS} from "../../worker/sudoku.worker";
import testWorker from "../../worker/testWorkerActuallyWorks";
import {GameStateSerializable, persist} from "../../persistence/localStorage";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import {GenerateButton} from "../Generator/GenerateButton";
import {Clock} from "../Board/Clock";
import isInputModeAttributeSupported from "../../utility/isInputModeAttributeSupported";
import {BOARD_SIZE, DEFAULT_CLUES} from "../../model/Board";
import {WinnerMessage} from "../Message/WinnerMessage";
import {formatTime} from "../../utility/formatTime";
import {Timer} from "../../model/Timer";
import {makeStyles} from "@material-ui/core/styles";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import About from "./About";
import {usePageVisibility} from "react-page-visibility";
import {getNextCellToFill} from "../../algorithm/solver/solverHumanTechniques";
import {CellData} from "../../model/CellData";
import {restoreGameStateOrInitialize} from "../../persistence/restoreGameStateOrInitialize";
import {SOLVING_TECHNIQUE} from "../../algorithm/solver/humanTechniques";
import {getCellWithMinPossAndValueFromSolution} from "../../algorithm/solver/solver";
import {addPossibleValuesToCellDataArray} from "../../algorithm/transformations";

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

let timer = new Timer();

export interface GameState {
    sudoku: Sudoku,
    msg: string,
    numberOfClues: number,
    difficulty: DIFFICULTY_LEVEL,
    currentDifficulty: DIFFICULTY_LEVEL,
    highlightedCell: OptionalCell,
    secondaryHighlight: CellData[],
    isWorking: boolean,
    forceFocus: OptionalCell,
    initialBoardIsSolved: boolean,
    solutionShown: boolean,
    isPaused: boolean, //paused by user
    secondsElapsed: number,
    timerEnabled: boolean
}

// only used to detect initial render for timer.
interface GameProps {
}

/**
 * This component wraps way too much state.
 * Better decompose logic in next project, maybe using redux.
 * Done: Board.tsx doesn't re-render every 1000ms.
 */

const {
    board: initialBoard,
    secondsElapsed: initialSeconds,
    isPaused: initialIsPaused,
    solutionShown: initialSolutionShown,
    timerEnabled: initialTimerEnabled,
    currentDifficulty
} = restoreGameStateOrInitialize();

export const Game = (props: GameProps) => {
    const [state, setState] = useState({
        sudoku: initialBoard,
        numberOfClues: DEFAULT_CLUES,
        currentDifficulty,
        difficulty: currentDifficulty ?? DIFFICULTY_LEVEL.EASY,
        highlightedCell: undefined as OptionalCell,
        secondaryHighlight: [],
        isWorking: false,
        msg: '',
        forceFocus: undefined as OptionalCell,
        initialBoardIsSolved: initialBoard.isSolved(),
        solutionShown: initialSolutionShown,
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
        initialBoardIsSolved: false,
        /*
         this line causes a re-render of Board.tsx every 1000ms.
         @todo place it somewhere else.
         forceFocus: state.sudoku.getInitialFocusCell()
        */
    };

    const [supportsInputModeAttribute, setSupportsInputModeAttribute] = useState(false);

    const [winnerModalOpen, setWinnerModalOpen] = React.useState(false);

    const pageIsVisible = usePageVisibility();

    interface StateFromGen {
        msg?: string,
        sudoku?: Sudoku
    }

    const stateFromGenerator = (result: GeneratorResult | GeneratorResultFromWorker): StateFromGen => {
        const board = result[1] instanceof Sudoku ? result[1] : new Sudoku(result[1]);
        switch (result[0]) {
            case GENERATOR_CODE.OK:
            case GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL:
                return {
                    sudoku: board,
                    ...(result[0] !== GENERATOR_CODE.OK ? {msg: result[2]} : {})
                }
            case GENERATOR_CODE.UNKNOWN_ERROR:
            default:
                if (IS_DEVELOPMENT) {
                    console.error(result);
                }
                return {
                    msg: result[2]
                }
        }
    };

    const generateSudoku = () => {
        if (IS_DEVELOPMENT) {
            console.log(useWebWorker ? 'Using web worker, test succeeded.' : 'Falling back to synchronous puzzle generation.')
        }
        if (useWebWorker) {
            if (state.isWorking) return;
            setState(prevState => ({...prevState, isWorking: true, msg: ''}));
            sudokuWorker.postMessage({
                source: MSGEVT_SOURCE,
                data: [WORKER_ACTIONS.GENERATE, state.numberOfClues, state.difficulty]
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
                        ...stateFromGenerator(result)
                    })
                );
                timer.start();
            }
            sudokuWorker.addEventListener('message', listener);
        } else {
            if (IS_DEVELOPMENT) {
                console.log("Falling back to synchronous generation.");
            }
            requestAnimationFrame(() => {
                setState(prevState => ({...prevState, isWorking: true}));
                setTimeout(() => {
                    const result = generateRandomSudoku(state.numberOfClues, state.difficulty, true);
                    setState(prevState =>
                        ({
                            ...prevState,
                            ...resetStateCommons,
                            currentDifficulty: state.difficulty,
                            ...stateFromGenerator(result)
                        })
                    );
                    timer.start();
                }, 25)
            });
        }
    }

    const updateNumberOfClues = (numberOfClues: number): void => {
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
        } else {
            timer.start();
        }
    }

    const showSolution = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.showSolution();
        setState(prevState => ({...prevState, sudoku, ...resetStateCommons, solutionShown: true}));
    }

    const persistState = () => {
        const {sudoku: board, isPaused, secondsElapsed, timerEnabled, currentDifficulty, solutionShown} = state;
        persist({
            board, isPaused, secondsElapsed, timerEnabled, currentDifficulty, solutionShown
        } as GameStateSerializable);
    }

    const persistAndPause = () => {
        timer.pause();
        setState(
            prevState => ({
                ...prevState
            })
        );
        persistState();
    }

    const resume = () => {
        if (!state.isPaused) {
            timer.resume();
            setState(
                prevState => ({
                    ...prevState
                })
            );
        }
    }

    useEffect(() => {
        if (pageIsVisible) {
            resume()
        } else {
            persistAndPause();
        }
    }, [pageIsVisible]);

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
            /**
             * jump through some hoops, because presence of window.Worker alone doesn't guarantee that
             * the Worker actually works (CORS, Blockers...). Verify with a test message that the Web Worker works.
             */
            checkWebWorkerSupport().then(
                (value => {
                    useWebWorker = value;
                    if (state.sudoku.isEmpty()) {
                        generateSudoku();
                    }
                })
            );
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
            setWinnerModalOpen(state.sudoku.isSolved() && !state.solutionShown && !state.initialBoardIsSolved);
            if (state.sudoku.isSolved()) {
                timer.pause();
            } else if (!state.isPaused) {
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
        if (!(state.isWorking || state.sudoku.isSolved())) {
            const sudoku = cloneDeep(state.sudoku)
            let usedTechnique: SOLVING_TECHNIQUE
            let setUsedTechnique = (tech: SOLVING_TECHNIQUE) => {
                usedTechnique = tech
            }

            let cellWithVal = getNextCellToFill(
                sudoku,
                false,
                setUsedTechnique
            );
            if (!cellWithVal) {
                cellWithVal = getCellWithMinPossAndValueFromSolution(
                    sudoku,
                    setUsedTechnique,
                    addPossibleValuesToCellDataArray(sudoku.getEmptyCells(), sudoku)
                );
            }
            if (!cellWithVal) {
                throw new Error();
            }

            const hintCellData = {...cellWithVal[0], value: cellWithVal[1], isInitial: true}

            if (cellWithVal) {
                sudoku.setValueUseCell(hintCellData)
                setState(prevState => ({
                    ...prevState,
                    sudoku,
                    highlightedCell: sudoku.getCell(hintCellData.x, hintCellData.y),
                    secondaryHighlight: getSecondaryHighlightFromCellAndTechnique(
                        usedTechnique,
                        hintCellData,
                        sudoku
                    ),
                    forceFocus: hintCellData,
                    solutionShown: prevState.sudoku.getNumberOfFilledCells() === BOARD_SIZE - 1,
                }));
            }
            if (hintTimeout !== undefined) {
                clearTimeout(hintTimeout)
            }

            hintTimeout = window.setTimeout(() => {
                setState(prevState => ({
                        ...prevState,
                        highlightedCell: undefined,
                        secondaryHighlight: [],
                        forceFocus: undefined
                    })
                )
            }, 5000);
        }
    }

    const getSecondaryHighlightFromCellAndTechnique = (
        tech: SOLVING_TECHNIQUE, cell: CellData, board: Sudoku
    ): CellData[] => {
        switch (tech) {
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_ROW:
                return board.getRows()[cell.y]
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_COL:
                return board.getColumns()[cell.x]
            case SOLVING_TECHNIQUE.HUMAN_UNIQPOSS_BLOCK:
                return board.getCellsInBlock(cell)
            default:
                return []
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
            case DIFFICULTY_LEVEL.EASY_NEW:
                return 'Easiest';
            case DIFFICULTY_LEVEL.EASY:
                return 'Easy';
            case DIFFICULTY_LEVEL.MEDIUM:
                return 'Medium';
            default:
                return 'Hard';
        }
    }

    const smallText = makeStyles({
        root: {
            fontSize: '.75em',
        }
    });

    const smallTextClass = smallText().root;

    return <Container style={{padding: 0}}>
        <Grid container spacing={3} justify={"center"}
              style={{padding: '2rem 0 0', position: 'relative', zIndex: 3}}
              className={`game${state.isWorking ? ' working' : ''}`}>
            <Grid item xs={12} md={8} lg={6} justify={"center"} container>
                <PaperBox {...paperBoxDefaultLayoutProps} width={'100%'}>
                    <Box p={1}>
                        <LinearProgress value={percentFilled()} variant={'determinate'} style={{marginTop: '12px'}}/>
                        <Typography component={'legend'}
                                    style={{textAlign: 'center', marginTop: ksuduoThemeNormal.spacing(1)}}
                                    className={smallTextClass}>
                            {state.sudoku.getNumberOfCorrectlyFilledCells()} / {BOARD_SIZE}
                        </Typography>
                    </Box>
                    <Board
                        solutionIsFromApp={state.solutionShown}
                        sudoku={state.sudoku}
                        cellCallback={updateCallback}
                        highlightedCell={state.highlightedCell}
                        secondaryHighlight={state.secondaryHighlight}
                        forceFocus={state.forceFocus}
                        isPaused={state.isPaused}
                        togglePaused={togglePaused}
                        supportsInputMode={supportsInputModeAttribute}
                    />
                    <Box p={1} display={'flex'} justifyContent={'space-between'}>
                        <Typography component={'small'} className={smallTextClass}
                        >
                            Difficulty: {difficultyLabel()}
                        </Typography>
                        <Typography component={'small'} className={smallTextClass}>
                            Hints: {state.sudoku.getNumberOfHints()}
                        </Typography>
                    </Box>
                </PaperBox>
            </Grid>
            <Grid item xs container alignItems={"stretch"} alignContent={"flex-start"}>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} className={smallTextClass}>
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
                            <label style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                <Switch checked={state.timerEnabled}
                                        onChange={(event, value: boolean) => {
                                            setState(prevState => ({...prevState, timerEnabled: value}))
                                        }}/>
                                {`${state.timerEnabled ? 'Click to hide timer' : 'Click to show timer'}`}
                            </label>
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
                        {state.msg.length > 0 ?
                            <Box display={'flex'} alignItems={'center'}>
                                <InfoOutlined style={{margin: '0 .75rem'}}/>
                                <Typography className={smallTextClass}>
                                    {state.msg}
                                </Typography>
                            </Box>
                            : null}
                        <GeneratorConfiguration numberOfClues={state.numberOfClues}
                                                setNumberOfClues={updateNumberOfClues}
                                                difficulty={state.difficulty}
                                                difficultyOfCurrentPuzzle={state.currentDifficulty}
                                                setDifficulty={selectDifficulty}
                                                numberOfFilledCellsInCurrentPuzzle={state.sudoku.getNumberOfFilledCells()}
                        />
                    </PaperBox>
                </Grid>
                <Grid item xs={12}>
                    <PaperBox {...paperBoxDefaultLayoutProps} mt={[1, 2]}>
                        <About/>
                    </PaperBox>
                </Grid>
            </Grid>
        </Grid>
        <ThemeProvider theme={ksuduoThemeSecond}>
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
                        {state.timerEnabled ? ` in ${formatTime(state.secondsElapsed)}.` : ''}
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