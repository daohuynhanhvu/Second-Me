import React, { useEffect, useRef } from 'react';
import { startPreload, startLevelPreload, type LevelLoadSpec } from '../game/loading/preloader.ts';
import { LoadingScene, preloadLoadingArt, fogTile } from '../game/loading/loadingScene.ts';
import { layout } from '../game/loading/placement.ts';

preloadLoadingArt();   // the screen's own art starts downloading with the app

/** Fog texture, made once (pixel clusters) and reused as a CSS background. */
let fogUrl = '';
function fogImage() {
  if (!fogUrl && typeof document !== 'undefined') fogUrl = fogTile(512, 96).toDataURL();
  return fogUrl;
}
const pct = (v: number, of: number) => `${(v / of * 100).toFixed(3)}%`;

const TEXT = {
  en: { lines: ['Awakening the forest...', 'Muster Magic...', 'Securing Portal...'], loading: 'LOADING...', caption: 'Prepare your Echo and listen to the memories.' },
  vi: { lines: ['Đánh thức khu rừng...', 'Hội tụ phép thuật...', 'Gia cố cổng dịch chuyển...'], loading: 'ĐANG TẢI...', caption: 'Chuẩn bị Echo và lắng nghe ký ức.' },
} as const;

/**
 * Loading screen: a pixel forest drawn in code, live portal / wizard / bar on one canvas
 * (src/game/loading/loadingScene.ts), and the progress of real asset loading
 * (src/game/loading/preloader.ts). `level` null is the first load into the lobby (every
 * asset); a level loads just what that level uses. Once loading is done the portal
 * transition plays (loadingScene.ts); onDone(true) comes on its final white flash, which the
 * caller fades out over the next screen (onDone(false): reduced motion, a plain fade).
 */
export function LoadingScreen({ language, reducedMotion, level = null, portal = false, onReveal, onDone }: {
  language: 'en' | 'vi'; reducedMotion: boolean; level?: Omit<LevelLoadSpec, 'delayMs'> | null;
  /** End with the portal transition (loads started from the main menu); otherwise fade into the level. */
  portal?: boolean; onReveal?: () => void; onDone: (flash: boolean) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const lines = useRef<(HTMLLIElement | null)[]>([]);
  const perf = useRef<HTMLPreElement>(null);
  const forest = useRef<HTMLCanvasElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const vignette = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const reveal = useRef(onReveal);
  reveal.current = onReveal;
  const spec = useRef(level);   // read once at mount: a new load needs a new screen (key)

  useEffect(() => {
    if (!canvas.current || !root.current || !percent.current) return;
    const params = new URLSearchParams(location.search);
    const dev = import.meta.env.DEV;
    // Dev: ?stress=4 multiplies particle counts to test the frame budget under load.
    const stress = dev ? Math.min(8, Math.max(1, Number(params.get('stress')) || 1)) : 1;
    // Dev: ?holdLoading=1 keeps the screen up after 100%; ?loadDelay=200 delays each file
    // by that many ms (a slow-network stand-in to watch progress). Both ignored in builds.
    const hold = dev && params.get('holdLoading') === '1';
    const delay = dev ? Math.min(2000, Number(params.get('loadDelay')) || 0) : 0;
    const load = spec.current ? startLevelPreload({ ...spec.current, delayMs: delay }) : startPreload({ delayMs: delay });
    const scene = new LoadingScene(canvas.current, load, {
      root: root.current, percent: percent.current,
      lines: lines.current.filter((l): l is HTMLLIElement => !!l),
      perf: dev ? perf.current : undefined,
      forest: forest.current, dim: dim.current, vignette: vignette.current,
    }, { reducedMotion, stress, hold, portal, language, onReveal: () => reveal.current?.(), onFinished: flash => done.current(flash) });
    if (dev) (window as unknown as { __loadingScene?: LoadingScene }).__loadingScene = scene;
    // How much the 1376:768 frame must grow to cover the whole screen; the portal dive zooms it to that
    // (adventure.css), so screens wider or taller than the frame show no dark bars once the forest fades.
    const rootEl = root.current;
    const fitCover = () => {
      const { width: w, height: h } = rootEl.getBoundingClientRect();
      const frameW = Math.min(w, h * 1376 / 768), frameH = frameW * 768 / 1376;
      if (frameW > 0) rootEl.style.setProperty('--lv-cover', String(Math.max(w / frameW, h / frameH)));
    };
    fitCover();
    const observer = new ResizeObserver(() => { scene.resize(); fitCover(); });
    observer.observe(canvas.current);
    observer.observe(root.current);   // a wider or taller screen shows more forest around the frame
    scene.start();
    return () => { scene.stop(); observer.disconnect(); };
  }, []);

  const t = TEXT[language];
  return (
    <div ref={root} className={`loading-v2 overlay${reducedMotion ? ' still' : ''}${portal ? '' : ' no-portal'}`} data-phase="loading" role="progressbar" aria-label={t.loading} aria-valuemin={0} aria-valuemax={100}>
      {/* The pixel forest (pixelForest.ts), screen-wide, and the layers that darken it as the
          portal wakes; the scene paints and drives them. */}
      <canvas ref={forest} className="lv-forest" aria-hidden="true"/>
      <div ref={dim} className="lv-dim"/>
      <div ref={vignette} className="lv-vignette"/>
      <div className="lv-frame">
      <div className="lv-world">
        {/* Slow ambient layers: compositor-animated (opacity / transform only). The wrappers
            fade them out during the transition (their own animations own `opacity`). */}
        <div className="lv-portal-light">
          <div className="lv-reflect" style={{ left: pct(layout.portal.cx, layout.width), top: pct(layout.portal.cy, layout.height) }}/>
        </div>
        <div className="lv-ambient">
          {[0, 1, 2].map(i => <div key={i} className={`lv-ray lv-ray-${i}`}/>)}
          <div className="lv-fog lv-fog-a" style={{ backgroundImage: `url(${fogImage()})` }}/>
          <div className="lv-fog lv-fog-b" style={{ backgroundImage: `url(${fogImage()})` }}/>
        </div>
        {/* Status lines sit under the canvas so the wizard runs in front of them. */}
        <ul className="lv-lines">
          {t.lines.map((line, i) => <li key={i} ref={el => { lines.current[i] = el; }} data-state="pending"><i aria-hidden="true"/>{line}</li>)}
        </ul>
        <canvas ref={canvas} className="lv-canvas"/>
      </div>
      <div className="lv-footer">
        <strong>{t.loading} <span ref={percent}>0</span>%</strong>
        <p>{t.caption}</p>
      </div>
      </div>
      {import.meta.env.DEV && new URLSearchParams(location.search).get('perf') === '1' && <pre ref={perf} className="lv-perf" aria-hidden="true"/>}
    </div>
  );
}
