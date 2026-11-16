import {useEffect, useRef, useState} from 'react';

/** Touch-only guard; keyboard activation uses the regular confirmation flow. */
export function NextHintButton({guarded, disabled, onHint, onHold}: {
  guarded: boolean; disabled: boolean; onHint: () => void; onHold: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [help, setHelp] = useState(false);
  const completed = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const cancel = () => {clearInterval(timer.current); timer.current = undefined; setRemaining(null);};
  useEffect(() => {if (disabled || !guarded) cancel();}, [disabled, guarded]);
  useEffect(() => {
    const stop = () => {clearInterval(timer.current); timer.current = undefined; setRemaining(null);};
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    return () => {
      clearInterval(timer.current);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', stop);
    };
  }, []);
  return <span className="next-hint-control">
    <button type="button" className={`next-hint-button${remaining !== null ? ' holding' : ''}`}
      disabled={disabled} aria-label={guarded ? 'Next Hint (hold for 2 seconds)' : 'Next Hint'}
      onPointerDown={event => {
        if (!guarded || event.pointerType === 'mouse' || disabled || timer.current) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        completed.current = false;
        setHelp(false); setRemaining(2);
        const started = Date.now();
        timer.current = setInterval(() => {
          const left = Math.max(0, Math.ceil((2000 - (Date.now() - started)) / 1000));
          setRemaining(left);
          if (left === 0) {completed.current = true; cancel(); onHold();}
        }, 50);
      }}
      onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onPointerMove={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) cancel();
      }}
      onContextMenu={event => {if (guarded) event.preventDefault();}}
      onClick={event => {
        if (completed.current) {completed.current = false; return;}
        if (guarded && event.detail !== 0) {setHelp(true); return;}
        onHint();
      }}>Next Hint</button>
    <small className="next-hint-feedback" role={remaining !== null || help ? "status" : undefined}>{remaining !== null ? remaining : help ? 'Hold for 2 seconds' : ''}</small>
  </span>;
}
