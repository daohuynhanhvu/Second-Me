import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { isTouchDevice } from '../game/logic/orientation.ts';
import './FullscreenButton.css';

// Browsers only allow full screen from a tap (iPhone Safari not at all for pages: the button hides there).
const canFullscreen = () => typeof document !== 'undefined' && !!document.fullscreenEnabled;

async function enterFullscreen() {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    // Keep it sideways while playing; not every browser can lock, and that is fine.
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => {});
  } catch { /* the browser refused (no tap, or not allowed): stay windowed */ }
}
function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

/**
 * F key: full screen on and off, on every screen and device.
 * Phones: each turn to landscape arms full screen for the next tap (a rotation is not a tap, so it cannot
 * go full screen by itself). Leaving full screen by hand disarms it until the next turn to landscape.
 * Also puts the page back at its origin after a rotation or a return from another tab, so a stale
 * scroll from the other orientation never leaves the screen shifted.
 */
export function installScreenControls() {
  const reset = () => window.scrollTo(0, 0);
  const onVisible = () => { if (document.visibilityState === 'visible') reset(); };
  // F toggles full screen on every screen (a key press counts as a user action, so browsers allow it).
  const onKey = (e: KeyboardEvent) => {
    if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !canFullscreen()) return;
    if ((e.target as Element | null)?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    if (document.fullscreenElement) exitFullscreen(); else void enterFullscreen();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('orientationchange', reset);
  window.addEventListener('keydown', onKey);
  const unbase = () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('orientationchange', reset); window.removeEventListener('keydown', onKey); };
  if (!canFullscreen() || !isTouchDevice()) return unbase;

  const landscape = window.matchMedia('(orientation: landscape)');
  let armed = landscape.matches && !document.fullscreenElement;
  const onTurn = () => { armed = landscape.matches && !document.fullscreenElement; };
  const onTap = (e: Event) => {
    if (!armed || !landscape.matches || document.fullscreenElement) return;
    if ((e.target as Element | null)?.closest?.('.fullscreen-toggle')) return; // the button decides itself
    armed = false;
    void enterFullscreen();
  };
  // pointerup/touchend count as a user tap for full screen; pointerdown from a finger does not.
  landscape.addEventListener('change', onTurn);
  window.addEventListener('pointerup', onTap, true);
  return () => {
    unbase();
    landscape.removeEventListener('change', onTurn);
    window.removeEventListener('pointerup', onTap, true);
  };
}

/** Toggle between full screen and windowed. Hidden where the browser has no full screen for pages. */
export function FullscreenButton({ vi, floating = false }: { vi: boolean; floating?: boolean }) {
  const [full, setFull] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  if (!canFullscreen()) return null;
  const label = full ? (vi ? 'Thu nhỏ màn hình' : 'Exit full screen') : (vi ? 'Toàn màn hình' : 'Full screen');
  return <button type="button" className={`fullscreen-toggle${floating ? ' is-floating' : ''}`} aria-label={label} title={`${label} (F)`} aria-pressed={full}
    onClick={() => (full ? exitFullscreen() : void enterFullscreen())}>
    {full ? <Minimize size={18}/> : <Maximize size={18}/>}
  </button>;
}
