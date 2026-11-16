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
    private musicBus = this.context.createGain();
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
        this.musicBus.connect(this.master);
        ctx.addEventListener('statechange', this.stateChanged);
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 1300;
        const dry = ctx.createGain();
        dry.gain.value = .68;
        this.filter.connect(dry).connect(this.musicBus);
        this.echo.delayTime.value = .48;
        this.feedback.gain.value = .25;
        this.echo.connect(this.feedback).connect(this.echo);
        this.echo.connect(this.filter);

        // A stereo, dark hall tail. No recordings, downloads or external assets.
        const reverb = ctx.createConvolver();
        const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 5.5), ctx.sampleRate);
        let seed = 0x51d00;
        for (let channel = 0; channel < 2; channel++) {
            const samples = impulse.getChannelData(channel);
            let smooth = 0;
            for (let i = 0; i < samples.length; i++) {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                smooth += ((seed / 2 ** 31 - 1) - smooth) * .24;
                samples[i] = smooth * Math.exp(-i / (ctx.sampleRate * 1.1));
            }
        }
        reverb.buffer = impulse;
        const predelay = ctx.createDelay(.1), wet = ctx.createGain();
        const roomLow = ctx.createBiquadFilter(), roomHigh = ctx.createBiquadFilter();
        predelay.delayTime.value = .035;
        roomLow.type = 'lowpass'; roomLow.frequency.value = 2400;
        roomHigh.type = 'highpass'; roomHigh.frequency.value = 180;
        wet.gain.value = .82;
        this.filter.connect(predelay).connect(reverb).connect(roomHigh).connect(roomLow).connect(wet).connect(this.musicBus);

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
    private duckMusic(accent = false) {
        if (!this.music) return;
        const now = this.context.currentTime, gain = this.musicBus.gain;
        gain.cancelScheduledValues(now);
        gain.setTargetAtTime(accent ? .58 : .78, now, .025);
        gain.setTargetAtTime(1, now + (accent ? .4 : .16), .3);
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
        this.duckMusic(aquatic);
        if (aquatic) {
            // Loose water droplets, without a repeated interval or pitched motif.
            const base = 480 + Math.random() * 220;
            [0, .06 + Math.random() * .08, .18 + Math.random() * .12].forEach((delay, i) =>
                this.bubble(base * (.8 + Math.random() * .9), .22 + Math.random() * .2, .032 - i * .004, delay));
        } else this.bubble(300 + Math.random() * 240, .1 + Math.random() * .04, .02);
    }
    private bubble(frequency: number, duration: number, volume: number, delay=0, wrong=false) {
        const ctx=this.context, start=ctx.currentTime+delay;
        const oscillator=ctx.createOscillator(), overtone=ctx.createOscillator();
        const overtoneGain=ctx.createGain(), gain=ctx.createGain(), filter=ctx.createBiquadFilter();
        oscillator.type=wrong ? 'triangle' : 'sine';
        overtone.type='sine'; overtoneGain.gain.value=wrong ? .28 : .22;
        for (const [voice, multiple] of [[oscillator,1],[overtone,2]] as const) {
            voice.frequency.setValueAtTime(frequency*multiple,start);
            voice.frequency.exponentialRampToValueAtTime(frequency*multiple*(wrong ? .28 : 2.4),start+duration*.22);
            voice.frequency.exponentialRampToValueAtTime(Math.max(40,frequency*.35)*multiple,start+duration);
            voice.start(start); voice.stop(start+duration+.02);
        }
        filter.type='lowpass'; filter.frequency.value=wrong ? 1600 : 2300; filter.Q.value=.5;
        gain.gain.setValueAtTime(0,start); gain.gain.linearRampToValueAtTime(volume,start+.005);
        gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
        oscillator.connect(filter);
        overtone.connect(overtoneGain).connect(filter);
        filter.connect(gain).connect(this.fx);
        oscillator.onended=()=>{oscillator.disconnect();overtone.disconnect();overtoneGain.disconnect();filter.disconnect();gain.disconnect();};
    }
    entry(wrong: boolean) {
        const now=this.context.currentTime;
        if(!this.effects || this.context.state!=='running' || now-this.lastFx<.06)return;
        this.lastFx=now;
        this.driftTape();
        this.duckMusic();
        this.bubble((wrong ? 240 : 420) + Math.random() * 220, wrong ? .24 : .13, .032, 0, wrong);
        if (wrong) this.bubble(190 + Math.random() * 100, .14, .017, .06, true);
    }
    completionSweep() {
        if (!this.effects || this.context.state !== 'running') return;
        this.lastFx = this.context.currentTime;
        this.driftTape(true);
        this.duckMusic(true);
        const base = 500 + Math.random() * 250;
        for (let i = 0; i < 5; i++) {
            this.bubble(base * (.7 + Math.random()), .35 + Math.random() * .35,
                .035 - i * .004, i * (.09 + Math.random() * .05));
        }
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
