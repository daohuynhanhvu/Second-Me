import type { LevelData } from '../logic/types.ts';
import { livingImage } from './livingAssets.ts';
import { drawForestBoundary } from './forestBoundary.ts';

// Original generated art: six floor paintings and eight isolated environment props.
const palettes = [
  ['#203e36', '#496c55', '#93b894', '#a1efcd'],
  ['#263c3b', '#4d6460', '#a8b9a0', '#e5c88c'],
  ['#252c49', '#4f5272', '#9f9bc6', '#bda5ff'],
  ['#463b32', '#796451', '#c6a47a', '#ffd28e'],
  ['#293d50', '#597080', '#afc6d2', '#a8e4ff'],
  ['#213d59', '#547f9e', '#c3e7f5', '#a7f6ff'],
];
const images = new Map<string, HTMLImageElement>();
function load(file: string) {
  if (typeof Image === 'undefined') return null;
  let img = images.get(file);
  if (!img) {
    img = new Image(); img.src = `${import.meta.env.BASE_URL}assets/biomes/${file}`;
    images.set(file, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}
export function biomeIndex(id: number) { return Math.max(0, Math.min(5, id - 1)); }
export function biomeLoaded() { return Number(!!load('forest-floors-pixel.png')) + Number(!!load('props-pixel.png')); }

export function drawBiomeProp(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, size: number) {
  const img = load('props-pixel.png');
  if (!img) return;
  const cw = img.width / 4, ch = img.height / 2;
  ctx.drawImage(img, index % 4 * cw, Math.floor(index / 4) * ch, cw, ch, x - size / 2, y - size * .7, size, size);
}

export function drawBiomeFloor(ctx: CanvasRenderingContext2D, w: number, h: number, level: LevelData) {
  const index = biomeIndex(level.id), img = load('forest-floors-pixel.png');
  if (!img) return false;
  const cw = img.width / 3, ch = img.height / 2;
  ctx.drawImage(img, index % 3 * cw, Math.floor(index / 3) * ch, cw, ch, 0, 0, w, h);
  // Keep the playfield bright; only the outside edge recedes into shadow.
  const shade = ctx.createRadialGradient(w / 2, h / 2, h * .22, w / 2, h / 2, w * .62);
  shade.addColorStop(0, '#07131c00'); shade.addColorStop(1, '#07131c77');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
  return true;
}

export function drawBiomeWalls(ctx: CanvasRenderingContext2D, level: LevelData) {
  if(drawForestBoundary(ctx,level))return;
  const index = biomeIndex(level.id), [dark, stone, edge, glow] = palettes[index];
  for (const wall of level.walls) {
    const { x, y, width: w, height: h } = wall;
    // Small obstacles are now complete natural vignettes, without a rectangular pedestal.
    if (livingImage('decor-pixel.png') && w >= h * 1.5 && w >= 60 && x > 0 && y > 0 && x + w < 1280 && y + h < 720 && Math.max(w, h) <= 160) {
      ctx.save(); ctx.fillStyle = dark; ctx.shadowColor = '#09140e88'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      continue;
    }
    ctx.save();
    ctx.shadowColor = '#06111dcc'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
    ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.beginPath(); ctx.roundRect(x, y, w, Math.max(1, h - 7), 4); ctx.clip();
    const vertical = h > w, length = vertical ? h : w;
    for (let at = 0, n = 0; at < length; at += 76, n++) {
      const bx = vertical ? x + 2 : x + at + 2, by = vertical ? y + at + 2 : y + 2;
      const bw = vertical ? w - 4 : Math.min(72, length - at - 4);
      const bh = vertical ? Math.min(72, length - at - 4) : h - 11;
      if (bw <= 0 || bh <= 0) continue;
      const gradient = ctx.createLinearGradient(bx, by, bx, by + bh);
      gradient.addColorStop(0, edge); gradient.addColorStop(.09, stone); gradient.addColorStop(1, dark);
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill();
      ctx.strokeStyle = `${edge}55`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx + 5, by + 2); ctx.lineTo(bx + bw - 5, by + 2); ctx.stroke();
      if (n % 3 === 1) {
        ctx.fillStyle = glow; ctx.globalAlpha = .65;
        ctx.fillRect(bx + bw / 2 - 1, by + bh / 2 - 4, 2, 8); ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
}

export function drawBiomeWeather(ctx: CanvasRenderingContext2D, level: LevelData, time: number, w: number, h: number) {
  const ice = level.id >= 5;
  // Broad, very faint shafts connect the floating motes to the environment lighting.
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 3; i++) {
    const x = w * (.12 + i * .32), drift = Math.sin(time * .16 + i) * 14;
    const light = ctx.createLinearGradient(x, 0, x + 160, h);
    light.addColorStop(0, ice ? '#b7eaff0c' : '#ffe9b515'); light.addColorStop(1, '#ffffff00');
    ctx.fillStyle = light; ctx.beginPath();ctx.moveTo(x + drift, 40);ctx.lineTo(x + 35 + drift, 40);ctx.lineTo(x + 280 + drift, h - 40);ctx.lineTo(x + 150 + drift, h - 40);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.fillStyle = ice ? '#e1f7ff' : palettes[biomeIndex(level.id)][3];
  for (let i = 0; i < (ice ? 42 : 15); i++) {
    const x = ((i * 173.3 + Math.sin(time * .3 + i) * 22 + time * (ice ? 12 : 2)) % w + w) % w;
    const y = (i * 97.7 + time * (ice ? 19 : -4) % h + h) % h;
    ctx.globalAlpha = .18 + .22 * (.5 + .5 * Math.sin(i + time));
    ctx.beginPath(); ctx.arc(x, y, ice ? 1.2 + i % 3 * .4 : 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (!ice) {
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const x = 95 + (i * 167 + time * 8) % (w - 190);
      const y = 105 + ((i * 113 + Math.sin(time * .35 + i) * 35) % (h - 210) + h - 210) % (h - 210);
      ctx.save(); ctx.translate(x, y);
      if (level.id === 4) {
        ctx.rotate(time * .5 + i);ctx.fillStyle = '#d4a35488';ctx.beginPath();ctx.ellipse(0, 0, 4, 1.8, .5, 0, Math.PI * 2);ctx.fill();
      } else {
        const wing = 1 + Math.abs(Math.sin(time * 6 + i)) * 2.2;
        ctx.fillStyle = level.id === 3 ? '#c8a9e5aa' : '#f7dfafaa';
        ctx.beginPath();ctx.ellipse(-wing, 0, wing, 2, -.5, 0, Math.PI * 2);ctx.ellipse(wing, 0, wing, 2, .5, 0, Math.PI * 2);ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

