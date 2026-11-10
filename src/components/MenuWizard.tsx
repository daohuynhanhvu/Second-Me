import { useEffect, useRef } from 'react';
import { ANCHOR, CELL, SPRITE_K, T, wizardPose, type WizardPose } from './menuWizardEntrance.ts';

// Plays once per page load; coming back to the menu shows her already standing there.
let played = false;

/** Aeris on the main menu: steps out of the portal, walks to her spot, then idles (inside IntroEffects' SVG). */
export function MenuWizard() {
  const clip = useRef<SVGGElement>(null), body = useRef<SVGGElement>(null), idle = useRef<SVGGElement>(null);
  const cell = useRef<SVGSVGElement>(null), flare = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const portal = Array.from(clip.current?.ownerSVGElement?.querySelectorAll('.portal-swirl,.plasma-wave,.portal-core,.portal-breath') ?? []);
    const setRate = (rate: number) => portal.forEach(el => el.getAnimations().forEach(a => { a.playbackRate = rate; }));
    const apply = (p: WizardPose) => {
      clip.current?.setAttribute('clip-path', p.inPortal ? 'url(#intro-portal-clip)' : 'none');
      if (clip.current) clip.current.style.filter = p.glow > 0.01 ? `brightness(${1 + p.glow * 0.7}) drop-shadow(0 0 ${3 + p.glow * 5}px rgba(126,255,224,${p.glow * 0.9}))` : '';
      body.current?.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${p.s})`);
      body.current?.setAttribute('opacity', String(p.opacity));
      cell.current?.setAttribute('viewBox', `${p.frame * CELL} ${p.row * CELL} ${CELL} ${CELL}`);
      flare.current?.setAttribute('opacity', String(p.flare));
      idle.current?.classList.toggle('is-idle', p.done);
    };
    const still = document.body.classList.contains('reduced-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (played || still) { apply(wizardPose(T.walkEnd)); return; }
    played = true;
    let frame = 0, start = 0;
    const tick = (now: number) => {
      // The menu mounts under the cinematic intro (AdventureApp); start the clock once the film is gone.
      if (!start && document.querySelector('.cinematic-intro')) { apply(wizardPose(0)); frame = requestAnimationFrame(tick); return; }
      start ||= now;
      const p = wizardPose((now - start) / 1000);
      apply(p);
      setRate(p.portalRate);
      if (!p.done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); setRate(1); };
  }, []);

  const k = SPRITE_K;
  return <g className="menu-wizard-entrance">
    <defs>
      {/* Same hard alpha edge as the game's sprite loader (alpha >= 180 -> opaque). */}
      <filter id="menu-wizard-alpha"><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 1 1 1"/></feComponentTransfer></filter>
    </defs>
    <ellipse ref={flare} cx="309" cy="445" rx="100" ry="152" fill="url(#intro-portal-core)" opacity="0"/>
    <g ref={clip}>
      <g ref={body} opacity="0">
        <g ref={idle} className="menu-wizard">
          <svg ref={cell} x={-ANCHOR.x * k} y={-ANCHOR.y * k} width={CELL * k} height={CELL * k} viewBox={`0 ${2 * CELL} ${CELL} ${CELL}`} overflow="hidden">
            <image href="/assets/aeris/Aeris_Walk.png" width={CELL * 8} height={CELL * 3} filter="url(#menu-wizard-alpha)"/>
          </svg>
        </g>
      </g>
    </g>
  </g>;
}
