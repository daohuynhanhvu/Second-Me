"""
The stone back of the main menu: the wall the slab items stand on, inside the painting's frame.

Input  public/assets/menu/second-me-forest-clean.png   (only for the preview)
       public/assets/menu/stone-button.png             (only for the preview)
Output public/assets/menu/stone-panel.png              PANEL_W x PANEL_H, the frame's opening
       public/assets/menu/stone-panel-frame.png        the same box: the painted frame's rim and the
                                                       brambles crossing into the opening, to lay over
                                                       the panel (the panel's box overlaps the rim)
       <preview_dir>/stone-panel-preview.png           panel + slabs over the menu, 2x (optional)

The opening (x 912-1246, y 172-606 of the 1376x768 painting) is laid with large flagstones in
uneven courses: each stone its own shade, mottled, lit from the top left with a dark lower
edge, set in dark mortar, with long cracks and moss creeping in from the corners. It sits a step
darker than the slabs (the darker half of the same palette) and falls into shadow under the
frame's edges, so the raised slabs read in front of it. Every colour comes from the frame's
stone (PALETTE / MOSS / INK of prepare_menu_buttons.py) in the same flat, undithered bands, 1
painting px per sprite px; its middle tone is the painted opening's own #1d3126.

The panel's box (X0..X1, Y0..Y1) is a little larger than the opening itself (INNER), so it covers
the frame's inner rim and the brambles wrapped over it. stone-panel-frame.png puts them back on top:
everything of the painting outside INNER, and inside it the brambles that cross in (dark ink or grey
stem, reached from the rim, within REACH px of it, and thicker than a crack). In the painting the
brambles stop at the opening's edge, which over the new wall reads as going under it, so a few of
them (BRAMBLE_LOOPS, drawn like the painted ones) loop out of the frame over the wall's edge and back.

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
FRAME_OUT = ROOT / 'public/assets/menu/stone-panel-frame.png'
BUTTONS = ROOT / 'public/assets/menu/stone-button.png'

X0, Y0, X1, Y1 = 912, 172, 1246, 606     # the frame's opening in the painting
PANEL_W, PANEL_H = X1 - X0, Y1 - Y0
INNER = (928, 179, 1240, 607)            # the opening inside the frame's ink edge, in the painting
REACH = 70                               # how far into the opening a crossing bramble is looked for
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


def frame_overlay() -> Image.Image:
    """The painting's frame rim and the brambles crossing into the opening, in the panel's box."""
    from collections import deque
    p = np.asarray(Image.open(SRC).convert('RGB'))[Y0:Y1, X0:X1].astype(int)
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    lum = (3 * r + 6 * g + b) / 10
    yy, xx = np.mgrid[0:PANEL_H, 0:PANEL_W]
    ix0, iy0, ix1, iy1 = INNER[0] - X0, INNER[1] - Y0, INNER[2] - X0, INNER[3] - Y0
    inside = (xx >= ix0) & (xx < ix1) & (yy >= iy0) & (yy < iy1)
    depth = np.minimum.reduce([xx - ix0, ix1 - 1 - xx, yy - iy0, iy1 - 1 - yy])
    # A bramble: black ink, or the stems' grey (no green cast), near the rim.
    bramble = ((lum < 24) | ((np.abs(g - r) < 12) & (np.abs(g - b) < 14) & (lum < 75))) & (depth < REACH)
    reached = ~inside
    q = deque(zip(*np.nonzero(reached)))
    while q:
        y, x = q.popleft()
        for v, u in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= v < PANEL_H and 0 <= u < PANEL_W and not reached[v, u] and bramble[v, u]:
                reached[v, u] = True
                q.append((v, u))
    # Keep only strokes wider than a crack (an opening of 2 px).
    m = reached.copy()
    for _ in range(2):
        m = m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)
    for _ in range(3):
        m = m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)
    keep = ~inside | (m & reached & inside)
    out = np.dstack([p, keep * 255]).astype(np.uint8)
    draw_brambles(out)
    return Image.fromarray(out, 'RGBA')


# Brambles of the frame wrapping over the wall's edge, so they are seen in front of it (in the
# painting they stop at the opening's edge, which over the new wall reads as going under it).
# Each one: out of the frame, along over the wall's edge for a stretch, and back into the frame,
# clear of the language switch on top. Painting px (the opening: INNER).
BRAMBLE_LOOPS = [
    # left side: out of the pillar, along over the wall's edge, back into the pillar
    [(904, 230), (922, 240), (934, 262), (936, 288), (924, 312), (904, 322)],
    [(904, 400), (925, 412), (937, 440), (933, 468), (916, 482), (904, 486)],
    [(904, 556), (924, 566), (940, 584), (948, 602), (946, 614)],
    # right side
    [(1263, 180), (1240, 192), (1228, 214), (1230, 240), (1244, 258), (1262, 266)],
    [(1263, 330), (1242, 340), (1229, 362), (1231, 392), (1246, 406), (1263, 410)],
    [(1263, 488), (1240, 498), (1226, 522), (1230, 548), (1250, 560), (1263, 562)],
    # top, sagging down either side of the language switch; bottom, arching up
    [(940, 166), (960, 180), (990, 188), (1020, 184), (1042, 172), (1050, 166)],
    [(1120, 166), (1140, 180), (1172, 190), (1205, 186), (1225, 175), (1240, 166)],
    [(960, 614), (985, 600), (1020, 596), (1052, 604), (1066, 614)],
    [(1110, 614), (1140, 598), (1176, 596), (1206, 606), (1216, 614)],
]
# The painted brambles, measured across a stem (as MenuVines.tsx): outline, body, grey band.
B_INK, B_STEM, B_EDGE, B_BAND = (2, 3, 5), (10, 14, 18), (28, 35, 38), (43, 51, 53)
B_R = 4.0


def catmull(pts, per_px=2):
    """Points along a Catmull-Rom spline through pts, ~1/per_px px apart, with their headings."""
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(0, i - 1)], pts[i], pts[i + 1], pts[min(len(pts) - 1, i + 2)]
        steps = int(np.ceil(np.hypot(p2[0] - p1[0], p2[1] - p1[1]) * per_px))
        for k in range(steps + (i == len(pts) - 2)):
            t = k / steps
            f = lambda a, b, c, d: 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3)   # noqa: E731
            out.append((f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])))
    heads = [np.arctan2(out[min(i + 1, len(out) - 1)][1] - out[max(i - 1, 0)][1], out[min(i + 1, len(out) - 1)][0] - out[max(i - 1, 0)][0]) for i in range(len(out))]
    return out, heads


def disc(img, cx, cy, r, color):
    h, w = img.shape[:2]
    R = int(np.ceil(r))
    X, Y = int(round(cx)), int(round(cy))
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            if dx * dx + dy * dy <= r * r + 0.3 and 0 <= Y + dy < h and 0 <= X + dx < w:
                img[Y + dy, X + dx] = (*color, 255)


def draw_brambles(img):
    """BRAMBLE_LOOPS onto the overlay (RGBA, panel px): thorns, outline, stem, its grey band."""
    for loop in BRAMBLE_LOOPS:
        pts, heads = catmull([(x - X0, y - Y0) for x, y in loop])
        n = len(pts)
        rad = [B_R * (0.8 + 0.2 * np.sin(np.pi * i / (n - 1))) for i in range(n)]
        side = 1
        for i in range(10, n - 10, 30):                        # thorns every ~15 px, alternating
            (x, y), a, r = pts[i], heads[i], rad[i]
            nrm = a + np.pi / 2 * side
            for k in range(7):
                wd = max(1, round(4 * (1 - k / 6)))
                cx = x + np.cos(nrm) * (r + k) - np.cos(a) * k * 0.8
                cy = y + np.sin(nrm) * (r + k) - np.sin(a) * k * 0.8
                for oy in range(wd):
                    for ox in range(wd):
                        X, Y = int(round(cx - wd / 2)) + ox, int(round(cy - wd / 2)) + oy
                        if 0 <= Y < img.shape[0] and 0 <= X < img.shape[1]:
                            img[Y, X] = (*B_INK, 255)
            side = -side
        for (x, y), r in zip(pts, rad):
            disc(img, x, y, r + 1, B_INK)
        for (x, y), r in zip(pts, rad):
            disc(img, x, y, r, B_STEM)
        for scale, color in ((0.42, B_EDGE), (0.26, B_BAND)):   # the grey band along the upper side
            for ((x, y), a, r) in zip(pts, heads, rad):
                up = a + np.pi / 2 if np.sin(a + np.pi / 2) < 0 else a - np.pi / 2
                disc(img, x + np.cos(up) * r * 0.42, y + np.sin(up) * r * 0.42, r * scale, color)


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
    crop.alpha_composite(frame_overlay(), (X0 - x0, Y0 - y0))
    crop.resize((crop.width * 2, crop.height * 2), Image.NEAREST).save(path)


def main() -> None:
    img = panel()
    img.save(OUT, optimize=True)
    frame_overlay().save(FRAME_OUT, optimize=True)
    if len(sys.argv) > 1:
        preview(img, Path(sys.argv[1]) / 'stone-panel-preview.png')
    print(OUT, img.size)


if __name__ == '__main__':
    main()
