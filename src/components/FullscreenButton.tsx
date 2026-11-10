import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize, Share, SquarePlus, X } from 'lucide-react';
import { isTouchDevice } from '../game/logic/orientation.ts';
import './FullscreenButton.css';

// Browsers only allow full screen from a tap. iPad Safari has it under webkit names; iPhone Safari has none for
// pages, so there the button explains "Add to Home Screen" instead (the manifest then opens it full screen).
type WebkitDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type WebkitEl = HTMLElement & { webkitRequestFullscreen?: () => void };
const doc = () => document as WebkitDoc;
const canFullscreen = () => typeof document !== 'undefined' && !!(document.fullscreenEnabled || doc().webkitFullscreenEnabled);
const fullscreenElement = () => document.fullscreenElement ?? doc().webkitFullscreenElement ?? null;
/** Opened from the home screen: already full screen, nothing to toggle. */
const standalone = () => typeof window !== 'undefined' && ((navigator as Navigator & { standalone?: boolean }).standalone === true
  || window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);
/** iPhone / iPod Safari: no page full screen (an iPad reports itself as a Mac and has webkit full screen). */
const iPhoneSafari = () => typeof navigator !== 'undefined' && /iPhone|iPod/.test(navigator.userAgent) && !standalone();

async function enterFullscreen() {
  try {
    const root = document.documentElement as WebkitEl;
    if (document.fullscreenEnabled) await root.requestFullscreen({ navigationUI: 'hide' });
    else root.webkitRequestFullscreen?.();
    // Keep it sideways while playing; not every browser can lock, and that is fine.
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => {});
  } catch { /* the browser refused (no tap, or not allowed): stay windowed */ }
}
function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (doc().webkitFullscreenElement) doc().webkitExitFullscreen?.();
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
    if (fullscreenElement()) exitFullscreen(); else void enterFullscreen();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('orientationchange', reset);
  window.addEventListener('keydown', onKey);
  const unbase = () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('orientationchange', reset); window.removeEventListener('keydown', onKey); };
  if (!canFullscreen() || !isTouchDevice()) return unbase;

  const landscape = window.matchMedia('(orientation: landscape)');
  let armed = landscape.matches && !fullscreenElement();
  const onTurn = () => { armed = landscape.matches && !fullscreenElement(); };
  const onTap = (e: Event) => {
    if (!armed || !landscape.matches || fullscreenElement()) return;
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
  const [full, setFull] = useState(() => typeof document !== 'undefined' && !!fullscreenElement());
  const [hint, setHint] = useState(false);
  useEffect(() => {
    const sync = () => setFull(!!fullscreenElement());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);
  const iphone = iPhoneSafari();
  if (standalone() || (!canFullscreen() && !iphone)) return null;
  const label = full ? (vi ? 'Thu nhỏ màn hình' : 'Exit full screen') : (vi ? 'Toàn màn hình' : 'Full screen');
  return <>
    <button type="button" className={`fullscreen-toggle${floating ? ' is-floating' : ''}`} aria-label={label} title={`${label} (F)`} aria-pressed={full}
      onClick={() => (iphone ? setHint(true) : full ? exitFullscreen() : void enterFullscreen())}>
      {full ? <Minimize size={18}/> : <Maximize size={18}/>}
    </button>
    {hint && <HomeScreenHint vi={vi} close={() => setHint(false)}/>}
  </>;
}

/** iPhone: Safari cannot put a page full screen, but a home-screen app opens full screen (manifest + Apple meta). */
function HomeScreenHint({ vi, close }: { vi: boolean; close: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [close]);
  return createPortal(<div className="fullscreen-hint-backdrop" onClick={close}>
    <section className="fullscreen-hint" role="dialog" aria-modal="true" aria-labelledby="fullscreen-hint-title" onClick={e => e.stopPropagation()}>
      <button type="button" className="fullscreen-hint-close" aria-label={vi ? 'Đóng' : 'Close'} onClick={close}><X size={18}/></button>
      <h2 id="fullscreen-hint-title">{vi ? 'Chơi toàn màn hình trên iPhone' : 'Full screen on iPhone'}</h2>
      <p>{vi ? 'Safari trên iPhone không cho trang web tự toàn màn hình. Thêm game vào màn hình chính, rồi mở từ biểu tượng đó:' : 'iPhone Safari cannot make a web page full screen. Add the game to your Home Screen and open it from there:'}</p>
      <ol>
        <li><Share size={18} aria-hidden="true"/>{vi ? 'Bấm nút Chia sẻ của Safari' : 'Tap Safari’s Share button'}</li>
        <li><SquarePlus size={18} aria-hidden="true"/>{vi ? 'Chọn “Thêm vào MH chính”' : 'Choose “Add to Home Screen”'}</li>
      </ol>
    </section>
  </div>, document.body);
}
