import * as React from 'react';
import {SetStateAction} from 'react';
import Cell from "./Cell";
import {BlockData} from "../../model/BlockData";
import {CellData, CellValue} from '../../model/CellData';
import {inputRefs, OptionalCell} from "../Board/Board";
import {BLOCK_WIDTH, BOARD_WIDTH, CellIndex} from "../../model/Board";

interface BlockProps {
    block: BlockData,
    tabCell?: CellData,

    cellValidityChecker(cell: CellData): boolean,

    updateCellValue(x: CellIndex, y: CellIndex, v: CellValue): void,

    setFocusedCell: React.Dispatch<SetStateAction<CellData>>,
    highlightedCell: OptionalCell,
    secondaryHighlight: CellData[],
    readOnly?: boolean,
    touchKeypad?: boolean,
    supportsInputMode: boolean
}

export const Block = (props: BlockProps) => {
    return <div className="block" style={{flexBasis: `${(BLOCK_WIDTH / BOARD_WIDTH * 100).toFixed(2)}%`}}>
        {props.block.getRows().map((row, blockRowIndex) => {
            return <div className={"row"} key={blockRowIndex}>
                {
                    row.map((cell, blockColIndex) => {
                        cell.isValid = props.cellValidityChecker(cell);
                        const key = `cell${blockColIndex}`;
                        if (!inputRefs[cell.x]) {
                            inputRefs[cell.x] = {};
                        }
                        inputRefs[cell.x][cell.y] = React.createRef();
                        return <Cell
                            ref={inputRefs[cell.x][cell.y]}
                            tabStop={props.tabCell?.x === cell.x && props.tabCell.y === cell.y}
                            key={key}
                            cell={cell}
                            setCellValue={v => props.updateCellValue(cell.x, cell.y, v)}
                            setFocusedCell={props.setFocusedCell}
                            isHighlighted={cell === props.highlightedCell}
                            isSecondarilyHighlighted={props.secondaryHighlight.includes(cell)}
                            readOnly={props.readOnly}
                            supportsInputMode={props.supportsInputMode}
                            touchKeypad={props.touchKeypad}
                        />
                    })
                }
            </div>
        })
        }
    </div>
};