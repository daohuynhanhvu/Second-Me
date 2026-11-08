"""Shared helpers for the combo sprite sheets: checkerboard removal and per-cell measurements."""
import numpy as np
from PIL import Image, ImageFilter

COLS, ROWS = 6, 4


def _uniform(a: np.ndarray) -> np.ndarray:
    """Pixels whose 5x5 neighbourhood is flat (inside a checker tile, not on a sprite edge)."""
    lum = (a @ np.array([0.3, 0.59, 0.11])).astype(np.float32)
    img = Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8))
    hi = np.asarray(img.filter(ImageFilter.MaxFilter(5))).astype(np.float32)
    lo = np.asarray(img.filter(ImageFilter.MinFilter(5))).astype(np.float32)
    return (hi - lo) < 5


def checker_model(a: np.ndarray, period: int):
    """Finds the baked-in checkerboard's phase and two colours (sampled only inside flat tile
    areas, so the sprites' own greys and inks never count). Returns the predicted background
    colour per pixel, a mask of pixels within 2 px of a tile boundary, and the parameters."""
    h, w, _ = a.shape
    lum = a @ np.array([0.3, 0.59, 0.11])
    sat = a.max(2) - a.min(2)
    flat = (sat < 18) & (lum < 110) & _uniform(a)
    yy, xx = np.mgrid[0:h, 0:w]
    best = None
    for ox in range(period):
        for oy in range(period):
            par = (((xx + ox) // period + (yy + oy) // period) & 1).astype(bool)
            l0, l1 = lum[flat & ~par], lum[flat & par]
            if len(l0) < 100 or len(l1) < 100:
                continue
            score = abs(np.median(l0) - np.median(l1)) - (l0.std() + l1.std())
            if best is None or score > best[0]:
                best = (score, ox, oy, par)
    _, ox, oy, par = best
    c0 = np.median(a[flat & ~par], 0); c1 = np.median(a[flat & par], 0)
    fx, fy = (xx + ox) % period, (yy + oy) % period
    near_edge = (np.minimum(fx, period - 1 - fx) < 2) | (np.minimum(fy, period - 1 - fy) < 2)
    return np.where(par[..., None], c1, c0), near_edge, (ox, oy, c0, c1)


def _components(mask: np.ndarray):
    """4-connected components of a boolean mask: (labels, count). Plain BFS (numpy + stdlib only)."""
    from collections import deque
    h, w = mask.shape
    labels = np.zeros((h, w), np.int32)
    n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if labels[y0, x0]:
            continue
        n += 1
        labels[y0, x0] = n
        q = deque([(y0, x0)])
        while q:
            y, x = q.popleft()
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                    labels[ny, nx] = n
                    q.append((ny, nx))
    return labels, n


def tile_colours(a: np.ndarray):
    """The checkerboard's two colours: medians of the flat, unsaturated pixels split by brightness."""
    lum = a @ np.array([0.3, 0.59, 0.11])
    sat = a.max(2) - a.min(2)
    flat = (sat < 18) & (lum < 110) & _uniform(a)
    mid = (np.percentile(lum[flat], 10) + np.percentile(lum[flat], 90)) / 2
    return np.median(a[flat & (lum < mid)], 0), np.median(a[flat & (lum >= mid)], 0)


def foreground(a: np.ndarray, c0: np.ndarray, c1: np.ndarray, period: int, tol: float = 8):
    """True where a cell has sprite or effect pixels, not the baked-in checkerboard.

    A pixel *matches* the background when its colour is one of the two tile colours, or a blend
    of them (JPEG smears tile boundaries) — position is not used, because these sheets are
    pasted together and the checker phase shifts inside cells. Matching pixels are removed
    only when they are background in fact: connected to the cell's edge, or an enclosed pocket
    (inside a sword trail, between staff and body) holding both tile colours. Sprite pixels
    that come close to a tile colour (a dark eye, the shadow in a hood) are enclosed and
    one-coloured, so they stay."""
    d = c1 - c0
    t = np.clip(((a - c0) @ d) / (d @ d), 0, 1)
    resid = np.abs(a - (c0 + t[..., None] * d)).max(2)
    near0 = np.abs(a - c0).max(2) < tol
    near1 = np.abs(a - c1).max(2) < tol
    match = near0 | near1 | (resid < tol - 1)
    labels, n = _components(match)
    edge_ids = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    flat_ids = labels.ravel()
    sizes = np.bincount(flat_ids, minlength=n + 1)
    n0 = np.bincount(flat_ids, weights=near0.ravel().astype(np.float64), minlength=n + 1)
    n1 = np.bincount(flat_ids, weights=near1.ravel().astype(np.float64), minlength=n + 1)
    keep_bg = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        both = n0[i] > sizes[i] * 0.15 and n1[i] > sizes[i] * 0.15
        keep_bg[i] = i in edge_ids or (sizes[i] >= period * period * 0.4 and both)
    bg = keep_bg[labels] & match
    fg = ~bg
    # Drop specks (JPEG noise) but keep bright magic sparks.
    img = Image.fromarray(fg.astype(np.uint8) * 255)
    opened = np.asarray(img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))) > 0
    sat = a.max(2) - a.min(2)
    bright = (a.max(2) > 150) | (sat > 70)
    return (opened | (fg & bright)) & fg


def sheet_foreground(a: np.ndarray, period: int) -> np.ndarray:
    """foreground() cell by cell (each cell's edge is where the background is certain)."""
    h, w, _ = a.shape
    c0, c1 = tile_colours(a)
    out = np.zeros((h, w), bool)
    for r in range(ROWS):
        for c in range(COLS):
            x0, y0, x1, y1 = cell(r, c, w, h)
            out[y0:y1, x0:x1] = foreground(a[y0:y1, x0:x1], c0, c1, period)
    return out


def cell(r: int, c: int, w: int, h: int):
    cw, ch = w // COLS, h // ROWS
    return c * cw, r * ch, (c + 1) * cw, (r + 1) * ch


def frames_by_component(fg: np.ndarray, row_edges, col_edges, link: int = 5):
    """Splits a sheet's foreground into frames: pixels are grouped into blobs (linked across
    gaps up to `link` px, so sparks stay with their caster) and each blob goes to the grid cell
    holding its centre. A frame may reach past its cell (a long sword trail) without being cut,
    and a neighbour's trail reaching into the cell is not taken. Returns {(row, col): mask}."""
    linked = np.asarray(Image.fromarray(fg.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(link))) > 0
    labels, n = _components(linked)
    labels = np.where(fg, labels, 0)
    ys, xs = np.nonzero(labels)
    ids = labels[ys, xs]
    count = np.bincount(ids, minlength=n + 1).astype(np.float64)
    cy = np.bincount(ids, weights=ys, minlength=n + 1) / np.maximum(count, 1)
    cx = np.bincount(ids, weights=xs, minlength=n + 1) / np.maximum(count, 1)
    row_of = np.clip(np.searchsorted(row_edges, cy, side='right') - 1, 0, len(row_edges) - 2)
    col_of = np.clip(np.searchsorted(col_edges, cx, side='right') - 1, 0, len(col_edges) - 2)
    out = {}
    for r in range(len(row_edges) - 1):
        for c in range(len(col_edges) - 1):
            keep = np.zeros(n + 1, bool)
            keep[1:] = (row_of[1:] == r) & (col_of[1:] == c) & (count[1:] > 0)
            out[(r, c)] = keep[labels]
    return out


def frames_by_cuts(fg: np.ndarray, row_edges, cols: int = COLS, search: int = 45):
    """Splits a sheet into frames along the emptiest columns: in each row band, the cut between
    two neighbouring frames is the column with the fewest sprite pixels within `search` px of
    the even split, so a sword trail or a magic circle touching its neighbour is cut where the
    two are thinnest instead of mid-character. Returns {(row, col): (x0, y0, x1, y1)}."""
    h, w = fg.shape
    out = {}
    pitch = w / cols
    for r in range(len(row_edges) - 1):
        y0, y1 = row_edges[r], row_edges[r + 1]
        proj = fg[y0:y1].sum(0)
        cuts = [0]
        for c in range(1, cols):
            b = int(round(c * pitch))
            lo, hi = b - search, b + search
            cuts.append(lo + int(np.argmin(proj[lo:hi])))
        cuts.append(w)
        for c in range(cols):
            out[(r, c)] = (cuts[c], y0, cuts[c + 1], y1)
    return out


def head_mask(name: str, a: np.ndarray) -> np.ndarray:
    """Kael's yellow hair or Aeris's blue hood: the most stable part to line frames up on."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if name == 'kael':
        return (r > 170) & (g > 120) & (b < 90) & (r > g)
    return (b > r + 35) & (b > g + 12) & (b < 200) & ((a @ np.array([0.3, 0.59, 0.11])) < 120)


def measure(name: str, a: np.ndarray, fg: np.ndarray, box):
    """Head centre x, head top y and feet y (lowest sprite pixel under the head) in sheet px."""
    x0, y0, x1, y1 = box
    m = head_mask(name, a[y0:y1, x0:x1]) & fg[y0:y1, x0:x1]
    ys, xs = np.nonzero(m)
    if len(ys) < 20:
        return None
    top = ys.min()
    hx = xs[ys < top + 25].mean()
    f = fg[y0:y1, x0:x1]
    under = f[:, max(0, int(hx) - 28):int(hx) + 28]
    rows = np.nonzero(under.sum(1) >= 3)[0]
    return x0 + hx, y0 + top, y0 + rows.max()
