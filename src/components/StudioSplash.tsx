import { useEffect, useRef, useState } from 'react';
import './StudioSplash.css';

// Black, then the studio logo fades in, holds, fades back to black, and the cinematic intro starts.
const BLACK_IN = 600, FADE_IN = 1200, HOLD = 1600, FADE_OUT = 1000, BLACK_OUT = 400;
const LOAD_WAIT = 2500;   // a slow network: give up on the logo and go on rather than sit on black

/** The 8HANDS studio card before the intro. A tap, click, Enter, Space or Esc skips it. */
export function StudioSplash({ onDone, paused = false }: { onDone: () => void; paused?: boolean }) {
  const [shown, setShown] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const done = useRef(onDone); done.current = onDone;
  const finished = useRef(false);
  const finish = () => { if (!finished.current) { finished.current = true; done.current(); } };

  // Starts once the image is in (or the wait runs out), and not while "rotate your phone" covers the screen.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setTimedOut(true), LOAD_WAIT); return () => window.clearTimeout(t); }, []);
  const ready = (loaded || timedOut) && !paused;
  useEffect(() => {
    if (!ready) return;
    if (!loaded) { finish(); return; }
    const timers = [
      window.setTimeout(() => setShown(true), BLACK_IN),
      window.setTimeout(() => setShown(false), BLACK_IN + FADE_IN + HOLD),
      window.setTimeout(finish, BLACK_IN + FADE_IN + HOLD + FADE_OUT + BLACK_OUT),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [ready, loaded]);

  // Keys go to the splash only: Enter / Space would otherwise open the lobby underneath (GameEngine).
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopImmediatePropagation();
      if (['Enter', 'Space', 'Escape'].includes(e.code)) finish();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, []);

  return <div className={`studio-splash${shown ? ' is-shown' : ''}`} onPointerDown={finish} role="img" aria-label="8HANDS Game Studio"
    style={{ '--fade-in': `${FADE_IN}ms`, '--fade-out': `${FADE_OUT}ms` } as React.CSSProperties}>
    <img src="/assets/ui/studio-8hands.jpg" alt="" draggable={false} onLoad={() => setLoaded(true)} onError={finish}/>
  </div>;
}
