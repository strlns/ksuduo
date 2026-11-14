import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import testWorker from '../src/worker/testWorkerActuallyWorks';
import WorkerConstructor from '../src/worker/sudoku.worker?worker';
import {MSGEVT_SOURCE, WORKER_ACTIONS} from '../src/worker/protocol';

vi.mock('../src/worker/sudoku.worker?worker', () => ({default: vi.fn()}));
let worker: EventTarget & {postMessage: ReturnType<typeof vi.fn>; terminate: ReturnType<typeof vi.fn>};
beforeEach(() => {
    vi.useFakeTimers();
    worker = Object.assign(new EventTarget(), {postMessage: vi.fn(), terminate: vi.fn()});
    vi.mocked(WorkerConstructor).mockImplementation(function () {return worker as unknown as Worker;});
});
afterEach(() => {vi.useRealTimers(); vi.restoreAllMocks();});

it('verifies the actual message exchange and cleans up the probe', async () => {
    const result = testWorker();
    expect(worker.postMessage).toHaveBeenCalledWith({source: MSGEVT_SOURCE, data: [WORKER_ACTIONS.TEST]});
    worker.dispatchEvent(new Event('message'));
    expect(await result).toBe(true);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
});
it('falls back when the worker never replies', async () => {
    const result = testWorker();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toBe(false);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
});
it('falls back when worker creation is blocked', async () => {
    vi.mocked(WorkerConstructor).mockImplementation(function () {throw new Error('blocked');});
    expect(await testWorker()).toBe(false);
});
it('falls back on worker errors and postMessage failures', async () => {
    const result = testWorker();
    worker.dispatchEvent(new Event('error'));
    expect(await result).toBe(false);
    worker.postMessage.mockImplementation(() => {throw new Error('blocked');});
    expect(await testWorker()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
});
