export type IntervalId = undefined | number;

export const MAGIC_NUMBER_COMPENSATE_JIT_JITTER = 2;

export class Timer {
    public secondsElapsed: number;
    protected intervalId: IntervalId;
    public callback: Function;

    constructor(callback?: Function) {
        if (callback) {
            this.callback = callback;
        }
    }

    private clearInterval(): void {
        if (this.intervalId !== undefined) {
            window.clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    public start(initiallyElapsed?: number): void {
        this.clearInterval();
        if (initiallyElapsed !== undefined) {
            this.secondsElapsed = initiallyElapsed;
        } else {
            this.secondsElapsed = 0;
        }
        this.intervalId = window.setInterval(() => {
            this.callback && this.callback.call(null);
            this.secondsElapsed++;
        }, 1000);
    }

    public pause(): void {
        if (this.secondsElapsed > MAGIC_NUMBER_COMPENSATE_JIT_JITTER) {
            this.secondsElapsed--;
        }
        this.clearInterval();
    }

    public resume(): void {
        if (this.secondsElapsed > 0 && !this.intervalId) {
            if (this.secondsElapsed > MAGIC_NUMBER_COMPENSATE_JIT_JITTER) {
                setTimeout(() => {
                    this.secondsElapsed++
                });
            }
            this.start(this.secondsElapsed);
        }
    }
}