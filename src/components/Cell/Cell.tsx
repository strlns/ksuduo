import * as React from "react"
import {NotesContext, LogicStepContext, SelectedCellContext} from "../Board/NotesContext";
import {ForwardedRef, SetStateAction} from "react"
import {CellData, CellValue} from "../../model/CellData";
import {Input} from "@mui/material";
import {styled} from "@mui/material/styles";

interface CellProps {
    cell: CellData,

    setCellValue(v: CellValue): void,

    setFocusedCell: React.Dispatch<SetStateAction<CellData>>,
    isHighlighted: boolean,
    isSecondarilyHighlighted: boolean,
    supportsInputMode: boolean
}

const NumInput = styled(Input)({
    fontSize: 'inherit',
    display: 'flex',
    '& input': {textAlign: 'center', padding: 0},
});

export const formatValue = (value: CellValue) => value === null ||
isNaN(value) ||
value === CellValue.EMPTY ||
value === undefined ? '' : value;

/**
 * see:
 * https://next.material-ui.com/components/text-fields/#type-quot-number-quot
 *
 * I cannot prevent 'e', '+' or '-' on desktop
 * without showing a full keyboard on older mobile devices that do not
 * support the `inputmode` attribute.
 */
const Cell = React.forwardRef((props: CellProps, ref: ForwardedRef<HTMLInputElement>) => {
    const notes = React.useContext(NotesContext)[`${props.cell.x},${props.cell.y}`] ?? [];
    const selected = React.useContext(SelectedCellContext) === `${props.cell.x},${props.cell.y}`;
    const step = React.useContext(LogicStepContext);
    const matches = (c: CellData) => c.x === props.cell.x && c.y === props.cell.y;
    const source = step?.sources.some(matches);
    const target = !step?.placement && step?.targets.some(matches);
    const added = !!props.cell.value && (props.isHighlighted || (step?.placement && step.targets.some(matches)));
    const removed = target ? step?.value : undefined;
    const pivot = step?.technique === 'XY-Wing' && matches(step.sources[0]);
    const className = `cell${pivot ? " logic-pivot" : ""}${added ? " hint-added" : ""}${selected ? " selected-cell" : ""}${source ? " logic-source" : ""}${target ? " logic-target" : ""}${props.cell.isInitial ? ' fixed' : ''}\
    ${props.cell.isValid ? '' : ' invalid'}\
    ${props.isHighlighted ? 'hint' : ''}\
    ${props.isSecondarilyHighlighted && !props.isHighlighted ? 'hint-origin' : ''}\
    `;

    const onKeyPress: React.KeyboardEventHandler = event => {
        if (props.cell.isInitial) return;
        const val = Number(event.key) as CellValue;
        if (Number.isInteger(val) && val >= 0 && val <= 9 && event.key.trim()) {
            event.preventDefault();
            props.setCellValue(val);
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
    /*
      This should not be needed, but it is: fix invalid input being
      visible on desktop.
      A dummy property counting the key presses did not fix the issue, I'm not sure
      if the cause is the use of React.memo on the Board component or something else.
    */
    const hackyControlledComponentSync = () => {
        //@ts-ignore
        if (ref && ref.current instanceof HTMLInputElement) {
            if (props.cell.value === CellValue.EMPTY) {
                //@ts-ignore
                ref.current.value = '';
            }
            else {
                //@ts-ignore
                ref.current.value = String(props.cell.value)
            }

        }
    }

    return <div className={className} style={{'--win-delay': `${(props.cell.x + props.cell.y) * 30}ms`} as React.CSSProperties}>
        {!props.cell.value && (notes.length > 0 || removed) && <span className="cell-notes" aria-hidden="true">
            {[1,2,3,4,5,6,7,8,9].map(n => <span key={n} className={removed === n ? 'candidate-removed' : source && !step?.placement && step?.value === n ? 'candidate-source' : undefined}>{notes.includes(n) || removed === n ? n : ' '}</span>)}
        </span>}
        <NumInput inputRef={ref}
                  className="value"
                  type={props.supportsInputMode ? 'text' : 'number'}
            //iOS, some versions show normal keypad.
                  slotProps={{input: {
                      'aria-label': `Row ${props.cell.y + 1}, column ${props.cell.x + 1}`,
                      'aria-description': added ? 'Value added by the hint.' : props.cell.value ? undefined : removed ? `Candidates: ${notes.join(', ')}. Eliminated ${removed}.` : notes.length ? `Notes: ${notes.join(', ')}` : undefined,
                      inputMode: 'numeric',
                      pattern: '[0-9]'
                  }}}
                  value={formatValue(props.cell.value)}
                  onKeyPress={onKeyPress}
                  onInput={event => {
                      // Mobile keyboards and paste may not send keypress events.
                      const input = event.target as HTMLInputElement;
                      const data = (event.nativeEvent as InputEvent).data;
                      const text = data ?? input.value;
                      if (!props.cell.isInitial && /^[1-9]$/.test(text)) props.setCellValue(Number(text));
                      else if (!props.cell.isInitial && input.value === '') props.setCellValue(CellValue.EMPTY);
                      hackyControlledComponentSync();
                  }}
                  onKeyUp={onKeyUp}
                  onFocus={onFocus}
                  disableUnderline={true}
                  readOnly={props.cell.isInitial}
        />
    </div>
});
export default Cell;