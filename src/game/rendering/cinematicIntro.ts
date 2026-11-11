import { getWizardSheet } from './wizardSprite.ts';
import { drawPfx, preloadPfx, type PfxDraw, type PfxName } from './pixelfx.ts';
import { INTRO_VOICE } from '../logic/voice.ts';
import { INTRO, BOSS_STEPS, clamp01, lerp, easeOutCubic, easeInCubic, easeInOutCubic, seg } from '../logic/introTimeline.ts';

/** Woodland film rendered on one consistent 2px grid. Dedicated scenery keeps
 * gameplay walls and triggers out of the story; audio timing remains in INTRO. */
export const W = 1280, H = 720;
const BASE = import.meta.env?.BASE_URL ?? '/';
type Lang = 'en' | 'vi';
type Ctx = CanvasRenderingContext2D;
type RGB = [number, number, number];

interface Sheet { img: HTMLImageElement; fw: number; fh: number; cols: number; frames: number }
interface Mote { x: number; y: number; vx: number; vy: number; age: number; max: number; size: number; rgb: RGB; mode: 0 | 1 | 2; seed: number; g: number }

const ready = (i: HTMLImageElement | undefined | null): i is HTMLImageElement => !!i && i.complete && i.naturalWidth > 0;
const load = (src: string) => { const i = new Image(); i.src = `${BASE}${src}`; return i; };
function makeCanvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${clamp01(a)})`;

const C = INTRO.cue;
const TEXT = {
  en: { aeris: 'AERIS', aerisSub: 'MAGE OF ECHOES', kael: 'KAEL', kaelSub: 'SWORDSMAN OF THE EMBER', eyebrow: 'CHAPTER II · THE EMBERFORGE', tag: 'ECHOES OF THE WILD' },
  vi: { aeris: 'AERIS', aerisSub: 'PHÁP SƯ TIẾNG VỌNG', kael: 'KAEL', kaelSub: 'KIẾM SĨ CỦA LỬA THIÊNG', eyebrow: 'CHƯƠNG II · LÒ RÈN EMBERFORGE', tag: 'TIẾNG VỌNG CỦA RỪNG HOANG' },
} as const;

/** Screen pixels per art pixel, per scene. Changes only behind a black dip or the whiteout. */
const pxAt = (_t: number) => 2;

const COL = {
  mote: [196, 236, 170] as RGB, cyan: [120, 230, 255] as RGB, ice: [190, 245, 255] as RGB, warm: [255, 206, 128] as RGB,
  ember: [255, 150, 70] as RGB, white: [255, 255, 240] as RGB, core: [255, 120, 70] as RGB, dust: [150, 132, 110] as RGB,
};

/** A low-resolution render target: one pixel = one art pixel at the current density. */
class PixelLayer {
  c = makeCanvas(1, 1); g = this.c.getContext('2d')!; px = 0; w = 1; h = 1;
  begin(px: number, fill: string | null): Ctx {
    if (px !== this.px) { this.px = px; this.w = Math.ceil(W / px); this.h = Math.ceil(H / px); this.c.width = this.w; this.c.height = this.h; }
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = false;
    if (fill) { g.fillStyle = fill; g.fillRect(0, 0, this.w, this.h); } else g.clearRect(0, 0, this.w, this.h);
    return g;
  }
}

/** pixelfx effects the film uses (INTRO_PLAN.md), loaded while the studio card is up. */
const INTRO_PFX: PfxName[] = ['god-rays', 'fireflies', 'rune-circle', 'fog', 'magic-circle-cast', 'halo', 'snow',
  'heavy-landing', 'frost-nova', 'blizzard', 'sword-slash', 'crit-hit', 'spell-charge', 'magic-missile', 'parry', 'collect-burst',
  'shooting-stars', 'pixel-dissolve', 'shatter-wipe', 'star-iris'];

export class CinematicIntro {
  private backdrop = load('assets/intro/woodland-story.png');
  private scene = new PixelLayer();
  private fx = new PixelLayer();
  private vignette = makeCanvas(160, 90);
  private mist = makeCanvas(64, 32);
  private logo = makeCanvas(1, 1);
  private logoTmp = makeCanvas(1, 1);
  private parts: Mote[] = [];
  private spawnAcc = 0;
  private lastT = 0;
  private fired = new Set<string>();
  private shakes: { at: number; amp: number; decay: number }[] = [];
  private flash = { at: -99, a: 0, rgb: [235, 250, 255] as RGB };
  private sold: Record<'Idle' | 'Walk' | 'Attack01', Sheet>;
  private cleanSoldiers = new Map<string, HTMLCanvasElement>();
  private runeSheet: Sheet;

  constructor(private lang: Lang, private reduced: boolean) {
    getWizardSheet();
    const sheet = (src: string, fw: number, fh: number, cols: number, frames: number): Sheet => ({ img: load(src), fw, fh, cols, frames });
    this.sold = { Idle: sheet('assets/soldier/Kael_Walk.png', 256, 256, 8, 8), Walk: sheet('assets/soldier/Kael_Walk.png', 256, 256, 8, 8), Attack01: sheet('assets/soldier/Kael_Attack.png', 256, 256, 8, 8) };
    this.runeSheet = sheet('assets/magic-effects/rune.png', 32, 32, 18, 18);
    this.buildVignette(); this.buildMist(); this.buildLogo();
    preloadPfx(INTRO_PFX);
  }

  // ---------- one-time builds ----------
  private buildVignette() {
    const g = this.vignette.getContext('2d')!, w = 160, h = 90;
    const r = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
    r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.8)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  }
  private buildMist() {
    const g = this.mist.getContext('2d')!;
    const r = g.createRadialGradient(32, 16, 0, 32, 16, 32);
    r.addColorStop(0, 'rgba(150,190,170,1)'); r.addColorStop(1, 'rgba(150,190,170,0)');
    g.setTransform(1, 0, 0, 0.5, 0, 8); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  /** Same lockup as the main menu: SECOND / ME on two lines, ME in sage. Light, not glowing. */
  private buildLogo() {
    const font = '500 108px "Second Me Pixel", monospace';
    const spacing = 14;
    const probe = this.logo.getContext('2d')!;
    probe.font = font; (probe as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
    const w = Math.ceil(probe.measureText('SECOND').width) + 120, h = 310;
    this.logo.width = this.logoTmp.width = w; this.logo.height = this.logoTmp.height = h;
    const g = this.logo.getContext('2d')!;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = font;
    (g as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
    const draw = (s: string, y: number, color: string) => {
      g.shadowColor = 'rgba(146,209,151,.35)'; g.shadowBlur = 16; g.fillStyle = color; g.fillText(s, w / 2 + spacing / 2, y);
      g.shadowBlur = 0; g.fillText(s, w / 2 + spacing / 2, y);
    };
    draw('SECOND', 150, '#edf3dc');
    draw('ME', 276, '#a5c89b');
  }
  // ---------- helpers ----------
  /** A pixelfx effect (INTRO_PLAN.md) `age` s in, on a layer in art pixels. False while it is loading, before it
   *  starts or after it ends, so the caller can keep its hand-drawn version. */
  private pfx(c: Ctx, name: PfxName, age: number, x: number, y: number, o: PfxDraw = {}) { return drawPfx(c, name, age, x, y, o); }
  /** Full-screen weather (320 x 180 at 2 art px per pixel) from `from` to `to`, fading in and out. Not with reduced motion. */
  private weather(c: Ctx, name: PfxName, from: number, to: number, t: number, alpha: number, floor = 170) {
    if (this.reduced || t < from || t >= to) return;
    const a = alpha * seg(t, from, from + .6) * (1 - seg(t, to - .6, to));
    if (a > .01) this.pfx(c, name, t - from, 320, floor * 2, { scale: 2, alpha: a });
  }
  /** A full-screen transition on the screen itself, played `rate` times faster; `until` stops it at full cover. */
  private wipe(ctx: Ctx, name: PfxName, start: number, t: number, rate = 1, until = Infinity, filter = 'none') {
    const age = (t - start) * rate;
    if (this.reduced || age < 0 || age >= until) return;
    ctx.save(); ctx.filter = filter; this.pfx(ctx, name, age, 0, 0, { scale: 4 }); ctx.restore();
  }
  private once(key: string, at: number, t: number, fn: () => void) { if (t >= at && !this.fired.has(key)) { this.fired.add(key); fn(); } }
  private shake(t: number, amp: number, decay = 5) { if (!this.reduced) this.shakes.push({ at: t, amp, decay }); }
  private doFlash(t: number, a: number, rgb: RGB = [235, 250, 255]) { this.flash = { at: t, a: this.reduced ? a * 0.35 : a, rgb }; }
  private spawn(m: Partial<Mote> & { x: number; y: number }) {
    if (this.parts.length > 320) return;
    this.parts.push({ vx: 0, vy: 0, age: 0, max: 3, size: 1, rgb: COL.mote, mode: 0, seed: Math.random() * 100, g: 0, ...m });
  }
  private burst(x: number, y: number, n: number, speed: number, rgb: RGB, max: number, g = 260, size = 1, mode: 0 | 1 | 2 = 1) {
    const count = Math.round(n * (this.reduced ? 0.4 : 1));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.25, max: max * (0.6 + Math.random() * 0.6), size: Math.random() < 0.3 ? size + 1 : size, rgb, mode, g });
    }
  }
  /** Animation clock with hit-stops: characters freeze for a few frames on impact. */
  private animT(t: number) {
    const stops: [number, number][] = [[C.impact, 0.08], [C.clash, 0.06]];
    return stops.reduce((acc, [a, len]) => acc - Math.min(len, Math.max(0, t - a)), t);
  }

  /** Banded (stepped) radial light, the pixel-art way of drawing a glow. Layer coordinates. */
  private glow(f: Ctx, x: number, y: number, r: number, rgb: RGB, a: number, sy = 1) {
    if (a <= 0.003 || r <= 0) return;
    f.save(); f.translate(x, y); f.scale(1, sy); f.fillStyle = rgba(rgb, 1);
    const steps = [0.1, 0.16, 0.26, 0.42];
    steps.forEach((s, i) => { f.globalAlpha = a * s; f.beginPath(); f.arc(0, 0, Math.max(1, r * (1 - i * 0.24)), 0, Math.PI * 2); f.fill(); });
    f.restore();
  }
  private ring(f: Ctx, x: number, y: number, rx: number, ry: number, rgb: RGB, a: number, lw = 1) {
    if (a <= 0.003 || rx <= 0) return;
    f.save(); f.globalAlpha = clamp01(a); f.strokeStyle = rgba(rgb, 1); f.lineWidth = lw;
    f.beginPath(); f.ellipse(x, y, rx, Math.max(0.5, ry), 0, 0, Math.PI * 2); f.stroke(); f.restore();
  }
  /** 4-point pixel star. */
  private star(f: Ctx, x: number, y: number, arm: number, rgb: RGB, a: number) {
    if (a <= 0.003) return;
    x = Math.round(x); y = Math.round(y);
    f.save(); f.globalAlpha = clamp01(a); f.fillStyle = rgba(rgb, 1);
    f.fillRect(x, y - arm, 1, arm * 2 + 1); f.fillRect(x - arm, y, arm * 2 + 1, 1);
    if (arm >= 2) { f.globalAlpha = clamp01(a) * 0.6; f.fillRect(x - 1, y - 1, 3, 3); }
    f.restore();
  }
  private shakeOffset(t: number) {
    let x = 0, y = 0;
    this.shakes = this.shakes.filter(s => t - s.at < 2.5 && t >= s.at - 0.01);
    for (const s of this.shakes) { const a = s.amp * Math.exp(-(t - s.at) * s.decay); x += Math.sin(t * 73 + s.at) * a; y += Math.cos(t * 89 + s.at * 2) * a; }
    // Low continuous tremor while the Guardian stirs in the dark.
    if (!this.reduced) { const tr = 1.6 * seg(t, 15.3, 16.2) * (1 - seg(t, C.step, C.step + 0.3)); x += Math.sin(t * 41) * tr; y += Math.cos(t * 37) * tr; }
    return [Math.round(x), Math.round(y)];
  }

  // ---------- backdrop ----------
  private drawBackdrop(g: Ctx, t: number, dt: number, px: number) {
    if (!ready(this.backdrop)) return;
    const sw=this.backdrop.naturalWidth/2,sh=this.backdrop.naturalHeight/2;
    const panel=(idx:number,alpha:number)=>{
      const progress=this.reduced?0:seg(t,idx===0?0:idx===1?5:idx===2?15:22,idx===0?5:idx===1?15:idx===2?22:28);
      const zoom=1.06+progress*.035,w=W/px*zoom,h=H/px*zoom;
      g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=false;
      g.drawImage(this.backdrop,(idx%2)*sw,Math.floor(idx/2)*sh,sw,sh,(W/px-w)/2,(H/px-h)/2,w,h);g.restore();
    };
    const idx=t<5?0:t<15?1:t<22?2:3;
    const start=idx===0?0:idx===1?5:idx===2?15:22;
    if(idx>0&&t<start+.8)panel(idx-1,1);
    panel(idx,idx===0?1:easeInOutCubic(seg(t,start,start+.8)));
  }
  private drawMist(g: Ctx, t: number, px: number, strength: number) {
    if (strength <= 0) return;
    g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = 0.15 * strength;
    for (let i = 0; i < 6; i++) {
      const sp = 14 + i * 5, x = ((t * sp + i * 330) % (W + 700)) - 350, y = 130 + i * 100 + Math.sin(t * 0.3 + i) * 24, s = 520 + (i % 3) * 140;
      g.drawImage(this.mist, (x - s / 2) / px, (y - s / 4) / px, s / px, s / 2 / px);
    }
    g.restore();
  }
  // ---------- sprites (layer coordinates = art pixels) ----------
  private shadow(g: Ctx, x: number, y: number, w: number, a: number) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a * 0.45; g.fillStyle = '#000'; g.fillRect(Math.round(x - w), Math.round(y), Math.round(w * 2), 1);
    g.globalAlpha = a * 0.3; g.fillRect(Math.round(x - w + 1), Math.round(y + 1), Math.max(1, Math.round(w * 2 - 2)), 1); g.restore();
  }
  // ---------- typography (full resolution) ----------
  private serif() { return '"Second Me Pixel", monospace'; }
  private text(ctx: Ctx, str: string, x: number, y: number, o: { size: number; font?: string; color?: string; alpha: number; spacing?: number; align?: CanvasTextAlign; weight?: string; style?: string }) {
    if (o.alpha <= 0.003) return;
    ctx.save(); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'alphabetic';
    // The pixel face first (VT323, with Vietnamese), then the caller's family as a fallback.
    ctx.font = `${o.style ?? ''} ${o.weight ?? '400'} ${o.size}px "Second Me Pixel", ${o.font ?? 'system-ui, "Segoe UI", Arial, sans-serif'}`;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing ?? 0}px`;
    ctx.fillStyle = '#020806'; ctx.globalAlpha = clamp01(o.alpha) * 0.7; ctx.fillText(str, x + 2, y + 2);
    ctx.globalAlpha = clamp01(o.alpha); ctx.fillStyle = o.color ?? '#e6ecd6'; ctx.fillText(str, x, y);
    ctx.restore();
  }
  /** Character name: letters rise in one by one, a rule draws under them, the epithet types on. */
  private nameCard(ctx: Ctx, name: string, sub: string, x: number, y: number, t0: number, t1: number, t: number, accent: string) {
    const out = 1 - seg(t, t1 - 0.45, t1);
    if (t < t0 || out <= 0) return;
    ctx.save();
    const font = `500 48px "Second Me Pixel", monospace`, spacing = 6;
    ctx.font = font; (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
    let cx = x;
    [...name].forEach((ch, i) => {
      const p = easeOutCubic(seg(t, t0 + i * 0.07, t0 + i * 0.07 + 0.45));
      this.text(ctx, ch, cx, y + (1 - p) * 14, { size: 48, font: this.serif(), weight: '300', spacing, alpha: p * out, align: 'left' });
      cx += ctx.measureText(ch).width;
    });
    const rule = easeInOutCubic(seg(t, t0 + 0.35, t0 + 0.95));
    ctx.globalAlpha = 0.8 * out; ctx.fillStyle = accent; ctx.fillRect(x + 2, y + 14, Math.round((cx - x - spacing) * rule), 2);
    ctx.restore();
    this.text(ctx, sub, x + 4, y + 50, { size: 22, font: 'ui-monospace, Consolas, monospace', spacing: 2, alpha: out, align: 'left', color: accent });
  }
  /** Subtitles live inside the bottom letterbox bar: always readable, never over the art. */
  private caption(ctx: Ctx, str: string, t: number, a: number, b: number, quote: boolean) {
    const al = Math.min(seg(t, a, a + 0.45), 1 - seg(t, b - 0.45, b));
    this.text(ctx, quote ? `“${str}”` : str, W / 2, H - 28, { size: 32, alpha: al, spacing: 1, color: quote ? '#f0e2bd' : '#e3ead5', font: this.serif(), style: quote ? 'italic' : '' });
  }

  // ---------- scenes ----------
  /** Match visible silhouette height, not sprite-cell size, for both introductions. */
  private heroPortrait(g:Ctx,kind:'aeris'|'kael',x:number,y:number,height:number,alpha:number) {
    const source=kind==='aeris'?getWizardSheet():this.sold.Idle.img;
    if(!source || (source instanceof HTMLImageElement&&!ready(source)))return;
    let portrait=this.cleanSoldiers.get(`portrait-${kind}`);
    if(!portrait){
      const cell=makeCanvas(256,256),c=cell.getContext('2d')!;
      c.drawImage(source,0,512,256,256,0,0,256,256);
      const pixels=c.getImageData(0,0,256,256);let x0=256,y0=256,x1=0,y1=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        const i=(y*256+x)*4;pixels.data[i+3]=pixels.data[i+3]>=180?255:0;
        if(pixels.data[i+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      }
      if(x1<x0)return;c.putImageData(pixels,0,0);
      portrait=makeCanvas(x1-x0+1,y1-y0+1);
      portrait.getContext('2d')!.drawImage(cell,x0,y0,portrait.width,portrait.height,0,0,portrait.width,portrait.height);
      this.cleanSoldiers.set(`portrait-${kind}`,portrait);
    }
    const width=height*portrait.width/portrait.height;
    g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=false;
    this.shadow(g,x,y+2,width*.38,.7);
    g.drawImage(portrait,Math.round(x-width/2),Math.round(y-height),width,height);g.restore();
  }

  private sceneHeroes(g: Ctx, f: Ctx, t: number, _ta: number, px: number) {
    const start=t<12.5?10.3:12.5,end=start+2.2;
    if(t<start||t>end)return;
    const mage=t<12.5,alpha=Math.min(easeOutCubic(seg(t,start,start+.35)),1-seg(t,end-.3,end));
    const x=430/px,y=530/px,height=210/px;
    // Identical scale, staging and reveal for both heroes; only their signature light differs.
    const accent=mage?COL.cyan:COL.warm;
    this.glow(f,x,y-height*.45,height*.8,accent,alpha*.22,.8);
    this.ring(f,x,y+2,44,12,accent,alpha*.35);
    // Effect pivots: magic-circle-cast's is the centre of its floor ring (drawn under her, on the scene layer);
    // halo's is the wearer's feet, 45 px below its ring, so it is lifted to float a little over the hair.
    if(mage)this.pfx(g,'magic-circle-cast',t-C.wizard,x,y-4,{alpha:Math.min(1,alpha*1.4)});
    else this.pfx(f,'halo',t-C.draw,x,y-32,{scale:1.75,alpha});
    this.heroPortrait(g,mage?'aeris':'kael',x,y,height,alpha);
    for(let i=0;i<7;i++){
      const an=i*2.4+t*.45;
      this.star(f,x+Math.cos(an)*43,y-24-i*10,0,accent,alpha*(.4+.3*Math.sin(t*2+i)));
    }
  }

  /** Side-facing action frames share a fixed cell anchor, so attacks do not jump. */
  private actor(g:Ctx,kind:'aeris'|'kael',x:number,y:number,time:number,clip:'idle'|'walk'|'attack',alpha=1,echo=false) {
    const source=kind==='aeris'?getWizardSheet():clip==='attack'?this.sold.Attack01.img:this.sold.Walk.img;
    if(!source || (source instanceof HTMLImageElement&&!ready(source)))return;
    const key=kind==='aeris'?'aeris-action':clip==='attack'?'kael-attack':'kael-walk';
    let clean=this.cleanSoldiers.get(key);
    if(!clean){
      clean=makeCanvas(source.width,source.height);const c=clean.getContext('2d')!;c.drawImage(source,0,0);
      const pixels=c.getImageData(0,0,clean.width,clean.height);
      for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=180?255:0;
      c.putImageData(pixels,0,0);this.cleanSoldiers.set(key,clean);
    }
    const frame=clip==='idle'?0:clip==='attack'?Math.min(7,Math.floor(Math.max(0,time)*22)):Math.floor(Math.max(0,time)*10)%8;
    const row=clip==='attack'?2:1;
    g.save();g.globalAlpha=alpha;
    if(echo)g.filter='brightness(1.5) sepia(1) saturate(3) hue-rotate(120deg)';
    else this.shadow(g,x,y+1,16,.7);
    g.imageSmoothingEnabled=false;g.drawImage(clean,frame*256,row*256,256,256,Math.round(x)-45,Math.round(y)-72,90,90);g.restore();
  }

  private sceneWoodland(g:Ctx,f:Ctx,t:number,px:number) {
    if(t<.8||t>=10)return;
    if(t<5){
      const x=750/px,y=355/px,open=seg(t,.9,2.2),out=1-seg(t,4.6,5);
      this.glow(f,x,y,70,COL.warm,.35*open*out,.45);
      this.weather(f,'god-rays',.8,5.2,t,.9);
      this.weather(f,'fireflies',.8,5.2,t,.8,170);
      // The stone circle wakes: a rune circle on it, flaring on each of the three rune beats.
      const beat=Math.max(...[C.rune1,C.rune2,C.rune3].map(at=>Math.max(0,1-Math.abs(t-at)/.45)));
      // The ring covers the stone circle: its drawn bottom edge stays put, its top is stretched up to the top stones.
      if(!this.pfx(f,'rune-circle',t-.9,392,170,{scale:2,scaleY:1.15,alpha:(.5+.5*beat)*open*out})&&ready(this.runeSheet.img)){
        f.save();f.globalAlpha=.55*open*out;
        f.drawImage(this.runeSheet.img,Math.floor(t*8)%18*32,0,32,32,x-30,y-16,60,32);f.restore();
      }
      for(let i=0;i<20;i++){
        const phase=(t*.17+i*.073)%1,an=i*2.4;
        this.star(f,x+Math.cos(an)*(24+phase*24),y-phase*65+Math.sin(an)*9,0,i%3?COL.warm:COL.cyan,Math.sin(phase*Math.PI)*open*out*.8);
      }
      this.once('shrine-wakes',C.rune2,t,()=>this.burst(750,350,18,55,COL.warm,1.5,-10));
    }else{
      const progress=seg(t,5.4,9.5),alpha=seg(t,5.2,5.9)*(1-seg(t,9.3,10));
      this.weather(f,'fog',5,10,t,.55);
      // A remembered traveller follows the path, leaving footsteps that wake the ruins.
      for(let i=0;i<8;i++){
        const u=i/9,seen=seg(progress,u,u+.15)*(1-seg(progress,u+.35,u+.6));
        const x=lerp(440,820,u)/px,y=lerp(540,310,u)/px;
        f.save();f.globalAlpha=seen*alpha*.6;f.fillStyle='#a3e9de';f.fillRect(x+(i%2?3:-3),y,2,4);f.restore();
      }
      this.actor(g,'aeris',lerp(440,820,progress)/px,lerp(540,310,progress)/px,t-5,'walk',alpha*.5,true);
      for(let i=0;i<3;i++){
        const pulse=seg(t,6+i*.7,6.5+i*.7)*alpha,x=(560+i*150)/px,y=(330-i*42)/px;
        this.glow(f,x,y,20,COL.cyan,.35*pulse,.6);
        this.star(f,x,y,1,COL.cyan,.7*pulse);
      }
    }
  }

  private sceneCombat(g:Ctx,f:Ctx,t:number,px:number) {
    if(t<17.8||t>=22)return;
    const alpha=seg(t,17.8,18.4)*(1-seg(t,21.7,22));
    const mageX=550/px,y=510/px;
    let kaelX=690/px,clip:'idle'|'walk'|'attack'='idle',clock=t;
    if(t<C.antic){kaelX=lerp(610,690,seg(t,17.8,19.1))/px;clip='walk';}
    else if(t<C.dash){clip='attack';clock=0;}
    else if(t<C.slash){kaelX=lerp(690,920,easeInCubic(seg(t,C.dash,C.slash)))/px;clip='walk';}
    else if(t<C.back){kaelX=920/px;clip='attack';clock=t-C.slash;}
    else {kaelX=lerp(920,740,easeOutCubic(seg(t,C.back,20.5)))/px;}
    this.actor(g,'aeris',mageX,y,0,'idle',alpha);
    this.actor(g,'kael',kaelX,y,clock,clip,alpha);
    const slash=seg(t,C.slash,C.impact+.2);
    if(!this.pfx(f,'sword-slash',t-C.slash,kaelX,y,{alpha})&&slash>0&&slash<1){
      f.save();f.globalAlpha=alpha*(1-slash);f.strokeStyle='#fff0bd';f.lineWidth=3;
      f.beginPath();f.arc(kaelX+12,y-28,34,-1.8,-1.8+slash*3);f.stroke();f.restore();
    }
    this.once('mist-impact',C.impact,t,()=>{this.burst(995,455,28,150,COL.ice,.6,160);this.shake(t,3,7);});
    this.pfx(f,'crit-hit',t-C.impact,995/px,(455+44)/px,{alpha});
    const charge=seg(t,C.cast,C.bolt)*(1-seg(t,C.bolt,C.clash));
    this.glow(f,mageX+22,y-35,18,COL.cyan,.8*charge*alpha);
    if(t<C.bolt)this.pfx(f,'spell-charge',t-C.cast,mageX+6,y,{alpha});
    const bolt=seg(t,C.bolt,C.clash);
    // The missile weaves from her hand to the clash point, played faster to land on the clash.
    if(!this.pfx(f,'magic-missile',(t-C.bolt)*1.6,mageX+4,y,{scale:1.5,alpha})&&t>=C.bolt&&t<C.clash+.12){
      const x=lerp(mageX+22,1040/px,bolt),by=lerp(y-35,400/px,bolt);
      f.save();f.globalAlpha=alpha;f.strokeStyle='#88dfff';f.lineWidth=3;
      f.beginPath();f.moveTo(x-40,by+5);f.lineTo(x-24,by-4);f.lineTo(x-9,by+2);f.lineTo(x,by);f.stroke();f.restore();
      this.star(f,x,by,3,COL.ice,alpha);this.glow(f,x,by,17,COL.cyan,.6*alpha);
    }
    this.once('mist-clash',C.clash,t,()=>{this.burst(1040,400,35,190,COL.ice,.8,60);this.shake(t,4,6);});
    this.pfx(f,'parry',t-C.clash,1040/px,(400+56)/px,{alpha});
    // The unseen enemy retaliates. Kael guards while an Echo catches the returning frost.
    const wave=seg(t,21.12,21.65);
    if(t>=21.12){
      const x=lerp(1120,790,wave)/px;
      for(let i=0;i<6;i++){
        const sx=x+i*8,sy=y-30+Math.sin(i*2.4)*16;
        f.save();f.globalAlpha=alpha*(1-wave*.6);f.fillStyle=i%2?'#c2f0fa':'#74bdd9';
        f.beginPath();f.moveTo(sx-4,sy);f.lineTo(sx+3,sy-2);f.lineTo(sx+5,sy);f.lineTo(sx+1,sy+2);f.closePath();f.fill();f.restore();
      }
      this.actor(g,'aeris',650/px,y,0,'idle',alpha*.4,true);
      f.save();f.globalAlpha=alpha*wave;f.strokeStyle='#b7e9f5';f.lineWidth=2;
      f.beginPath();f.arc(kaelX+18,y-30,26,-1.05,1.05);f.stroke();f.restore();
      for(let i=0;i<5;i++)this.star(f,kaelX+44+i*3,y-30+Math.sin(i*3)*13,0,COL.ice,alpha*wave*.8);
    }
  }

  private sceneBoss(g: Ctx, f: Ctx, t: number, _ta: number, px: number) {
    if(t<INTRO.s4||t>=INTRO.s6)return;
    const enter=seg(t,15,16.4),out=1-seg(t,21.4,22);
    // No boss art, anatomy or name: the forest itself reacts to an unseen presence.
    const veil=g.createLinearGradient(250/px,0,W/px,0);
    veil.addColorStop(0,'rgba(2,8,15,0)');veil.addColorStop(.5,'rgba(2,8,15,.6)');veil.addColorStop(1,'rgba(1,5,12,.97)');
    g.save();g.globalAlpha=enter;g.fillStyle=veil;g.fillRect(0,0,W/px,H/px);g.restore();
    // Frost spreads in irregular pixel clusters, rather than long geometric wire lines.
    for(let i=0;i<35;i++){
      const u=seg(t,16+(i%7)*.28,18.5+(i%7)*.25),x=(880+(i*43)%350)/px,y=(440+(i*31)%130)/px;
      f.save();f.globalAlpha=.23*u*out;f.fillStyle=i%3?'#83b8c6':'#c9e8eb';
      f.fillRect(Math.round(x),Math.round(y),2+i%3,1);f.fillRect(Math.round(x)+1,Math.round(y)-1,1,3);f.restore();
    }
    this.weather(f,'snow',15,22,t,.8);
    BOSS_STEPS.forEach((at,i)=>this.pfx(f,'heavy-landing',t-at,(1180-i*40)/px,(500+i*12)/px,{scale:1.4,alpha:out}));
    this.pfx(f,'frost-nova',t-BOSS_STEPS[1],1050/px,480/px,{scale:1.1,alpha:.8*out});
    this.weather(f,'blizzard',C.roar-.1,C.roar+2.9,t,.75);
    const pulse=Math.max(0,1-Math.abs(t-C.roar)/.55);
    this.glow(f,1060/px,400/px,110,COL.ice,.15*pulse*out,.6);
    for(let i=0;i<28;i++){
      const x=((i*83+t*(18+i%4*5))%W)/px,y=(110+(i*67+t*13)%480)/px;
      this.star(f,x,y,0,COL.ice,.3*enter*out);
    }
    BOSS_STEPS.forEach((at,i)=>this.once(`unseen-step-${i}`,at,t,()=>this.shake(t,2,6)));
    this.once('unseen-roar',C.roar,t,()=>this.shake(t,3,5));
  }

  /** The motes gather into a burst of light, a rune circle turns behind the title and stars fall overhead. */
  private sceneTitle(f: Ctx, t: number, px: number) {
    if (t < INTRO.s6) return;
    this.weather(f, 'shooting-stars', INTRO.s6, INTRO.s7 + .6, t, .9, 180);
    const ring = seg(t, C.logo, C.logo + .8) * (1 - seg(t, INTRO.s7, INTRO.s7 + .5));
    if (ring > 0) this.pfx(f, 'rune-circle', t - C.logo, 640 / px, 560 / px, { scale: 2.5, alpha: .45 * ring });
    this.pfx(f, 'collect-burst', t - C.logo, 640 / px, (345 + 80) / px, { scale: 2 });
  }

  // ---------- particles (fx layer) ----------
  private particles(f: Ctx, t: number, dt: number, px: number) {
    const rate = t < 1 ? 4 : t < 10 ? 13 : t < 15 ? 8 : t < 19 ? 9 : t < 21 ? 5 : t < 22.6 ? 0 : t < INTRO.s7 ? 5 : 0;
    this.spawnAcc += dt * rate * (this.reduced ? 0.4 : 1);
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const boss = t >= INTRO.s4 && t < INTRO.s6;
      this.spawn({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.62), vx: (Math.random() - 0.5) * 10, vy: -6 - Math.random() * 12, max: 4 + Math.random() * 4, size: Math.random() < 0.15 ? 2 : 1, rgb: boss ? (Math.random() < 0.6 ? COL.cyan : COL.ice) : t >= INTRO.s6 ? COL.warm : (Math.random() < 0.75 ? COL.mote : COL.warm), mode: 0 });
    }
    // Before the Guardian appears, the motes turn and drift toward the dark where it waits.
    const pull = seg(t, C.dim + 0.2, C.silhouette + 0.4) * (1 - seg(t, C.roar, C.roar + 0.05)), [px0, py0] = [1080, 420];
    const gather = t >= C.gather, gx = 640, gy = 345;
    f.save();
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.age += dt;
      if (p.age >= p.max) { this.parts.splice(i, 1); continue; }
      if (p.mode === 0) {
        p.vx += Math.sin(t * 0.9 + p.seed) * 16 * dt; p.vy += (Math.cos(t * 0.7 + p.seed * 1.3) * 10 - 3) * dt;
        if (pull > 0) { const dx = px0 - p.x, dy = py0 - p.y, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 70 * pull * dt; p.vy += dy / d * 50 * pull * dt; }
        p.vx *= 1 - 0.5 * dt; p.vy *= 1 - 0.5 * dt;
      } else if (p.mode === 1) { p.vy += p.g * dt; p.vx *= 1 - 1.6 * dt; }
      else {
        p.vx *= 1 - 2.2 * dt; p.vy *= 1 - 2.2 * dt;
        if (gather) {
          const dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy);
          if (d < 10) { this.parts.splice(i, 1); continue; }
          p.vx += dx / d * 900 * dt; p.vy += dy / d * 900 * dt; p.max = Math.max(p.max, p.age + 0.5);
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const fl = p.age / p.max, a = Math.sin(Math.PI * Math.min(1, fl)) * (p.mode === 0 ? 0.75 : 1);
      f.globalAlpha = clamp01(a); f.fillStyle = rgba(p.rgb, 1);
      f.fillRect(Math.round(p.x / px), Math.round(p.y / px), p.size, p.size);
    }
    f.restore();
  }

  // ---------- frame ----------
  /** `k` = backing pixels per logical pixel; `fadeOut` 0..1 = extra fade to black (skip). */
  draw(ctx: Ctx, t: number, k = 1, fadeOut = 0) {
    const dt = Math.min(0.1, Math.max(0, t - this.lastT)); this.lastT = t;

    const L = TEXT[this.lang], px = pxAt(t), ta = this.animT(t);
    const g = this.scene.begin(px, '#020605'), f = this.fx.begin(px, null);

    // --- scene layer: backdrop, grade, mist, foliage, characters ---
    this.drawBackdrop(g, t, dt, px);
    const dark=t<INTRO.s4?.12:t<INTRO.s6?.24:.34;
    g.fillStyle=`rgba(3,9,8,${dark})`;g.fillRect(0,0,this.scene.w,this.scene.h);
    this.drawMist(g, t, px, t < INTRO.s2 ? 1.6 : t < INTRO.s3 ? 1.1 : t < INTRO.s6 ? 0.8 : 0.5);
    // Dedicated painted woodland: no gameplay gates, oversized plants or UI in the film.
    this.sceneWoodland(g, f, t, px);
    this.sceneHeroes(g, f, t, ta, px);
    this.sceneBoss(g, f, t, ta, px);
    this.sceneCombat(g, f, t, px);
    this.sceneTitle(f, t, px);

    g.save(); g.imageSmoothingEnabled = true; g.drawImage(this.vignette, 0, 0, this.scene.w, this.scene.h); g.restore();
    this.particles(f, t, dt, px);

    // --- composite with camera (push-in on the Guardian) and shake ---
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const [sx, sy] = this.shakeOffset(t);
    const focus = easeInOutCubic(seg(t, C.step, C.roar + 0.3)) * (1 - easeInOutCubic(seg(t, C.roar + 0.9, INTRO.s5 + 0.3)));
    const z = this.reduced ? 1 : 1 + 0.035 * focus, fx = lerp(640, 990, focus), fy = lerp(360, 420, focus);
    ctx.save(); ctx.translate(fx + sx, fy + sy); ctx.scale(z, z); ctx.translate(-fx, -fy);
    ctx.drawImage(this.scene.c, 0, 0, this.scene.w * px, this.scene.h * px);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha=.65; ctx.drawImage(this.fx.c, 0, 0, this.fx.w * px, this.fx.h * px);
    ctx.restore();

    // --- screen-space light: flashes, scene dips, whiteout into the title ---
    const fl = this.flash.a * Math.exp(-(t - this.flash.at) * 6);
    if (fl > 0.01 && t >= this.flash.at) { ctx.fillStyle = rgba(this.flash.rgb, Math.min(.12, fl)); ctx.fillRect(0, 0, W, H); }
    const dip = Math.max(1 - seg(t, 0.1, 1.0), Math.max(0, 1 - Math.abs(t - INTRO.s3) / 0.32), Math.max(0, 1 - Math.abs(t - INTRO.s4) / 0.3) * 0.85);
    if (dip > 0) { ctx.fillStyle = `rgba(0,0,0,${dip})`; ctx.fillRect(0, 0, W, H); }
    const white = this.reduced ? 0 : .12 * seg(t, C.clash, C.clash + 0.1) * (1 - seg(t, C.clash + .1, C.clash + .45));
    if (white > 0) { ctx.fillStyle = `rgba(240,252,255,${white})`; ctx.fillRect(0, 0, W, H); }

    // --- pixelfx transitions (INTRO_PLAN.md): dissolve into the path, shatter into the frozen wood, close on a star ---
    this.wipe(ctx, 'pixel-dissolve', INTRO.s2 - .83 / 1.6, t, 1.6, Infinity, 'saturate(0) brightness(.75)');   // its pink outlines, made grey
    this.wipe(ctx, 'shatter-wipe', INTRO.s4 - 1.03 / 1.4, t, 1.4);
    this.wipe(ctx, 'star-iris', INTRO.s7 + .55 - .8, t, 1, .8);

    // --- typography ---
    this.nameCard(ctx, L.aeris, L.aerisSub, 640, 370, 10.3, 12.5, t, '#8fe3f2');
    this.nameCard(ctx, L.kael, L.kaelSub, 640, 370, 12.5, 14.7, t, '#f0cf8c');
    this.drawLogo(ctx, t, L);

    // --- end: fade to black (the component then reveals the menu) ---
    const black = Math.max(fadeOut, easeInOutCubic(seg(t, INTRO.s7, INTRO.s7 + 0.55)));
    // Letterbox stays constant for the whole film; subtitles sit inside the lower bar.
    const bar = 78 * easeOutCubic(seg(t, 0.15, 1.2));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    for (const v of INTRO_VOICE) if (t >= v.at - 0.05 && t <= v.until) this.caption(ctx, v[this.lang], t, v.at, v.until, v.role !== 'narrator');
    if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, W, H); }
  }

  private drawLogo(ctx: Ctx, t: number, L: (typeof TEXT)[Lang]) {
    if (t < C.logo) return;
    const reveal = easeInOutCubic(seg(t, C.logo, C.logo + 1.6));
    const tc = this.logoTmp.getContext('2d')!, lw = this.logoTmp.width, lh = this.logoTmp.height, lc = lw / 2;
    tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, lw, lh); tc.drawImage(this.logo, 0, 0);
    // Wipe from the centre outward with a soft edge, like light spreading from the rune circle.
    tc.globalCompositeOperation = 'destination-in';
    const half = (lc + 20) * reveal + 1, g = tc.createLinearGradient(lc - half, 0, lc + half, 0), edge = Math.min(0.5, 70 / (half * 2));
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(edge, 'rgba(0,0,0,1)'); g.addColorStop(1 - edge, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    tc.fillStyle = g; tc.fillRect(0, 0, lw, lh);
    // One light sweep across the letters.
    const sw = seg(t, C.logo + 1.5, C.logo + 2.8);
    if (sw > 0 && sw < 1) {
      tc.globalCompositeOperation = 'source-atop';
      const x = lerp(-200, lw + 200, easeInOutCubic(sw)), sg = tc.createLinearGradient(x - 80, 0, x + 80, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,248,220,.8)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      tc.fillStyle = sg; tc.fillRect(0, 0, lw, lh);
    }
    const sc = lerp(1.05, 1, easeOutCubic(seg(t, C.logo, C.logo + 2.2)));
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.translate(W / 2, 345); ctx.scale(sc, sc); ctx.drawImage(this.logoTmp, -lc, -lh / 2); ctx.restore();
    this.text(ctx, L.tag, W / 2, 552, { size: 22, font: 'ui-monospace, Consolas, monospace', spacing: 10, alpha: easeOutCubic(seg(t, C.logo + 1.6, C.logo + 2.6)), color: '#c6d1b8' });
    this.text(ctx, '◇　✦　◈　✺　◆', W / 2, 594, { size: 18, spacing: 12, alpha: 0.5 * easeOutCubic(seg(t, C.logo + 2.2, C.logo + 3.2)), color: '#9eb28b' });
  }
}
