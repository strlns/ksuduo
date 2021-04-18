import * as React from 'react';
import {CellValue} from "../../model/Cell";
import arrayChunk from "../../utility/arrayChunk";
import Cell from "./Cell";
import Block from "../../model/Block";

type BlockProps = {
    block: Block
}

export default (props: BlockProps) =>
    <div className={"block"}>
        {props.block.getRows().map((row, index) => {
                return <div className={"row"} key={index}>
                    {row.map((cell, index) => <Cell key={'cell'+index} cell={cell}/>)}
                </div>
            }
        )}
    </div>