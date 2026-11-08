"""
Main-menu background from the painted mockup (tools/assets/source/main-menu-mockup.png).

    python -I -X utf8 tools/assets/prepare_main_menu.py

The mockup has its menu words painted onto the stone panel. They are erased here so the
game can draw real, translatable, keyboard-friendly buttons in the same spots
(src/components/MainMenu.tsx). The title stays painted. Each erased area is refilled
coarse-to-fine from the stone around it, then given back the slab's grain from a clean
stretch of the same panel. Needs only numpy + Pillow.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools' / 'assets' / 'source' / 'main-menu-mockup.png'
OUT = ROOT / 'public' / 'assets' / 'menu' / 'main-menu.jpg'

# Painted words (x0, y0, x1, y1) in the 1376x768 mockup, with their glow and shadow.
WORDS = [
    (919, 210, 1243, 308),   # START GAME, its highlight frame and the frame's glow (panel-wide)
    (986, 308, 1180, 358),   # CONTINUE
    (994, 382, 1170, 432),   # SETTINGS
    (1004, 456, 1162, 506),  # CREDITS
    (1040, 529, 1140, 581),  # QUIT
]
# Clean slab between the panel's frame and the words: its fine grain is measured here.
GRAIN = (924, 330, 984, 600)


def fill_smooth(img: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Pyramid fill: each level averages known neighbours; holes take the coarser level."""
    if min(img.shape[:2]) < 4 or not hole.any():
        out = img.copy()
        if hole.any():
            known = ~hole
            out[hole] = img[known].mean(0) if known.any() else 0
        return out
    h, w = hole.shape
    known = (~hole).astype(np.float32)
    # 2x2 weighted downsample (pad to even).
    ph, pw = h + h % 2, w + w % 2
    pi = np.zeros((ph, pw, 3), np.float32); pi[:h, :w] = img * known[..., None]
    pk = np.zeros((ph, pw), np.float32); pk[:h, :w] = known
    si = pi.reshape(ph // 2, 2, pw // 2, 2, 3).sum((1, 3))
    sk = pk.reshape(ph // 2, 2, pw // 2, 2).sum((1, 3))
    small = np.where(sk[..., None] > 0, si / np.maximum(sk, 1e-6)[..., None], 0)
    small = fill_smooth(small, sk == 0)
    up = small.repeat(2, 0).repeat(2, 1)[:h, :w]
    # Soften the block pattern of the upsample before using it.
    up = np.asarray(Image.fromarray(np.clip(up, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
    out = img.copy()
    out[hole] = up[hole]
    return out


def main() -> None:
    im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
    hole = np.zeros(im.shape[:2], bool)
    for x0, y0, x1, y1 in WORDS:
        hole[y0:y1, x0:x1] = True
    # Work on the panel only, so the fill takes its colour from the stone.
    px0, py0, px1, py1 = 905, 200, 1262, 610
    panel = im[py0:py1, px0:px1]
    ph = hole[py0:py1, px0:px1]
    smooth = fill_smooth(panel, ph)

    # Grain: fresh noise with the slab's own fine-grain strength (copying real stone repeats visibly).
    gx0, gy0, gx1, gy1 = GRAIN
    strip = im[gy0:gy1, gx0:gx1]
    blur = np.asarray(Image.fromarray(strip.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
    sigma = (strip - blur).reshape(-1, 3).std(0)
    rng = np.random.default_rng(7)
    lum = rng.normal(0, 1, panel.shape[:2]).astype(np.float32)
    lum = np.asarray(Image.fromarray(np.clip(lum * 40 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32)
    lum = (lum - lum.mean()) / max(lum.std(), 1e-6)
    grain = lum[..., None] * sigma[None, None, :] * 0.35  # sigma also counts cracks, so keep it subtle
    filled = np.where(ph[..., None], smooth + grain, panel)

    # Feather the seam: blend over a few pixels at each hole's edge.
    edge = np.asarray(Image.fromarray((ph * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32)[..., None] / 255
    edge = np.maximum(edge, ph[..., None].astype(np.float32))
    panel_out = filled * edge + panel * (1 - edge)

    out = im.copy()
    out[py0:py1, px0:px1] = panel_out
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT, quality=90, optimize=True, progressive=True)
    print('wrote', OUT.relative_to(ROOT), OUT.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
