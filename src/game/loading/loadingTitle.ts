/**
 * The loading screen's title. In English it is the painted lettering cut from the mockup
 * (public/assets/loading/title.png: "THE ANCIENT PATH REMEMBERS / THE TRAILS ARE APPEARING...").
 * In Vietnamese it is drawn here with canvas in the same manner (a cream line over two lines of
 * gold lettering, darkly outlined, with a drop shadow), on a canvas of the sprite's size so it
 * takes the same place (layout.title) everywhere the sprite would.
 *
 * The lettering is the menu's serif ('Second Me Serif', with its Vietnamese subset, mainMenu.css);
 * until that has loaded nothing is returned, and the scene shows the title once it is ready.
 */
import { layout } from './placement.ts';

export type TitleLanguage = 'en' | 'vi';

const VI = { sub: 'HOÀI NIỆM LỐI CỔ', lines: ['NHỮNG LỐI ĐI', 'BẮT ĐẦU LỘ DIỆN'] };
const FAMILY = '"Second Me Serif", Georgia, "Times New Roman", serif';

let vi: HTMLCanvasElement | null = null;
let asked = false;

/** The Vietnamese title (null until its font has loaded and it is drawn). */
export function vietnameseTitle(): HTMLCanvasElement | null {
  if (vi || typeof document === 'undefined') return vi;
  if (!asked) {
    asked = true;
    const draw = () => { vi = drawTitle(); };
    const fonts = document.fonts;
    if (fonts?.load) Promise.all([fonts.load(`700 80px ${FAMILY}`, VI.lines.join(' ')), fonts.load(`600 30px ${FAMILY}`, VI.sub)]).then(draw, draw);
    else draw();
  }
  return null;
}

function drawTitle() {
  const { w, h } = layout.title;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  x.lineJoin = 'round';

  // The cream line on top, small and spaced out.
  x.font = `600 30px ${FAMILY}`;
  x.letterSpacing = '3px';
  const subW = x.measureText(VI.sub).width, subK = Math.min(1, (w - 120) / subW);
  x.save();
  x.translate(w / 2, 38);
  x.scale(subK, subK);
  x.lineWidth = 7; x.strokeStyle = '#0b1610'; x.strokeText(VI.sub, 0, 0);
  x.fillStyle = '#f4e6bf'; x.fillText(VI.sub, 0, 0);
  x.restore();

  // The two lines of gold lettering, sized to the box (the widest line sets the size).
  x.letterSpacing = '1px';
  let size = 84;
  x.font = `700 ${size}px ${FAMILY}`;
  const widest = Math.max(...VI.lines.map(l => x.measureText(l).width));
  size = Math.floor(size * Math.min(1, (w - 40) / widest));
  x.font = `700 ${size}px ${FAMILY}`;
  const base = [h * 0.6, h * 0.95];
  VI.lines.forEach((line, i) => {
    const y = base[i] - 8;
    // Drop shadow, deep outline, warm inner outline, then the gold fill (light at the top).
    x.lineWidth = 16; x.strokeStyle = '#120804'; x.strokeText(line, w / 2 + 2, y + 7);
    x.lineWidth = 14; x.strokeStyle = '#2b1406'; x.strokeText(line, w / 2, y);
    x.lineWidth = 6; x.strokeStyle = '#7a3a12'; x.strokeText(line, w / 2, y);
    const g = x.createLinearGradient(0, y - size * 0.75, 0, y + size * 0.05);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(0.45, '#ffcd4f'); g.addColorStop(1, '#e7862a');
    x.fillStyle = g; x.fillText(line, w / 2, y);
  });
  return c;
}
