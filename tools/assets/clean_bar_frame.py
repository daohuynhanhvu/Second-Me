"""
Cleans the loading bar's stone channel sprite (public/assets/loading/bar-frame.png, cut from the
painting by prepare_portal_transition.py) so it sits on any backdrop: the cut carries strips of
the painting's forest above and below the channel, and a smear of its erased streaks, which
show on the pixel forest the loading screen now draws (src/game/loading/pixelForest.ts).

    python -I -X utf8 tools/assets/clean_bar_frame.py   # after prepare_portal_transition.py

Rows between the channel's top and bottom ink lines are the channel itself; outside them the
painting's forest is dark teal (blue at least as strong as green), which the channel's mossy
stone and vines never are. Rewrites bar-frame.png in place (running it again changes nothing).
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BAR = ROOT / 'public' / 'assets' / 'loading' / 'bar-frame.png'
BAR_ROWS = (44, 121)
BAR_SMEAR = (440, 680, 46)       # x0, x1, above this row: the streaks' smear, where no vine reaches
BAR_MIN_PART = 40                # px: smaller leftover specks are dropped


def parts(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """4-connected components of `mask`: a label per pixel (0 = none) and each label's size."""
    lab = np.zeros(mask.shape, np.int32)
    sizes = [0]
    h, w = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n = len(sizes)
        lab[y0, x0] = n
        q, size = deque([(y0, x0)]), 0
        while q:
            y, x = q.popleft()
            size += 1
            for v, u in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= v < h and 0 <= u < w and mask[v, u] and not lab[v, u]:
                    lab[v, u] = n
                    q.append((v, u))
        sizes.append(size)
    return lab, np.array(sizes)


def main() -> None:
    im = np.asarray(Image.open(BAR).convert('RGBA')).copy()
    r, g, b = (im[..., i].astype(int) for i in range(3))
    yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]]
    lum = (3 * r + 6 * g + b) / 10
    channel = (yy >= BAR_ROWS[0]) & (yy <= BAR_ROWS[1])
    forest = (b >= g - 3) & (r < g - 8) & (lum < 62) & ~channel
    forest |= (yy < BAR_SMEAR[2]) & (xx >= BAR_SMEAR[0]) & (xx <= BAR_SMEAR[1])
    keep = (im[..., 3] > 0) & ~forest
    lab, sizes = parts(keep)
    keep &= sizes[lab] >= BAR_MIN_PART
    im[..., 3] = np.where(keep, 255, 0)
    Image.fromarray(im).save(BAR, optimize=True)
    print('cleaned', BAR.relative_to(ROOT))


if __name__ == '__main__':
    main()
