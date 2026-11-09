/**
 * Where the loading screen's pieces stand on the pixel forest (pixelForest.ts).
 *
 * loadingLayout.json and portalAnim.json are measured on the painting the sprites were cut from
 * (tools/assets/), where the arch stood further back, its base above the forest's floor line.
 * Here the arch group (the arch, its vortex and swirl, and the opening the transition starts
 * from) is moved by ARCH_SHIFT so its stone base stands on the floor. The transition still
 * ends at layout.center: it moves the arch from wherever it starts.
 */
import raw from '../data/loadingLayout.json';
import rawAnim from '../data/portalAnim.json';

/** Painting px: the arch's stone base (painting y ~615) down to the forest's floor (~643). */
export const ARCH_SHIFT = { x: 0, y: 28 };

const shift = <T extends { x: number; y: number }>(o: T): T => ({ ...o, x: o.x + ARCH_SHIFT.x, y: o.y + ARCH_SHIFT.y });

export const layout = {
  ...raw,
  arch: shift(raw.arch),
  swirl: shift(raw.swirl),
  portal: {
    ...raw.portal,
    cx: raw.portal.cx + ARCH_SHIFT.x, cy: raw.portal.cy + ARCH_SHIFT.y,
    eyeX: raw.portal.eyeX + ARCH_SHIFT.x, eyeY: raw.portal.eyeY + ARCH_SHIFT.y,
  },
};

export const anim = { ...rawAnim, vortex: shift(rawAnim.vortex) };
