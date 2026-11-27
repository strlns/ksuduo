// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
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
const confirmIfNeeded = async () => {
 const button=screen.queryByRole('button',{name:/^Confirm /});
 if(button) {fireEvent.click(button); await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());}
};
const addHint = async () => {
    fireEvent.click(screen.getByRole('button', {name: 'Add Hint'}));
    if (screen.queryByRole('dialog', {name: 'Add a hint?'})) {
        fireEvent.click(screen.getByRole('button', {name: 'Add Hint'}));
        if (vi.isFakeTimers()) act(() => vi.advanceTimersByTime(300));
        else await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Add a hint?'})).toBeNull());
    }
};
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
        await addHint();
        await waitFor(() => expect(values().filter(Boolean)).toHaveLength(31));
        expect(document.querySelector('.cell.hint')).toBeTruthy();
        expect(localStorage.getItem('ksuduoState')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', {name: /Undo/i}));
        await waitFor(() => expect(values()).toEqual(puzzle));
        fireEvent.click(screen.getByRole('button', {name: /Show Solution/i}));
 await confirmIfNeeded();
        await waitFor(() => expect(screen.getByText('Solution shown')).toBeTruthy());
        expect(values().filter(Boolean)).toHaveLength(81);
        expect(screen.queryByText('Good job!')).toBeNull();
        fireEvent.click(screen.getByRole('button', {name: /^Reset$/i}));
 await confirmIfNeeded();
        await waitFor(() => expect(values()).toEqual(puzzle));
    });
    it('keeps native difficulty options, slider ranges and the timer toggle', async () => {
        await startGame();
        fireEvent.click(screen.getByRole('button', {name: 'Puzzle settings'}));
        const select = screen.getByLabelText('Difficulty');
        expect(screen.queryByRole('slider')).toBeNull();
        for (const [difficulty, maximum] of [['0', '37'], ['1', '29'], ['2', '28'], ['4', '28']]) {
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
    it.each([true, false])('returns focus after generation only for desktop pointers (desktop=%s)', async desktop => {
        const original = window.matchMedia;
        window.matchMedia = query => ({matches: desktop && query === '(hover: hover) and (pointer: fine)',
            media: query, onchange: null, dispatchEvent() {return true;}, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}} as MediaQueryList);
        try {
            await startGame();
            expect(document.activeElement?.closest('.cell')).toBeNull();
            const generate = screen.getByRole('button', {name: /Generate sudoku/i});
            await userEvent.click(generate);
            await waitFor(() => expect(mode.requests).toHaveLength(2));
            const first = screen.getByRole('textbox', {name: 'Row 1, column 3'});
            expect(document.querySelectorAll('.cell input[tabindex="0"]')).toHaveLength(1);
            if (desktop) {
                expect(document.activeElement).toBe(first);
                await userEvent.keyboard('{ArrowRight}');
                const next = document.activeElement;
                expect(next).toBe(screen.getByRole('textbox', {name: 'Row 1, column 4'}));
                await userEvent.tab();
                expect(document.activeElement?.closest('.cell')).toBeNull();
                await userEvent.tab({shift: true});
                expect(document.activeElement).toBe(next);
            } else expect(document.activeElement?.closest('.cell')).toBeNull();
        } finally { window.matchMedia = original; }
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
 await confirmIfNeeded();
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
    await addHint();
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
    await addHint();
    await waitFor(() => expect(document.querySelector('.cell.selected-cell.hint')).toBeTruthy());
    expect(document.activeElement?.matches('.cell input')).toBe(false);
    expect(document.querySelector('.cell.selected-cell.hint')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Annotate selected cell'}).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', {name: 'About puzzle generation'}));
    expect(screen.getByRole('dialog', {name: 'How puzzles are generated'})).toBeTruthy();
    expect(screen.getByText(/The generator first tries up to three puzzles/)).toBeTruthy();
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
 await addHint();
 expect(screen.getByLabelText('Solving explanation')).toBe(slot);
 expect(slot.classList.contains('logic-step-empty')).toBe(false);
 expect(slot.querySelector('.explainer-text')!.textContent).toContain(slot.querySelector('.explainer-summary')!.textContent);
 expect(slot.querySelector('.explainer-text')!.textContent!.length).toBeGreaterThan(slot.querySelector('.explainer-summary')!.textContent!.length + 80);
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
 await confirmIfNeeded();
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
 await addHint();
 expect(screen.getByLabelText('Solving explanation')).toBe(slot);
 expect(document.querySelector('.board')).toBe(board);
 fireEvent.click(screen.getByRole('button',{name:'Collapse'}));
 expect(screen.getByRole('button',{name:'Explain'}).getAttribute('aria-expanded')).toBe('false');
});

it('plays one completion sweep when an entry completes a correct unit, and stays silent on reveal', async () => {
    await startGame();
    const sweep = vi.fn();
    document.addEventListener('ksuduo-completion-sweep', sweep);
    try {
        for (const [column, value] of [[3,4],[4,6],[6,8],[7,9],[8,1],[9,2]]) {
            fireEvent.input(screen.getByRole('textbox', {name: `Row 1, column ${column}`}), {target:{value:String(value)}});
        }
        expect(sweep).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', {name:'Show Solution'}));
 await confirmIfNeeded();
        expect(sweep).toHaveBeenCalledTimes(1);
    } finally { document.removeEventListener('ksuduo-completion-sweep', sweep); }
});

it('shows settings directly on desktop', async () => {
    const original = window.matchMedia;
    window.matchMedia = query => ({
        matches: query.includes('min-width:900px'), media: query, onchange: null,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    });
    try {
        await startGame();
        expect(screen.getByLabelText('Difficulty')).toBeTruthy();
        expect(screen.queryByRole('button', {name:'Puzzle settings'})).toBeNull();
        expect(screen.queryByRole('dialog')).toBeNull();
    } finally { window.matchMedia = original; }
});

it('emits entry effects for keyboard numbers and distinguishes conflicts', async () => {
 await startGame();const cues:boolean[]=[];
 const listener=(event:Event)=>cues.push((event as CustomEvent).detail.wrong);
 document.addEventListener('ksuduo-entry-cue',listener);
 try {
  const input=screen.getByRole('textbox',{name:'Row 1, column 3'});
  await userEvent.click(input);await userEvent.keyboard('4');await userEvent.keyboard('{Backspace}');await userEvent.keyboard('5');
  expect(cues).toEqual([false,true]);
 } finally {document.removeEventListener('ksuduo-entry-cue',listener);}
});

it('protects progress with cancellable confirmations for destructive and bulk actions', async () => {
 await startGame();
 const input=screen.getByRole('textbox',{name:'Row 1, column 3'});
 await userEvent.click(input);await userEvent.keyboard('4');
 fireEvent.click(screen.getByRole('button',{name:'Annotate selected cell'}));
 // Add a note in an empty cell so Clear all also has work to protect.
 await userEvent.click(screen.getByRole('textbox',{name:'Row 1, column 4'}));
 fireEvent.click(screen.getByRole('button',{name:'Annotate selected cell'}));
 const before=values(),savedNotes=localStorage.getItem('ksuduo-notes');
 for(const name of ['Reset','Show Solution','Generate sudoku','Annotate all','Clear all notes']) {
  fireEvent.click(screen.getByRole('button',{name: new RegExp(`^${name}$`)}));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(values()).toEqual(before);
  fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
  expect(values()).toEqual(before);expect(localStorage.getItem('ksuduo-notes')).toBe(savedNotes);
 }
 fireEvent.click(screen.getByRole('button',{name:/^Reset$/}));
 fireEvent.click(screen.getByRole('button',{name:'Confirm reset puzzle'}));
 await waitFor(()=>expect(values()).toEqual(puzzle));
});

it('plays arrival visuals only for successful generation, keeping the board mounted during hints', async () => {
 await startGame();
 const arrival=document.querySelector('.board-arrival');
 expect(arrival).toBeTruthy();
 await addHint();
 expect(document.querySelector('.board-arrival')).toBe(arrival);
 fireEvent.click(screen.getByRole('button',{name:/^Generate sudoku$/}));
 await confirmIfNeeded();
 await waitFor(()=>expect(document.querySelector('.board-arrival')).not.toBe(arrival));
});

it('celebrates a manual final entry after hints filled every other empty cell', async () => {
 await startGame();
 for(let i=0;i<50;i++)await addHint();
 expect(values().filter(Boolean)).toHaveLength(80);
 const remaining=values().findIndex(value=>!value);
 const {solution}=await import('./fixtures');
 fireEvent.input(screen.getByRole('textbox',{name:`Row ${Math.floor(remaining/9)+1}, column ${remaining%9+1}`}),{target:{value:String(solution[remaining])}});
 expect(screen.queryByText('Good job!')).toBeNull();
 expect(screen.getByRole('status').textContent).toContain('Puzzle complete');
 expect(document.querySelector('.board-celebrating')).toBeTruthy();
 await waitFor(()=>expect(screen.getByText('Good job!')).toBeTruthy(), {timeout:3000});
 expect(document.querySelector('.board-celebrating')).toBeNull();
 expect(document.querySelector('.victory-crown')).toBeTruthy();
 expect(document.querySelectorAll('.victory-bubbles span')).toHaveLength(10);
 expect(screen.queryByText('Solution shown')).toBeNull();
},60000);

it('labels the achieved board rating even when a harder grade was requested', async () => {
 await startGame();
 fireEvent.click(screen.getByRole('button',{name:'Puzzle settings'}));
 fireEvent.change(screen.getByLabelText('Difficulty'),{target:{value:'4'}});
 fireEvent.click(screen.getByRole('button',{name:'Done'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 fireEvent.click(screen.getByRole('button',{name:'Generate sudoku'}));
 await waitFor(()=>expect(mode.requests).toHaveLength(2));
 expect(screen.getByText('Difficulty: Easiest')).toBeTruthy();
 expect(JSON.parse(localStorage.getItem('ksuduoState')!)[8]).toBe(0);
});

it('replays several undone hints with the same placements and explanations, counting filled hints', async () => {
    await startGame();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
        const path: {values: number[]; explanation: string}[] = [];
        for (let i=0; i<3; i++) {
            await addHint();
            path.push({values: values(), explanation: document.getElementById('step-explanation')!.textContent!});
            expect(screen.getByText(`Clues: ${31+i}`)).toBeTruthy();
        }
        for (let i=0; i<3; i++) fireEvent.click(screen.getByRole('button', {name: /Undo/i}));
        expect(values()).toEqual(puzzle);
        expect(screen.getByText('Clues: 30')).toBeTruthy();
        random.mockReturnValue(.9999);
        for (let i=0; i<3; i++) {
            await addHint();
            expect(values()).toEqual(path[i].values);
            expect(document.getElementById('step-explanation')!.textContent).toBe(path[i].explanation);
            expect(screen.getByText(`Clues: ${31+i}`)).toBeTruthy();
        }
        fireEvent.click(screen.getByRole('button', {name: 'Reset'}));
        await confirmIfNeeded();
        expect(screen.getByText('Clues: 30')).toBeTruthy();
        expect(values()).toEqual(puzzle);
    } finally {random.mockRestore();}
});

it('discards hint replay when the player makes a new move, even if that move is then undone', async () => {
    await startGame();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
        await addHint();
        const explanation = document.getElementById('step-explanation')!.textContent;
        fireEvent.click(screen.getByRole('button', {name: /Undo/i}));
        const cell = screen.getByRole('textbox', {name: 'Row 1, column 3'});
        fireEvent.input(cell, {target: {value: '4'}, data: '4', inputType: 'insertText'});
        expect(values()[2]).toBe(4);
        expect(screen.getByText('Clues: 30')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', {name: /Undo/i}));
        random.mockReturnValue(.9999);
        await addHint();
        expect(document.getElementById('step-explanation')!.textContent).not.toBe(explanation);
    } finally {random.mockRestore();}
});


it('expires single highlights while retaining the explanation and does not revive emphasis on entry', async () => {
    await startGame();
    vi.useFakeTimers();
    try {
        await addHint();
        const explanation = document.getElementById('step-explanation')!.textContent;
        expect(document.querySelector('.hint-added')).toBeTruthy();
        act(() => {vi.advanceTimersByTime(8000);});
        expect(document.querySelector('.hint,.hint-added,.hint-origin,.logic-source')).toBeNull();
        expect(document.getElementById('step-explanation')!.textContent).toBe(explanation);
        const input = Array.from(document.querySelectorAll<HTMLInputElement>('.cell input')).find(input => !input.value)!;
        act(() => {input.focus();});
        fireEvent.input(input, {target: {value: '1'}});
        expect(document.querySelector('.hint,.hint-added,.hint-origin')).toBeNull();
    } finally {vi.useRealTimers();}
});


it('browses immutable hint snapshots, returns to the current board and keeps undo on the live path', async () => {
    await startGame();
    fireEvent.click(screen.getByRole('button', {name: 'Explain'}));
    await addHint();
    const first = values();
    const explanation = document.getElementById('step-explanation')!.textContent;
    await addHint();
    const second = values();
    const saved = localStorage.getItem('ksuduoState');
    const notes = localStorage.getItem('ksuduo-notes');
    fireEvent.click(screen.getByRole('button', {name: 'Previous hint'}));
    expect(values()).toEqual(first);
    expect(document.getElementById('step-explanation')!.textContent).toContain(explanation);
    const input = Array.from(document.querySelectorAll<HTMLInputElement>('.cell input')).find(input => !input.value)!;
    expect(input.readOnly).toBe(true);
    fireEvent.input(input, {target: {value: '1'}});
    expect(values()).toEqual(first);
    expect(localStorage.getItem('ksuduoState')).toBe(saved);
    expect(localStorage.getItem('ksuduo-notes')).toBe(notes);
    fireEvent.click(screen.getByRole('button', {name: 'Current board'}));
    expect(values()).toEqual(second);
    fireEvent.click(screen.getByRole('button', {name: 'Previous hint'}));
    fireEvent.click(screen.getByRole('button', {name: 'Undo'}));
    expect(values()).toEqual(first);
    expect(screen.queryByRole('button', {name: 'Current board'})).toBeNull();
    expect(screen.queryByText('Hint 1 of 2')).toBeNull();
    expect(document.getElementById('step-explanation')!.textContent).toBe(explanation);
    await addHint();
    expect(values()).toEqual(second);
});

it('offers three assistant states without keeping a Details dialog or losing the current hint', async () => {
    await startGame();
    await addHint();
    expect(screen.queryByRole('button', {name: 'Details'})).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Hide hint assistant'}));
    expect(screen.queryByLabelText('Solving explanation')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Show hint assistant'}));
    fireEvent.click(screen.getByRole('button', {name: 'Explain'}));
    expect(screen.getByRole('button', {name: 'Collapse'})).toBeTruthy();
    expect(document.getElementById('step-explanation')!.textContent).toContain('hidden single');
});

it('annotates missing explanation cells and reports when the same action would add nothing', async () => {
    await startGame();
    fireEvent.click(screen.getByRole('button', {name: 'Explain'}));
    await addHint();
    const annotate = screen.getByRole('button', {name: 'Annotate these cells'});
    expect(annotate.hasAttribute('disabled')).toBe(false);
    fireEvent.click(annotate);
    expect(document.querySelectorAll('.cell-notes').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', {name: 'Notes already shown'}).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', {name: 'Clear all notes'}));
    await confirmIfNeeded();
    expect(screen.getByRole('button', {name: 'Annotate these cells'}).hasAttribute('disabled')).toBe(false);
});

it('shares hint confirmation dismissal for this session and keeps cancellation harmless', async () => {
    await startGame();
    const before = values();
    fireEvent.click(screen.getByRole('button', {name: 'Next Hint'}));
    expect(screen.getByRole('checkbox').hasAttribute('checked')).toBe(true);
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(values()).toEqual(before);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await addHint();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', {name: 'Next Hint'}));
    expect(screen.queryByRole('dialog', {name: 'Add a hint?'})).toBeNull();
    expect(values()).not.toEqual(before);
});

it('offers step-by-step mode after two mobile holds and permits the next hint by tap', async () => {
    const original = window.matchMedia;
    window.matchMedia = query => ({matches: query === '(pointer: coarse)', media: query, onchange: null,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true});
    try {
        await startGame();
        vi.useFakeTimers();
        for (let i = 0; i < 2; i++) {
            const button = screen.getByRole('button', {name: 'Next Hint (hold for 2 seconds)'});
            fireEvent.pointerDown(button);
            act(() => vi.advanceTimersByTime(2000));
            fireEvent.pointerUp(button);
            fireEvent.click(button, {detail: 1});
        }
        expect(screen.getByRole('dialog', {name: 'Enable step-by-step mode?'})).toBeTruthy();
        fireEvent.click(screen.getByRole('button', {name: 'Enable'}));
        act(() => vi.advanceTimersByTime(300));
        const before = values();
        fireEvent.click(screen.getByRole('button', {name: 'Next Hint'}), {detail: 1});
        expect(values()).not.toEqual(before);
        expect(screen.queryByRole('dialog')).toBeNull();
    } finally {vi.useRealTimers(); window.matchMedia = original;}
});

it('keeps the touch keypad mounted for entries, notes and erasing', async () => {
    const original = window.matchMedia;
    window.matchMedia = query => ({matches: query === '(pointer: coarse)', media: query, onchange: null,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true});
    try {
        await startGame();
        const cell = screen.getByRole('textbox', {name: 'Row 1, column 3'}) as HTMLInputElement;
        act(() => cell.focus());
        expect(cell.readOnly).toBe(true);
        expect(cell.inputMode).toBe('none');
        const pad = screen.getByRole('group', {name: 'Number pad'});
        fireEvent.click(screen.getByRole('button', {name: 'Enter 4'}));
        expect(cell.value).toBe('4');
        fireEvent.click(screen.getByRole('button', {name: 'Erase number'}));
        expect(cell.value).toBe('');
        fireEvent.click(screen.getByRole('button', {name: 'Notes mode'}));
        expect(screen.getByRole('group', {name: 'Note digits'})).toBe(pad);
        fireEvent.click(screen.getByRole('button', {name: 'Toggle note 4'}));
        expect(screen.getByRole('button', {name: 'Toggle note 4'}).getAttribute('aria-pressed')).toBe('true');
        expect(cell.value).toBe('');
    } finally {window.matchMedia = original;}
});

it('branches only after confirmation even when the hint assistant is hidden', async () => {
    await startGame();
    await addHint();
    const first = values();
    await addHint();
    fireEvent.click(screen.getByRole('button', {name: 'Explain'}));
    fireEvent.click(screen.getByRole('button', {name: 'Previous hint'}));
    fireEvent.click(screen.getByRole('button', {name: 'Hide hint assistant'}));
    const branch = screen.getByRole('button', {name: 'Play from this hint'});
    fireEvent.click(branch);
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', {name: 'Current board'})).toBeTruthy();
    fireEvent.click(branch);
    await confirmIfNeeded();
    expect(values()).toEqual(first);
    expect(screen.queryByRole('button', {name: 'Current board'})).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Undo'}));
    expect(values()).toEqual(puzzle);
});
