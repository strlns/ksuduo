// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/components/App/App';
import {GenerateButton} from '../src/components/Generator/GenerateButton';
import {GENERATOR_CODE} from '../src/algorithm/generator/generator';
import {MSGEVT_SOURCE, WORKER_ACTIONS} from '../src/worker/protocol';
import {makeBoard, puzzle} from './fixtures';

const mode = vi.hoisted(() => {
    // The main app checks Worker availability before constructing its Vite worker.
    window.Worker = function () {} as unknown as typeof Worker;
    return {probeWorks: true, requests: [] as unknown[], synchronousCalls: 0};
});
vi.mock('../src/worker/testWorkerActuallyWorks', () => ({default: async () => mode.probeWorks}));
vi.mock('../src/worker/sudoku.worker?worker', () => ({default: class extends EventTarget {
    postMessage(request: {source: string; data: number[]}) {
        mode.requests.push(request);
        queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', {
            data: [GENERATOR_CODE.OK, structuredClone(makeBoard())],
        })));
    }
}}));
vi.mock('../src/algorithm/generator/generator', async importOriginal => ({
    ...await importOriginal<typeof import('../src/algorithm/generator/generator')>(),
    default: () => {mode.synchronousCalls++; return [GENERATOR_CODE.OK, makeBoard()];},
}));

beforeEach(() => {localStorage.clear(); mode.requests.length = 0; mode.synchronousCalls = 0; mode.probeWorks = true;});
afterEach(() => cleanup());
const values = () => {
    const flat = Array<number>(81);
    document.querySelectorAll<HTMLInputElement>('.cell input').forEach(input => {
        const [row, column] = input.getAttribute('aria-label')!.match(/\d+/g)!.map(Number);
        flat[(row - 1) * 9 + column - 1] = Number(input.value);
    });
    return flat;
};
const startGame = async () => {
    render(<App/>);
    await waitFor(() => expect(screen.getByText('30 / 81')).toBeTruthy());
    await waitFor(() => expect(values()).toEqual(puzzle));
};

describe('gameplay migration baseline', () => {
    it('generates once under StrictMode using the worker protocol', async () => {
        await startGame();
        expect(mode.requests).toEqual([{source: MSGEVT_SOURCE, data: [WORKER_ACTIONS.GENERATE, 28, 3]}]);
        expect(mode.synchronousCalls).toBe(0);
        expect(values()).toEqual(puzzle);
        expect(screen.getByRole('button', {name: /Undo/i}).hasAttribute('disabled')).toBe(true);
    });
    it('generates synchronously when the worker probe fails', async () => {
        mode.probeWorks = false;
        await startGame();
        expect(mode.requests).toHaveLength(0);
        expect(mode.synchronousCalls).toBe(1);
        fireEvent.click(screen.getByRole('button', {name: /Generate sudoku/i}));
        await waitFor(() => expect(mode.synchronousCalls).toBe(2));
    });
    it('retains hints, highlight explanations, undo, reset and show-solution behavior', async () => {
        await startGame();
        fireEvent.click(screen.getByRole('switch'));
        fireEvent.click(screen.getByRole('button', {name: /Add Hint/i}));
        await waitFor(() => expect(values().filter(Boolean)).toHaveLength(31));
        expect(document.querySelector('.cell.hint')).toBeTruthy();
        expect(localStorage.getItem('ksuduoState')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', {name: /Undo/i}));
        await waitFor(() => expect(values()).toEqual(puzzle));
        fireEvent.click(screen.getByRole('button', {name: /Show Solution/i}));
        await waitFor(() => expect(screen.getByText('Solution shown')).toBeTruthy());
        expect(values().filter(Boolean)).toHaveLength(81);
        expect(screen.queryByText('Good job!')).toBeNull();
        fireEvent.click(screen.getByRole('button', {name: /^Reset$/i}));
        await waitFor(() => expect(values()).toEqual(puzzle));
    });
    it('keeps native difficulty options, slider ranges and the timer toggle', async () => {
        await startGame();
        fireEvent.click(screen.getByRole('button', {name: 'Puzzle settings'}));
        const select = screen.getByLabelText('Difficulty');
        expect(screen.queryByRole('slider')).toBeNull();
        for (const [difficulty, maximum] of [['0', '37'], ['1', '29'], ['2', '24']]) {
            fireEvent.change(select, {target: {value: difficulty}});
            const slider = screen.getByRole('slider');
            expect(slider.getAttribute('min')).toBe('21');
            expect(slider.getAttribute('max')).toBe(maximum);
        }
        fireEvent.change(select, {target: {value: '3'}});
        expect(screen.queryByRole('slider')).toBeNull();
        fireEvent.click(screen.getByRole('button', {name: /^Done$/}));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        fireEvent.click(screen.getByRole('switch'));
        expect(screen.getByText('Click to hide timer')).toBeTruthy();
    });
    it('retains keyboard entry, invalid-input cleanup, deletion and arrow navigation', async () => {
        await startGame();
        const input = screen.getByRole('textbox', {name: 'Row 1, column 3'}) as HTMLInputElement;
        await userEvent.click(input);
        await userEvent.keyboard('4');
        expect(input.value).toBe('4');
        await userEvent.keyboard('e');
        expect(input.value).toBe('4');
        await userEvent.keyboard('{Backspace}');
        expect(input.value).toBe('');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(screen.getByRole('textbox', {name: 'Row 1, column 4'}));
        const fixed = screen.getByRole('textbox', {name: 'Row 1, column 1'}) as HTMLInputElement;
        await userEvent.click(fixed);
        await userEvent.keyboard('2');
        expect(fixed.value).toBe('5');
    });
    it('opens About and closes it using the existing control', async () => {
        await startGame();
        fireEvent.click(screen.getByRole('button', {name: /^About$/i}));
        expect(screen.getByText('How to play?')).toBeTruthy();
        fireEvent.click(screen.getAllByTitle('Close')[0]);
        await waitFor(() => expect(screen.queryByText('How to play?')).toBeNull());
    });
});

it('replaces the generate icon with an aligned, accessible busy indicator', () => {
    const {rerender} = render(<GenerateButton text="Generate sudoku" isWorking={false}/>);
    expect(screen.queryByRole('progressbar')).toBeNull();
    rerender(<GenerateButton text="Generate sudoku" isWorking/>);
    expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('Generating sudoku');
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true');
});

it('annotates and toggles notes without changing puzzle values', async () => {
    await startGame();
    const input = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    await userEvent.click(input);
    fireEvent.click(screen.getByRole('button', {name: 'Annotate selected cell'}));
    expect(input.getAttribute('aria-description')).toBe('Notes: 1, 2, 4');
    expect(values()).toEqual(puzzle);
    fireEvent.click(screen.getByRole('button', {name: 'Notes mode'}));
    await userEvent.click(input);
    await userEvent.keyboard('2');
    expect(input.getAttribute('aria-description')).toBe('Notes: 1, 4');
    expect(values()).toEqual(puzzle);
    expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes['2,0']).toEqual([1,4]);
    fireEvent.click(screen.getByRole('button', {name: 'Clear cell notes'}));
    expect(input.getAttribute('aria-description')).toBeNull();
});

it('clears all notes across cells and persists the cleared state without editing the puzzle', async () => {
    await startGame();
    const first = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    const second = screen.getByRole('textbox', {name: 'Row 1, column 4'});
    await userEvent.click(first);
    fireEvent.click(screen.getByRole('button', {name: 'Annotate selected cell'}));
    await userEvent.click(second);
    fireEvent.click(screen.getByRole('button', {name: 'Annotate selected cell'}));
    expect(first.getAttribute('aria-description')).toContain('Notes:');
    expect(second.getAttribute('aria-description')).toContain('Notes:');
    fireEvent.click(screen.getByRole('button', {name: 'Clear cell notes'}));
    expect(second.getAttribute('aria-description')).toBeNull();
    expect(first.getAttribute('aria-description')).toContain('Notes:');
    fireEvent.click(screen.getByRole('button', {name: 'Clear all notes'}));
    expect(first.getAttribute('aria-description')).toBeNull();
    expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes).toEqual({});
    expect(values()).toEqual(puzzle);
    expect(screen.getByRole('button', {name: 'Clear all notes'}).hasAttribute('disabled')).toBe(true);
});
it('toggles notes using the compact digit strip and preserves the selected cell', async () => {
    await startGame();
    const input = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    await userEvent.click(input);
    fireEvent.click(screen.getByRole('button', {name: 'Notes mode'}));
    const digit = screen.getByRole('button', {name: 'Toggle note 4'});
    fireEvent.click(digit);
    expect(input.getAttribute('aria-description')).toBe('Notes: 4');
    expect(digit.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(digit);
    expect(input.getAttribute('aria-description')).toBeNull();
    expect(values()).toEqual(puzzle);
});
it('placement hints do not annotate all empty cells or hide existing notes', async () => {
    await startGame();
    const input = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    await userEvent.click(input);
    fireEvent.click(screen.getByRole('button', {name: 'Annotate selected cell'}));
    fireEvent.click(screen.getByRole('button', {name: 'Add Hint'}));
    expect(document.querySelectorAll('.cell-notes').length).toBeLessThanOrEqual(1);
});
it('keeps notes in sync with entries, clearing and undo', async () => {
    await startGame();
    const noted = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    const peer = screen.getByRole('textbox', {name: 'Row 1, column 4'});
    await userEvent.click(noted);
    fireEvent.click(screen.getByRole('button', {name: 'Annotate selected cell'}));
    await userEvent.click(peer);await userEvent.keyboard('2');
    expect(noted.getAttribute('aria-description')).toBe('Notes: 1, 4');
    fireEvent.click(screen.getByRole('button', {name: 'Undo'}));
    expect(noted.getAttribute('aria-description')).toBe('Notes: 1, 2, 4');
    await userEvent.click(noted);await userEvent.keyboard('4');
    expect(noted.getAttribute('aria-description')).toBeNull();
    await userEvent.keyboard('{Backspace}');
    expect(noted.getAttribute('aria-description')).toBe('Notes: 1, 2, 4');
});
it('handles mobile input events for notes and values', async () => {
    await startGame();
    const input = screen.getByRole('textbox', {name: 'Row 1, column 3'}) as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', {name: 'Notes mode'}));
    fireEvent.input(input, {target: {value: '4'}, data: '4', inputType: 'insertText'});
    expect(input.getAttribute('aria-description')).toBe('Notes: 4');
    expect(input.value).toBe('');
    fireEvent.click(screen.getByRole('button', {name: 'Notes mode'}));
    fireEvent.input(input, {target: {value: '4'}, data: '4', inputType: 'insertText'});
    expect(input.value).toBe('4');
    expect(input.getAttribute('aria-description')).toBeNull();
});

it('selects the visibly highlighted hint cell and explains generation in a dialog', async () => {
    await startGame();
    fireEvent.click(screen.getByRole('button', {name: 'Add Hint'}));
    await waitFor(() => expect(document.querySelector('.cell.selected-cell.hint')).toBeTruthy());
    expect(document.activeElement?.matches('.cell input')).toBe(false);
    expect(document.querySelector('.cell.selected-cell.hint')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Annotate selected cell'}).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', {name: 'About puzzle generation'}));
    expect(screen.getByRole('dialog', {name: 'How puzzles are generated'})).toBeTruthy();
    expect(screen.getByText(/The generator tries up to three puzzles/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: /^Close$/}));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('does not open input focus on mount and retains it during touch note entry', async () => {
    await startGame();
    expect(document.activeElement?.matches('.cell input')).toBe(false);
    const input = screen.getByRole('textbox', {name: 'Row 1, column 3'});
    await userEvent.click(input);
    await userEvent.click(screen.getByRole('button', {name: 'Notes mode'}));
    expect(document.activeElement).toBe(input);
    await userEvent.click(screen.getByRole('button', {name: 'Toggle note 4'}));
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-description')).toBe('Notes: 4');
});
it('keeps a hint slot mounted before, during and after step explanations', async()=>{
 await startGame();
 const slot=screen.getByLabelText('Solving explanation');
 expect(slot.classList.contains('logic-step-empty')).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Add Hint'}));
 expect(screen.getByLabelText('Solving explanation')).toBe(slot);
 expect(slot.classList.contains('logic-step-empty')).toBe(false);
 expect(slot.querySelector('.explainer-summary')!.textContent).toBe(slot.querySelector('.explainer-text')!.textContent);
 expect(screen.queryByRole('button',{name:'Hide explanation'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Undo'}));
 expect(screen.getByLabelText('Solving explanation')).toBe(slot);
 expect(slot.classList.contains('logic-step-empty')).toBe(true);
 expect(screen.getByRole('link',{name:'Ksuduo strlns.github.io/ksuduo/'}).getAttribute('href')).toBe('https://strlns.github.io/ksuduo/');
});
it('offers annotation expansion and clears input selection on undo',async()=>{
 await startGame();
 fireEvent.click(screen.getByRole('button',{name:'Hint and annotation options'}));
 fireEvent.click(screen.getByRole('menuitem',{name:'Annotate all empty cells'}));
 await waitFor(()=>expect(document.querySelectorAll('.cell-notes')).toHaveLength(51));
 const input=screen.getByRole('textbox',{name:'Row 1, column 3'});
 await userEvent.click(input);await userEvent.keyboard('4');
 fireEvent.click(screen.getByRole('button',{name:'Undo'}));
 await waitFor(()=>expect(document.querySelector('.selected-cell')).toBeNull());
 expect(document.activeElement?.matches('.cell input')).toBe(false);
 expect(screen.getByRole('button',{name:'Annotate selected cell'}).hasAttribute('disabled')).toBe(true);
});
it('manual notes are not undo steps, number undo retains them and reset clears them', async () => {
 await startGame();
 const input = screen.getByRole('textbox', {name: 'Row 1, column 3'});
 await userEvent.click(input);
 fireEvent.click(screen.getByRole('button', {name: 'Annotate selected cell'}));
 expect(input.getAttribute('aria-description')).toBe('Notes: 1, 2, 4');
 expect(screen.getByRole('button', {name: 'Undo'}).hasAttribute('disabled')).toBe(true);
 await userEvent.keyboard('4');
 fireEvent.click(screen.getByRole('button', {name: 'Undo'}));
 expect(input.getAttribute('aria-description')).toBe('Notes: 1, 2, 4');
 fireEvent.click(screen.getByRole('button', {name: 'Reset'}));
 expect(document.querySelectorAll('.cell-notes')).toHaveLength(0);
 expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes).toEqual({});
 expect(screen.getByRole('button', {name: 'Undo'}).hasAttribute('disabled')).toBe(true);
});

it('explains impossible pencil marks without changing notes or values', async () => {
 await startGame();
 const input=screen.getByRole('textbox',{name:'Row 1, column 3'});
 await userEvent.click(input);
 fireEvent.click(screen.getByRole('button',{name:'Notes mode'}));
 fireEvent.click(screen.getByRole('button',{name:'Toggle note 5'}));
 expect(screen.getByText('Cannot note 5 in r1c3: Row 1 already contains 5.')).toBeTruthy();
 expect(input.getAttribute('aria-description')).toBeNull();
 expect(values()).toEqual(puzzle);
 fireEvent.click(screen.getByRole('button',{name:'Toggle note 4'}));
 expect(input.getAttribute('aria-description')).toBe('Notes: 4');
});
it('expands and collapses the explanation without replacing the board or hint slot', async () => {
 await startGame();
 const slot=screen.getByLabelText('Solving explanation');
 const board=document.querySelector('.board');
 const explain=screen.getByRole('button',{name:'Explain'});
 expect(explain.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(explain);
 expect(screen.getByRole('button',{name:'Collapse'}).getAttribute('aria-expanded')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:'Add Hint'}));
 expect(screen.getByLabelText('Solving explanation')).toBe(slot);
 expect(document.querySelector('.board')).toBe(board);
 fireEvent.click(screen.getByRole('button',{name:'Collapse'}));
 expect(screen.getByRole('button',{name:'Explain'}).getAttribute('aria-expanded')).toBe('false');
});
