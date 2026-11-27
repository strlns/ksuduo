// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {Board} from '../src/components/Board/Board';
import type {LogicStep} from '../src/algorithm/solver/logical';
import {makeBoard} from './fixtures';

beforeEach(() => {localStorage.clear(); vi.useFakeTimers();});
afterEach(() => {cleanup(); vi.useRealTimers();});

function presentation(technique: string, unit: 'row' | 'column' | 'block' = 'row') {
    const sudoku = makeBoard();
    let target = sudoku.getCell(2, 0);
    const single = technique.endsWith('single');
    const sources = technique === 'Naked single' ? [target] : unit === 'row' ? sudoku.getRows()[0]
        : unit === 'column' ? sudoku.getColumns()[2] : sudoku.getBlocks()[0].cells;
    if (single) {sudoku.setValue(2, 0, 4, false, false); target = sudoku.getCell(2, 0);}
    const step: LogicStep = {technique, sources, targets: [target], value: 4, placement: single, explanation: 'Proof'};
    const props = {sudoku, highlightedCell: target, secondaryHighlight: sources, forceFocus: target,
        logicStep: step, hintActivationKey: 1, solutionIsFromApp: false, isPaused: false,
        togglePaused() {}, supportsInputMode: true};
    return {props, step};
}

it.each(['row', 'column', 'block', 'naked'] as const)('keeps %s single highlights for eight seconds, then removes them', unit => {
    const {props} = presentation(unit === 'naked' ? 'Naked single' : 'Hidden single', unit === 'naked' ? 'row' : unit);
    const {container} = render(<Board {...props}/>);
    act(() => {vi.advanceTimersByTime(7999);});
    expect(container.querySelector('.hint-added')).toBeTruthy();
    expect(container.querySelector('.logic-source')).toBeTruthy();
    act(() => {vi.advanceTimersByTime(1);});
    expect(container.querySelector('.hint,.hint-added,.hint-origin,.logic-source')).toBeNull();
    expect(screen.getByRole('textbox', {name: 'Row 1, column 3'}).getAttribute('value')).toBe('4');
});

it.each(['focus', 'arrow'] as const)('dismisses only primary emphasis on manual %s, retaining the complex proof and notes', method => {
    const {props} = presentation('Locked candidates');
    const {container} = render(<Board {...props} hintCandidates={{'2,0': [1,2]}}/>);
    const notes = localStorage.getItem('ksuduo-notes');
    const target = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    act(() => {target.focus();});
    expect(container.querySelector('.hint')).toBeTruthy();
    if (method === 'focus') act(() => {screen.getByRole('textbox', {name: 'Row 1, column 4'}).focus();});
    else fireEvent.keyDown(target, {key: 'ArrowRight'});
    expect(container.querySelector('.hint')).toBeNull();
    act(() => {vi.advanceTimersByTime(60000);});
    expect(container.querySelector('.logic-source')).toBeTruthy();
    expect(container.querySelector('.logic-target')).toBeTruthy();
    expect(container.querySelector('.candidate-removed')).toBeTruthy();
    expect(localStorage.getItem('ksuduo-notes')).toBe(notes);
});

it('does not reconstruct primary placement emphasis from the proof after manual selection', () => {
    const {props} = presentation('Hidden single');
    const {container} = render(<Board {...props}/>);
    act(() => {screen.getByRole('textbox', {name: 'Row 1, column 4'}).focus();});
    expect(container.querySelector('.hint,.hint-added')).toBeNull();
    expect(container.querySelector('.logic-source')).toBeTruthy();
    act(() => {vi.advanceTimersByTime(8000);});
    expect(container.querySelector('.logic-source,.hint-origin')).toBeNull();
});

it('restarts the lifetime on replay and cancels a single timer when a complex hint replaces it', () => {
    const {props} = presentation('Hidden single');
    const {container, rerender} = render(<Board {...props}/>);
    act(() => {vi.advanceTimersByTime(7000);});
    rerender(<Board {...props} hintActivationKey={2}/>);
    act(() => {vi.advanceTimersByTime(7000);});
    expect(container.querySelector('.hint-added')).toBeTruthy();
    const complex = {...props.logicStep, technique: 'Naked pair', placement: false};
    rerender(<Board {...props} logicStep={complex} hintActivationKey={3}/>);
    act(() => {vi.advanceTimersByTime(60000);});
    expect(container.querySelector('.hint')).toBeTruthy();
    expect(container.querySelector('.logic-target')).toBeTruthy();
});
