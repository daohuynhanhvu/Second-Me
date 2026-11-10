import { useEffect, useRef, useState } from 'react';
import type { GameEngine } from '../game/GameEngine.ts';
import './TouchControls.css';

const RADIUS = 46;      // px the knob can travel from the stick's centre
const DEAD_ZONE = 0.2;  // fraction of RADIUS ignored, so a resting thumb does not drift

/** Floating joystick for phones: touch anywhere in the lower-left zone, the stick centres there; drag to walk. */
export function TouchJoystick({ engine, vi }: { engine: GameEngine | null; vi: boolean }) {
  const zone = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState<{ id: number; ox: number; oy: number; dx: number; dy: number } | null>(null);
  useEffect(() => () => engine?.setTouchMove(0, 0), [engine]);

  const local = (e: React.PointerEvent) => {
    const r = zone.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const steer = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy), k = len > RADIUS ? RADIUS / len : 1;
    dx *= k; dy *= k;
    const on = Math.hypot(dx, dy) / RADIUS > DEAD_ZONE;
    engine?.setTouchMove(on ? dx : 0, on ? dy : 0);
    return { dx, dy };
  };
  const release = (e: React.PointerEvent) => {
    if (stick?.id !== e.pointerId) return;
    engine?.setTouchMove(0, 0);
    setStick(null);
  };

  return <div ref={zone} className={`touch-stick-zone${stick ? ' is-active' : ''}`} role="presentation" aria-label={vi ? 'Cần điều khiển di chuyển' : 'Movement stick'}
    onPointerDown={e => {
      if (stick) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = local(e);
      setStick({ id: e.pointerId, ox: p.x, oy: p.y, dx: 0, dy: 0 });
      engine?.setTouchMove(0, 0);
    }}
    onPointerMove={e => {
      if (stick?.id !== e.pointerId) return;
      const p = local(e);
      setStick({ ...stick, ...steer(p.x - stick.ox, p.y - stick.oy) });
    }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
    <div className="touch-stick" style={stick ? { left: stick.ox, top: stick.oy, bottom: 'auto' } : undefined}>
      <i className="touch-stick-knob" style={stick ? { transform: `translate(${stick.dx}px, ${stick.dy}px)` } : undefined}/>
    </div>
  </div>;
}

export type TouchAction = { id: string; name: string; icon: React.ReactNode; cooldown: number; max: number; disabled: boolean; run: () => void };

const HOLD_REPEAT_MS = 170; // holding Cast re-presses at a mashing pace; the combo buffers the presses

/** Round skill buttons for phones: a big Cast button in the corner, the others on a quarter arc around it. */
export function TouchSkills({ actions, mana, maxMana, manaCost, charges, recording, vi }: {
  actions: TouchAction[]; mana: number; maxMana: number; manaCost: number; charges: number; recording: boolean; vi: boolean;
}) {
  const hold = useRef<number | undefined>(undefined);
  const stop = () => { window.clearInterval(hold.current); hold.current = undefined; };
  useEffect(() => stop, []);
  return <div className={`touch-skills${recording ? ' is-recording' : ''}`} role="group" aria-label={vi ? 'Chiêu và điều khiển chiến đấu' : 'Combat abilities and controls'}>
    <div className="touch-mana" role="meter" aria-label="MP" aria-valuenow={Math.floor(mana)} aria-valuemin={0} aria-valuemax={maxMana}>
      <i style={{ width: `${mana / maxMana * 100}%` }}/><span>MP {Math.floor(mana)}</span>
    </div>
    {actions.map(a => <button key={a.id} type="button" className={`touch-skill skill-${a.id}${a.cooldown > 0 ? ' is-recovering' : ''}`} disabled={a.disabled}
      style={{ '--cd': a.cooldown > 0 ? Math.min(1, a.cooldown / a.max) : 0 } as React.CSSProperties}
      aria-label={`${a.name}${a.cooldown > 0 ? ` · ${a.cooldown.toFixed(1)}s` : ''}`}
      onPointerDown={e => {
        // Act on touch-down, like a game pad; keep the press away from the canvas (tap-to-attack) and the stick.
        e.preventDefault(); e.stopPropagation();
        a.run();
        if (a.id === 'attack') { stop(); hold.current = window.setInterval(a.run, HOLD_REPEAT_MS); e.currentTarget.setPointerCapture(e.pointerId); }
      }}
      onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
      onClick={e => { if (e.detail === 0) a.run(); }}>
      <span className="touch-skill-icon">{a.icon}</span><span className="touch-skill-label">{a.name}</span>
      {a.cooldown > 0 && <b className="touch-skill-timer">{a.cooldown.toFixed(a.cooldown < 1 ? 1 : 0)}</b>}
      {a.id === 'echo' && <b className="touch-skill-badge">{charges}</b>}
      {a.id === 'skill' && <small className="touch-skill-cost">{manaCost}</small>}
    </button>)}
  </div>;
}
