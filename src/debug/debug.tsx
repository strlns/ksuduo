import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Box} from "@material-ui/core";
import {evilSudoku} from "../examples/validExamples";
import {Sudoku} from "../model/Sudoku";

const board = new Sudoku();
board.initWithNumbers(evilSudoku);
const Debug = () => <Box justifyContent={'center'} alignItems={'center'}>
    {/*<h2>Puzzle</h2>*/}
    {/*{JSON.stringify(bugPuzzle)}*/}
    {/*<h2>Solution found by solver:</h2>*/}
    {/*{JSON.stringify(solve(bugPuzzle))}*/}
    {/*<h2>"hasMultipleSolutionsOrIsUnsolvable"</h2>*/}
    {/*{JSON.stringify(hasMultipleSolutionsOrIsUnsolvable(bugPuzzle))}*/}
    <pre>{JSON.stringify(board.getRows().map(cells => cells.map(cell => cell.value)), undefined, 4)}</pre>
    <hr/>
    <pre>{JSON.stringify(board.getColumns().map(cells => cells.map(cell => cell.value)), undefined, 4)}</pre>
</Box>

ReactDOM.render(
    <Debug/>,
    document.getElementById('app')
)