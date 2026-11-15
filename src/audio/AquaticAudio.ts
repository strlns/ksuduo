export const AQUATIC_CUE = 'ksuduo-aquatic-cue';
export const playAquaticCue = () => document.dispatchEvent(new Event(AQUATIC_CUE));

function createPlaybackContext() {
    // Safari exposes an audio session category; request media playback explicitly.
    const session = (navigator as Navigator & {audioSession?: {type: string}}).audioSession;
    if (session) { try { session.type = 'playback'; } catch { /* optional API */ } }
    return new AudioContext();
}

/** Procedural, self-contained ambient audio. Created only by a user gesture. */
export class AquaticAudio {
    private context = createPlaybackContext();
    private disposed = false;
    private started = false;
    private master = this.context.createGain();
    private timer?: ReturnType<typeof setInterval>;
    private lastFx = -Infinity;
    private chord = 0;
    private echo = this.context.createDelay(2);
    private feedback = this.context.createGain();
    private filter = this.context.createBiquadFilter();
    constructor(private music: boolean, private effects = true) {
        this.master.gain.value = .55;
        this.master.connect(this.context.destination);
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 1300;
        this.filter.connect(this.master);
        this.echo.delayTime.value = .48;
        this.feedback.gain.value = .25;
        this.echo.connect(this.feedback);
        this.feedback.connect(this.echo);
        this.echo.connect(this.filter);
    }
    async start() {
        // Invoke resume inside the gesture, then schedule only once audio is running.
        await this.context.resume();
        if (this.disposed) return;
        if (this.context.state !== 'running') throw new Error('Audio playback is suspended');
        if (!this.started) {
            this.started = true;
            if (this.music) {
                this.playChord();
                this.timer = setInterval(() => this.playChord(), 9000);
            }
            this.effect(); // Subtle confirmation only in modes with effects.
        }
    }
    private tone(midi: number, duration: number, volume: number, attack: number, delay = 0, watery = false) {
        const ctx = this.context, start = ctx.currentTime + delay;
        const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
        oscillator.type = 'sine';
        const frequency = 440 * 2 ** ((midi - 69) / 12);
        oscillator.frequency.setValueAtTime(watery ? frequency * 1.15 : frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency, start + .18);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(volume, start + attack);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(this.filter);
        envelope.connect(this.echo);
        oscillator.start(start);
        oscillator.stop(start + duration + .1);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    }
    private playChord() {
        if (this.context.state !== 'running') return;
        // Slow voice-leading in D minor: Dm9, Bbmaj7, Gm9, Am7 suspended.
        const chords = [[38,53,57,60,64],[34,53,57,62,65],[31,53,57,58,62],[33,55,57,60,64]];
        const notes = chords[this.chord++ % chords.length];
        notes.forEach((note, index) => {
            this.tone(note, 13, index === 0 ? .07 : .025, 3.5);
            if (index > 0) this.tone(note + .035, 12, .012, 4);
        });
        this.tone(notes[3] + 12, 5, .018, .5, 4.5);
    }
    effect(aquatic = false) {
        const now = this.context.currentTime;
        if (!this.effects || this.context.state !== 'running' || now - this.lastFx < .12) return;
        this.lastFx = now;
        if (aquatic) {
            this.tone(74, .9, .024, .045, 0, true);
            this.tone(81, .7, .0096, .08, .09, true);
        } else {
            // A short, softly filtered downward glide well below the aquatic cue.
            this.tone(67, .24, .006, .025, 0, true);
        }
    }
    setHidden(hidden: boolean) {
        if (hidden) void this.context.suspend().catch(() => {});
        else void this.context.resume().catch(() => {});
    }
    dispose() {
        this.disposed = true;
        clearInterval(this.timer);
        this.master.gain.cancelScheduledValues(this.context.currentTime);
        this.master.gain.setTargetAtTime(0, this.context.currentTime, .04);
        setTimeout(() => {void this.context.close().catch(() => {});}, 200);
    }
}
