import {useEffect} from 'react';
import {GameMessage, GameMessageBox} from './GameMessageBox';

/** Only the visible message's clock runs; queued messages get their full duration. */
export function MessageQueue({messages}: {messages: GameMessage[]}) {
    const current = messages[0];
    useEffect(() => {
        if (!current || current.duration <= 0) return;
        const timer = window.setTimeout(() => current.dismiss?.(), current.duration);
        return () => window.clearTimeout(timer);
    }, [current]);
    if (!current) return null;
    return <aside className="message-queue" aria-label="Game notifications">
        <div role="status" aria-live="polite" aria-atomic="true"><GameMessageBox message={current}/></div>
        {messages.length > 1 && <small>{messages.length - 1} more notification{messages.length > 2 ? 's' : ''}</small>}
    </aside>;
}
