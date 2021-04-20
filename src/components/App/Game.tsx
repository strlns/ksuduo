import * as React from "react";
import {Board} from "../Board/Board";
import '../../css/app.css';
import generateSudoku, {DEFAULT_CLUES, MINIMUM_CLUES} from "../../generator/generator";
import {ChangeEvent, useEffect, useState} from "react";
import {
    Box, Card, CardContent, CardHeader,
    Container,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    NativeSelect,
    Paper,
    Typography
} from "@material-ui/core";
import {Button} from "../Controls/Button";
import GeneratorConfiguration from "../Controls/GeneratorConfiguration";
import {BOARD_SIZE, Sudoku} from "../../model/Sudoku";
import {Solution, SOLVERS, solveWithMattsSolver} from "../../solver/solver";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";

export const Game = () => {
    const [state, setState] = useState({
        sudoku: generateSudoku(DEFAULT_CLUES),
        solutions: [] as Sudoku[],
        numberOfClues: DEFAULT_CLUES,
        solver: SOLVERS.MATTFLOW,
        errorMsg: ''
    });
    const [computedSolution, setComputedSolution] = useState(null as Solution);

    const updateNumberOfClues = (e: ChangeEvent, numberOfClues: number): void => {
        setState(prevState => {
            return ({
                ...prevState,
                numberOfClues
            });
        })
    };

    const newSudoku = () => {
        setState(prevState => ({...prevState, sudoku: generateSudoku(state.numberOfClues)}));
    }

    const resetSudoku = () => {
        setState(prevState => ({...prevState, sudoku: prevState.sudoku.clearUserInput()}));
    }

    const solveSudoku = async () => {
        switch (state.solver) {
            case SOLVERS.MATTFLOW:
                try {
                    const solution = await solveWithMattsSolver(state.sudoku);
                    setComputedSolution(solution);
                } catch (e) {
                    // setState(prevState => ({...prevState, errorMsg: e.message}));
                }
                break;
        }
    }

    useEffect(() => {
        if (computedSolution === null) return;
        if (Array.isArray(computedSolution)) {
            setState(prevState => ({...prevState, solutions: computedSolution}));
        } else {
            setState(prevState => ({...prevState, sudoku: computedSolution}));
        }
    }, [computedSolution])

    const updateCallback = () => {
        setState(prevState => ({...prevState, errorMsg: ''}));
    }

    const selectSolver: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        setState(prevState => ({...prevState, solver: +event.target.value as SOLVERS}))
    }

    const showClueNumWarning = () => {
        return state.numberOfClues <= MINIMUM_CLUES && state.sudoku.getNumberOfFilledCells() > MINIMUM_CLUES;
    }

    const HardWarning = () => {
        return showClueNumWarning() ? <Typography component={"legend"} style={{color: '#aa0000'}}>
                Are you sure you can handle this? The minimum number of clues for a Sudoku to be solvable
                has been proven to be 17.
            </Typography> :
            null;
    }
    const percentFilled = () => `
        ${+(state.sudoku.getNumberOfFilledCells() / BOARD_SIZE * 100).toFixed(1)}%`
    return <Container>
        <Grid container spacing={3} justify={"center"}>
            <Grid item xs={12}>
                <h1>Ksuduo</h1>
                <h2>Sudoku Toy Project</h2>
            </Grid>
            <Grid item xs={12} md={8} lg={6} justify={"center"} container>
                <PaperBox p={2}>
                    <Typography>
                        {state.sudoku.getNumberOfFilledCells()} / {BOARD_SIZE} ({percentFilled()})
                    </Typography>
                    <Board sudoku={state.sudoku} cellCallback={updateCallback}/>
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
                        <Button onClick={resetSudoku} variant="outlined" color="secondary">
                            Reset Sudoku
                        </Button>
                    </PaperBox>
                </Grid>
                <Grid item>
                    <PaperBox p={4} mt={2}>
                        <Button onClick={solveSudoku} variant="outlined" color="primary">
                            Solve
                        </Button>
                        <FormControl style={{width: '100%', marginTop: '1rem'}}>
                            <InputLabel htmlFor="solver-select">Solver</InputLabel>
                            <NativeSelect
                                value={state.solver}
                                onChange={selectSolver}
                                inputProps={{
                                    name: 'solver',
                                    id: 'solver-select',
                                }}
                            >
                                <option value={SOLVERS.MATTFLOW}>@mattflow/sudoku-solver</option>
                            </NativeSelect>
                            <FormHelperText>Select a solver algorithm</FormHelperText>
                        </FormControl>
                        {state.errorMsg.length ?
                            <Typography style={{color: 'red', fontWeight: 'bold'}}>{state.errorMsg}</Typography>
                            : null}
                    </PaperBox>
                </Grid>
            </Grid>
        </Grid>
    </Container>
}