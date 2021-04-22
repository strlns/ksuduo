/*
 * (c) 2021 Moritz Rehbach. See LICENSE.txt
 */

import * as React from "react";
import {ChangeEvent, useEffect, useState} from "react";
import {Board, OptionalCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudoku, {DEFAULT_CLUES, MINIMUM_CLUES} from "../../generator/generator";
import {
    Box,
    CircularProgress,
    Container,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    NativeSelect,
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
import testWorker from "../../worker/testWorkerActualyWorks";
import {boardFromLocalStorage, persist} from "../../persistence/localStorage";

let sudokuWorker: Worker;
let useWebWorker = false;
if (window.Worker) {
    try {
        sudokuWorker = new SudokuWorker();
        window.onbeforeunload = () => {
            sudokuWorker.terminate();
        }
    } catch (e) {
        console.error(e);
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
            // console.log("Worker: falling back");
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
    // if (state.sudoku.isEmpty()) {
    //     generateSudoku();
    // }

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

    const solveSudoku = () => {
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

    const showClueNumWarning = () => {
        return state.numberOfClues <= MINIMUM_CLUES && state.sudoku.getNumberOfFilledCells() > MINIMUM_CLUES;
    }

    const HardWarning = () => {
        return showClueNumWarning() ? <Typography component={"legend"} style={{color: '#aa0000'}}>
                Are you sure you can handle this? The minimum number of clues for a solvable Sudoku
                has been proven to be 17.
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

    const percentFilled = () => `
        ${+(state.sudoku.getNumberOfFilledCells() / BOARD_SIZE * 100).toFixed(1)}%`;

    return <Container style={{position: 'relative'}}>
        <Grid container spacing={3} justify={"center"}>
            <Grid item xs={12}>
                <h1>Ksuduo</h1>
                <h2>Sudoku Toy Project</h2>
            </Grid>
            <Grid item xs={12} md={8} lg={6} justify={"center"} container>
                <PaperBox p={2} maxWidth={"100%"} display={"flex"} flexDirection={"column"}>
                    <Typography>
                        {state.sudoku.getNumberOfFilledCells()} / {BOARD_SIZE} ({percentFilled()})
                    </Typography>
                    <Board
                        solutionIsFromApp={state.solvedByApp}
                        sudoku={state.sudoku}
                        cellCallback={updateCallback}
                        highlightedCell={state.highlightedCell}
                        forceFocus={state.forceFocus}
                    />

                    <Box display={"flex"} justifyContent={"space-between"} flexWrap={"wrap"}>
                        <Button style={{flexBasis: '45%'}} onClick={resetSudoku} variant="outlined"
                                color="secondary">
                            Reset
                        </Button>
                        <Button style={{flexBasis: '45%'}} onClick={giveHint} variant="outlined" color="default">
                            Hint
                        </Button>
                        <Button disabled={state.sudoku.isHistoryEmpty()} onClick={undo}>
                            Undo
                        </Button>
                    </Box>

                </PaperBox>
            </Grid>
            <Grid item xs justify={"space-between"} alignItems={"stretch"} direction={"column"} container>
                <Grid item>
                    <PaperBox p={4}>
                        <GeneratorConfiguration setNumberOfClues={updateNumberOfClues}/>
                        {showClueNumWarning() ?
                            <HardWarning/> : null
                        }
                    </PaperBox>
                </Grid>
                <Grid item>
                    <PaperBox p={4} mt={2} position={"relative"}>
                        {state.isWorking ? <CircularProgress
                            style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)'}}/> : null}
                        <Button onClick={generateSudoku} variant="contained" color="primary">
                            Generate Sudoku
                        </Button>
                        <FormControl style={{width: '100%', marginTop: '1rem'}}>
                            <InputLabel htmlFor="solver-select">Generation strategy</InputLabel>
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
                <Grid item>
                    <PaperBox p={4} mt={2}>
                        <Button disabled={state.sudoku.isSolved() || !state.sudoku.hasSolutionSet()}
                                onClick={solveSudoku} variant="contained">
                            Show Solution
                        </Button>
                        {state.errorMsg.length ?
                            <Typography style={{color: 'red', fontWeight: 'bold'}}>{state.errorMsg}</Typography>
                            : null}
                    </PaperBox>
                </Grid>
            </Grid>
        </Grid>
    </Container>
}