import {MSGEVT_SOURCE, WORKER_ACTIONS} from "./protocol";
import SudokuWorker from "./sudoku.worker?worker";

export default async function testWorker(): Promise<boolean> {
    return new Promise(resolve => {
        let worker: Worker;
        try {
            worker = new SudokuWorker();
        } catch {
            resolve(false);
            return;
        }
        const finish = (works: boolean) => {
            clearTimeout(timeout);
            worker.removeEventListener('message', listener);
            worker.removeEventListener('error', onError);
            worker.terminate();
            resolve(works);
        };
        const listener = () => finish(true);
        const onError = () => finish(false);
        const timeout = setTimeout(() => finish(false), 5000);
        worker.addEventListener('message', listener);
        worker.addEventListener('error', onError);
        try {
            worker.postMessage({source: MSGEVT_SOURCE, data: [WORKER_ACTIONS.TEST]});
        } catch {
            finish(false);
        }
    });
}
