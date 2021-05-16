import * as React from "react"
import {ForwardedRef, SetStateAction} from "react"
import {CellData, CellValue, CellValues} from "../../model/CellData";
import {Input, withStyles} from "@material-ui/core";

interface CellProps {
    cell: CellData,

    setCellValue(v: CellValue): void,

    setFocusedCell: React.Dispatch<SetStateAction<CellData>>,

    isHighlightedCell(c: CellData): boolean,

    supportsInputMode: boolean
}

const NumInput = withStyles({
    root: {
        fontSize: 'inherit',
        display: 'flex' //full width, default is inline-flex
    },
    input: {
        textAlign: 'center'
    }
})(Input);

export const formatValue = (value: CellValue) => value === null ||
isNaN(value) ||
value === CellValue.EMPTY ||
value === undefined ?
    '' : value;

/**
 * see:
 * https://next.material-ui.com/components/text-fields/#type-quot-number-quot
 *
 * I cannot prevent 'e', '+' or '-' on desktop
 * without showing a full keyboard on older mobile devices that do not
 * support the `inputmode` attribute.
 */
const Cell = React.forwardRef((props: CellProps, ref: ForwardedRef<HTMLInputElement>) => {
    const isHighlighted = () => props.isHighlightedCell(props.cell);
    const className = `cell${props.cell.isInitial ? ' fixed' : ''}\
    ${props.cell.isValid ? '' : ' invalid'}\
    ${isHighlighted() ? 'hint' : ''}\
    `;

    const onKeyPress: React.KeyboardEventHandler = event => {
        if (props.cell.isInitial) return;
        const val = Number(event.key) as CellValue;
        if (CellValues.includes(val)) {
            props.setCellValue(val);
        } else {
            /**
             * see:
             * https://next.material-ui.com/components/text-fields/#type-quot-number-quot
             *
             * I cannot prevent 'e', '+' or '-' on desktop
             * without showing a full keyboard on older mobile devices that do not
             * support the `inputmode` attribute.
             */
        }
    };

    const onKeyUp: React.KeyboardEventHandler = (event: React.KeyboardEvent) => {
        if (["Backspace", "Delete"].includes(event.key)) {
            props.setCellValue(CellValue.EMPTY);
        }
    };
    const onFocus: React.FocusEventHandler<HTMLInputElement> = () => {
        props.setFocusedCell(props.cell)
    }
    return <div className={className}>
        <NumInput inputRef={ref}
                  className="value"
                  type={props.supportsInputMode ? 'text' : 'number'}
            //iOS, some versions show normal keypad.
                  inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]'
                  }}
                  value={formatValue(props.cell.value)}
                  onKeyPress={onKeyPress}
                  onKeyUp={onKeyUp}
                  onFocus={onFocus}
                  disableUnderline={true}
                  readOnly={props.cell.isInitial}
        />
        {/*<small className="details">x:{props.cell.x} y:{props.cell.y}</small>*/}
    </div>
});
export default Cell;