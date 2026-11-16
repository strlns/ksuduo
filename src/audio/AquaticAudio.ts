export const ENTRY_CUE = 'ksuduo-entry-cue';
export const playEntryCue = (wrong: boolean) => document.dispatchEvent(new CustomEvent(ENTRY_CUE, {detail: {wrong}}));
export const COMPLETION_SWEEP = 'ksuduo-completion-sweep';
export const playCompletionSweep = () => document.dispatchEvent(new Event(COMPLETION_SWEEP));
export const AQUATIC_CUE = 'ksuduo-aquatic-cue';
export const playAquaticCue = () => document.dispatchEvent(new Event(AQUATIC_CUE));

function createPlaybackContext() {
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
    private hidden = document.hidden;
    private recovering = false;
    private recoveryAttempt = 0;
    private recoveryTimeout?: ReturnType<typeof setTimeout>;
    private readonly stateChanged = () => {
        if (this.started && !this.disposed && !this.hidden && !this.recovering && this.context.state !== 'running') {
            this.onPlaybackLost();
        }
    };
    private timer?: ReturnType<typeof setInterval>;
    private lastFx = -Infinity;
    private chord = 0;
    private motif = 0;
    private lastMotif = -Infinity;
    private echo = this.context.createDelay(2);
    private feedback = this.context.createGain();
    private filter = this.context.createBiquadFilter();
    private fx = this.context.createBiquadFilter();
    private tape = this.context.createDelay(1);
    private tapeFeedback = this.context.createGain();
    private wow = this.context.createOscillator();

    constructor(private music: boolean, private effects = true, private onPlaybackLost: () => void = () => {}) {
        const ctx = this.context;
        this.master.gain.value = .55;
        this.master.connect(ctx.destination);
        ctx.addEventListener('statechange', this.stateChanged);
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 1300;
        const dry = ctx.createGain();
        dry.gain.value = .68;
        this.filter.connect(dry).connect(this.master);
        this.echo.delayTime.value = .48;
        this.feedback.gain.value = .25;
        this.echo.connect(this.feedback).connect(this.echo);
        this.echo.connect(this.filter);

        // A stereo, dark hall tail. No recordings, downloads or external assets.
        const reverb = ctx.createConvolver();
        reverb.buffer = this.impulse(5.5, 1.1, 0x51d00);
        const predelay = ctx.createDelay(.1), wet = ctx.createGain();
        const roomLow = ctx.createBiquadFilter(), roomHigh = ctx.createBiquadFilter();
        predelay.delayTime.value = .035;
        roomLow.type = 'lowpass'; roomLow.frequency.value = 2400;
        roomHigh.type = 'highpass'; roomHigh.frequency.value = 180;
        wet.gain.value = .82;
        this.filter.connect(predelay).connect(reverb).connect(roomHigh).connect(roomLow).connect(wet).connect(this.master);

        // Every effect shares the same softened top end and low, drifting tape send.
        this.fx.type = 'lowpass'; this.fx.frequency.value = 2800; this.fx.Q.value = .5;
        this.fx.connect(this.master);
        const send = ctx.createGain(), repeats = ctx.createGain();
        const tapeLow = ctx.createBiquadFilter(), tapeHigh = ctx.createBiquadFilter();
        send.gain.value = .22; repeats.gain.value = .6;
        tapeLow.type = 'lowpass'; tapeLow.frequency.value = 1550; tapeLow.Q.value = .5;
        tapeHigh.type = 'highpass'; tapeHigh.frequency.value = 260;
        this.tape.delayTime.value = .245;
        this.tapeFeedback.gain.value = .18;
        this.fx.connect(send).connect(this.tape).connect(tapeHigh).connect(tapeLow);
        tapeLow.connect(repeats).connect(this.master);
        tapeLow.connect(this.tapeFeedback).connect(this.tape);
        // A separate, long dark FX hall. The music signal and its gain stay untouched.
        const fxRoom = ctx.createConvolver(), roomSend = ctx.createGain();
        const fxPredelay = ctx.createDelay(.2), fxRoomLow = ctx.createBiquadFilter(), fxRoomHigh = ctx.createBiquadFilter();
        fxRoom.buffer = this.impulse(7, 2, 0xa91c);
        fxPredelay.delayTime.value = .06;
        fxRoomHigh.type = 'highpass'; fxRoomHigh.frequency.value = 240;
        fxRoomLow.type = 'lowpass'; fxRoomLow.frequency.value = 1900;
        roomSend.gain.value = .36;
        this.fx.connect(fxPredelay).connect(fxRoom).connect(fxRoomHigh).connect(fxRoomLow).connect(roomSend).connect(this.master);
        // Slow, shallow wow: under two milliseconds, with no sharp time jumps.
        const depth = ctx.createGain(); depth.gain.value = .0012;
        this.wow.frequency.value = .17;
        this.wow.connect(depth).connect(this.tape.delayTime);
    }
    async start() {
        await this.context.resume();
        if (this.disposed) return;
        if (this.context.state !== 'running') throw new Error('Audio playback is suspended');
        if (!this.started) {
            this.started = true;
            this.wow.start();
            if (this.music) {
                this.playChord();
                this.timer = setInterval(() => this.playChord(), 9000);
            }
            this.effect();
        }
    }
    private impulse(duration: number, decay: number, seed: number) {
        const ctx = this.context;
        const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const samples = impulse.getChannelData(channel);
            let smooth = 0;
            for (let i = 0; i < samples.length; i++) {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                smooth += ((seed / 2 ** 31 - 1) - smooth) * .24;
                samples[i] = smooth * Math.exp(-i / (ctx.sampleRate * decay));
            }
        }
        return impulse;
    }
    private driftTape(accent = false) {
        const now = this.context.currentTime;
        this.tape.delayTime.setTargetAtTime(accent ? .38 + Math.random() * .25 : .25 + Math.random() * .1, now, .6);
        this.tapeFeedback.gain.setTargetAtTime(accent ? .24 + Math.random() * .08 : .16 + Math.random() * .06, now, .5);
    }
    private tone(midi: number, duration: number, volume: number, attack: number, delay = 0, watery = false) {
        const ctx = this.context, start = ctx.currentTime + delay;
        const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
        oscillator.type = watery ? 'triangle' : 'sine';
        const frequency = 440 * 2 ** ((midi - 69) / 12);
        oscillator.frequency.setValueAtTime(watery ? frequency * 1.15 : frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency, start + .18);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(volume, start + attack);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(envelope);
        if (watery) envelope.connect(this.fx);
        else { envelope.connect(this.filter); envelope.connect(this.echo); }
        oscillator.start(start);
        oscillator.stop(start + duration + .1);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    }
    private harmonic(midi: number) {
        const ctx = this.context, start = ctx.currentTime + 2;
        const oscillator = ctx.createOscillator(), band = ctx.createBiquadFilter(), envelope = ctx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
        band.type = 'bandpass'; band.Q.value = .45;
        band.frequency.setValueAtTime(380, start);
        band.frequency.exponentialRampToValueAtTime(1250, start + 5);
        band.frequency.exponentialRampToValueAtTime(420, start + 11);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(.004, start + 4);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + 12);
        oscillator.connect(band).connect(envelope).connect(this.filter);
        oscillator.start(start); oscillator.stop(start + 12.1);
        oscillator.onended = () => {oscillator.disconnect(); band.disconnect(); envelope.disconnect();};
    }
    private playChord() {
        if (this.context.state !== 'running') return;
        // Preserve the slow D-minor voice-leading: Dm9, Bbmaj7, Gm9, Am7 suspended.
        const chords = [[38,53,57,60,64],[34,53,57,62,65],[31,53,57,58,62],[33,55,57,60,64]];
        const notes = chords[this.chord++ % chords.length];
        notes.forEach((note, index) => {
            this.tone(note, 13, index === 0 ? .07 : .025, 3.5);
            if (index > 0) this.tone(note + .035, 12, .012, 4);
        });
        this.tone(notes[3] + 12, 5, .018, .5, 4.5);
        this.harmonic(notes[2] + 12);
    }
    effect(aquatic = false) {
        const now = this.context.currentTime;
        if (!this.effects || this.context.state !== 'running' || now - this.lastFx < .12) return;
        this.lastFx = now;
        this.driftTape(aquatic);
        if (aquatic) {
            // A loose pair of midrange droplets; no upward squeal or repeated tune.
            const base = 540 + Math.random() * 140;
            this.zap(base, .22, .034);
            this.zap(base * (.82 + Math.random() * .12), .28, .019, .11 + Math.random() * .08);
        } else this.zap(500 + Math.random() * 130, .13, .023);
    }
    private zap(frequency: number, duration: number, volume: number, delay = 0, low = false) {
        const ctx = this.context, start = ctx.currentTime + delay;
        const oscillator = ctx.createOscillator(), body = ctx.createOscillator();
        const bodyGain = ctx.createGain(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
        oscillator.type = 'triangle';
        // The identity lives in the mids. Only a quiet, short underlay reaches the bass.
        oscillator.frequency.setValueAtTime(frequency * 1.65, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency, start + .035);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * .78, start + duration);
        body.type = 'sine';
        body.frequency.setValueAtTime(low ? 160 : frequency * .5, start);
        body.frequency.exponentialRampToValueAtTime(low ? 85 : frequency * .38, start + duration);
        bodyGain.gain.setValueAtTime(low ? .3 : .13, start);
        bodyGain.gain.exponentialRampToValueAtTime(.0001, start + Math.min(.09, duration));
        filter.type = 'lowpass'; filter.Q.value = 1.15;
        filter.frequency.setValueAtTime(low ? 2100 : 2400, start);
        filter.frequency.exponentialRampToValueAtTime(low ? 700 : 950, start + duration);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(filter);
        body.connect(bodyGain).connect(filter);
        filter.connect(gain).connect(this.fx);
        for (const voice of [oscillator, body]) {voice.start(start); voice.stop(start + duration + .02);}
        oscillator.onended = () => {oscillator.disconnect(); body.disconnect(); bodyGain.disconnect(); filter.disconnect(); gain.disconnect();};
    }
    entry(wrong: boolean) {
        const now = this.context.currentTime;
        if (!this.effects || this.context.state !== 'running' || now - this.lastFx < .06) return;
        this.lastFx = now;
        this.driftTape(wrong);
        this.zap((wrong ? 430 : 570) + Math.random() * 110, wrong ? .25 : .16, wrong ? .046 : .035, 0, wrong);
        if (wrong && this.music && now - this.lastMotif > 12) {
            this.lastMotif = now;
            // Sparse, rotating open intervals follow the current pad's root.
            const root = [38, 34, 31, 33][Math.max(0, this.chord - 1) % 4] + 24;
            const phrases = [[0, 7], [7, 12], [12, 2]];
            const phrase = phrases[this.motif++ % phrases.length];
            phrase.forEach((offset, i) => this.tone(root + offset, 2.4, .011, .16, .13 + i * .22, true));
        }
    }
    completionSweep() {
        if (!this.effects || this.context.state !== 'running') return;
        this.lastFx = this.context.currentTime;
        this.driftTape(true);
        // Restore the recognisable, legato aquatic sweep instead of a bubble cluster.
        // Tiny timing/detuning variations keep its contour without making a new jingle.
        const detune = (Math.random() - .5) * .12;
        const spacing = .082 + Math.random() * .012;
        [62, 69, 74, 76, 81, 86].forEach((note, i) =>
            this.tone(note + detune, 1.5 - i * .1, .024 - i * .002, .12, i * spacing, true));
    }
    setHidden(hidden: boolean) {
        this.hidden = hidden;
        const attempt = ++this.recoveryAttempt;
        clearTimeout(this.recoveryTimeout);
        if (this.disposed) return;
        if (hidden) {
            this.recovering = false;
            void this.context.suspend().catch(() => {});
            return;
        }
        if (!this.started || this.context.state === 'running') return;
        // Some iOS interruptions leave resume pending until a new user gesture.
        // Observe the context, then turn the control off if playback cannot recover.
        this.recovering = true;
        const check = () => {
            if (attempt !== this.recoveryAttempt) return;
            clearTimeout(this.recoveryTimeout);
            this.recovering = false;
            if (!this.disposed && !this.hidden && this.context.state !== 'running') this.onPlaybackLost();
        };
        this.recoveryTimeout = setTimeout(check, 1200);
        void this.context.resume().then(check, check);
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        clearTimeout(this.recoveryTimeout);
        this.context.removeEventListener('statechange', this.stateChanged);
        clearInterval(this.timer);
        if (this.started) this.wow.stop();
        this.master.gain.cancelScheduledValues(this.context.currentTime);
        this.master.gain.setTargetAtTime(0, this.context.currentTime, .04);
        setTimeout(() => {void this.context.close().catch(() => {});}, 200);
    }
}
