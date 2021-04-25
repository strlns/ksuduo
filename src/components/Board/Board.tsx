import * as React from "react";
import {ForwardedRef, KeyboardEventHandler, useEffect, useState} from "react";
import {BOARD_WIDTH, CellIndex, Sudoku} from "../../model/Sudoku";
import {Block} from "../Cell/Block";
import {CellData, CellValue} from "../../model/CellData";
import {WinnerMessage} from "../Message/WinnerMessage";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";
import {Box, Icon, IconButton, Modal, ThemeProvider, Typography} from "@material-ui/core";
import {CheckCircleRounded, PauseCircleFilledTwoTone, ThumbUp} from "@material-ui/icons";
import {ksuduoThemeSecondWinnerModal} from "../Theme/WinnerModalTheme";
import {Timer} from "../../model/Timer";
import {formatTime} from "../../utility/formatTime";

interface BoardProps {
    sudoku: Sudoku,
    cellCallback?: Function,
    highlightedCell: OptionalCell,
    forceFocus: OptionalCell,
    solutionIsFromApp: boolean,
    isPaused: boolean,
    setPaused: (value: boolean) => void,
    timer: Timer
}

interface CellRefMap {
    [key: string]: {
        [key: string]: ForwardedRef<HTMLInputElement>
    }
}

export const inputRefs: CellRefMap = {};

export type OptionalCell = CellData | undefined;

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
        if (state.forceFocus !== undefined) {
            setFocusedCell(state.forceFocus);
        }
    }, [state.forceFocus]);

    // brittle code to allow arrow key navigation.
    // usage of the "global" CellRefMap is non-standard but works.
    let [focusedCell, setFocusedCell] = useState(state.sudoku.getInitialFocusCell());
    const onKeyUp: KeyboardEventHandler = (e: React.KeyboardEvent) => {
        if (state.isPaused) {
            return;
        }
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

    const classes = `board${state.isPaused ? ' disabled' : ''}`

    return <PaperBox elevation={9}
                     className={classes}
                     onKeyUp={onKeyUp}
                     style={{position: 'relative', margin: 'auto'}}>
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
        {state.isPaused ? <IconButton onClick={() => state.setPaused(false)} style={{
                zIndex: 999, position: 'absolute',
                left: '50%', top: '50%', transform: 'translate(-50%, -50%)'
            }}>
                <PauseCircleFilledTwoTone
                    style={{width: '8rem', height: '8rem'}}
                    color={'inherit'}
                /></IconButton>
            : null}
        <ThemeProvider theme={ksuduoThemeSecondWinnerModal}>
            <Modal
                open={winnerModalOpen}
                onClose={() => setWinnerModalOpen(false)}>
                <WinnerMessage>
                    <Box display={"flex"} justifyContent={"center"}>
                        <Icon children={<ThumbUp/>} fontSize={"large"}/>
                        <Icon children={<ThumbUp/>} fontSize={"large"}/>
                        <Icon children={<ThumbUp/>} fontSize={"large"}/>
                    </Box>
                    <Typography component={'h3'} variant={'h3'}>
                        Congratulations!
                    </Typography>
                    <Typography style={{margin: '1em 0'}}>
                        You successfully completed the Sudoku in {formatTime(state.timer.secondsElapsed)}.
                    </Typography>

                    <Box onClick={() => setWinnerModalOpen(false)}>
                        <IconButton style={{margin: 'auto', display: 'block'}} title="OK">
                            <CheckCircleRounded color={'secondary'}/>
                        </IconButton>
                    </Box>
                </WinnerMessage>
            </Modal>
        </ThemeProvider>
    </PaperBox>
};