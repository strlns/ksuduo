// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {AudioControl} from '../src/components/App/AudioControl';
import {AquaticAudio} from '../src/audio/AquaticAudio';

class Parameter {
    value = 0;
    setValueAtTime(value: number) {this.value = value;}
    linearRampToValueAtTime() {}
    exponentialRampToValueAtTime() {}
    setTargetAtTime(value: number) {this.value = value;}
    cancelScheduledValues() {}
}
class AudioNode {
    gain = new Parameter(); frequency = new Parameter(); Q = new Parameter(); delayTime = new Parameter();
    connect(target: unknown) {return target as AudioNode;}
    disconnect() {}
    start() {}
    stop() {}
}
const contexts: Context[] = [];
class Context extends EventTarget {
    state = 'suspended'; currentTime = 0; sampleRate = 100; destination = new AudioNode();
    recovery: 'works' | 'rejects' | 'pending' | 'stays-suspended' = 'works';
    constructor() {super(); contexts.push(this);}
    createGain = () => new AudioNode();
    createDelay = () => new AudioNode();
    createBiquadFilter = () => new AudioNode();
    createOscillator = () => new AudioNode();
    createConvolver = () => new AudioNode();
    createBuffer = (_channels: number, length: number) => ({getChannelData: () => new Float32Array(length)});
    change(state: string) {this.state = state; this.dispatchEvent(new Event('statechange'));}
    resume() {
        if (this.recovery === 'rejects') return Promise.reject(new Error('Gesture needed'));
        if (this.recovery === 'pending') return new Promise<void>(() => {});
        if (this.recovery === 'works') this.change('running');
        return Promise.resolve();
    }
    suspend() {this.change('suspended'); return Promise.resolve();}
    close() {this.change('closed'); return Promise.resolve();}
}
let hidden = false;
beforeEach(() => {
    contexts.length = 0; hidden = false; vi.useFakeTimers();
    vi.stubGlobal('AudioContext', Context);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
});
afterEach(() => {cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
const enable = async () => {
    render(<AudioControl/>);
    await act(async () => {fireEvent.click(screen.getByRole('button', {name: 'Sound: Off'}));});
    expect(screen.getByRole('button', {name: 'Sound: Music + FX'})).toBeTruthy();
    return contexts[0];
};
const visibility = async (value: boolean) => {
    hidden = value;
    await act(async () => {document.dispatchEvent(new Event('visibilitychange'));});
};

it('retains the selected mode if the actual context recovers after a tab switch', async () => {
    const ctx = await enable();
    await visibility(true);
    expect(ctx.state).toBe('suspended');
    await visibility(false);
    expect(ctx.state).toBe('running');
    expect(screen.getByRole('button', {name: 'Sound: Music + FX'})).toBeTruthy();
});

it.each(['rejects', 'pending', 'stays-suspended'] as const)('returns to Off when foreground recovery %s', async recovery => {
    const ctx = await enable();
    await visibility(true);
    ctx.recovery = recovery;
    await visibility(false);
    await act(async () => {vi.advanceTimersByTime(1200);});
    expect(screen.getByRole('button', {name: 'Sound: Off'})).toBeTruthy();
    // The next tap starts music immediately instead of advancing through stale modes.
    await act(async () => {fireEvent.click(screen.getByRole('button', {name: 'Sound: Off'}));});
    expect(screen.getByRole('button', {name: 'Sound: Music + FX'})).toBeTruthy();
});

it('observes native foreground interruption and ignores events from a disposed old context', async () => {
    const old = await enable();
    await act(async () => {fireEvent.click(screen.getByRole('button', {name: 'Sound: Music + FX'}));});
    const current = contexts.at(-1)!;
    act(() => {old.change('closed');});
    expect(screen.getByRole('button', {name: 'Sound: FX only'})).toBeTruthy();
    act(() => {current.change('interrupted');});
    expect(screen.getByRole('button', {name: 'Sound: Off'})).toBeTruthy();
});

it('does not equate pagehide or an already running context with lost playback', async () => {
    await enable();
    await act(async () => {window.dispatchEvent(new Event('pagehide')); window.dispatchEvent(new Event('pageshow'));});
    expect(screen.getByRole('button', {name: 'Sound: Music + FX'})).toBeTruthy();
});

it('reports startup failure and permits a retry', async () => {
    render(<AudioControl/>);
    // A constructor that starts suspended and cannot resume without a gesture.
    vi.stubGlobal('AudioContext', class extends Context {recovery = 'rejects' as const;});
    await act(async () => {fireEvent.click(screen.getByRole('button', {name: 'Sound: Off'}));});
    expect(screen.getByRole('button', {name: 'Sound: Off'}).textContent).toContain('Retry sound');
});

it('cancels pending foreground recovery when the engine is disposed', async () => {
    const lost = vi.fn();
    const audio = new AquaticAudio(true, true, lost);
    await audio.start();
    audio.setHidden(true); contexts[0].recovery = 'pending'; audio.setHidden(false);
    audio.dispose();
    await vi.advanceTimersByTimeAsync(2000);
    expect(lost).not.toHaveBeenCalled();
});
