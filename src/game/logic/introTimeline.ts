/** Shared timing (seconds) for the cinematic intro: visuals, music and SFX read the same cues. */
export const INTRO = {
  /** Scene boundaries. */
  s1: 0,      // Ancient forest awakening: black -> light, god rays, runes, camera push-in
  s2: 5,      // The ancient path: narration over drifting maps, parallax foliage
  s3: 10,     // Heroes: Aeris summoned, Kael strides in
  s4: 15,     // Boss awakening: light dies, silhouette, steps into the light, roar
  s5: 19,     // Combat showcase: anticipation, dash, slash, impact, bolt, clash
  s6: 22,     // Particles gather, rune circle, SECOND ME
  s7: 28,     // Everything fades to black...
  reveal: 28.6, // ...then the main menu is revealed (the film's box fades out)
  end: 29.4,
  /** One-shot cues. */
  cue: {
    rune1: 1.6, rune2: 3.1, ember: 3.6, rune3: 4.6,
    wizard: 10.4,        // summoning circle opens
    wizardIn: 10.95,     // Aeris materialises
    kael: 12.5,          // Kael enters
    kaelStop: 13.55,
    draw: 13.8,          // sword glint
    dim: 15.0,           // forest light starts to die
    silhouette: 16.0,
    step: 16.9,          // boss walks into the light
    roar: 18.0,
    antic: 19.1,         // Kael wind-up
    dash: 19.4,
    slash: 19.6,
    impact: 19.78,
    back: 20.15,
    cast: 20.4,          // Aeris charges
    bolt: 20.75,
    clash: 21.05,
    gather: 22.0,
    logo: 22.8,
  },
} as const;

/** Boss footfalls while walking into the light (seconds). */
export const BOSS_STEPS = [17.15, 17.65] as const;
/** Kael's footsteps while striding in. */
export const KAEL_STEPS = [12.62, 12.88, 13.14, 13.4] as const;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3);
export const easeInOutCubic = (t: number) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t: number) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
/** Progress 0..1 of `t` between a and b. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
