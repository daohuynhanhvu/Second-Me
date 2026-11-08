"""
Cut the loading screen's painted portal arch and loading-bar frame into sprites, and make a
background without them, for the portal transition at the end of loading
(src/game/loading/loadingScene.ts: the arch slides to the centre, the bar sinks away).

Input  public/assets/loading/background.jpg   (made by prepare_loading_screen.py; run that first)
Output public/assets/loading/portal-arch.png   the stone arch with its vortex
       public/assets/loading/bar-frame.png     the stone channel the progress bar runs in
       public/assets/loading/title.png         "THE TRAILS ARE APPEARING..." and its subtitle
       public/assets/loading/portal-front.png  the arch seen from the front (built from the painting)
       public/assets/loading/background-empty.jpg  the painting with both removed, plus the
                                               energy streaks (their sprite fades out in-game)
       src/game/data/loadingLayout.json        gains `arch`, `barFrame`, `title`, `front` and `center`

The painted stone and the forest behind it share the same dark values, so the outlines are
hand-placed polygons just outside the objects' black ink lines. Each cut is then trimmed:
backdrop pixels are flood-filled inward from the polygon edge until the first ink pixel,
at most TRIM px deep, so the sprites carry no slivers of forest. The title is warm lettering
and yellow-green leaves on a cool forest, so it is cut by colour (plus its dark outline).

The painting shows the arch at an angle: the near (left) pillar in full, the far one narrow,
the vortex a thin ellipse. There is no front view to paint from, so it is built from the
painting: the near pillar and the near half of the opening (widened to the front-on width,
FRONT_RX) are mirrored into a symmetric arch. In-game the arch turns about its vertical axis
from the painted angle to this front view (loadingScene.ts, drawArchModel). Two pre-darkened
strips ride along in the same image: the pillar's side face and the far pillar in shadow.

Run: python -I -X utf8 tools/assets/prepare_portal_transition.py
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from inpaint import erase  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/loading'
LAYOUT = ROOT / 'src/game/data/loadingLayout.json'

ARCH = [(4, 150), (20, 122), (55, 104), (140, 96), (215, 98), (262, 106), (292, 128), (310, 165),
        (312, 330), (314, 560), (306, 600), (285, 622), (150, 628), (80, 618), (30, 600), (4, 570)]
BAR = [(292, 552), (318, 534), (352, 528), (400, 540), (520, 544), (1000, 540), (1048, 532),
       (1100, 552), (1106, 610), (1100, 668), (1040, 676), (360, 676), (296, 668)]
STREAK_BOX = (300, 286, 560, 506)   # streaks right of the arch (the part over the arch moves with it)
INK = 18                            # luminance of the black outlines
TRIM = 10
TITLE_BOX = (320, 50, 1080, 295)
GRAIN = (1040, 470, 1120, 540)      # plain dark forest to sample grain from
SHADE = 0.55                        # how much darker the portal's corner gets without it
FRONT_RX = 88                       # half-width of the vortex opening seen front-on (painted: 69)
SIDE_W = 8                          # columns of the near pillar's edge reused as its side face


def polygon_mask(shape, pts):
    m = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 0


def trim_backdrop(mask, lum):
    """Remove non-ink pixels reachable from outside the polygon, up to TRIM px deep."""
    h, w = mask.shape
    depth = np.full(mask.shape, -1, np.int32)
    q = deque()
    edge = mask & ~np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MinFilter(3)))
    for y, x in zip(*np.nonzero(edge)):
        if lum[y, x] > INK:
            depth[y, x] = 0; q.append((y, x))
    while q:
        y, x = q.popleft()
        d = depth[y, x]
        if d >= TRIM:
            continue
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and depth[ny, nx] < 0 and lum[ny, nx] > INK:
                depth[ny, nx] = d + 1; q.append((ny, nx))
    return mask & (depth < 0)


def cut(im, lum, pts, name):
    mask = trim_backdrop(polygon_mask(lum.shape, pts), lum)
    ys, xs = np.nonzero(mask)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    rgba = np.dstack([im[y0:y1, x0:x1], mask[y0:y1, x0:x1] * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(OUT / name, optimize=True)
    return mask, dict(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))


def grow(a, k, f):
    return np.asarray(Image.fromarray(a.astype(np.uint8) * 255).filter(f(k))) > 0


def title_mask(im, lum):
    x0, y0, x1, y1 = TITLE_BOX
    r, g, b = (im[y0:y1, x0:x1, i] for i in range(3))
    core = (r > b + 10) | ((r > 150) & (g > 130)) | ((g > b + 28) & (g >= r - 10) & (g > 70))
    core = grow(grow(core, 3, ImageFilter.MaxFilter), 3, ImageFilter.MinFilter)
    m = core | (grow(core, 9, ImageFilter.MaxFilter) & (lum[y0:y1, x0:x1] < 70))   # the dark outline
    m = grow(grow(m, 3, ImageFilter.MaxFilter), 3, ImageFilter.MinFilter)
    full = np.zeros(lum.shape, bool); full[y0:y1, x0:x1] = m
    return full


def front_view(arch_rgba, arch, portal):
    """Symmetric front-on arch from the near pillar and the near half of the opening."""
    cx, rx = portal['cx'] - arch['x'], portal['rx']           # vortex centre / half-width in the sprite
    left = cx - rx                                            # near pillar: columns [0, left)
    pillar = arch_rgba[:, :left]
    half = Image.fromarray(np.ascontiguousarray(arch_rgba[:, left:cx])).resize((FRONT_RX, arch_rgba.shape[0]), Image.NEAREST)
    half = np.asarray(half)
    front = np.concatenate([pillar, half, half[:, ::-1], pillar[:, ::-1]], axis=1)
    dark = lambda a, k: np.dstack([a[..., :3] * k, a[..., 3:]])      # noqa: E731
    side = dark(pillar[:, :SIDE_W].astype(np.float32), 0.45)
    far = dark(pillar[:, ::-1].astype(np.float32), 0.55)
    sheet = np.concatenate([front, side, far], axis=1).astype(np.uint8)
    Image.fromarray(sheet, 'RGBA').save(OUT / 'portal-front.png', optimize=True)
    return dict(w=int(front.shape[1]), h=int(front.shape[0]), pillar=int(left), open=int(2 * FRONT_RX),
                cy=int(portal['cy'] - arch['y']), sideW=SIDE_W,
                paintedOpen=int(2 * rx), paintedFar=int(arch['w'] - (cx + rx)))


def main() -> None:
    im = np.asarray(Image.open(OUT / 'background.jpg').convert('RGB')).astype(np.float32)
    lum = im @ np.array([0.3, 0.59, 0.11], np.float32)

    arch_mask, arch = cut(im, lum, ARCH, 'portal-arch.png')
    layout = json.loads(LAYOUT.read_text(encoding='utf-8'))
    arch_rgba = np.asarray(Image.open(OUT / 'portal-arch.png').convert('RGBA'))
    front = front_view(arch_rgba, arch, layout['portal'])
    bar_mask, bar = cut(im, lum, BAR, 'bar-frame.png')
    tmask = title_mask(im, lum)
    ys, xs = np.nonzero(tmask)
    tx0, ty0, tx1, ty1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(np.dstack([im[ty0:ty1, tx0:tx1], tmask[ty0:ty1, tx0:tx1] * 255]).astype(np.uint8), 'RGBA').save(OUT / 'title.png', optimize=True)
    title = dict(x=int(tx0), y=int(ty0), w=int(tx1 - tx0), h=int(ty1 - ty0))

    # Streaks and sparks the portal throws out (same test as the streak sprite).
    sx0, sy0, sx1, sy1 = STREAK_BOX
    region = im[sy0:sy1, sx0:sx1]
    base = np.asarray(Image.fromarray(region.astype(np.uint8)).filter(ImageFilter.MedianFilter(15))).astype(np.float32)
    streak = ((region - base).max(2) > 12) & (region.max(2) > 80)
    streak = np.asarray(Image.fromarray(streak.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))) > 0
    streak_mask = np.zeros_like(arch_mask); streak_mask[sy0:sy1, sx0:sx1] = streak

    # The holes are filled slightly wider than the cuts so no outline remains.
    hole = arch_mask | bar_mask
    hole = np.asarray(Image.fromarray(hole.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    empty = erase(im, hole | streak_mask | grow(tmask, 5, ImageFilter.MaxFilter), GRAIN, 0.3)
    # The portal lit this corner; once it has left, the corner falls dark (this also hides
    # the smooth fill where the arch stood).
    yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]]
    shade = 1 - SHADE * np.exp(-((xx - 160) / 300) ** 2 - ((yy - 380) / 330) ** 2)
    empty = empty * shade[..., None]
    Image.fromarray(np.clip(empty, 0, 255).astype(np.uint8)).save(OUT / 'background-empty.jpg', quality=90, optimize=True, progressive=True)

    layout['arch'] = arch
    layout['front'] = front
    layout['barFrame'] = bar
    layout['title'] = title
    layout['center'] = dict(x=layout['width'] // 2, y=layout['height'] // 2)
    LAYOUT.write_text(json.dumps(layout, indent=1) + '\n', encoding='utf-8')
    print('arch', arch, 'bar', bar)


if __name__ == '__main__':
    main()
