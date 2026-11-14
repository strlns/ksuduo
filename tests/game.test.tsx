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
