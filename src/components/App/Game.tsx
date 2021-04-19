import * as React from "react";
import Board from "../Board/Board";
import '../../css/app.css';
import CreateNew, {DEFAULT_NUMBER_OF_CLUES} from "../Controls/CreateNew";
import generateSudoku, {MINIMUM_CLUES} from "../../generator/generator";
import {ChangeEvent, useState} from "react";
import {Typography} from "@material-ui/core";

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

    const isVeryHard = () => state.numberOfClues <= MINIMUM_CLUES;
    const HardWarning = () => {
        return isVeryHard() ? <Typography style={{fontWeight: 'bold', color: '#aa0000'}}>
                Are you sure you can handle this? The minimum number of clues for a Sudoku to be solvable
                has been proven to be 17.
            </Typography> :
            null;
    }

    return <div className={"app-main"}>
        <h1>Ksuduo</h1>
        <h2>Sudoku Toy Project</h2>
        <div className={"app-view"}>
            <Board sudoku={state.sudoku}/>
            <CreateNew setNumberOfClues={updateNumberOfClues}
                       submit={newSudoku}/>
        </div>
        {isVeryHard() ?
            <HardWarning/> : null
        }
    </div>
}