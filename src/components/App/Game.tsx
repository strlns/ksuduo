import * as React from "react";
import Board from "../Board/Board";
import '../../css/app.css';
import CreateNew, {DEFAULT_NUMBER_OF_CLUES} from "../Controls/CreateNew";
import {Sudoku} from "../../model/Sudoku";
import generateSudoku, {MINIMUM_CLUES} from "../../generator/generator";
import {ChangeEvent, useState} from "react";
import { Typography } from "@material-ui/core";


export const Game = () => {
    const [sudoku, setSudoku] = useState(new Sudoku());
    const [numberOfClues, setNumberOfClues] = useState(DEFAULT_NUMBER_OF_CLUES);
    const isVeryHard = () => numberOfClues <= MINIMUM_CLUES;
    const HardWarning = () => {
        return isVeryHard() ? <Typography>
            Are you sure you can handle this? The minimum number of clues for a Sudoku to be solvable
            has been proven to be 17.
        </Typography> :
            null;
    }
    return <div className={"app-main"}>
        <div className={"app-view"}>
            <Board sudoku={sudoku}/>
            <CreateNew setNumberOfClues={(e: ChangeEvent, num: number) => setNumberOfClues(num)}
                       submit={() => setSudoku(generateSudoku(numberOfClues))}/>
            <HardWarning />
        </div>
    </div>
}