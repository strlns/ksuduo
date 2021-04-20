import * as React from "react";
import {BOARD_WIDTH, CellIndex, Sudoku} from "../../model/Sudoku";

import {ForwardedRef, KeyboardEventHandler, useEffect, useState} from "react";
import {Block} from "../Cell/Block";
import {CellData, CellValue} from "../../model/CellData";
import {WinnerMessage} from "../Message/WinnerMessage";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";

interface BoardProps {
    sudoku: Sudoku,
    cellCallback?: Function
}

interface CellRefMap {
    [key: string]: {
        [key: string]: ForwardedRef<HTMLInputElement>
    }
}

export const inputRefs: CellRefMap = {};

export const Board = (props: BoardProps) => {
    const [state, setState] = useState(props);

    const setCellValue = (x: CellIndex, y: CellIndex, v: CellValue) => {
        setState(prevState => {
            prevState.sudoku.setValue(x, y, v);
            if (props.cellCallback) {
                props.cellCallback.call(state);
            }
            return {...prevState};
        });
    }

    //make sure that a new Sudoku object triggers re-render, focus first empty cell again if possible
    useEffect(() => {
        setState(props);
        setFocusedCell(state.sudoku.getFirstEmptyCell())
    }, [props]);

    // brittle code to allow arrow key navigation.
    // usage of the "global" CellRefMap is non-standard but works.
    let [focusedCell, setFocusedCell] = useState(state.sudoku.getFirstEmptyCell());
    const onKeyUp: KeyboardEventHandler = (e: React.KeyboardEvent) => {
        let newY, newX: CellIndex;
        let newCell: CellData = focusedCell;
        switch (e.key) {
            case 'ArrowUp':
                newY = Math.max(focusedCell.y - 1, 0) as CellIndex;
                newCell = state.sudoku.getCell(focusedCell.x, newY);
                break;
            case 'ArrowRight':
                newX = Math.min(focusedCell.x + 1, BOARD_WIDTH - 1) as CellIndex;
                newCell = state.sudoku.getCell(newX, focusedCell.y);
                break;
            case 'ArrowDown':
                newY = Math.min(focusedCell.y + 1, BOARD_WIDTH - 1) as CellIndex;
                newCell = state.sudoku.getCell(focusedCell.x, newY);
                break;
            case 'ArrowLeft':
                newX = Math.max(focusedCell.x - 1, 0) as CellIndex;
                newCell = state.sudoku.getCell(newX, focusedCell.y);
                break;
        }
        setFocusedCell(newCell);
    }

    useEffect(() => {
        const targetInputRef: any = inputRefs[focusedCell.x][focusedCell.y];
        targetInputRef.current.focus();
    }, [focusedCell]);



    return <PaperBox p={2} elevation={16} className={'board'} onKeyUp={onKeyUp} style={{margin: 'auto'}}>
        {
            state.sudoku.getBlocks().map(
                (block, index) => {
                    return <Block
                        block={block}
                        key={index}
                        cellValidityChecker={state.sudoku.isCellValid.bind(state.sudoku)}
                        setCellValue={setCellValue}
                        setFocusedCell={setFocusedCell}
                    />
                }
            )
        }
        {
            state.sudoku.isComplete() ?
                <WinnerMessage>
                    Congratulations! You completed the Sudoku successfully.
                </WinnerMessage> : null
        }
    </PaperBox>
};