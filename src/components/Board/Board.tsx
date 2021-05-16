import * as React from "react";
import {ForwardedRef, KeyboardEventHandler, useEffect, useState} from "react";
import {Sudoku} from "../../model/Sudoku";
import {Block} from "../Cell/Block";
import {CellData, CellValue, CellValues} from "../../model/CellData";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";
import {IconButton} from "@material-ui/core";
import {PauseCircleFilledTwoTone} from "@material-ui/icons";
import {BOARD_WIDTH, CellIndex} from "../../model/Board";

interface BoardProps {
    sudoku: Sudoku,
    cellCallback?: Function,
    highlightedCell: OptionalCell,
    forceFocus: OptionalCell,
    solutionIsFromApp: boolean,
    isPaused: boolean,
    togglePaused: () => void,
    /**
     * There is a browser support dilemma with numeric keypads.
     * {@see Cell}
     */
    supportsInputMode: boolean
}

interface CellRefMap {
    [key: string]: {
        [key: string]: ForwardedRef<HTMLInputElement>
    }
}

export const inputRefs: CellRefMap = {};

export type OptionalCell = CellData | undefined;

export const Board = React.memo(
    ({
         isPaused,
         forceFocus,
         highlightedCell,
         togglePaused,
         sudoku,
         cellCallback,
         supportsInputMode
     }: BoardProps) => {

        const updateCellValue = (x: CellIndex, y: CellIndex, v: CellValue) => {
            if (CellValues.includes(v)) {
                sudoku.setValue(x, y, v);
            }
            if (cellCallback) {
                cellCallback();
            }
        }

    //make sure that a new Sudoku object triggers re-render, focus first empty cell again if possible
    useEffect(() => {
        setFocusedCell(sudoku.getInitialFocusCell())
    }, [sudoku]);

    useEffect(() => {
        if (forceFocus !== undefined) {
            setFocusedCell(forceFocus);
        }
    }, [forceFocus]);

    // brittle code to allow arrow key navigation.
    let [focusedCell, setFocusedCell] = useState(sudoku.getInitialFocusCell());
    const onKeyUp: KeyboardEventHandler = (e: React.KeyboardEvent) => {
        if (isPaused) {
            return;
        }
        let newY, newX: CellIndex;
        let newCell: CellData = focusedCell;
        switch (e.key) {
            case 'ArrowUp':
                newY = Math.max(focusedCell.y - 1, 0) as CellIndex;
                newCell = sudoku.getCell(focusedCell.x, newY);
                break;
            case 'ArrowRight':
                newX = Math.min(focusedCell.x + 1, BOARD_WIDTH - 1) as CellIndex;
                newCell = sudoku.getCell(newX, focusedCell.y);
                break;
            case 'ArrowDown':
                newY = Math.min(focusedCell.y + 1, BOARD_WIDTH - 1) as CellIndex;
                newCell = sudoku.getCell(focusedCell.x, newY);
                break;
            case 'ArrowLeft':
                newX = Math.max(focusedCell.x - 1, 0) as CellIndex;
                newCell = sudoku.getCell(newX, focusedCell.y);
                break;
        }
        setFocusedCell(newCell);
    }

    useEffect(() => {
        const targetInputRef: any = inputRefs[focusedCell.x][focusedCell.y];
        targetInputRef.current.focus();
    }, [focusedCell]);

    const classes = `board${isPaused ? ' disabled' : ''}`

    if (IS_DEVELOPMENT) {
        console.log("Re-render of Board.tsx");
    }

    return <PaperBox elevation={9}
                     className={classes}
                     onKeyUp={onKeyUp}
                     style={{position: 'relative', margin: 'auto'}}>
        {
            sudoku.getBlocks().map(
                (block, index) => {
                    return <Block
                        block={block}
                        key={index}
                        cellValidityChecker={sudoku.isCellValid.bind(sudoku)}
                        updateCellValue={updateCellValue}
                        setFocusedCell={setFocusedCell}
                        highlightedCell={highlightedCell}
                        supportsInputMode={supportsInputMode}
                    />
                }
            )
        }
        {isPaused ? <IconButton onClick={togglePaused} style={{
                zIndex: 999, position: 'absolute',
                left: '50%', top: '50%', transform: 'translate(-50%, -50%)'
            }}>
                <PauseCircleFilledTwoTone
                    style={{width: '8rem', height: '8rem'}}
                    color={'inherit'}
                /></IconButton>
            : null}
    </PaperBox>
    });