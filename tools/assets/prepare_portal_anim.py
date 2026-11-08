"""
Animated portal for the loading screen, from two sheets in tools/assets/source/ (1200x896,
RGB: their "transparent" checkerboard is painted in):
  portal-anim-sheet.png  10 portal frames: the arch's middle with a turning vortex, in the
                         painting's three-quarter view (its streak frames are not used);
  portal-flow-sheet.png  15 streak frames, 4 per row in 300x224 cells: energy streaks with spark
                         heads flying right, their band of light rising and falling.

    python -I -X utf8 tools/assets/prepare_portal_anim.py      # after prepare_loading_screen.py

Writes to public/assets/loading/:
  portal-vortex.png  the 10 vortices in a row, each cut along its oval and resampled so the
                     oval lands on the painted portal's oval (the arch itself stays the painting's);
  portal-flow.png    the 15 streak frames in a row, checkerboard removed: colour is the light
                     above the checkerboard, alpha its strength (drawn additively). Every frame
                     is cut from the same place in its cell, so the band's rise and fall is
                     kept; scaled to the painted streaks' span;
and their placement to src/game/data/portalAnim.json.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools' / 'assets' / 'source' / 'portal-anim-sheet.png'
FLOW_SRC = ROOT / 'tools' / 'assets' / 'source' / 'portal-flow-sheet.png'
OUT = ROOT / 'public' / 'assets' / 'loading'
LAYOUT = ROOT / 'src' / 'game' / 'data' / 'loadingLayout.json'
DATA = ROOT / 'src' / 'game' / 'data' / 'portalAnim.json'

# Portal frames: 6 + 4 cells, 172 px wide at these x, 224 px rows (registered: they agree within 1 px).
CELL_X = [15, 214, 413, 613, 812, 1012]
CELLS = [(x, 0) for x in CELL_X] + [(x, 224) for x in CELL_X[:4]]
# The vortex oval (with its yellow rim) in each cell, measured on the sheet.
SHEET_OVAL = dict(cx=84, cy=121, rx=44, ry=93)
EDGE = 0.05                      # soft edge, as a fraction of the oval's radius

# Streak frames in reading order: 300x224 cells, 4 per row, 15 frames; FLOW_CROP is the part of
# each cell (x0, y0, x1, y1) that holds every frame's streaks.
FLOW_CELL = (300, 224)
FLOW_FRAMES = 15
FLOW_CROP = (8, 46, 300, 206)
CHECKER_MAX = 40                 # the painted checkerboard never gets brighter than this
FLOW_SCALE = 1.16                # sheet px -> painting px: tails at the arch's rim, heads ~x 545
FLOW_HEAD = (548, 412)           # painting px: right edge of the heads, light-weighted centre height
FLOW_PAD = 6


def vortex_frames(sheet: np.ndarray, portal: dict) -> tuple[Image.Image, dict]:
    s = SHEET_OVAL
    pad = 4
    x0, y0 = portal['cx'] - portal['rx'] - pad, portal['cy'] - portal['ry'] - pad
    w, h = 2 * (portal['rx'] + pad), 2 * (portal['ry'] + pad)
    kx, ky = s['rx'] / portal['rx'], s['ry'] / portal['ry']          # painting px -> sheet px
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx + x0 + 0.5 - portal['cx']) / portal['rx']) ** 2 + ((yy + y0 + 0.5 - portal['cy']) / portal['ry']) ** 2)
    alpha = np.clip((1 - d) / EDGE, 0, 1)
    strip = Image.new('RGBA', (w * len(CELLS), h))
    img = Image.fromarray(sheet)
    for i, (cx, cy) in enumerate(CELLS):
        # Output pixel (u, v) samples the sheet at the matching point of the sheet's oval.
        ox = cx + s['cx'] + (x0 - portal['cx']) * kx
        oy = cy + s['cy'] + (y0 - portal['cy']) * ky
        frame = img.transform((w, h), Image.AFFINE, (kx, 0, ox, 0, ky, oy), resample=Image.BICUBIC)
        rgba = np.dstack([np.asarray(frame), alpha * 255]).astype(np.uint8)
        strip.paste(Image.fromarray(rgba, 'RGBA'), (i * w, 0))
    return strip, dict(x=x0, y=y0, w=w, h=h, frames=len(CELLS))


def flow_frames(sheet: np.ndarray) -> tuple[Image.Image, dict]:
    f = sheet.astype(np.float32)
    # The checkerboard under each pixel: a median over a few tiles, capped at its brightest tone
    # so glow never counts as background. What rises above it is the streak's light.
    bg = np.stack([np.asarray(Image.fromarray(sheet[..., c]).filter(ImageFilter.MedianFilter(13))) for c in range(3)], -1)
    light = np.clip(f - np.minimum(bg.astype(np.float32), CHECKER_MAX) - 4, 0, 255)
    cx0, cy0, cx1, cy1 = FLOW_CROP
    W, H = cx1 - cx0, cy1 - cy0
    fw, fh = round(W * FLOW_SCALE), round(H * FLOW_SCALE)
    strip = Image.new('RGBA', (fw * FLOW_FRAMES, fh))
    lit = []
    for i in range(FLOW_FRAMES):
        ox, oy = (i % 4) * FLOW_CELL[0], (i // 4) * FLOW_CELL[1]
        L = light[oy + cy0:oy + cy1, ox + cx0:ox + cx1]
        lum = L.max(2)
        ys, xs = np.nonzero(lum > 18)
        lit.append((xs.max(), float((lum * np.arange(H)[:, None]).sum() / lum.sum())))
        big = np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).resize((fw, fh), Image.LANCZOS)).astype(np.float32)
        a = big.max(2)
        a = np.where(a < 6, 0, a)                          # leftover checkerboard edges
        rgb = np.where(a[..., None] > 0, big * 255 / np.maximum(a, 1)[..., None], 0)
        strip.paste(Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a]).astype(np.uint8), 'RGBA'), (i * fw, 0))
    # Placement: the frames' furthest heads and their average height go to FLOW_HEAD.
    head = max(x for x, _ in lit)
    mid = sum(y for _, y in lit) / len(lit)
    x = round(FLOW_HEAD[0] - (head + FLOW_PAD) * FLOW_SCALE)
    y = round(FLOW_HEAD[1] - mid * FLOW_SCALE)
    return strip, dict(x=x, y=y, w=fw, h=fh, frames=FLOW_FRAMES)


def main() -> None:
    sheet = np.asarray(Image.open(SRC).convert('RGB'))
    portal = json.loads(LAYOUT.read_text(encoding='utf-8'))['portal']
    vortex, vdata = vortex_frames(sheet, portal)
    vortex.save(OUT / 'portal-vortex.png', optimize=True)
    flow, fdata = flow_frames(np.asarray(Image.open(FLOW_SRC).convert('RGB')))
    flow.save(OUT / 'portal-flow.png', optimize=True)
    DATA.write_text(json.dumps(dict(vortex=vdata, flow=fdata), indent=1) + '\n', encoding='utf-8')
    print('vortex', vdata, 'flow', fdata)


if __name__ == '__main__':
    main()
