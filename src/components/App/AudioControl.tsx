import {useEffect, useRef, useState} from 'react';
import {Button, Tooltip} from '@mui/material';
import {isStyleId, soundscapes, type StyleId} from '../../audio/soundscapes';
import {ExpandMoreRounded, GraphicEqRounded, VolumeOffRounded, WavesRounded} from '@mui/icons-material';
import {AquaticAudio, ENTRY_CUE, AQUATIC_CUE, COMPLETION_SWEEP} from '../../audio/AquaticAudio';

const labels = ['Off', 'Music + FX', 'FX only', 'Music only'];
export function AudioControl() {
    const [mode, setMode] = useState(0);
    const [style, setStyle] = useState<StyleId>(() => {
        try {
            const saved = localStorage.getItem('ksuduo-soundscape');
            if (isStyleId(saved)) return saved;
        } catch { /* storage is optional */ }
        return 'lagoon';
    });
    const startupTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [failed, setFailed] = useState(false);
    const engine = useRef<AquaticAudio | undefined>(undefined);
    useEffect(() => {
        const visibility = () => engine.current?.setHidden(document.hidden);
        const click = (event: Event) => {
            const target = event.target as Element;
            if (target.closest('.gameplay-area button') && !target.closest('button:disabled, [data-aquatic-cue]')) engine.current?.effect();
        };
        const input = (event: Event) => engine.current?.entry((event as CustomEvent<{wrong:boolean}>).detail.wrong);
        const completion = () => engine.current?.completionSweep();
        document.addEventListener(COMPLETION_SWEEP, completion);
        const aquatic = () => engine.current?.effect(true);
        document.addEventListener(AQUATIC_CUE, aquatic);
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('pageshow', visibility);
        document.addEventListener('click', click);
        document.addEventListener(ENTRY_CUE, input);
        return () => {
            document.removeEventListener(COMPLETION_SWEEP, completion);
            document.removeEventListener(AQUATIC_CUE, aquatic);
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('pageshow', visibility);
            document.removeEventListener('click', click);
            document.removeEventListener(ENTRY_CUE, input);
            clearTimeout(startupTimeout.current);
            engine.current?.dispose();
            engine.current = undefined;
        };
    }, []);
    const cycle = () => {
        clearTimeout(startupTimeout.current);
        const next = (mode + 1) % labels.length;
        engine.current?.dispose();
        engine.current = undefined;
        try {
            if (next) {
                const stop = (failed: boolean) => {
                    if (engine.current !== audio) return;
                    audio.dispose(); engine.current = undefined;
                    setMode(0); setFailed(failed);
                };
                const audio = new AquaticAudio(next === 1 || next === 3, next !== 3, () => stop(false), style);
                engine.current = audio;
                const timeout = startupTimeout.current = setTimeout(() => fail(), 4000);
                const fail = () => {
                    if (engine.current !== audio) return;
                    stop(true);
                };
                void audio.start().then(() => clearTimeout(timeout), () => {
                    clearTimeout(timeout); fail();
                });
            }
            setMode(next);
            setFailed(false);
        } catch {setMode(0); setFailed(true);}
    };
    const changeStyle = (value: string) => {
        if (!isStyleId(value)) return;
        engine.current?.setStyle(value);
        setStyle(value);
        try { localStorage.setItem('ksuduo-soundscape', value); } catch { /* optional */ }
    };
    return <div className="audio-controls"><Tooltip title={failed ? 'Audio did not start. Tap to retry.' : `Sound: ${labels[mode]}. Switch to ${labels[(mode + 1) % labels.length]}`}>
        <Button className="audio-control" onClick={cycle} aria-label={`Sound: ${labels[mode]}`} startIcon={mode === 0 ? <VolumeOffRounded/> : mode === 1 || mode === 3 ? <WavesRounded/> : <GraphicEqRounded/>}>
            <span>{failed ? 'Retry sound' : labels[mode]}{mode > 0 && <small>{soundscapes[style].name}</small>}</span>
        </Button>
    </Tooltip>
        <label className="soundscape-picker" title="Choose soundscape">
            <ExpandMoreRounded aria-hidden="true" fontSize="small"/>
            <select aria-label="Soundscape" value={style} disabled={!mode} onChange={e => changeStyle(e.target.value)}>
                {Object.entries(soundscapes).map(([id, score]) => <option key={id} value={id}>{score.name}</option>)}
            </select>
        </label>
    </div>;
}
