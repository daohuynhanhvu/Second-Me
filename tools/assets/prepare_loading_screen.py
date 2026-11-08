"""
Loading-screen art from the painted mockup (tools/assets/source/loading-mockup.png, 1376x768).

    python -I -X utf8 tools/assets/prepare_loading_screen.py

The painting keeps its title ("THE ANCIENT PATH REMEMBERS", "THE TRAILS ARE APPEARING..."),
forest, portal and the vine-wrapped bar frame. Everything that must be live is removed:
the standing wizard and its dust, the status lines, the painted 75% fill, the text and thin
bar under the frame. The bar's channel is repainted empty from its own unfilled end.

Also cut out, for animation:
  portal-swirl.png    the vortex inside the arch (rotated in-game),
  portal-streaks.png  the bright energy streaks leaving the portal (light runs along them).
Geometry the game needs goes to src/game/data/loadingLayout.json.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from inpaint import erase  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools' / 'assets' / 'source' / 'loading-mockup.png'
OUT = ROOT / 'public' / 'assets' / 'loading'
LAYOUT = ROOT / 'src' / 'game' / 'data' / 'loadingLayout.json'

# Painted UI to remove (x0, y0, x1, y1). Text areas only lose the letters (and their dark
# outline), so the forest between them stays; solid areas are removed whole.
TEXT = [
    (548, 474, 786, 568),    # status lines
    (590, 652, 790, 690),    # "LOADING... 75%"
    (436, 702, 946, 740),    # caption
]
SOLID = [
    (756, 427, 974, 575),    # standing wizard, its dust, stray "UMG ROCKS" label
    (800, 548, 912, 575),    # sparks over the fill head
    (414, 684, 962, 707),    # thin progress bar
]
CHANNEL = (362, 588, 1011, 628)    # inside the bar frame
BEVEL = (362, 584, 1011, 634)      # channel plus the bevel lines the painted fill lit up
FILLED_TO = 906                   # the painted fill (and its head sparks) ends before here
EMPTY_COLS = (932, 952)           # clean unfilled channel, used as the empty look
PORTAL = dict(cx=186, cy=360, rx=69, ry=175, eyeX=165, eyeY=366)
SWIRL_BOX = (110, 180, 262, 544)
STREAK_BOX = (236, 286, 556, 506)
RUNES = [(729, 299), (728, 442)]
GRAIN = (1040, 470, 1120, 540)   # clean dark forest
HEAD = (872, 572)                # where the painted fill head glowed


def main() -> None:
    im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
    OUT.mkdir(parents=True, exist_ok=True)

    # --- portal layers (cut before anything is changed) ---
    x0, y0, x1, y1 = SWIRL_BOX
    swirl = im[y0:y1, x0:x1]
    yy, xx = np.mgrid[y0:y1, x0:x1]
    d = ((xx - PORTAL['cx']) / PORTAL['rx']) ** 2 + ((yy - PORTAL['cy']) / PORTAL['ry']) ** 2
    a = np.clip((1.0 - d) / 0.12, 0, 1)            # soft edge at the arch
    Image.fromarray(np.dstack([swirl, a * 255]).astype(np.uint8), 'RGBA').save(OUT / 'portal-swirl.png', optimize=True)

    sx0, sy0, sx1, sy1 = STREAK_BOX
    region = im[sy0:sy1, sx0:sx1]
    base = np.asarray(Image.fromarray(region.astype(np.uint8)).filter(ImageFilter.MedianFilter(15))).astype(np.float32)
    lift = (region - base).max(2)
    bright = region.max(2)
    streak_a = np.clip((lift - 28) / 50, 0, 1) * (bright > 120)
    streak_a = np.asarray(Image.fromarray((streak_a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))).astype(np.float32) / 255
    Image.fromarray(np.dstack([region, streak_a * 255]).astype(np.uint8), 'RGBA').save(OUT / 'portal-streaks.png', optimize=True)

    # --- remove painted UI ---
    hole = np.zeros(im.shape[:2], bool)
    cream = (im[..., 0] > 140) & (im[..., 1] > 125) & (im[..., 2] > 80)
    for ex0, ey0, ex1, ey1 in TEXT:
        letters = np.zeros_like(hole); letters[ey0:ey1, ex0:ex1] = cream[ey0:ey1, ex0:ex1]
        grown = np.asarray(Image.fromarray(letters.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))) > 0
        hole[ey0:ey1, ex0:ex1] |= grown[ey0:ey1, ex0:ex1]
    for ex0, ey0, ex1, ey1 in SOLID:
        hole[ey0:ey1, ex0:ex1] = True
    out = erase(im, hole, GRAIN, strength=0.2)

    # The painted fill head lit the forest around it; take that light back out (a soft
    # yellow-green bloom centred on the old head), so no glow sits at a fixed 75%.
    gy, gx = np.mgrid[0:out.shape[0], 0:out.shape[1]]
    bloom = np.exp(-(((gx - HEAD[0]) / 70.0) ** 2 + ((gy - HEAD[1]) / 60.0) ** 2) / 2)
    bloom[HEAD[1] + 6:] = 0          # the frame and channel below are handled separately
    lum = out.mean(2, keepdims=True)
    tint = np.array([1.0, 1.0, 0.55])
    out = np.clip(out - bloom[..., None] * np.clip(lum - 38, 0, None) * 0.75 * tint, 0, 255)

    # Empty channel: the unfilled end's vertical profile (with its bevel lines), repeated
    # where the fill was painted.
    cx0, cy0, cx1, cy1 = CHANNEL
    bx0, by0, bx1, by1 = BEVEL
    profile = np.median(im[by0:by1, EMPTY_COLS[0]:EMPTY_COLS[1]], axis=1)          # (rows, 3)
    rng = np.random.default_rng(3)
    channel = np.repeat(profile[:, None, :], FILLED_TO - bx0, axis=1)
    channel += rng.normal(0, 1.2, channel.shape[:2])[..., None]
    out[by0:by1, bx0:FILLED_TO] = channel

    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT / 'background.jpg', quality=90, optimize=True, progressive=True)

    layout = dict(
        width=im.shape[1], height=im.shape[0],
        bar=dict(x=cx0, y=cy0, w=cx1 - cx0, h=cy1 - cy0),
        portal=PORTAL,
        swirl=dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0),
        streaks=dict(x=sx0, y=sy0, w=sx1 - sx0, h=sy1 - sy0),
        runes=[dict(x=x, y=y) for x, y in RUNES],
        status=dict(x=548, y=474, w=238, h=94),
        footer=dict(y=650),
    )
    LAYOUT.write_text(json.dumps(layout, indent=1) + '\n', encoding='utf-8')
    print('wrote', [p.name for p in OUT.iterdir()], LAYOUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
