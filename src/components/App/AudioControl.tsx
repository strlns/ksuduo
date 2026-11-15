import {useEffect, useRef, useState} from 'react';
import {Button, Tooltip} from '@mui/material';
import {GraphicEqRounded, VolumeOffRounded, WavesRounded} from '@mui/icons-material';
import {AquaticAudio, ENTRY_CUE, AQUATIC_CUE, COMPLETION_SWEEP} from '../../audio/AquaticAudio';

const labels = ['Off', 'Music + FX', 'FX only', 'Music only'];
export function AudioControl() {
    const [mode, setMode] = useState(0);
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
        document.addEventListener('click', click);
        document.addEventListener(ENTRY_CUE, input);
        return () => {
            document.removeEventListener(COMPLETION_SWEEP, completion);
            document.removeEventListener(AQUATIC_CUE, aquatic);
            document.removeEventListener('visibilitychange', visibility);
            document.removeEventListener('click', click);
            document.removeEventListener(ENTRY_CUE, input);
            engine.current?.dispose();
        };
    }, []);
    const cycle = () => {
        const next = (mode + 1) % labels.length;
        engine.current?.dispose();
        engine.current = undefined;
        try {
            if (next) {
                const audio = new AquaticAudio(next === 1 || next === 3, next !== 3);
                engine.current = audio;
                const timeout = setTimeout(() => fail(), 4000);
                const fail = () => {
                    if (engine.current !== audio) return;
                    audio.dispose(); engine.current = undefined;
                    setMode(0); setFailed(true);
                };
                void audio.start().then(() => clearTimeout(timeout), () => {
                    clearTimeout(timeout); fail();
                });
            }
            setMode(next);
            setFailed(false);
        } catch {setMode(0); setFailed(true);}
    };
    return <Tooltip title={failed ? 'Audio did not start. Tap to retry.' : `Sound: ${labels[mode]}. Switch to ${labels[(mode + 1) % labels.length]}`}>
        <Button className="audio-control" onClick={cycle} aria-label={`Sound: ${labels[mode]}`} startIcon={mode === 0 ? <VolumeOffRounded/> : mode === 1 || mode === 3 ? <WavesRounded/> : <GraphicEqRounded/>}>
            {failed ? 'Retry sound' : labels[mode]}
        </Button>
    </Tooltip>;
}
