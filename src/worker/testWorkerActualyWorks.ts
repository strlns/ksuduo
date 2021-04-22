import {WORKER_ACTIONS} from "./sudoku.worker";
import SudokuWorker from "worker-loader!./sudoku.worker";

export default async function testWorker(): Promise<boolean> {
    return new Promise(resolve => {
        const worker: Worker = new SudokuWorker();
        worker.postMessage({
            source: 'ksuduo',
            data: [WORKER_ACTIONS.TEST]
        });
        const listener = (event: MessageEvent) => {
            worker.removeEventListener("message", listener);
            worker.terminate();
            resolve(event.data);
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