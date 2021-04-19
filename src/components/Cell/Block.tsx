import * as React from 'react';
import Cell from "./Cell";
import {BlockData} from "../../model/BlockData";
import {CellData, CellValue} from '../../model/CellData';
import {CellIndex} from "../../model/Sudoku";
import {useEffect, useState} from "react";

interface BlockProps {
    block: BlockData,
    cellValidityChecker(cell: CellData): boolean,
    setCellValue(y: CellIndex, x: CellIndex, v: CellValue): void
}

export const Block = (props: BlockProps) => {
    const [state, setState] = useState(props);
    useEffect(() => {
        setState(props)
    }, [props]);
    return <div className={"block"}>
        {state.block.getRows().map((row, index) => {
                return <div className={"row"} key={index}>
                    {
                        row.map((cell, index) => {
                            cell.isValid = state.cellValidityChecker(cell);
                            return <Cell key={'cell' + index}
                                             cell={cell}
                                             setCellValue={v => state.setCellValue(cell.y, cell.x, v)}

                            />
                        })
                    }
                </div>
            })
        }
    </div>
}