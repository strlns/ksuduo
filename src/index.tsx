/*!
 * KSUDUO
 * (c) 2021 Moritz Rehbach
 * GPL v3
 *
 * Uses sudoku solver:
 * @mattflow/sudoku-solver
 * https://github.com/mattflow/sudoku-solver
 * (MIT License)
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {App} from './components/App/App';

ReactDOM.render(
    <App/>,
    document.getElementById('app')
)