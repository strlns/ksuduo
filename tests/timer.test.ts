import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {Timer} from '../src/model/Timer';
import {formatTime} from '../src/utility/formatTime';

beforeEach(() => {vi.useFakeTimers(); vi.stubGlobal('window', globalThis);});
afterEach(() => {vi.useRealTimers(); vi.unstubAllGlobals();});

it('keeps exactly one interval after repeated start and resume calls', () => {
    const tick = vi.fn();
    const timer = new Timer(tick);
    for (let i = 0; i < 20; i++) {timer.start(); timer.resume();}
    expect(vi.getTimerCount()).toBe(1);
    tick.mockClear();
    vi.advanceTimersByTime(3000);
    expect(timer.secondsElapsed).toBe(3);
    expect(tick).toHaveBeenCalledTimes(3);
    timer.clearInterval();
    expect(vi.getTimerCount()).toBe(0);
});
it('pauses without losing elapsed time, resumes and resets for a new game', () => {
    const timer = new Timer();
    timer.start(65);
    vi.advanceTimersByTime(2000);
    timer.pause();
    vi.advanceTimersByTime(10000);
    expect(timer.secondsElapsed).toBe(67);
    timer.resume();
    vi.advanceTimersByTime(1000);
    expect(timer.secondsElapsed).toBe(68);
    timer.start();
    expect(timer.secondsElapsed).toBe(0);
    timer.clearInterval();
});
it('converts milliseconds consistently', () => {
    const timer = new Timer(undefined, 2500);
    expect(timer.secondsElapsed).toBe(2.5);
    expect(timer.ms).toBe(2500);
    timer.ms = 7000;
    expect(timer.secondsElapsed).toBe(7);
});
it.each([[0, ''], [1, '1s'], [59, '59s'], [60, '1min 0s'], [125, '2min 5s']])('keeps the elapsed time label for %s seconds', (input, output) => {
    expect(formatTime(input as number)).toBe(output);
});
