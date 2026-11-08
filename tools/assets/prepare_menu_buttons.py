"""
Raised stone slabs for the main menu's items, in the colours of the menu painting's stone frame.

Input  public/assets/menu/second-me-forest-clean.png   (only for the preview)
Output public/assets/menu/stone-button.png             5 slab shapes (columns) x 3 layers (rows: base,
                                                        face, hover face), SLAB_W x SLAB_H each
       <preview_dir>/stone-button-preview.png          the slabs over the menu, 2x (optional)

Each slab is a hand-cut stone plate standing out of the panel: a chipped, slightly irregular
face lit from the top left, its thickness showing below it, an ink outline and a soft drop
shadow, a couple of cracks and moss. Every colour comes from the frame's own stone (median-cut
from the painting: PALETTE / MOSS below), mapped by brightness onto flat bands with no dithering,
like the frame's own cel-shaded stones, so the slabs are pixel art at 1 painting px per sprite px.
The face is a lit block of the frame's top band, outlined 2 px in the frame's ink. Hover lifts the face 3 px, lights it a
step and rims it in the painting's gold (the face is its own layer so the game can slide it);
a locked item is darkened by the game's CSS.

Run: python -I -X utf8 tools/assets/prepare_menu_buttons.py [preview_dir]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/menu/second-me-forest-clean.png'
OUT = ROOT / 'public/assets/menu/stone-button.png'

# The frame's stone, dark to light, measured on its blocks: shadowed edge #112020, pillar face
# #1f3226, lit block of the top band #374838, plus one step of highlight for the lit bevel. MOSS is
# the frame's moss (#1f371d) and two lighter steps; INK its outline colour.
PALETTE = np.array([[17, 32, 30], [24, 40, 34], [31, 50, 38], [40, 59, 45], [49, 67, 51], [57, 74, 58], [72, 90, 70]], np.float32)
MOSS = np.array([[31, 55, 29], [40, 68, 36], [52, 82, 44]], np.float32)
INK = np.array([8, 16, 13], np.float32)
GOLD = np.array([229, 211, 141], np.float32)

SLAB_W, SLAB_H = 304, 78          # sprite cell
FACE_W, FACE_H = 292, 54          # the slab's face
FACE_X, FACE_Y = 4, 7             # face position in the cell (normal state)
DEPTH = 9                         # thickness showing under the face
LIFT = 3                          # hover raises the face this much
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16 - 0.5


def smooth_noise(shape, scale, rng):
    """Value noise: a coarse random grid, bilinearly enlarged."""
    h, w = shape
    gh, gw = h // scale + 2, w // scale + 2
    g = rng.random((gh, gw)).astype(np.float32)
    return np.asarray(Image.fromarray(g).resize((gw * scale, gh * scale), Image.BILINEAR))[:h, :w]


def face_mask(rng):
    """A chipped, irregular rounded plate in a FACE_W x FACE_H box: each slab a little narrower or
    wider and tilted a little, like stones set by hand."""
    w, h = FACE_W, FACE_H
    yy, xx = np.mgrid[0:h, 0:w]
    edge = lambda n: np.clip(np.round(smooth_noise((1, n), 9, rng)[0] * 3.2 - 0.8), 0, 3).astype(int)   # noqa: E731
    top, bot, left, right = edge(w), edge(w), edge(h), edge(h)
    tilt = rng.uniform(-0.016, 0.016)                              # rows step up or down across the slab
    lean = np.round(tilt * (np.arange(w) - w / 2)).astype(int)
    top = top + 2 + lean; bot = bot + 2 - lean                     # 2 px headroom for the tilt
    trim = int(rng.integers(0, 9))                                 # some slabs a little shorter
    left = left + trim // 2; right = right + trim - trim // 2
    # A few chips knocked out of the edges.
    for arr, n in ((top, w), (bot, w), (left, h), (right, h)):
        for _ in range(rng.integers(1, 3)):
            at, span = rng.integers(8, n - 12), rng.integers(4, 9)
            arr[at:at + span] = np.maximum(arr[at:at + span], [1, 2, 3, 3, 3, 3, 2, 1, 1][:span][:len(arr[at:at + span])])
    m = (yy >= top[xx]) & (yy < h - bot[xx]) & (xx >= left[yy]) & (xx < w - right[yy])
    r = int(rng.integers(5, 9))                                   # worn corners, each a little different
    for cy, cx in ((r, r), (r, w - 1 - r), (h - 1 - r, r), (h - 1 - r, w - 1 - r)):
        corner = ((yy < r) | (yy > h - 1 - r)) & ((xx < r) | (xx > w - 1 - r))
        near = (np.abs(yy - cy) <= r) & (np.abs(xx - cx) <= r) & corner
        m &= ~(near & ((yy - cy) ** 2 + (xx - cx) ** 2 > (r + rng.random() * 0.8) ** 2))
    return m


def shift(m, dy, dx):
    out = np.zeros_like(m)
    h, w = m.shape
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = m[max(-dy, 0):h - max(dy, 0), max(-dx, 0):w - max(dx, 0)]
    return out


def to_palette(v, pal, dither=0.0):
    """Brightness 0..1 → palette rows: flat bands like the frame's cel shading (dither > 0 mixes
    neighbouring rows with an ordered pattern instead)."""
    h, w = v.shape
    d = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    idx = np.clip(np.round(v * (len(pal) - 1) + d * dither), 0, len(pal) - 1).astype(int)
    return pal[idx]


def crack(img_v, mask, rng):
    """A short crack walking in from an edge: dark line with a lit lip below it."""
    h, w = mask.shape
    side = rng.integers(0, 2)
    x, y = (int(rng.integers(20, w - 20)), 1) if side == 0 else (int(rng.integers(20, w - 20)), h - 2)
    dy = 1 if side == 0 else -1
    for _ in range(int(rng.integers(12, 30))):
        if not (0 < y < h - 1 and 0 < x < w - 1) or not mask[y, x]:
            break
        img_v[y, x] = 0.0
        if mask[y + 1, x] and img_v[y + 1, x] > 0.1:
            img_v[y + 1, x] = min(1, img_v[y + 1, x] + 0.25)       # lit lip of the crack
        if rng.random() < 0.08:                                     # a short branch
            bx = x + (2 if rng.random() < 0.5 else -2)
            if 0 < bx < w - 1 and mask[y, bx]: img_v[y, bx] = 0.0
        y += dy if rng.random() < 0.7 else 0
        x += int(rng.integers(-1, 2))


def slab_layers(seed: int):
    """One slab as three layers, each a SLAB_W x SLAB_H cell:
    base   its thickness (as far as the face can rise), outline and drop shadow; stays put;
    face   the face and its ink outline, at rest (FACE_Y);
    hover  the same face lit a step, with the painting's gold on its rim.
    In the game the face layer slides up LIFT px on hover (more thickness shows under it) and
    down when pressed, so the slab pops out and sinks back."""
    rng = np.random.default_rng(seed)
    face = face_mask(rng)
    fy, fx = FACE_Y, FACE_X
    f = np.zeros((SLAB_H, SLAB_W), bool)
    f[fy:fy + FACE_H, fx:fx + FACE_W] = face
    ring = lambda m: (shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)) & ~m   # noqa: E731
    rows = np.arange(SLAB_H)[:, None] * np.ones((1, SLAB_W))

    # Base: the block from the face down through its full thickness.
    body = f.copy()
    for k in range(1, DEPTH + 1):
        body |= shift(f, k, 0)
    outline = ring(body); outline |= ring(body | outline)       # 2 px, like the frame's stones
    shadow = (shift(body | outline, 3, 2) | shift(body | outline, 2, 3)) & ~(body | outline)
    sv = np.zeros((SLAB_H, SLAB_W), np.float32)
    bottom = fy + FACE_H - LIFT                       # the side shows from here once the face is up
    sv[body] = np.clip(0.62 - (rows[body] - bottom) / (DEPTH + LIFT + 1) * 0.55, 0.05, 0.62)
    sv[body] += (smooth_noise((SLAB_H, SLAB_W), 3, rng)[body] - 0.5) * 0.15
    base = np.zeros((SLAB_H, SLAB_W, 4), np.float32)
    base[..., :3] = to_palette(np.clip(sv, 0, 1), PALETTE[:3])
    base[body, 3] = 255
    base[outline, :3] = INK; base[outline, 3] = 255
    base[shadow, :3] = INK; base[shadow, 3] = 110

    # Face: light from the top left, mottled stone, bevelled edges, cracks, moss.
    v = np.zeros((SLAB_H, SLAB_W), np.float32)
    fv = 0.64 + (smooth_noise((SLAB_H, SLAB_W), 11, rng) - 0.5) * 0.16 + (smooth_noise((SLAB_H, SLAB_W), 4, rng) - 0.5) * 0.06
    fv -= (rows - fy) / FACE_H * 0.16
    v[f] = fv[f]
    tl1 = f & ~(shift(f, 1, 0) & shift(f, 0, 1))
    tl2 = f & ~(shift(f, 2, 0) & shift(f, 0, 2)) & ~tl1
    tl3 = f & ~shift(f, 3, 0) & ~tl1 & ~tl2
    br1 = f & ~(shift(f, -1, 0) & shift(f, 0, -1))
    br2 = f & ~(shift(f, -2, 0) & shift(f, 0, -2)) & ~br1
    v[tl3] += 0.14; v[tl2] = np.maximum(v[tl2], 0.8); v[tl1] = 1.0
    v[br2] -= 0.16; v[br1] = 0.12
    for _ in range(int(rng.integers(2, 4))):
        crack(v, f, rng)
    moss = []
    for _ in range(int(rng.integers(1, 3))):
        cx = int(rng.choice([fx + rng.integers(6, 30), fx + FACE_W - rng.integers(6, 30), fx + rng.integers(40, FACE_W - 40)]))
        cy, rr = fy + int(rng.integers(0, 4)), rng.integers(5, 9)
        yy, xx = np.mgrid[0:SLAB_H, 0:SLAB_W]
        blob = ((xx - cx) ** 2 / (rr * 1.8) ** 2 + (yy - cy) ** 2 / rr ** 2 < 1) & f & (smooth_noise((SLAB_H, SLAB_W), 2, rng) > 0.35)
        mv = np.clip(0.6 - (yy - cy) / (rr * 2) + (smooth_noise((SLAB_H, SLAB_W), 2, rng) - 0.5) * 0.5, 0, 1)
        moss.append((blob, to_palette(mv, MOSS)))
    edge = ring(f); edge |= ring(f | edge)                         # 2 px ink, like the frame

    def face_layer(step: float, gold: bool):
        out = np.zeros((SLAB_H, SLAB_W, 4), np.float32)
        out[..., :3] = to_palette(np.clip(v + step * f, 0, 1), PALETTE)
        for blob, colour in moss:
            out[blob, :3] = colour[blob]
        out[f, 3] = 255
        out[edge, :3] = INK; out[edge, 3] = 255
        if gold:
            rim = f & ~(shift(f, 1, 0) & shift(f, -1, 0) & shift(f, 0, 1) & shift(f, 0, -1))
            out[rim, :3] = GOLD
        return out

    return base, face_layer(0.0, False), face_layer(0.14, True)


def preview(sheet: Image.Image, path: Path) -> None:
    """The menu area of the painting with the slabs in place of the items, 2x: START GAME raised
    (hovered), CONTINUE locked (darkened, as the game's CSS does), the rest at rest."""
    painting = Image.open(SRC).convert('RGBA')
    x0, y0, x1, y1 = 880, 130, 1262, 640
    crop = painting.crop((x0, y0, x1, y1))
    crop.alpha_composite(Image.new('RGBA', (1242 - 912, 606 - 172), (17, 39, 34, 255)), (912 - x0, 172 - y0))
    font = None
    for fpath in ('C:/Windows/Fonts/georgiab.ttf', 'C:/Windows/Fonts/timesbd.ttf'):
        try: font = ImageFont.truetype(fpath, 26); break
        except OSError: pass
    d = ImageDraw.Draw(crop)
    labels = ['START GAME', 'CONTINUE', 'SETTINGS', 'CREDITS', 'QUIT']
    for i, label in enumerate(labels):
        hov, locked = i == 0, i == 1
        top = int(round(215 + i * 75.2 + (75.2 - SLAB_H) / 2)) - y0
        cell = lambda row: sheet.crop((i * SLAB_W, row * SLAB_H, (i + 1) * SLAB_W, (row + 1) * SLAB_H))   # noqa: E731
        layer = Image.new('RGBA', (SLAB_W, SLAB_H + LIFT), (0, 0, 0, 0))
        layer.alpha_composite(cell(0), (0, LIFT))
        layer.alpha_composite(cell(2 if hov else 1), (0, 0 if hov else LIFT))
        if locked:
            a = np.asarray(layer).astype(np.float32); a[..., :3] *= 0.55
            layer = Image.fromarray(a.astype(np.uint8), 'RGBA')
        crop.alpha_composite(layer, (915 - x0, top - LIFT))
        if font:
            tw = d.textlength(label, font=font)
            face_top = top + FACE_Y - (LIFT if hov else 0)
            tx, ty = 915 - x0 + FACE_X + (FACE_W - tw) / 2, face_top + FACE_H / 2 - 16
            d.text((tx + 2, ty + 3), label, font=font, fill=(7, 18, 14))
            d.text((tx, ty), label, font=font, fill=(255, 241, 181) if hov else (150, 146, 118) if locked else (242, 229, 171))
    crop.resize((crop.width * 2, crop.height * 2), Image.NEAREST).save(path)


def main() -> None:
    layers = [slab_layers(100 + i) for i in range(5)]
    rows = [np.concatenate([l[r] for l in layers], axis=1) for r in range(3)]   # base, face, hover face
    sheet = Image.fromarray(np.clip(np.concatenate(rows, axis=0), 0, 255).astype(np.uint8), 'RGBA')
    sheet.save(OUT, optimize=True)
    if len(sys.argv) > 1:
        preview(sheet, Path(sys.argv[1]) / 'stone-button-preview.png')
    print(OUT, sheet.size)


if __name__ == '__main__':
    main()
