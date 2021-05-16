import * as React from 'react';
import {SetStateAction, useEffect, useState} from 'react';
import Cell from "./Cell";
import {BlockData} from "../../model/BlockData";
import {CellData, CellValue} from '../../model/CellData';
import {inputRefs} from "../Board/Board";
import arraysEqualSimple from "../../utility/arraysEqualSimple";
import {BLOCK_WIDTH, BOARD_WIDTH, CellIndex} from "../../model/Board";
import {makeStyles} from "@material-ui/core/styles";
import clsx from "clsx";

interface BlockProps {
    block: BlockData,

    cellValidityChecker(cell: CellData): boolean,

    updateCellValue(x: CellIndex, y: CellIndex, v: CellValue): void,

    setFocusedCell: React.Dispatch<SetStateAction<CellData>>,
    highlightedCell: CellData | undefined,
    supportsInputMode: boolean
}

const blockStyles = makeStyles({
    root: {
        flexBasis: `${(BLOCK_WIDTH / BOARD_WIDTH * 100).toFixed(2)}%`
    }
});

export const Block = (props: BlockProps) => {
    const [state, setState] = useState(props);
    useEffect(() => {
        setState(props)
    }, [props]);

    const isHighlightedCell = (cell: CellData): boolean => {
        return state.highlightedCell !== undefined && arraysEqualSimple(
            [cell.x, cell.y],
            [state.highlightedCell.x, state.highlightedCell.y]);
    };

    const blockClass = blockStyles();

    return <div className={clsx(blockClass.root, 'block')}>
        {state.block.getRows().map((row, blockRowIndex) => {
            return <div className={"row"} key={blockRowIndex}>
                {
                    row.map((cell, blockColIndex) => {
                        cell.isValid = state.cellValidityChecker(cell);
                        const key = `cell${blockColIndex}`;
                        if (!inputRefs[cell.x]) {
                            inputRefs[cell.x] = {};
                        }
                        inputRefs[cell.x][cell.y] = React.createRef();
                        return <Cell
                            ref={inputRefs[cell.x][cell.y]}
                            key={key}
                            cell={cell}
                            setCellValue={v => state.updateCellValue(cell.x, cell.y, v)}
                            setFocusedCell={state.setFocusedCell}
                            isHighlightedCell={isHighlightedCell}
                            supportsInputMode={props.supportsInputMode}
                        />
                    })
                }
            </div>
        })
        }
    </div>
};