"""
Turn the hand-drawn "Secondme asset" sheets into game-ready atlases.

    python -I -X utf8 tools/assets/prepare_forest_assets.py "C:/path/to/Secondme asset"

The sources stay untouched. For every sheet this script:
  1. lifts the white paper background to transparency ("colour to alpha"), keeping
     soft glows soft and solid art fully opaque,
  2. finds each frame (row bands, then column gaps), ignoring captions,
  3. aligns frames on their solid core so animations don't jitter,
  4. writes one horizontal strip per sheet to public/assets/forest/ and the
     layout to src/game/data/forestAtlas.json.

The map background keeps only its upper (watermark-free) copy of the repeating tile.
Decoration props are split into separate items and packed into one atlas.
Needs only numpy + Pillow.
"""
from __future__ import annotations

import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT_IMG = ROOT / 'public' / 'assets' / 'forest'
OUT_JSON = ROOT / 'src' / 'game' / 'data' / 'forestAtlas.json'

# name: (file, anchor, fill enclosed light areas, max cell side in px, frames per row)
SHEETS = {
    'crusher':     ('Bẫy Nghiền Đá.png', 'center', True, 288, 4),
    'rocks':       ('Bẫy Đá Rơi & Vòng Cảnh Báo.png', 'center', False, 256, 3),
    'vines':       ('Dây Gai Rào Chắn.png', 'bottom', True, 256, 4),
    'spikes':      ('bẫy gai.png', 'bottom', True, 224, 6),
    'portalExit':  ('cổng kết thúc màn.png', 'bottom', True, 288, 3),
    'portalStart': ('cổng xuất phát.png', 'bottom', True, 288, 3),
    'door':        ('cửa.png', 'bottom', False, 320, 5),
    'button':      ('nút.png', 'center', True, 192, 5),
}
FLOOR = 0.035   # darkness below this is paper
SOLID = 0.30    # darkness above this is fully opaque art


def color_to_alpha(rgb: np.ndarray, fill_holes: bool, floor: float = FLOOR, shadows: bool = False) -> np.ndarray:
    """RGB uint8 -> RGBA float32 (0..1). Light pixels touching the paper become translucent.

    fill_holes keeps light areas enclosed by ink opaque (glowing cores), except bare paper
    showing through gaps (between vines, fence rails) and its anti-aliased rim.
    shadows turns pale grey drop shadows drawn on the paper into dark translucent ones,
    so they read as shadow on a dark forest floor instead of a white patch."""
    c = rgb.astype(np.float32) / 255.0
    dark = 1.0 - c.min(axis=2)
    light = dark < SOLID
    # Paper-connected light pixels: flood from the border through `light`.
    # .copy(): an image made by fromarray may share the numpy buffer, and floodfill then silently does nothing.
    m = Image.fromarray(np.pad(light, 1, constant_values=True).astype(np.uint8) * 128).copy()
    ImageDraw.floodfill(m, (0, 0), 255)
    outside = (np.asarray(m)[1:-1, 1:-1] == 255)
    if fill_holes:
        paper = (dark < 0.075) & (c.max(axis=2) - c.min(axis=2) < 0.055)
        near_paper = np.asarray(Image.fromarray(paper.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
        soft = outside | (light & near_paper)
    else:
        soft = light
    a = np.where(soft, np.clip((dark - floor) / (SOLID - floor), 0, 1), 1.0).astype(np.float32)
    safe = np.maximum(a, 1e-4)[..., None]
    col = np.clip((c - (1 - a[..., None])) / safe, 0, 1)
    if shadows:
        grey = soft & (c.max(axis=2) - c.min(axis=2) < 0.09) & (a < 0.98)
        col[grey] = (0.03, 0.07, 0.05)
        a = np.where(grey, a * 0.6, a)
    return np.dstack([col, a])


def bands(profile: np.ndarray, min_gap: int) -> list[tuple[int, int]]:
    """Runs of True in `profile`, merging runs separated by gaps shorter than min_gap."""
    runs, start, gap = [], None, 0
    for i, v in enumerate(profile):
        if v:
            if start is None:
                start = i
            gap, end = 0, i
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                runs.append((start, end + 1)); start = None
    if start is not None:
        runs.append((start, end + 1))
    return runs


def find_frames(alpha: np.ndarray, per_row: int) -> list[tuple[int, int, int, int]]:
    """Frame boxes (x0, y0, x1, y1) in reading order; drops captions and stray specks.

    Frames are laid out evenly but may touch, and glows / speed lines bridge the gaps, so
    each row is cut where the solid ink is thinnest near its even divisions."""
    mask = alpha > 0.6
    h, w = mask.shape
    rows = bands(mask.sum(1) > 2, 40)
    tallest = max(b - a for a, b in rows)
    rows = [r for r in rows if r[1] - r[0] > tallest * 0.45]
    boxes = []
    for ri, (y0, y1) in enumerate(rows):
        ry0 = 0 if ri == 0 else (rows[ri - 1][1] + y0) // 2
        ry1 = h if ri == len(rows) - 1 else (y1 + rows[ri + 1][0]) // 2
        prof = mask[y0:y1].sum(0).astype(float)
        xs = np.nonzero(prof > 1)[0]
        left, right = xs.min(), xs.max() + 1
        step = (right - left) / per_row
        smooth = np.convolve(prof, np.ones(5) / 5, mode='same')
        cuts = [0]
        for k in range(1, per_row):
            c = left + k * step
            lo, hi = int(c - step * 0.3), int(c + step * 0.3)
            cuts.append(lo + int(np.argmin(smooth[lo:hi])))
        cuts.append(w)
        for rx0, rx1 in zip(cuts, cuts[1:]):
            sub = alpha[ry0:ry1, rx0:rx1] > 0.02
            ys, xs = np.nonzero(sub)
            # Ignore captions or the next row's sparks inside the region.
            keep = (ys + ry0 >= y0 - (y1 - y0) * 0.25) & (ys + ry0 <= y1 + (y1 - y0) * 0.1)
            ys, xs = ys[keep], xs[keep]
            boxes.append((rx0 + xs.min(), ry0 + ys.min(), rx0 + xs.max() + 1, ry0 + ys.max() + 1))
    return boxes


def core_box(alpha: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(alpha > 0.9)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def to_image(rgba: np.ndarray) -> Image.Image:
    return Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA')


def build_strip(name: str, src: Path, anchor: str, fill: bool, max_side: int, per_row: int) -> dict:
    rgba = color_to_alpha(np.asarray(Image.open(src).convert('RGB')), fill)
    boxes = find_frames(rgba[..., 3], per_row)
    frames = []
    for x0, y0, x1, y1 in boxes:
        crop = rgba[y0:y1, x0:x1]
        cx0, cy0, cx1, cy1 = core_box(crop[..., 3])
        ax = (cx0 + cx1) / 2
        ay = cy1 if anchor == 'bottom' else (cy0 + cy1) / 2
        frames.append(dict(img=crop, ax=ax, ay=ay, core=(cx0, cy0, cx1, cy1)))
    left = max(f['ax'] for f in frames); right = max(f['img'].shape[1] - f['ax'] for f in frames)
    top = max(f['ay'] for f in frames); bottom = max(f['img'].shape[0] - f['ay'] for f in frames)
    cw, ch = left + right, top + bottom
    scale = min(1.0, max_side / max(cw, ch))
    cell_w, cell_h = int(np.ceil(cw * scale)) + 2, int(np.ceil(ch * scale)) + 2
    strip = Image.new('RGBA', (cell_w * len(frames), cell_h), (0, 0, 0, 0))
    cores = []
    for i, f in enumerate(frames):
        im = to_image(f['img'])
        # Premultiply before resampling so translucent edges don't pick up stray colour.
        im = im.convert('RGBa').resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                                       Image.LANCZOS).convert('RGBA')
        ox = 1 + (left - f['ax']) * scale; oy = 1 + (top - f['ay']) * scale
        strip.alpha_composite(im, (i * cell_w + round(ox), round(oy)))
        cx0, cy0, cx1, cy1 = f['core']
        cores.append([round(ox + cx0 * scale, 1), round(oy + cy0 * scale, 1),
                      round((cx1 - cx0) * scale, 1), round((cy1 - cy0) * scale, 1)])
    strip.save(OUT_IMG / f'{name}.png', optimize=True)
    return dict(file=f'{name}.png', frames=len(frames), w=cell_w, h=cell_h,
                anchor=[round(1 + left * scale, 1), round(1 + top * scale, 1)], cores=cores)


def build_ground(src: Path) -> dict:
    im = Image.open(src).convert('RGB')
    w, h = im.size
    # The sheet is one tile stacked twice (the Gemini mark sits in the lower copy), so the
    # upper half on its own repeats seamlessly top to bottom.
    tile = im.crop((0, 0, w, h // 2)).resize((1280, 640), Image.LANCZOS)
    tile.save(OUT_IMG / 'ground.jpg', quality=88, optimize=True, progressive=True)
    return dict(file='ground.jpg', w=1280, h=640)


def label_components(mask: np.ndarray) -> tuple[np.ndarray, list[tuple[int, int, int, int, int]]]:
    """4-connected components -> (label image, [(x0, y0, x1, y1, area)]), labels start at 1."""
    h, w = mask.shape
    labels = np.zeros(mask.shape, np.int32)
    out = []
    for y, x in zip(*np.nonzero(mask)):
        if labels[y, x]:
            continue
        n = len(out) + 1
        q = deque([(y, x)]); labels[y, x] = n
        x0 = x1 = x; y0 = y1 = y; area = 0
        while q:
            cy, cx = q.popleft(); area += 1
            x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                    labels[ny, nx] = n; q.append((ny, nx))
        out.append((x0, y0, x1 + 1, y1 + 1, area))
    return labels, out


def build_decor(src: Path) -> dict:
    rgb = np.asarray(Image.open(src).convert('RGB'))
    rgba = color_to_alpha(rgb, True, floor=0.07, shadows=True)   # JPEG noise sits a little darker than paper
    a = rgba[..., 3]
    # Group each prop with its pebbles/shadow: dilate, then label.
    m = np.asarray(Image.fromarray(((a > 0.12) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    labels, comps = label_components(m)
    found = sorted((c + (i + 1,) for i, c in enumerate(comps) if c[4] > 900), key=lambda c: (round(c[1] / 120), c[0]))
    items, crops, pad, x = [], [], 2, 0
    for x0, y0, x1, y1, _, n in found:
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] *= labels[y0:y1, x0:x1] == n   # this prop only, not a neighbour's edge
        crops.append(crop)
    height = max(c.shape[0] for c in crops)
    atlas = Image.new('RGBA', (sum(c.shape[1] + pad for c in crops), height), (0, 0, 0, 0))
    for c in crops:
        atlas.alpha_composite(to_image(c), (x, 0))
        items.append([x, 0, c.shape[1], c.shape[0]]); x += c.shape[1] + pad
    atlas.save(OUT_IMG / 'decor.png', optimize=True)
    return dict(file='decor.png', items=items)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    atlas = {name: build_strip(name, src / f, *opts) for name, (f, *opts) in SHEETS.items()}
    atlas['ground'] = build_ground(src / 'nền map.png')
    decor_source = next((src / name for name in ('trang tri map.jpg', 'trang trí map.jpg') if (src / name).is_file()), None)
    if decor_source is None:
        raise FileNotFoundError(f'Missing decoration sheet in {src}')
    atlas['decor'] = build_decor(decor_source)
    OUT_JSON.write_text(json.dumps(atlas, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for k, v in atlas.items():
        print(k, {kk: vv for kk, vv in v.items() if kk not in ('cores', 'items', 'anchor')}, len(v.get('items', [])) or '')


if __name__ == '__main__':
    main()
