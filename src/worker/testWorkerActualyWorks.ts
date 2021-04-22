import {MSGEVT_SOURCE, WORKER_ACTIONS} from "./sudoku.worker";
import SudokuWorker from "worker-loader!./sudoku.worker";

export default async function testWorker(): Promise<boolean> {
    return new Promise(resolve => {
        const worker: Worker = new SudokuWorker();
        worker.postMessage({
            source: MSGEVT_SOURCE,
            data: [WORKER_ACTIONS.TEST]
        });
        const listener = (event: MessageEvent) => {
            worker.removeEventListener("message", listener);
            worker.terminate();
            resolve(true);
        }
        worker.addEventListener('message', listener);
        setTimeout(() => {
            try {
                worker.terminate();
            }
            catch {}
            resolve(false);
        }, 2500);
    });
}