"""
Animated portal for the loading screen, from tools/assets/source/portal-anim-sheet.png
(1200x896, RGB: its "transparent" checkerboard is painted in): 10 portal frames, the arch's
middle with a turning vortex, in the painting's three-quarter view (its streak frames are not
used: the loading screen shows no energy streaks).

    python -I -X utf8 tools/assets/prepare_portal_anim.py      # after prepare_loading_screen.py

Writes to public/assets/loading/:
  portal-vortex.png  the 10 vortices in a row, each cut along its oval and resampled so the
                     oval lands on the painted portal's oval (the arch itself stays the painting's);
and its placement to src/game/data/portalAnim.json.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools' / 'assets' / 'source' / 'portal-anim-sheet.png'
OUT = ROOT / 'public' / 'assets' / 'loading'
LAYOUT = ROOT / 'src' / 'game' / 'data' / 'loadingLayout.json'
DATA = ROOT / 'src' / 'game' / 'data' / 'portalAnim.json'

# Portal frames: 6 + 4 cells, 172 px wide at these x, 224 px rows (registered: they agree within 1 px).
CELL_X = [15, 214, 413, 613, 812, 1012]
CELLS = [(x, 0) for x in CELL_X] + [(x, 224) for x in CELL_X[:4]]
# The vortex oval (with its yellow rim) in each cell, measured on the sheet.
SHEET_OVAL = dict(cx=84, cy=121, rx=44, ry=93)
EDGE = 0.05                      # soft edge, as a fraction of the oval's radius



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



def main() -> None:
    sheet = np.asarray(Image.open(SRC).convert('RGB'))
    portal = json.loads(LAYOUT.read_text(encoding='utf-8'))['portal']
    vortex, vdata = vortex_frames(sheet, portal)
    vortex.save(OUT / 'portal-vortex.png', optimize=True)
    DATA.write_text(json.dumps(dict(vortex=vdata), indent=1) + '\n', encoding='utf-8')
    print('vortex', vdata)


if __name__ == '__main__':
    main()
