import * as React from 'react';
import {SetStateAction, useEffect, useState} from 'react';
import Cell from "./Cell";
import {BlockData} from "../../model/BlockData";
import {CellData, CellValue} from '../../model/CellData';
import {inputRefs, OptionalCell} from "../Board/Board";
import {BLOCK_WIDTH, BOARD_WIDTH, CellIndex} from "../../model/Board";

interface BlockProps {
    block: BlockData,

    cellValidityChecker(cell: CellData): boolean,

    updateCellValue(x: CellIndex, y: CellIndex, v: CellValue): void,

    setFocusedCell: React.Dispatch<SetStateAction<CellData>>,
    highlightedCell: OptionalCell,
    secondaryHighlight: CellData[],
    readOnly?: boolean,
    supportsInputMode: boolean
}

export const Block = (props: BlockProps) => {
    const [state, setState] = useState(props);
    useEffect(() => {
        setState(props)
    }, [props]);

    return <div className="block" style={{flexBasis: `${(BLOCK_WIDTH / BOARD_WIDTH * 100).toFixed(2)}%`}}>
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
                            isHighlighted={cell === state.highlightedCell}
                            isSecondarilyHighlighted={state.secondaryHighlight.includes(cell)}
                            readOnly={props.readOnly}
                            supportsInputMode={props.supportsInputMode}
                        />
                    })
                }
            </div>
        })
        }
    </div>
};