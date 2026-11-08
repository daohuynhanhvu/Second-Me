import React, { useEffect, useRef, useState } from 'react';
import { CinematicIntro as Director, W, H } from '../game/rendering/cinematicIntro.ts';
import { INTRO, seg, easeInOutCubic } from '../game/logic/introTimeline.ts';
import { voice, INTRO_VOICE } from '../game/logic/voice.ts';
import { sounds } from '../game/logic/sound.ts';
import { music } from '../game/logic/music.ts';

const LABEL = {
  en: { skip: 'SKIP INTRO', sound: '♪ Click or press any key to enable sound' },
  vi: { skip: 'BỎ QUA INTRO', sound: '♪ Bấm chuột hoặc nhấn phím bất kỳ để bật nhạc' },
} as const;
const SKIP_KEYS = new Set(['Enter', 'Space', 'Escape']);

/**
 * Plays the cinematic on its own canvas above the game, then dissolves into the existing
 * main menu (the `Intro` screen underneath). Enter / Space / Esc or the button skips it.
 */
export function CinematicIntro({ lang, reducedMotion, onDone }: { lang: 'en' | 'vi'; reducedMotion: boolean; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const [needsSound, setNeedsSound] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const cv = canvas.current, box = root.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !box || !ctx) { onDone(); return; }
    const reduced = reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    let director: Director | null = null;
    try { director = new Director(lang, reduced); } catch { onDone(); return; }

    // Dev-only: ?introAt=18 starts the film at 18s, for checking a scene quickly.
    const devAt = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('introAt')) || 0 : 0;
    const start = performance.now() - devAt * 1000;
    let raf = 0, skipAt: number | null = null, frozenT = 0, gestured = false, stopScore: (() => void) | null = null, stopVoice: (() => void) | null = null, finished = false;
    const now = () => (performance.now() - start) / 1000;

    const finish = () => { if (finished) return; finished = true; stopScore?.(); stopScore = null; stopVoice?.(); stopVoice = null; onDone(); };
    const skip = () => {
      if (skipAt !== null) return;
      skipAt = now(); frozenT = Math.min(skipAt, INTRO.s6);
      stopScore?.(); stopScore = null; stopVoice?.(); stopVoice = null;
    };
    const tryAudio = (t: number) => {
      if (stopScore || sounds.getMuted() || skipAt !== null || !sounds.isAudioRunning()) return;
      // Decide between the intro track and the synthesised score only once the music folder's
      // listing is known (a frame or two), so the two never play together.
      if (!music.loaded()) { music.preload(); return; }
      // An intro track in public/assets/music replaces the synthesised score; it starts at the
      // film's current time. A broken score must never take the film down with it.
      try { stopScore = music.has('intro') ? music.playIntro(now) : sounds.playIntroScore(t, INTRO.cue, INTRO.end); }
      catch (err) { console.error('[intro] score failed', err); stopScore = () => {}; }
      // Narration + character intros, pre-rendered with OmniVoice (tools/voice); missing files
      // stay silent. The music ducks under each line as it plays.
      voice.lang = lang;
      stopVoice = voice.playTimeline(INTRO_VOICE, now, (start, duration) => music.duckForSpeech(start, start + duration));
      setNeedsSound(false);
    };

    skipRef.current = skip;
    // Capture phase on window so the engine's own Enter/Space handler never fires mid-film.
    const onKey = (e: KeyboardEvent) => {
      if (SKIP_KEYS.has(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); skip(); return; }
      gestured = true;
    };
    const onPointer = () => { gestured = true; };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);

    music.preload();
    if (!sounds.getMuted()) { tryAudio(0); if (!sounds.isAudioRunning()) setNeedsSound(true); }
    const skipTimer = window.setTimeout(() => setShowSkip(true), 700);

    const frame = () => {
      const t = skipAt !== null ? frozenT : now();
      if (!stopScore && (gestured || sounds.isAudioRunning())) tryAudio(t);
      director!.draw(ctx, t);
      if (import.meta.env.DEV) { const w = window as unknown as { __introFrames?: number[] }; (w.__introFrames ??= []).push(performance.now()); }
      // Reveal the menu only after the film has faded to black, or quickly when skipped.
      // (Fading earlier lets the menu's own logo show through the film's logo, misaligned.)
      const mix = skipAt !== null ? Math.min(1, (now() - skipAt) / 0.5) : easeInOutCubic(seg(t, INTRO.reveal, INTRO.end));
      box.style.opacity = String(1 - mix);
      box.style.pointerEvents = skipAt === null && t < INTRO.reveal ? 'auto' : 'none';
      if (mix >= 1) { finish(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      finished = true; cancelAnimationFrame(raf); window.clearTimeout(skipTimer);
      window.removeEventListener('keydown', onKey, true); window.removeEventListener('pointerdown', onPointer, true);
      stopScore?.(); stopVoice?.();
    };
  }, []);

  const text = LABEL[lang];
  return (
    <div ref={root} className="cinematic-intro" data-testid="cinematic-intro">
      <canvas ref={canvas} width={W} height={H} />
      {showSkip && <button type="button" className="cinematic-skip" onClick={() => skipRef.current?.()}>{text.skip} ▸▸</button>}
      {needsSound && <span className="cinematic-sound">{text.sound}</span>}
    </div>
  );
}
