import * as React from "react"
import {Cell, CellValue} from "../../model/Cell";

type CellProps = {
    cell: Cell
}

const formatValue = (value: CellValue) => value === CellValue.EMPTY ? '' : value;

export default (props: CellProps) => {
    let className = `cell`;
    return <div className={className}>
        <span className="value">{formatValue(props.cell.value)}</span>
        {/*<small className="details">x:{props.cell.x} y:{props.cell.y}</small>*/}
    </div>
}