"""
Combo attack frames for Kael and Aeris, cut from the supplied sprite sheets.

Input  tools/assets/source/kael-combo-sheet.jpg, aeris-combo-sheet.jpg
       (1200x896 JPEGs, 6 columns x 4 rows of poses on a baked-in checkerboard)
Output public/assets/combat/kael-combo.png, aeris-combo.png   one strip of frames per hero
       src/game/data/comboSprites.json                         frame size, anchor, animations

What it does, and why:
- The checkerboard is painted into the JPEG, and the sheets are pasted together (its phase
  shifts inside cells), so the background is found by colour (the two tile colours or a JPEG
  blend of them) and connectivity (combo_sheet.foreground), not by position.
- The poses are not on an even grid; each row's frames are split at the emptiest columns
  (combo_sheet.frames_by_cuts) so touching sword trails and magic circles are not cut through
  a body.
- Every frame is lined up on the same point: the centre of the head (Kael's hair, Aeris's hood)
  across, the row's ground line down (GROUND), so playing them back never jitters. The frame
  box is the union of all frames around that point, so no trail or spell is clipped.
- Frames are scaled to the size the heroes walk at in the game (their walk sprites: Kael's
  body 54 px tall, Aeris's 58) with area averaging, then given hard alpha.

Run: python -I -X utf8 tools/assets/prepare_combo_sprites.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from combo_sheet import tile_colours, foreground, frames_by_cuts, measure  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools/assets/source'
OUT = ROOT / 'public/assets/combat'
DATA = ROOT / 'src/game/data/comboSprites.json'

# Per hero: checker tile size, row bands (sheet px), each row's ground line (feet; Aeris's last
# row stands in magic circles that reach lower), body height in game px (as the walk sprite).
HEROES = {
    'kael': dict(period=30, rows=[0, 247, 452, 655, 896], ground=[241, 447, 650, 860], height=54),
    'aeris': dict(period=15, rows=[0, 235, 442, 663, 896], ground=[218, 427, 652, 875], height=58),
}
# Which sheet cells (row, col) make each animation, in play order (checked against the sheets).
ANIMS = {
    'kael': {
        'idle': [(0, 0)],
        'quickSlash': [(0, 1), (0, 2), (0, 3)],                    # draw, horizontal cut, follow-through arc
        'reverseSlash': [(1, 1), (1, 2), (1, 3)],                  # step, raise, diagonal cut back
        'spinSlash': [(2, 1), (2, 2), (2, 3), (2, 4)],             # wind-up, half turn, full ring, land in dust
        'heavyFinisher': [(3, 0), (3, 1), (3, 2), (3, 3), (3, 4), (3, 5)],   # ready, dash, raise, impact, follow, recover
    },
    'aeris': {
        'idle': [(0, 0)],
        'arcaneBolt': [(0, 2), (0, 3), (0, 4), (0, 5)],            # spark, orb grows, draw back, release
        'arcaneBurst': [(1, 2), (1, 3), (1, 4), (1, 5)],           # rune ring, ring charges, fan of rays, sparks
        'magicOrbit': [(2, 0), (2, 1), (2, 2), (2, 3)],            # staff up, orbs appear, orbit, send them
        'arcaneNova': [(3, 0), (3, 1), (3, 2), (3, 4), (3, 5)],    # staff high, circle, sphere, burst, settle
    },
}


def cut_frames(name: str):
    cfg = HEROES[name]
    a = np.asarray(Image.open(SRC / f'{name}-combo-sheet.jpg').convert('RGB')).astype(np.float32)
    c0, c1 = tile_colours(a)
    fg = foreground(a, c0, c1, cfg['period'])
    sat = a.max(2) - a.min(2)
    lum = a @ np.array([0.3, 0.59, 0.11])
    fg &= ~((sat < 6) & (lum > 15) & (lum < 75))          # neutral tile grey left under translucent glows
    boxes = frames_by_cuts(fg, cfg['rows'])
    frames = []
    for anim in ANIMS[name].values():
        for rc in anim:
            if rc in [f['rc'] for f in frames]:
                continue
            box = boxes[rc]
            hx, _, _ = measure(name, a, fg, box)
            x0, y0, x1, y1 = box
            m = fg[y0:y1, x0:x1]
            ys, xs = np.nonzero(m)
            frames.append(dict(rc=rc, box=box, ax=hx, ay=cfg['ground'][rc[0]],
                               bbox=(x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)))
    # Common frame around the anchor.
    left = max(f['ax'] - f['bbox'][0] for f in frames)
    right = max(f['bbox'][2] - f['ax'] for f in frames)
    up = max(f['ay'] - f['bbox'][1] for f in frames)
    down = max(0, max(f['bbox'][3] - f['ay'] for f in frames))
    return a, fg, frames, (left, right, up, down)


def build(name: str):
    a, fg, frames, (left, right, up, down) = cut_frames(name)
    cfg = HEROES[name]
    stature = np.median([f['ay'] - measure(name, a, fg, f['box'])[1] for f in frames if f['rc'][1] in (0, 5)])
    scale = cfg['height'] / stature
    sw, sh = int(np.ceil((left + right) * scale)) + 2, int(np.ceil((up + down) * scale)) + 2
    strip = Image.new('RGBA', (sw * len(frames), sh), (0, 0, 0, 0))
    rgba = np.dstack([a, fg * 255]).astype(np.uint8)
    for i, f in enumerate(frames):
        # Crop the sheet so the anchor lands on the same pixel of every frame, then scale.
        x0 = int(round(f['ax'] - left)); y0 = int(round(f['ay'] - up))
        w, h = int(round(left + right)), int(round(up + down))
        src = np.zeros((h, w, 4), np.uint8)
        f_box = f['box']
        mask = np.zeros(fg.shape, bool); mask[f_box[1]:f_box[3], f_box[0]:f_box[2]] = True
        sx0, sy0 = max(0, x0), max(0, y0)
        sx1, sy1 = min(a.shape[1], x0 + w), min(a.shape[0], y0 + h)
        piece = rgba[sy0:sy1, sx0:sx1].copy()
        piece[..., 3] = np.where(mask[sy0:sy1, sx0:sx1], piece[..., 3], 0)   # only this frame's pixels
        src[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = piece
        # Area-average with premultiplied alpha, then hard alpha (pixel art: no soft edges).
        pre = src.astype(np.float32); pre[..., :3] *= pre[..., 3:] / 255
        tw, th = int(round(w * scale)), int(round(h * scale))
        small = np.stack([np.asarray(Image.fromarray(pre[..., k]).resize((tw, th), Image.BOX)) for k in range(4)], -1)
        alpha = small[..., 3:]
        rgb = np.where(alpha > 0, small[..., :3] * 255 / np.maximum(alpha, 1e-3), 0)
        out = np.dstack([np.clip(rgb, 0, 255), (alpha[..., 0] >= 110) * 255]).astype(np.uint8)
        strip.paste(Image.fromarray(out, 'RGBA'), (i * sw + 1, 1))
    OUT.mkdir(parents=True, exist_ok=True)
    strip.save(OUT / f'{name}-combo.png', optimize=True)
    index = {f['rc']: i for i, f in enumerate(frames)}
    return {
        'file': f'{name}-combo.png', 'frameW': sw, 'frameH': sh,
        # Where the hero's position goes in a frame: head centre across, ground line down.
        'anchorX': round(left * scale + 1, 1), 'anchorY': round(up * scale + 1, 1),
        'scale': round(scale, 4),
        'anims': {k: [index[rc] for rc in v] for k, v in ANIMS[name].items()},
    }


def main() -> None:
    data = {name: build(name) for name in HEROES}
    DATA.write_text(json.dumps(data, indent=1) + '\n', encoding='utf-8')
    for k, v in data.items():
        print(k, v['frameW'], 'x', v['frameH'], 'anchor', v['anchorX'], v['anchorY'], 'scale', v['scale'], 'frames', sum(len(x) for x in v['anims'].values()))


if __name__ == '__main__':
    main()
