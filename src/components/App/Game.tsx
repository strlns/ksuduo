import * as React from "react";
import {Board} from "../Board/Board";
import '../../css/app.css';
import {DEFAULT_NUMBER_OF_CLUES} from "../Controls/GeneratorConfiguration";
import generateSudoku, {MINIMUM_CLUES} from "../../generator/generator";
import {ChangeEvent, useEffect, useState} from "react";
import {Box, Container, Grid, Paper, Typography} from "@material-ui/core";
import {Button} from "../Controls/Button";
import GeneratorConfiguration from "../Controls/GeneratorConfiguration";
import {BOARD_SIZE} from "../../model/Sudoku";

export const Game = () => {
    const [state, setState] = useState({
        sudoku: generateSudoku(DEFAULT_NUMBER_OF_CLUES),
        numberOfClues: DEFAULT_NUMBER_OF_CLUES
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
        setState(prevState => ({...prevState, sudoku: generateSudoku(state.numberOfClues)}));
    }

    const resetSudoku = () => {
        setState(prevState => ({...prevState, sudoku: prevState.sudoku.clearUserInput()}));
    }

    const isVeryHard = () => state.numberOfClues <= MINIMUM_CLUES;
    const HardWarning = () => {
        return isVeryHard() ? <Typography style={{fontWeight: 'bold', color: '#aa0000'}}>
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
            <Grid item xs={12} md={8} lg={6}>
                <Typography>
                    {state.sudoku.getNumberOfFilledCells()} / {BOARD_SIZE} ({percentFilled()})
                </Typography>
                <Board sudoku={state.sudoku} cellCallback={() => setState(pS => ({...pS}))}/>
            </Grid>
            <Grid item xs={12} md={4} lg={6}>
                <Box component={Paper} p={4}>
                    <GeneratorConfiguration setNumberOfClues={updateNumberOfClues} />
                    {isVeryHard() ?
                        <HardWarning/> : null
                    }
                </Box>
                <Button onClick={newSudoku} variant="contained" color="primary">
                    Generate Sudoku
                </Button>
                <Button onClick={resetSudoku} variant="contained" color="secondary">
                    Reset Sudoku
                </Button>
            </Grid>
        </Grid>
    </Container>
}