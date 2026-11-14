export type IntervalId = undefined | number;

export class Timer {
  public secondsElapsed: number;
  protected intervalId: IntervalId;
  public callback: Function;

  constructor(callback?: Function, ms?: number) {
    this.callback = callback ?? (() => {});
    this.secondsElapsed = ms ? ms / 1000 : 0;
    this.intervalId = undefined;
  }

  public clearInterval(): void {
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
      this.secondsElapsed++;
      this.callback.call(null);
    }, 1000);
  }

  public pause(): void {
    this.clearInterval();
  }

  public resume(): void {
    this.start(this.secondsElapsed);
  }

  get ms(): number {
    return this.secondsElapsed * 1000;
  }
  set ms(ms: number) {
    this.secondsElapsed = ms / 1000;
  }
}
