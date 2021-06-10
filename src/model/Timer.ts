export type IntervalId = undefined | number;

export class Timer {
    public secondsElapsed: number;
    protected intervalId: IntervalId;
    public callback: Function;

    constructor(callback?: Function) {
        this.callback = callback ?? (() => {
        });
        this.secondsElapsed = 0;
        this.intervalId = undefined;
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

        this.callback.call(null);

        this.intervalId = window.setInterval(() => {
            this.callback && this.callback.call(null);
            this.secondsElapsed++;
        }, 1000);
    }

    public pause(): void {
        this.clearInterval();
    }

    public resume(): void {
        this.start(this.secondsElapsed);
    }
}