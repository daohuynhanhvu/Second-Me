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
