import {annotationsFor, AnnotationRequest} from './annotations';
import * as React from "react";
import type {LogicStep} from "../../algorithm/solver/logical";
import {NotesContext, LogicStepContext, SelectedCellContext} from "./NotesContext";
import {Button} from "../Controls/Button";
import {ForwardedRef, KeyboardEventHandler, useEffect, useState} from "react";
import {Sudoku} from "../../model/Sudoku";
import {Block} from "../Cell/Block";
import {CellData, CellValue, CellValues} from "../../model/CellData";
import {PaperBox} from "../MaterialUiTsHelper/PaperBox";
import {IconButton, Tooltip} from "@mui/material";
import {EditNoteRounded, GridOnRounded, PauseCircleFilledTwoTone} from "@mui/icons-material";
import {BOARD_WIDTH, CellIndex} from "../../model/Board";

export interface NotesHistoryControls { undo: () => boolean; clear: () => void }

interface BoardProps {
    onInvalidNote?: (message: string) => void,
    notesHistoryRef?: React.Ref<NotesHistoryControls>,
    onNotesHistoryChange?: (available: boolean) => void,
    sudoku: Sudoku,
    cellCallback?: Function,
    highlightedCell: OptionalCell,
    secondaryHighlight: CellData[],
    forceFocus: OptionalCell,
    solutionIsFromApp: boolean,
    isPaused: boolean,
    togglePaused: () => void,
    /**
     * There is a browser support dilemma with numeric keypads.
     * {@see Cell}
     */
    logicStep?: LogicStep,
    hintActivationKey?: number,
    selectionResetKey?: number,
    onSelectionChange?: (selected: boolean) => void,
    annotationRequest?: AnnotationRequest,
    solverCandidates?: Record<string, number[]>,
    hintCandidates?: Record<string, number[]>,
    supportsInputMode: boolean
}

interface CellRefMap {
    [key: string]: {
        [key: string]: ForwardedRef<HTMLInputElement>
    }
}

export const inputRefs: CellRefMap = {};

export type OptionalCell = CellData | undefined;

export const Board = React.memo(
    ({
         isPaused,
         forceFocus,
         highlightedCell,
         secondaryHighlight,
         togglePaused,
         sudoku,
         cellCallback,
         supportsInputMode,
         hintCandidates,
         logicStep,
         annotationRequest,
         solverCandidates,
         selectionResetKey,
         hintActivationKey,
         onSelectionChange,
         onInvalidNote,
         notesHistoryRef,
         onNotesHistoryChange
     }: BoardProps) => {

        const notesHistory = React.useRef<{depth: number; before: Record<string, number[] | undefined>; after: Record<string, number[]>}[]>([]);
        const [notes, setNotes] = useState<Record<string, number[]>>({});
        const [selectionVisible, setSelectionVisible] = useState(true);
        const [showCoordinates, setShowCoordinates] = useState(false);
        const [noteMode, setNoteMode] = useState(false);
        const puzzleKey = sudoku.getSolution().join('') + ':' + sudoku.getFlatCells().map(c => c.isInitial ? c.value : 0).join('');
        useEffect(() => {
            notesHistory.current = [];
            onNotesHistoryChange?.(false);
            try {
                const saved = JSON.parse(localStorage.getItem('ksuduo-notes') ?? 'null');
                const valid = saved?.puzzle === puzzleKey && saved.notes && typeof saved.notes === 'object'
                    ? Object.fromEntries(Object.entries(saved.notes).filter(([k, v]) => /^[0-8],[0-8]$/.test(k) && Array.isArray(v) && v.every(n => Number.isInteger(n) && n >= 1 && n <= 9))) : {};
                setNotes(valid as Record<string, number[]>);
            } catch { setNotes({}); }
        }, [puzzleKey]);
        const persistNotes = (next: Record<string, number[]>) => {
            setNotes(next);
            try { localStorage.setItem('ksuduo-notes', JSON.stringify({puzzle: puzzleKey, notes: next})); } catch { /* optional storage */ }
        };
        const saveNotes = (next: Record<string, number[]>, solutionStep = false) => {
            if (!solutionStep && JSON.stringify(next) === JSON.stringify(notes)) return;
            if (solutionStep) {
                const changed = Object.keys(next).filter(key => JSON.stringify(notes[key]) !== JSON.stringify(next[key]));
                notesHistory.current.push({depth: sudoku.history.length,
                    before: Object.fromEntries(changed.map(key => [key, notes[key]])),
                    after: Object.fromEntries(changed.map(key => [key, next[key]]))});
                onNotesHistoryChange?.(true);
            }
            persistNotes(next);
        };
        React.useImperativeHandle(notesHistoryRef, () => ({
            undo: () => {
                const latest = notesHistory.current.at(-1);
                if (!latest || latest.depth !== sudoku.history.length) return false;
                notesHistory.current.pop();
                const restored = {...notes};
                for (const [key, previous] of Object.entries(latest.before)) {
                    // Preserve pencil marks the player edited after this hint.
                    if (JSON.stringify(restored[key]) !== JSON.stringify(latest.after[key])) continue;
                    if (previous === undefined) delete restored[key];
                    else restored[key] = previous;
                }
                persistNotes(restored);
                onNotesHistoryChange?.(notesHistory.current.length > 0);
                return true;
            },
            clear: () => {
                notesHistory.current = [];
                persistNotes({});
                onNotesHistoryChange?.(false);
            },
        }));
        useEffect(() => {
            if (logicStep || hintActivationKey) setShowCoordinates(true);
        }, [logicStep, hintActivationKey]);
        useEffect(() => {
            if (hintCandidates && !logicStep?.placement) saveNotes({...notes, ...hintCandidates}, true);
        }, [hintCandidates, logicStep]);
        useEffect(() => {
            if (annotationRequest && !isPaused && (selectionVisible || annotationRequest.scope === 'all' || annotationRequest.scope === 'explanation')) {
                const selected = sudoku.getCell(focusedCell.x, focusedCell.y);
                saveNotes({...notes, ...annotationsFor(sudoku, selected, annotationRequest.scope, logicStep, solverCandidates)});
            }
        }, [annotationRequest]);
        // Retain pencil marks for undo, but show only candidates allowed by current entries.
        const visibleNotes = Object.fromEntries(sudoku.getEmptyCells().map(cell => {
            const key = `${cell.x},${cell.y}`;
            const allowed = sudoku.getAllowedCellValues(cell);
            return [key, (notes[key] ?? []).filter(n => allowed.includes(n))];
        }));
        const updateCellValue = (x: CellIndex, y: CellIndex, v: CellValue) => {
            if (isPaused || sudoku.getCell(x, y).isInitial) return;
            if (noteMode && !sudoku.getCell(x, y).value && CellValues.includes(v)) {
                const key = `${x},${y}`;
                const current = visibleNotes[key] ?? [];
                if (v !== 0 && !sudoku.getAllowedCellValues(sudoku.getCell(x, y)).includes(v)) {
                    const conflicts = sudoku.getFlatCells().filter(cell => cell.value === v);
                    const unit = conflicts.some(cell => cell.y === y) ? `row ${y + 1}`
                        : conflicts.some(cell => cell.x === x) ? `column ${x + 1}` : 'block';
                    onInvalidNote?.(`Cannot note ${v} in r${y + 1}c${x + 1}: ${unit === 'block' ? 'this block' : unit[0].toUpperCase() + unit.slice(1)} already contains ${v}.`);
                    return;
                }
                saveNotes({...notes, [key]: v === 0 ? [] : current.includes(v) ? current.filter(n => n !== v) : [...current, v].sort()});
                return;
            }
            if (CellValues.includes(v)) {
                sudoku.setValue(x, y, v);
            }
            if (cellCallback) {
                cellCallback();
            }
        }

    useEffect(() => {
        if (forceFocus !== undefined) {
            setFocusedCell(forceFocus);
        }
    }, [forceFocus]);

    // brittle code to allow arrow key navigation.
        const [focusedCell, setFocusedCellState] = useState(sudoku.getFirstEmptyCell());
        const setFocusedCell: React.Dispatch<React.SetStateAction<CellData>> = next => {
            setFocusedCellState(next);
            setSelectionVisible(true);
        };
        useEffect(() => {
            if (!selectionResetKey) return;
            setSelectionVisible(false);
            if (document.activeElement?.matches('.cell input')) (document.activeElement as HTMLInputElement).blur();
        }, [selectionResetKey]);
        useEffect(() => {onSelectionChange?.(selectionVisible);}, [selectionVisible, onSelectionChange]);
        const onKeyUp: KeyboardEventHandler = (e: React.KeyboardEvent) => {
            if (isPaused) {
                return;
            }
            let newY, newX: CellIndex;
            let newCell: CellData = focusedCell;
            switch (e.key) {
                case 'ArrowUp':
                    newY = Math.max(focusedCell.y - 1, 0) as CellIndex;
                    newCell = sudoku.getCell(focusedCell.x, newY);
                break;
            case 'ArrowRight':
                newX = Math.min(focusedCell.x + 1, BOARD_WIDTH - 1) as CellIndex;
                newCell = sudoku.getCell(newX, focusedCell.y);
                break;
            case 'ArrowDown':
                newY = Math.min(focusedCell.y + 1, BOARD_WIDTH - 1) as CellIndex;
                newCell = sudoku.getCell(focusedCell.x, newY);
                break;
            case 'ArrowLeft':
                newX = Math.max(focusedCell.x - 1, 0) as CellIndex;
                newCell = sudoku.getCell(newX, focusedCell.y);
                break;
        }
        setFocusedCell(newCell);
    }

    useEffect(() => {
        const targetInputRef: any = inputRefs[focusedCell.x][focusedCell.y];
        // Never open the mobile keyboard on mount or after a toolbar/hint click.
        // Arrow navigation may move existing input focus without scrolling the page.
        if (document.activeElement?.matches('.cell input')) {
            targetInputRef.current?.focus({preventScroll: true});
        }
    }, [focusedCell]);

    const classes = `board${isPaused ? ' disabled' : ''}`

    if (IS_DEVELOPMENT) {
        console.log("Re-render of Board.tsx");
    }

    const fishLineClass = (axis: 'rows' | 'columns', index: number) => {
        const fish = logicStep?.fish;
        if (!fish) return undefined;
        return fish.orientation === axis
            ? (fish.bases.includes(index) ? 'fish-base-label' : undefined)
            : (fish.covers.includes(index) ? 'fish-cover-label' : undefined);
    };
    const selected = sudoku.getCell(focusedCell.x, focusedCell.y);
    const key = `${selected.x},${selected.y}`;
    return <SelectedCellContext.Provider value={selectionVisible ? key : undefined}><LogicStepContext.Provider value={logicStep}><NotesContext.Provider value={{...visibleNotes, ...hintCandidates}}><div className="board-panel">
        <div className={`board-frame${showCoordinates ? ' coordinates-visible' : ''}`}>
        <div className="coordinate-columns" aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i} className={fishLineClass('columns', i)}>c{i+1}</span>)}</div>
        <div className="coordinate-rows" aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i} className={fishLineClass('rows', i)}>r{i+1}</span>)}</div>
        <PaperBox elevation={9}
                     className={classes}
                     onKeyUp={onKeyUp}
                     style={{position: 'relative', margin: 'auto'}}>
        {
            sudoku.getBlocks().map(
                (block, index) => {
                    return <Block
                        block={block}
                        key={index}
                        cellValidityChecker={sudoku.isCellValid.bind(sudoku)}
                        updateCellValue={updateCellValue}
                        setFocusedCell={setFocusedCell}
                        highlightedCell={highlightedCell}
                        secondaryHighlight={secondaryHighlight}
                        supportsInputMode={supportsInputMode}
                    />
                }
            )
        }
        {isPaused ? <IconButton onClick={togglePaused} style={{
                zIndex: 999, position: 'absolute',
                left: '50%', top: '50%', transform: 'translate(-50%, -50%)'
            }}>
                <PauseCircleFilledTwoTone
                    style={{width: '8rem', height: '8rem'}}
                    color={'inherit'}
                /></IconButton>
            : null}
    </PaperBox>
        </div>
        <section className="notes-toolbar" aria-label="Pencil notes" onPointerDown={event => {
            // Keep an already-open keyboard stable while toggling notes or digits.
            if (document.activeElement?.matches('.cell input')) event.preventDefault();
        }}>
            <div className="notes-actions">
                <Tooltip title={noteMode ? "Notes mode on — enter pencil marks" : "Notes mode off — enter numbers"}>
                    <span><IconButton className="notes-mode-toggle" size="small" aria-label="Notes mode" aria-pressed={noteMode} disabled={isPaused} onClick={() => setNoteMode(!noteMode)}>
                        <EditNoteRounded fontSize="small"/>
                    </IconButton></span>
                </Tooltip>
                <Tooltip title="Show row and column labels (r2c6 = row 2, column 6)">
                    <IconButton className="coordinate-toggle" size="small" aria-label="Coordinate labels" aria-pressed={showCoordinates} onClick={() => setShowCoordinates(!showCoordinates)}><GridOnRounded fontSize="inherit"/></IconButton>
                </Tooltip>
                <span className="notes-selection">{selectionVisible ? `r${selected.y + 1}c${selected.x + 1}` : 'Select cell'}</span>
                <Button size="small" aria-label="Annotate selected cell" title="Annotate the currently selected cell with its allowed digits" disabled={isPaused || !selectionVisible || !!selected.value} onClick={() => saveNotes({...notes, [key]: solverCandidates?.[key] ?? sudoku.getAllowedCellValues(selected)})}>Annotate</Button>
                <Button size="small" aria-label="Clear cell notes" disabled={isPaused || !selectionVisible || !(notes[key]?.length)} onClick={() => saveNotes({...notes, [key]: []})}>Clear cell</Button>
                <Button size="small" aria-label="Clear all notes" disabled={isPaused || !Object.values(notes).some(values => values.length)} onClick={() => saveNotes({})}>Clear all</Button>
            </div>
            {noteMode && <div className="note-digits" role="group" aria-label="Note digits">
                {[1,2,3,4,5,6,7,8,9].map(n => <Button key={n} size="small" disabled={isPaused || !selectionVisible || !!selected.value} aria-label={`Toggle note ${n}`} aria-pressed={(visibleNotes[key] ?? []).includes(n)} onClick={() => updateCellValue(selected.x, selected.y, n)}>{n}</Button>)}
            </div>}
        </section>
    </div></NotesContext.Provider></LogicStepContext.Provider></SelectedCellContext.Provider>
    });