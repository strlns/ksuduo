import * as React from "react";
import {ForwardedRef, KeyboardEventHandler, useEffect, useState} from "react";
import {BOARD_WIDTH, CellIndex, Sudoku} from "../../model/Sudoku";
import {Block} from "../Cell/Block";
import {CellData, CellValue} from "../../model/CellData";
import {WinnerMessage} from "../Message/WinnerMessage";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";
import {Box, Button, Icon, Modal, Typography} from "@material-ui/core";
import {ThumbUp} from "@material-ui/icons";

interface BoardProps {
    sudoku: Sudoku,
    cellCallback?: Function,
    highlightedCell: OptionalCell,
    forceFocus: OptionalCell,
    solutionIsFromApp: boolean
}

interface CellRefMap {
    [key: string]: {
        [key: string]: ForwardedRef<HTMLInputElement>
    }
}

export const inputRefs: CellRefMap = {};

export type OptionalCell = CellData|undefined;

export const Board = (props: BoardProps) => {
    const [state, setState] = useState(props);
    useEffect(() => {
        setState(props);
    }, [props]);

    const [winnerModalOpen, setWinnerModalOpen] = React.useState(false);

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
        setFocusedCell(state.sudoku.getInitialFocusCell())
    }, [state.sudoku]);


    useEffect(() => {
        setWinnerModalOpen(state.sudoku.isSolved() && !state.solutionIsFromApp);
    }, [state.sudoku.isSolved()]);

    useEffect(() => {
        if (state.forceFocus instanceof CellData) {
            setFocusedCell(state.forceFocus);
        }
    }, [state.forceFocus]);

    // brittle code to allow arrow key navigation.
    // usage of the "global" CellRefMap is non-standard but works.
    let [focusedCell, setFocusedCell] = useState(state.sudoku.getInitialFocusCell());
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
                        highlightedCell={state.highlightedCell}
                    />
                }
            )
        }

        <Modal
            open={winnerModalOpen}
            onClose={() => setWinnerModalOpen(false)}>
            <WinnerMessage>
                <Typography>Congratulations! You successfully completed the Sudoku!</Typography>
                <Box display={"flex"} justifyContent={"center"}>
                    <Icon children={<ThumbUp/>} fontSize={"large"}/>
                    <Icon children={<ThumbUp/>} fontSize={"large"}/>
                    <Icon children={<ThumbUp/>} fontSize={"large"}/>
                </Box>
                <Button style={{marginTop: '1rem'}} fullWidth={true} variant={"outlined"}
                        onClick={() => setWinnerModalOpen(false)}>
                    OK
                </Button>
            </WinnerMessage>
        </Modal>
    </PaperBox>
};