import * as React from "react";
import {CellIndex, Sudoku} from "../../model/Sudoku";

import {useEffect, useState} from "react";
import {Block} from "../Cell/Block";
import {CellValue} from "../../model/CellData";
import {cloneDeep} from "lodash-es";

interface BoardProps {
    sudoku: Sudoku
}

const Board = (props: BoardProps) => {
    const [state, setState] = useState(props);
    //this makes sure that a new Sudoku object triggers re-render
    useEffect(() => {
        setState(props)
    }, [props]);

    const setCellValue = (i: CellIndex, j: CellIndex, v: CellValue) => {
        setState(prevState => {
            prevState.sudoku.setValue(i, j, v);
            return {...prevState};
        });
    }

    return <div className={'board'}>
        {
            state.sudoku.getBlocks().map(
                (block, index) => {
                    return <Block
                        block={block}
                        key={index}
                        cellValidityChecker={state.sudoku.isCellValid.bind(state.sudoku)}
                        setCellValue={setCellValue}
                    />
                }
            )
        }
    </div>
};
export default Board;