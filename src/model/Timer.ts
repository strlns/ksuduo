export type IntervalId = undefined | number;

const MAGIC_NUMBER_COMPENSATE_OFF_BY_ONE_ON_PAUSE = 2;

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

        /**
         * this line has an unhealthy relationship with {@see MAGIC_NUMBER_COMPENSATE_OFF_BY_ONE_ON_PAUSE}
         * {@see pause()}
         * The "magic number" variant leads to off-by-one errors when restoring a paused game.
         * This variant leads to a stolen second on pause, that is returned to the player when resuming.
         */
        this.callback && this.callback.call(null);

        this.intervalId = window.setInterval(() => {
            this.callback && this.callback.call(null);
            this.secondsElapsed++;
        }, 1000);
    }

    public pause(): void {
        // if (this.secondsElapsed > MAGIC_NUMBER_COMPENSATE_OFF_BY_ONE_ON_PAUSE) {
        //     this.secondsElapsed--;
        // }
        this.clearInterval();
    }

    public resume(): void {
        // if (this.secondsElapsed > MAGIC_NUMBER_COMPENSATE_OFF_BY_ONE_ON_PAUSE) {
        //     setTimeout(() => {
        //         this.secondsElapsed++
        //     });
        // }
        this.start(this.secondsElapsed);
    }
}