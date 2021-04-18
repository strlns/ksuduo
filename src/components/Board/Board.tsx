import * as React from "react";
import {Sudoku} from "../../model/Sudoku";
import Block from "../Cell/Block";

type BoardProps = {
    sudoku: Sudoku
}

export default (props: BoardProps) => {
    return <div className={'board'}>
        {
            props.sudoku.getBlocks().map(
                (block, index) => <Block block={block} key={index}/>
            )
        }
    </div>
}
