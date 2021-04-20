import * as React from "react";
import {Board, HighlightedCell} from "../Board/Board";
import '../../css/app.css';
import generateRandomSudokuWithPossiblyManySolutions, {DEFAULT_CLUES, MINIMUM_CLUES} from "../../generator/generator";
import {ChangeEvent, useEffect, useState} from "react";
import {
    Box, CircularProgress,
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
import {BOARD_SIZE, CELL_INDICES, flatIndexToCoords, Sudoku} from "../../model/Sudoku";
import {Solution, SOLVERS, solveWithMattsSolver} from "../../solver/solver";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";
import {cloneDeep} from "lodash-es";

export const Game = () => {
    const [state, setState] = useState({
        sudoku: generateRandomSudokuWithPossiblyManySolutions(DEFAULT_CLUES),
        numberOfClues: DEFAULT_CLUES,
        generatorSolver: SOLVERS.MATTFLOW,
        errorMsg: '',
        highlightedCell: undefined as HighlightedCell,
        isWorking: false
    });

    const updateNumberOfClues = (e: ChangeEvent, numberOfClues: number): void => {
        setState(prevState => {
            return ({
                ...prevState,
                numberOfClues
            });
        })
    };

    const newSudoku = () => {
        setState(prevState => ({...prevState, sudoku: generateRandomSudokuWithPossiblyManySolutions(state.numberOfClues)}));
    }

    const resetSudoku = () => {
        setState(prevState => ({...prevState, sudoku: prevState.sudoku.clearUserInput()}));
    }

    const solveSudoku = () => {
        const sudoku = cloneDeep(state.sudoku);
        sudoku.showSolution();
        setState(prevState => ({...prevState, sudoku}));
    }

    useEffect(() => {
        updateCallback()
    }, [state.highlightedCell, state.generatorSolver, state.sudoku]);

    const updateCallback = () => {
        setState(prevState => ({...prevState, errorMsg: '', isWorking: false}));
    }

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
                cell.value = value;
                setState(prevState => ({...prevState, highlightedCell: cell}))
                setTimeout(() => {
                    setState(prevState => ({...prevState, highlightedCell: undefined}))
                }, 1000);
            }
        }
    }
    const percentFilled = () => `
        ${+(state.sudoku.getNumberOfFilledCells() / BOARD_SIZE * 100).toFixed(1)}%`
    return <Container style={{position:'relative'}}>
        <Grid container spacing={3} justify={"center"}>
            <Grid item xs={12}>
                <h1>Ksuduo</h1>
                <h2>Sudoku Toy Project</h2>
            </Grid>
            <Grid item xs={12} md={8} lg={6} justify={"center"} container>
                <PaperBox p={2} maxWidth={"100%"}>
                    <Typography>
                        {state.sudoku.getNumberOfFilledCells()} / {BOARD_SIZE} ({percentFilled()})
                    </Typography>
                    <Board sudoku={state.sudoku}
                           cellCallback={updateCallback}
                           highlightedCell={state.highlightedCell}
                    />
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
                    <PaperBox p={4} mt={2}>
                        <Button onClick={newSudoku} variant="contained" color="primary">
                            Generate Sudoku
                        </Button>
                        <Box display={"flex"} justifyContent={"space-between"}>
                            <Button style={{width:'auto'}} onClick={resetSudoku} variant="outlined" color="secondary">
                                Reset Sudoku
                            </Button>
                            {state.isWorking ? <CircularProgress /> : null}
                            <Button style={{width:'auto'}} onClick={giveHint} variant="outlined" color="default">
                                Give me a hint (fill a cell)
                            </Button>
                        </Box>

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
                        <Button disabled={state.sudoku.isSolved()} onClick={solveSudoku} variant="outlined" color="primary">
                            Solve
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