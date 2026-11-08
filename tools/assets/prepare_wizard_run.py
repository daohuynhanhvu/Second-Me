"""
Wizard run cycle for the loading screen, from tools/assets/source/wizard-run-sheet.png
(2 rows x 4 cells, numbered 01-08, light grey paper with guide lines behind the art).

    python -I -X utf8 tools/assets/prepare_wizard_run.py

Steps:
  1. Cut the 8 cells inside the sheet's border lines, in reading order 01..08.
  2. Drop the paper and guide lines (neutral greys) and the painted dust puffs (warm beige;
     the game spawns its own dust on footfalls), keeping the dark outline, hat, cloak, staff
     and the gem's green sparks.
  3. Align frames on the eyes horizontally (the head is the steadiest point of a run);
     keep each cell's ground line so the natural bob of the cycle survives.
  4. Re-pixelate: the source is painted pixel-art at an uneven ~4 px block. Each frame is
     reduced 4x with coverage-based alpha, then all frames share one 32-colour palette so
     colours don't shimmer between frames. The game scales it up with nearest-neighbour.
Writes public/assets/loading/wizard-run.png (8 frames in a row) and the layout to
src/game/data/wizardRun.json. Needs only numpy + Pillow.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools' / 'assets' / 'source' / 'wizard-run-sheet.png'
OUT = ROOT / 'public' / 'assets' / 'loading' / 'wizard-run.png'
META = ROOT / 'src' / 'game' / 'data' / 'wizardRun.json'

# Cell interiors (x0, x1) / (y0, y1), just inside the 3-4 px border lines; 2 px margin trims their anti-aliasing.
XS = [(27, 344), (348, 686), (690, 1028), (1032, 1349)]
YS = [(77, 358), (426, 703)]
MARGIN = 2
BLOCK = 4          # source pixels per sprite pixel
COLOURS = 32


def cut_frames(sheet: np.ndarray) -> list[np.ndarray]:
    return [sheet[y0 + MARGIN:y1 - MARGIN, x0 + MARGIN:x1 - MARGIN] for (y0, y1) in YS for (x0, x1) in XS]


def lift(cell: np.ndarray) -> np.ndarray:
    """RGB cell -> boolean mask of the wizard (paper, guide lines and dust removed)."""
    c = cell.astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    hi, lo, mean = c.max(2), c.min(2), c.mean(2)
    paper = (hi - lo < 14) & (mean > 140)                               # paper, guide lines, their AA
    dust = (hi - lo < 45) & (mean > 105) & (r >= g) & (g >= b) & (r - b > 8) & ~((r > 150) & (g < 120))
    return ~paper & ~dust


def eyes_x(cell: np.ndarray) -> float:
    c = cell.astype(int)
    yellow = (c[..., 0] > 190) & (c[..., 1] > 160) & (c[..., 2] < 110)
    return float(np.nonzero(yellow)[1].mean())


def main() -> None:
    sheet = np.asarray(Image.open(SRC).convert('RGB'))
    cells = cut_frames(sheet)
    masks = [lift(c) for c in cells]
    eyes = [eyes_x(c) for c in cells]
    target = float(np.median(eyes))
    shifts = [int(round((target - e) / BLOCK)) * BLOCK for e in eyes]   # whole sprite pixels only

    h = max(c.shape[0] for c in cells); w = max(c.shape[1] for c in cells)
    pad = max(abs(s) for s in shifts) + BLOCK
    W, H = w + 2 * pad, h
    W += (-W) % BLOCK; H += (-H) % BLOCK
    small = []
    for cell, mask, s in zip(cells, masks, shifts):
        canvas = np.zeros((H, W, 4), np.float32)
        ch, cw = cell.shape[:2]
        canvas[:ch, pad + s:pad + s + cw, :3] = cell * mask[..., None]
        canvas[:ch, pad + s:pad + s + cw, 3] = mask
        blocks = canvas.reshape(H // BLOCK, BLOCK, W // BLOCK, BLOCK, 4).sum((1, 3))
        cover = blocks[..., 3] / (BLOCK * BLOCK)
        rgb = blocks[..., :3] / np.maximum(blocks[..., 3:4], 1e-6)
        small.append((rgb, cover >= 0.45))

    # One shared palette for all frames (opaque pixels only).
    opaque = np.concatenate([rgb[a] for rgb, a in small]).astype(np.uint8)
    base = Image.fromarray(opaque.reshape(1, -1, 3)).quantize(COLOURS, method=Image.Quantize.MEDIANCUT)
    # Tiny accents (yellow eyes, the gem's greens) lose a median cut to the big cloak areas:
    # add them to the palette explicitly from the full-resolution art.
    src = np.concatenate([c[m] for c, m in zip(cells, masks)]).astype(int)
    eye = src[(src[:, 0] > 190) & (src[:, 1] > 160) & (src[:, 2] < 110)]
    gem = src[(src[:, 1] > src[:, 0] + 60) & (src[:, 1] > 150)]
    gem_dark = src[(src[:, 1] > src[:, 0] + 40) & (src[:, 1] <= 150) & (src[:, 1] > 90)]
    accents = [np.median(x, 0) for x in (eye, gem, gem_dark) if len(x)]
    accents.append(np.percentile(eye, 90, 0)) if len(eye) else None
    pal = list(base.getpalette()[:COLOURS * 3])
    for a in accents:
        pal += [int(v) for v in a]
    pal_img = Image.new('P', (1, 1)); pal_img.putpalette(pal + [0] * (768 - len(pal)))
    frames = []
    for rgb, a in small:
        q = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).quantize(palette=pal_img, dither=Image.Dither.NONE).convert('RGB')
        q = np.asarray(q)
        # Drop lone pixels left by stray dust/paper, but keep the gem's green sparks.
        n = sum(np.roll(np.roll(a, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1)) - a
        green = (q[..., 1].astype(int) > q[..., 0].astype(int) + 40)
        a = a & ((n > 0) | green)
        frames.append(np.dstack([q, a.astype(np.uint8) * 255]))

    # Frame 01 is painted with a navy-violet cloak while 02-08 are teal, which would flash
    # once per loop. Recolour its cloak (below the hat brim) to the teal of the other frames,
    # matching by brightness. The hat is navy-violet in every frame and is left alone.
    eye_rows = [int(round(np.nonzero((c[..., 0].astype(int) > 190) & (c[..., 1].astype(int) > 160) & (c[..., 2].astype(int) < 110))[0].mean() / BLOCK)) for c in cells]
    def violet(px):  # navy-violet: blue well above green, green close to red
        r, g, b = (px[..., k].astype(int) for k in range(3))
        return (b > g + 15) & (np.abs(g - r) < 14)
    def teal(px):    # the cloak's blue-green (e.g. 43,69,78), not the gem's bright greens
        r, g, b = (px[..., k].astype(int) for k in range(3))
        return (g > r + 12) & (b >= g - 6) & (g < 130)
    ref = np.concatenate([f[eye_rows[i] - 1:, :, :3][teal(f[eye_rows[i] - 1:, :, :3]) & (f[eye_rows[i] - 1:, :, 3] > 0)] for i, f in enumerate(frames[1:], 1)]).astype(int)
    ref = np.unique(ref, axis=0)
    ref_l = ref.mean(1)
    f0 = frames[0]
    lower = np.zeros(f0.shape[:2], bool); lower[eye_rows[0] - 1:] = True
    sel = lower & violet(f0[..., :3]) & (f0[..., 3] > 0)
    l0 = f0[..., :3][sel].astype(int).mean(1)
    # Keep frame 01's own light and shade: pick the teal of the same brightness.
    target_l = l0
    f0[..., :3][sel] = ref[np.abs(ref_l[None, :] - target_l[:, None]).argmin(1)]

    # Common crop around everything, so every frame keeps the same size and ground line.
    union = np.any([f[..., 3] > 0 for f in frames], axis=0)
    ys, xs = np.nonzero(union)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    fw, fh = x1 - x0, y1 - y0
    strip = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(Image.fromarray(f[y0:y1, x0:x1], 'RGBA'), (i * fw, 0))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    strip.save(OUT, optimize=True)

    # Feet: lowest opaque row per frame (a frame whose feet sit above the ground is airborne).
    ground = int(max(np.nonzero(f[y0:y1, x0:x1, 3].any(1))[0].max() for f in frames)) + 1
    feet = [int(np.nonzero(f[y0:y1, x0:x1, 3].any(1))[0].max()) + 1 for f in frames]
    meta = dict(file='wizard-run.png', frames=len(frames), w=int(fw), h=int(fh), ground=ground,
                feet=feet, eyeX=round((target + pad) / BLOCK - x0, 1))
    META.write_text(json.dumps(meta, indent=1) + '\n', encoding='utf-8')
    print('wrote', OUT.relative_to(ROOT), meta)


if __name__ == '__main__':
    main()
