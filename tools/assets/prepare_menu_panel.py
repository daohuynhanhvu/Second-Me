"""
The stone back of the main menu: the wall the slab items stand on, inside the painting's frame.

Input  public/assets/menu/second-me-forest-clean.png   (only for the preview)
       public/assets/menu/stone-button.png             (only for the preview)
Output public/assets/menu/stone-panel.png              PANEL_W x PANEL_H, the frame's opening
       <preview_dir>/stone-panel-preview.png           panel + slabs over the menu, 2x (optional)

The opening (x 912-1246, y 172-606 of the 1376x768 painting) is laid with large flagstones in
uneven courses: each stone its own shade, mottled, lit from the top left with a dark lower
edge, set in dark mortar, with long cracks and moss creeping in from the corners. It sits a step
darker than the slabs (the darker half of the same palette) and falls into shadow under the
frame's edges, so the raised slabs read in front of it. Every colour comes from the frame's
stone (PALETTE / MOSS / INK of prepare_menu_buttons.py) in the same flat, undithered bands, 1
painting px per sprite px; its middle tone is the painted opening's own #1d3126.

Run: python -I -X utf8 tools/assets/prepare_menu_panel.py [preview_dir]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prepare_menu_buttons import INK, MOSS, PALETTE, SRC, smooth_noise, to_palette  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/menu/stone-panel.png'
BUTTONS = ROOT / 'public/assets/menu/stone-button.png'

X0, Y0, X1, Y1 = 912, 172, 1246, 606     # the frame's opening in the painting
PANEL_W, PANEL_H = X1 - X0, Y1 - Y0
WALL = PALETTE[:4]                       # the darker half of the frame's stone


def courses(rng):
    """Stone ids per pixel: courses of uneven height, stones of uneven width, joints staggered."""
    ids = np.zeros((PANEL_H, PANEL_W), int)
    joint = np.zeros((PANEL_H, PANEL_W), bool)
    y, n = -int(rng.integers(10, 30)), 0
    while y < PANEL_H:
        h = int(rng.integers(46, 74))
        x = -int(rng.integers(0, 90))
        while x < PANEL_W:
            w = int(rng.integers(78, 150))
            y0, y1, x0, x1 = max(y, 0), min(y + h, PANEL_H), max(x, 0), min(x + w, PANEL_W)
            if y1 > y0 and x1 > x0:
                ids[y0:y1, x0:x1] = n
            n += 1
            x += w
        y += h
    # Joints: wherever a pixel's right or lower neighbour is another stone. Wobbled a pixel so
    # they look cut by hand, not ruled.
    wob = np.round((smooth_noise((PANEL_H, PANEL_W), 7, rng) - 0.5) * 2.4).astype(int)
    yy, xx = np.mgrid[0:PANEL_H, 0:PANEL_W]
    ids = ids[np.clip(yy + wob, 0, PANEL_H - 1), np.clip(xx + wob, 0, PANEL_W - 1)]
    joint[:-1] |= ids[:-1] != ids[1:]
    joint[:, :-1] |= ids[:, :-1] != ids[:, 1:]
    return ids, joint, n


def shift(m, dy, dx):
    out = np.zeros_like(m)
    h, w = m.shape
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = m[max(-dy, 0):h - max(dy, 0), max(-dx, 0):w - max(dx, 0)]
    return out


def crack(v, rng, x, y, steps, dx):
    """A long crack wandering across the wall: a dark line with a lit lip below it, branching."""
    for _ in range(steps):
        if not (1 < y < PANEL_H - 2 and 1 < x < PANEL_W - 2):
            return
        v[y, x] = 0.0
        v[y + 1, x] = min(1, v[y + 1, x] + 0.18)
        if rng.random() < 0.04:
            crack(v, rng, x, y, int(rng.integers(8, 22)), -dx if rng.random() < 0.5 else dx)
        x += dx if rng.random() < 0.75 else 0
        y += int(rng.integers(-1, 2))


def panel(seed=7):
    rng = np.random.default_rng(seed)
    ids, joint, n = courses(rng)
    stone = ~joint
    shade = rng.uniform(-0.09, 0.09, n)                       # each stone its own shade
    v = 0.5 + shade[ids]
    v += (smooth_noise((PANEL_H, PANEL_W), 13, rng) - 0.5) * 0.22
    v += (smooth_noise((PANEL_H, PANEL_W), 4, rng) - 0.5) * 0.12
    # Per-stone bevel: lit along the top/left of each stone, dark along its bottom/right.
    lit1 = stone & (shift(joint, 1, 0) | shift(joint, 0, 1))
    dark1 = stone & (shift(joint, -1, 0) | shift(joint, 0, -1))
    dark2 = stone & (shift(joint, -2, 0) | shift(joint, 0, -2)) & ~dark1
    v[lit1] += 0.2
    v[dark2] -= 0.1
    v[dark1] -= 0.22
    v[joint] = 0.0
    for _ in range(5):
        side = rng.integers(0, 2)
        crack(v, rng, 2 if side == 0 else PANEL_W - 3, int(rng.integers(30, PANEL_H - 30)),
              int(rng.integers(40, 120)), 1 if side == 0 else -1)
    # Recessed under the frame: shadow falls from the frame's top and sides.
    yy, xx = np.mgrid[0:PANEL_H, 0:PANEL_W]
    edge = np.minimum.reduce([yy * 0.8, xx, PANEL_W - 1 - xx, (PANEL_H - 1 - yy) * 1.4]).astype(np.float32)
    v -= np.clip(1 - edge / 26, 0, 1) ** 1.6 * 0.38
    v = np.clip(v, 0, 1)

    out = np.zeros((PANEL_H, PANEL_W, 3), np.float32)
    out[:] = to_palette(v, WALL)
    out[joint] = INK
    # Moss creeping in from the corners and along the bottom, only on the stone's face.
    grow = np.zeros((PANEL_H, PANEL_W), np.float32)
    for cx, cy, r in ((0, 0, 70), (PANEL_W, 0, 55), (0, PANEL_H, 90), (PANEL_W, PANEL_H, 80), (PANEL_W * 0.45, PANEL_H, 60)):
        grow = np.maximum(grow, 1 - np.hypot((xx - cx) / r, (yy - cy) / (r * 0.8)))
    moss = stone & (grow + (smooth_noise((PANEL_H, PANEL_W), 3, rng) - 0.5) * 0.7 > 0.32)
    mv = np.clip(0.25 + grow * 0.6 + (smooth_noise((PANEL_H, PANEL_W), 2, rng) - 0.5) * 0.5 - np.clip(1 - edge / 26, 0, 1) * 0.3, 0, 1)
    out[moss] = to_palette(mv, MOSS)[moss] * 0.85
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB')


def preview(img: Image.Image, path: Path) -> None:
    """The menu area with the panel and the slabs in place (START GAME raised), 2x."""
    from prepare_menu_buttons import LIFT, SLAB_H, SLAB_W
    x0, y0 = 880, 130
    crop = Image.open(SRC).convert('RGBA').crop((x0, y0, 1262, 640))
    crop.alpha_composite(img.convert('RGBA'), (X0 - x0, Y0 - y0))
    sheet = Image.open(BUTTONS).convert('RGBA')
    for i in range(5):
        hov = i == 0
        top = int(round(215 + i * 75.2 + (75.2 - SLAB_H) / 2)) - y0
        cell = lambda row: sheet.crop((i * SLAB_W, row * SLAB_H, (i + 1) * SLAB_W, (row + 1) * SLAB_H))   # noqa: E731
        layer = Image.new('RGBA', (SLAB_W, SLAB_H + LIFT), (0, 0, 0, 0))
        layer.alpha_composite(cell(0), (0, LIFT))
        layer.alpha_composite(cell(2 if hov else 1), (0, 0 if hov else LIFT))
        crop.alpha_composite(layer, (927 - x0, top - LIFT))
    crop.resize((crop.width * 2, crop.height * 2), Image.NEAREST).save(path)


def main() -> None:
    img = panel()
    img.save(OUT, optimize=True)
    if len(sys.argv) > 1:
        preview(img, Path(sys.argv[1]) / 'stone-panel-preview.png')
    print(OUT, img.size)


if __name__ == '__main__':
    main()
