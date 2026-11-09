/**
 * Dresses the recovered forest renderer (natureLegacy.js) with the hand-drawn art: ground,
 * scattered props, rune buttons, start and exit portals, stone doors and trap floors.
 *
 * The legacy scene's methods are wrapped, not edited. Each wrapper falls back to the
 * original drawing while its images are still loading.
 */
import type { LevelData, Rect, SecurityDoor, PressurePlate } from '../logic/types.ts';
import { drawTrap, trapSpritesReady } from './traps.ts';
import { biomeIndex, biomeLoaded, drawBiomeFloor, drawBiomeProp, drawBiomeWalls, drawBiomeWeather } from './biomes.ts';
import { livingReady, livingImage, drawLivingDecor } from './livingAssets.ts';
import { drawPortalEnergy } from './portalEffects.ts';
import { getCurrentLanguage, translate } from '../../i18n.ts';
import { drawPixelInteraction } from './pixelInteractions.ts';
import { understoryReady, planUnderstory, drawUnderstoryStatic, drawUnderstoryMotion } from './forestUnderstory.ts';
import {
  preloadForest, forestLoaded, forestReady, groundImage, drawStrip, drawStripBlend, boxAround,
  drawDecor, decorSize, DECOR_GROUND, DECOR_SOLID, DECOR_LONG, DECOR_ROUND, type Box,
} from './forestSprites.ts';

/** What the stage needs from the game each frame (set by GameEngine before rendering). */
export interface StageState {
  /** Seconds since the level started (trap and portal clock). */
  levelTime: number;
  /** True once the exit accepts the player. */
  exitOpen: boolean;
  reducedMotion?: boolean;
}

type Ctx = CanvasRenderingContext2D;
interface LegacyScene {
  drawGround(ctx: Ctx, w: number, h: number, level: LevelData): void;
  drawRunes(ctx: Ctx, level: LevelData, time: number): void;
  drawPortal(ctx: Ctx, exit: LevelData['exit'], time: number): void;
  drawGateThresholds(ctx: Ctx, level: LevelData): void;
  drawGates(ctx: Ctx, level: LevelData): void;
  drawWalls(ctx: Ctx, level: LevelData, time: number): void;
}

const PERIMETER = 40;
/** Levels whose cached ground and prop layers are kept (two cross-fading in the intro, plus one). */
const LAYER_CACHE = 3;

export function installForestStage(scene: LegacyScene, state: StageState) {
  preloadForest();
  const orig = {
    drawGround: scene.drawGround.bind(scene), drawRunes: scene.drawRunes.bind(scene),
    drawPortal: scene.drawPortal.bind(scene), drawGateThresholds: scene.drawGateThresholds.bind(scene),
    drawGates: scene.drawGates.bind(scene), drawWalls: scene.drawWalls.bind(scene),
  };
  let ground: HTMLCanvasElement | null = null, props: HTMLCanvasElement | null = null, cacheKey = '';
  // The last few levels' layers, not just one: the cinematic intro cross-fades two levels and
  // renders them on alternate frames, which would otherwise rebuild both layers every frame.
  const layerCache = new Map<string, [HTMLCanvasElement | null, HTMLCanvasElement | null]>();
  let level: LevelData | null = null;
  const plateSince = new Map<string, { pressed: boolean; at: number }>();
  let exitOpenedAt: number | null = null, lastTime = 0;

  scene.drawGround = (ctx, w, h, lvl) => {
    orig.drawGround(ctx, w, h, lvl);
    level = lvl;
    // A new level (or a restart) rewinds the clock: forget per-level animation state.
    if (state.levelTime < lastTime) { plateSince.clear(); exitOpenedAt = null; }
    lastTime = state.levelTime;
    const key = `${w}:${h}:${lvl.id}:${forestLoaded()}:${biomeLoaded()}:${livingReady()}:${understoryReady()}:${JSON.stringify(lvl.walls)}:${JSON.stringify(lvl.traps ?? [])}`;
    if (key !== cacheKey) {
      cacheKey = key;
      let layers = layerCache.get(key);
      if (layers) layerCache.delete(key);                     // re-inserted below as most recent
      else layers = buildLayers(w, h, lvl);
      layerCache.set(key, layers);
      if (layerCache.size > LAYER_CACHE) layerCache.delete(layerCache.keys().next().value!);
      [ground, props] = layers;
    }
    if (ground) ctx.drawImage(ground, 0, 0);
    drawUnderstoryMotion(ctx,lvl.id,state.reducedMotion?0:state.levelTime);
    drawBiomeWeather(ctx, lvl, state.reducedMotion ? 0 : state.levelTime, w, h);
    drawStartPortal(ctx, lvl, state.levelTime, state.reducedMotion);
  };

  scene.drawRunes = (ctx, lvl, time) => {
    if (trapSpritesReady()) for (const trap of lvl.traps ?? []) drawTrap(ctx, trap, state.levelTime, 'floor', lvl.id);
    if (!forestReady('button')) return orig.drawRunes(ctx, lvl, time);
    for (const plate of lvl.plates) drawLinks(ctx, lvl, plate, time);
    for (const plate of lvl.plates) drawButton(ctx, plate, state.levelTime, time);
  };

  scene.drawPortal = (ctx, exit, time) => {
    if (!forestReady('portalExit')) return orig.drawPortal(ctx, exit, time);
    if (state.exitOpen && exitOpenedAt === null) exitOpenedAt = state.levelTime;
    if (!state.exitOpen) exitOpenedAt = null;
    drawExitPortal(ctx, exit, exitOpenedAt === null ? null : state.levelTime - exitOpenedAt, time, state.reducedMotion);
  };

  scene.drawGateThresholds = (ctx, lvl) => { if (!forestReady('door')) orig.drawGateThresholds(ctx, lvl); };
  scene.drawGates = (ctx, lvl) => {
    if (!forestReady('door')) return orig.drawGates(ctx, lvl);
    for(const door of lvl.doors) drawDoor(ctx,door);
  };

  scene.drawWalls = (ctx, lvl, time) => {
    if (biomeLoaded()) drawBiomeWalls(ctx, lvl);
    else orig.drawWalls(ctx, lvl, time);
    if (props && lvl === level) ctx.drawImage(props, 0, 0);
  };

  function drawButton(ctx: Ctx, plate: PressurePlate, t: number, time: number) {
    const pad = 9;
    if(drawPixelInteraction(ctx,plate.isPressed?1:0,plate.x-pad,plate.y-pad,plate.width+pad*2,plate.height+pad*2))return;
    let s = plateSince.get(plate.id);
    if (!s || s.pressed !== plate.isPressed) plateSince.set(plate.id, s = { pressed: plate.isPressed, at: t });
    const e = t - s.at;
    const size = Math.max(plate.width, plate.height) * 1.25;
    const box = boxAround('button', 1, plate.x + plate.width / 2, plate.y + plate.height / 2, size);
    if (!plate.isPressed) {
      // Releasing: the glow drains back to the raised stone.
      drawStripBlend(ctx, 'button', 0, 1, s.at > 0 ? Math.max(0, 1 - e / 0.25) : 0, box, { ref: 1 });
      return;
    }
    // Pressing: sinks and lights up (frames 1-3), flares once (4), then keeps a soft pulse.
    if (e < 0.18) drawStrip(ctx, 'button', 1 + Math.floor(e / 0.06), box, { ref: 1 });
    else if (e < 0.5) drawStripBlend(ctx, 'button', 3, 4, 1 - Math.abs((e - 0.34) / 0.16), box, { ref: 1 });
    else drawStripBlend(ctx, 'button', 3, 4, 0.18 + 0.14 * Math.sin(time * 3.2), box, { ref: 1 });
  }
}

/** Dotted rune line from a plate to the doors it opens (as in the original). */
function drawLinks(ctx: Ctx, lvl: LevelData, plate: PressurePlate, time: number) {
  const cx = plate.x + plate.width / 2, cy = plate.y + plate.height / 2;
  ctx.save();
  for (const door of lvl.doors.filter(d => d.requiredPlates.includes(plate.id))) {
    ctx.strokeStyle = plate.isPressed ? '#a5f0d0' : '#77977a66';
    ctx.lineWidth = plate.isPressed ? 2 : 1;
    ctx.setLineDash([2, 7]); ctx.lineDashOffset = -time * 12;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(door.x + door.width / 2, cy); ctx.lineTo(door.x + door.width / 2, door.y + door.height / 2); ctx.stroke();
  }
  ctx.restore();
}

/** The player rises out of a rune circle that settles into a calm swirl. */
function drawStartPortal(ctx: Ctx, lvl: LevelData, t: number, reduced = false) {
  if (biomeLoaded() === 2) {
    ctx.save(); ctx.globalAlpha = t < 1.2 ? 1 : .85;
    drawBiomeProp(ctx, 7, lvl.playerSpawn.x, lvl.playerSpawn.y + 15, 100);
    ctx.restore();
    drawPortalEnergy(ctx,lvl.playerSpawn.x,lvl.playerSpawn.y,t,t<1.2?1-t*.3:.18,reduced);
    return;
  }
  if (!forestReady('portalStart')) return;
  const { x, y } = lvl.playerSpawn;
  const box = boxAround('portalStart', 3, x, y + 8, 92);
  const seq = [0, 1, 2, 4, 5];
  if (t < 1) return void drawStrip(ctx, 'portalStart', seq[Math.min(seq.length - 1, Math.floor(t / 0.2))], box, { ref: 3 });
  if (t < 1.6) return void drawStripBlend(ctx, 'portalStart', 5, 3, (t - 1) / 0.6, box, { ref: 3 });
  drawStripBlend(ctx, 'portalStart', 3, 4, 0.12 + 0.1 * Math.sin(t * 2.2), box, { ref: 3, alpha: 0.92 });
}

/** Dormant stone ring until every rune is reached, then the vortex opens. */
function drawExitPortal(ctx: Ctx, exit: LevelData['exit'], sinceOpen: number | null, time: number, reduced = false) {
  const cx = exit.x + exit.width / 2, cy = exit.y + exit.height / 2;
  if (biomeLoaded() === 2) {
    ctx.save();
    ctx.globalAlpha = sinceOpen === null ? .45 : 1;
    if (sinceOpen === null) ctx.filter = 'saturate(.15) brightness(.65)';
    ctx.shadowColor = '#83eaff'; ctx.shadowBlur = sinceOpen === null ? 0 : 14 + Math.sin(time * 2) * 5;
    drawBiomeProp(ctx, 7, cx, cy + 18, 120);
    ctx.restore();
    if(sinceOpen!==null) drawPortalEnergy(ctx,cx,cy,sinceOpen,sinceOpen<1.2?1:.62,reduced,true);
    return;
  }
  const box = boxAround('portalExit', 5, cx, cy, 116);
  if (sinceOpen === null) drawStripBlend(ctx, 'portalExit', 3, 2, 0.15 + 0.1 * Math.sin(time * 1.6), box, { ref: 5 });
  else if (sinceOpen < 0.35) drawStripBlend(ctx, 'portalExit', 3, 4, sinceOpen / 0.35, box, { ref: 5 });
  else if (sinceOpen < 0.7) drawStripBlend(ctx, 'portalExit', 4, 5, (sinceOpen - 0.35) / 0.35, box, { ref: 5 });
  else drawStripBlend(ctx, 'portalExit', 5, 4, 0.2 + 0.15 * Math.sin(time * 2.4), box, { ref: 5 });
  ctx.save();
  ctx.font = '600 11px "Second Me Pixel", monospace'; ctx.textAlign = 'center';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillStyle = sinceOpen === null ? '#b9c7a2' : '#d8f7c5';
  ctx.fillText(translate('ANCIENT GATE', getCurrentLanguage()), cx, box.y - 4);
  ctx.restore();
}

/** Stone door in its frame; frames 0-4 follow openProgress. Horizontal doors lie on their side. */
function drawDoor(ctx: Ctx, door: SecurityDoor) {
  const verticalDoor = door.orientation === 'vertical';
  ctx.save();ctx.translate(door.x+door.width/2,door.y+door.height/2);
  if(!verticalDoor)ctx.rotate(Math.PI/2);
  const dw=(verticalDoor?door.width:door.height)+18,dh=(verticalDoor?door.height:door.width)+16;
  const pixelDoor=drawPixelInteraction(ctx,2,-dw/2,-dh/2,dw,dh,door.openProgress);
  ctx.restore();if(pixelDoor)return;
  const vertical = door.orientation === 'vertical';
  const padAcross = 7, padAlong = 5;
  const box: Box = vertical
    ? { x: door.x - padAcross, y: door.y - padAlong, w: door.width + padAcross * 2, h: door.height + padAlong * 2 }
    : { x: door.x - padAlong, y: door.y - padAcross, w: door.width + padAlong * 2, h: door.height + padAcross * 2 };
  const f = Math.max(0, Math.min(1, door.openProgress)) * 4;
  drawStripBlend(ctx, 'door', Math.floor(f), Math.min(4, Math.floor(f) + 1), f - Math.floor(f), box, { ref: 0, rotate: !vertical });
  // Small lamp: amber while shut, green once open.
  ctx.save();
  ctx.fillStyle = door.openProgress > 0.85 ? '#adf0a7' : '#ead298';
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(door.x + door.width / 2, door.y - 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------- cached layers: ground with scattered props, and props on walls ----------

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hits = (a: Rect, b: Rect, pad = 0) =>
  a.x < b.x + b.width + pad && a.x + a.width > b.x - pad && a.y < b.y + b.height + pad && a.y + a.height > b.y - pad;

/** Places the props must leave clear: rune buttons, doors, traps, both portals. */
function keepClear(lvl: LevelData): Rect[] {
  const around = (x: number, y: number, r: number): Rect => ({ x: x - r, y: y - r, width: r * 2, height: r * 2 });
  return [
    ...lvl.plates.map(p => ({ x: p.x - 26, y: p.y - 34, width: p.width + 52, height: p.height + 60 })),
    ...lvl.doors.map(d => ({ x: d.x - 26, y: d.y - 26, width: d.width + 52, height: d.height + 52 })),
    ...(lvl.traps ?? []).map(t => ({ x: t.x - 14, y: t.y - 14, width: t.width + 28, height: t.height + 34 })),
    around(lvl.exit.x + lvl.exit.width / 2, lvl.exit.y + lvl.exit.height / 2, 78),
    around(lvl.playerSpawn.x, lvl.playerSpawn.y, 66),
  ];
}

function buildLayers(w: number, h: number, lvl: LevelData): [HTMLCanvasElement | null, HTMLCanvasElement | null] {
  const tile = groundImage();
  if (!tile || typeof document === 'undefined') return [null, null];
  const ground = document.createElement('canvas'), props = document.createElement('canvas');
  ground.width = props.width = w; ground.height = props.height = h;
  const g = ground.getContext('2d')!, p = props.getContext('2d')!;
  const rand = rng(lvl.id * 977 + 13);

  if (drawBiomeFloor(g, w, h, lvl)) {
    const clear = keepClear(lvl);
    if (lvl.id === 6) {
      for (const x of [130, 1150]) for (const y of [120, 580]) clear.push({ x: x - 80, y: y - 80, width: 160, height: 160 });
    }
    if(understoryReady()) {
      drawUnderstoryStatic(g,planUnderstory(lvl,w,h,clear));
      return [ground,props];
    }
    if (livingImage('decor-pixel.png')) {
      const pools = [[0, 1, 2, 3], [2, 3, 0], [4, 5], [6, 7, 3], [8, 9], [10, 11]];
      const pool = pools[biomeIndex(lvl.id)];
      const placed: Rect[] = [];
      const place = (x: number, y: number, size: number, onWall = false) => {
        const rect = { x: x - size * .5, y: y - size * .66, width: size, height: size };
        if (clear.some(c => hits(rect, c, 12)) || placed.some(c => hits(rect, c, 14))) return;
        if (!onWall && lvl.walls.some(wall => hits(rect, wall, 3))) return;
        placed.push(rect);
        const solidPools = [[1, 2, 3], [2, 3], [5], [6, 7], [8, 9], [10, 11]];
        const choices = onWall ? solidPools[biomeIndex(lvl.id)] : pool;
        drawLivingDecor(onWall ? p : g, choices[Math.floor(rand() * choices.length)], x, y, size, rand() > .5);
      };
      // Uneven groups at sheltered corners, rather than a repeated row of identical props.
      for (const wall of lvl.walls) {
        if (wall.x <= 0 || wall.y <= 0 || wall.x + wall.width >= w || wall.y + wall.height >= h) continue;
        if (Math.max(wall.width, wall.height) <= 160) {
          place(wall.x + wall.width * .5, wall.y + wall.height * .55, Math.min(180, Math.max(100, wall.width * 1.5)), true);
        } else {
          for (const side of [-1, 1]) {
            const size = 65 + rand() * 22;
            place(wall.x + (side < 0 ? -size * .55 : wall.width + size * .55), wall.y + wall.height - 32, size);
          }
        }
      }
      for (let i = 0; i < 240 && placed.length < (lvl.id === 6 ? 12 : 22); i++) {
        const size = 52 + rand() * 38;
        const side = Math.floor(rand() * 4);
        const x = side === 0 ? 42 + size * .5 : side === 1 ? w - 42 - size * .5 : 90 + rand() * (w - 180);
        const y = side === 2 ? 48 + size * .66 : side === 3 ? h - 44 - size * .34 : 100 + rand() * (h - 200);
        place(x, y, size);
      }
      // Low, walkable accents inhabit empty pockets without masking puzzle objects.
      const smallPool = lvl.id >= 5 ? [8, 9, 10] : lvl.id === 3 ? [4, 5] : lvl.id === 4 ? [6, 7] : [0, 1, 3];
      for (let i = 0, count = 0; i < 250 && count < (lvl.id === 6 ? 10 : 30); i++) {
        const size = 25 + rand() * 22;
        const x = 85 + rand() * (w - 170), y = 95 + rand() * (h - 190);
        const rect = { x: x - size / 2, y: y - size * .66, width: size, height: size };
        if (clear.some(c => hits(rect, c, 22)) || lvl.walls.some(wall => hits(rect, wall, 16)) || placed.some(c => hits(rect, c, 24))) continue;
        placed.push(rect); count++;
        g.save(); g.globalAlpha = .85;
        drawLivingDecor(g, smallPool[Math.floor(rand() * smallPool.length)], x, y, size, rand() > .5);
        g.restore();
      }
      return [ground, props];
    }
    // Place larger silhouettes at the boundary, leaving routes and mechanics quiet.
    const index = biomeIndex(lvl.id);
    for (let i = 0; i < 8; i++) {
      const x = 150 + Math.floor(i / 2) * ((w - 300) / 3) + (rand() - .5) * 30;
      const y = i % 2 ? h - 52 : 57;
      const size = 45 + rand() * 26;
      const r = { x: x - size / 2, y: y - size * .7, width: size, height: size };
      if (!clear.some(c => hits(r, c, 14))) drawBiomeProp(p, index, x, y, size);
    }
    // Small obstacles receive a matching single prop, instead of stacked textures.
    for (const wall of lvl.walls) {
      if (wall.x <= 0 || wall.y <= 0 || wall.x + wall.width >= w || wall.y + wall.height >= h) continue;
      if (Math.max(wall.width, wall.height) > 160) continue;
      drawBiomeProp(p, index, wall.x + wall.width / 2, wall.y + wall.height / 2, Math.min(80, Math.max(wall.width, wall.height)));
    }
    return [ground, props];
  }

  // Ground: the painted forest floor, repeated down the stage, a touch darker so play pieces pop.
  const scale = w / tile.width;
  for (let y = 0; y < h; y += tile.height * scale) g.drawImage(tile, 0, y, w, tile.height * scale);
  g.fillStyle = 'rgba(6, 22, 16, 0.22)'; g.fillRect(0, 0, w, h);

  const clear = keepClear(lvl);
  // Walls keep the legacy stone look; the floor gets small walkable clutter (ferns, mushrooms, twigs).
  const placed: Rect[] = [];
  for (let tries = 0; tries < 400 && placed.length < 24; tries++) {
    const idx = DECOR_GROUND[Math.floor(rand() * DECOR_GROUND.length)];
    const size = decorSize(idx);
    const width = Math.min(96, size.w * (0.34 + rand() * 0.12));
    const height = width * size.h / size.w;
    const x = PERIMETER + 10 + rand() * (w - PERIMETER * 2 - 20), y = PERIMETER + 12 + rand() * (h - PERIMETER * 2 - 16);
    const r: Rect = { x: x - width / 2, y: y - height, width, height };
    if (r.x < PERIMETER || r.x + r.width > w - PERIMETER || r.y < PERIMETER || y > h - PERIMETER) continue;
    if (lvl.walls.some(wl => hits(r, wl, 4)) || clear.some(c => hits(r, c)) || placed.some(o => hits(r, o, 26))) continue;
    placed.push(r);
    drawDecor(g, idx, x, y, width, rand() < 0.5);
  }

  // Interior wall blocks become what they look like: a log or a boulder that fills the block.
  for (const wall of lvl.walls) {
    const perimeter = wall.x <= 0 || wall.y <= 0 || wall.x + wall.width >= w || wall.y + wall.height >= h;
    if (perimeter || wall.width * wall.height > 9000 || Math.max(wall.width, wall.height) > 160) continue;
    const long = wall.width >= wall.height * 1.6;
    const pool = long ? DECOR_LONG : DECOR_ROUND;
    const idx = pool[Math.floor(rand() * pool.length)];
    const size = decorSize(idx);
    // Fit the prop's footprint over the block, overhanging by at most a few pixels.
    const width = Math.min(wall.width + 14, (wall.height + 22) * size.w / size.h);
    drawDecor(p, idx, wall.x + wall.width / 2, wall.y + wall.height + 6, width, rand() < 0.5);
  }

  // Perimeter: bushes, rocks and stumps sit on the outer wall and spill off-screen, never inward.
  const solid = () => DECOR_SOLID[Math.floor(rand() * DECOR_SOLID.length)];
  const blocked = (r: Rect) => clear.some(c => hits(r, c, 6));
  for (let x = 30 + rand() * 60; x < w - 30; x += 120 + rand() * 90) {
    const idx = solid(), s = decorSize(idx);
    const width = Math.min(150, s.w * 0.55), height = width * s.h / s.w;
    if (!blocked({ x: x - width / 2, y: PERIMETER + 4 - height, width, height })) drawDecor(p, idx, x, PERIMETER + 4, width, rand() < 0.5);
    const idx2 = solid(), s2 = decorSize(idx2);
    const h2 = Math.min(58, s2.h * 0.5), w2 = h2 * s2.w / s2.h;
    const x2 = x + 50 + rand() * 40;
    if (!blocked({ x: x2 - w2 / 2, y: h - PERIMETER - 4, width: w2, height: h2 })) drawDecor(p, idx2, x2, h - PERIMETER - 4 + h2 - 2, w2, rand() < 0.5);
  }
  for (let y = 110 + rand() * 60; y < h - 80; y += 130 + rand() * 80) {
    for (const side of [0, 1]) {
      const idx = solid(), s = decorSize(idx);
      const width = Math.min(PERIMETER + 18, s.w * 0.5), height = width * s.h / s.w;
      const x = side ? w - PERIMETER / 2 + 4 : PERIMETER / 2 - 4;
      if (!blocked({ x: x - width / 2, y: y - height, width, height })) drawDecor(p, idx, x, y, width, side === 1);
    }
  }
  return [ground, props];
}
