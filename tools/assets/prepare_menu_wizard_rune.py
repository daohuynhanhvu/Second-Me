"""Main-menu painting: remove the painted wizard (src/components/MenuWizard.tsx walks the in-game Aeris in), and make the R rune blinkable.

Input   tools/assets/source/second-me-forest-clean.png   (the original painting, untouched)
Output  public/assets/menu/second-me-forest-clean.png     painting without the wizard, R, ᛟ and ᚠ runes unlit (engraved)
        public/assets/menu/rune-r-lit.png                  the R's lit strokes, laid back on top and faded in/out
        public/assets/menu/rune-othala-lit.png             the same for the ᛟ rune by the menu frame
        public/assets/menu/rune-fehu-lit.png               the same for the ᚠ rune at the far left

Coordinates are the painting's native 1376x768 pixels; IntroEffects.tsx places the overlays with the same numbers.
Run from the repo root: python tools/assets/prepare_menu_wizard_rune.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from inpaint import erase

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools/assets/source/second-me-forest-clean.png'
MENU = ROOT / 'public/assets/menu'

RUNE_BOX = (548, 484, 600, 566)          # x0, y0, x1, y1 around the R and its halo
OTHALA_BOX = (1274, 476, 1324, 534)      # the ᛟ rune by the menu frame, and its halo
FEHU_BOX = (42, 494, 90, 574)            # the ᚠ rune at the far left, and its halo
WIZARD_POLY = [(640, 610), (654, 622), (630, 640), (664, 651), (662, 667), (655, 673), (657, 744),
               (594, 744), (590, 669), (572, 655), (574, 639), (609, 627), (625, 610)]


def dilate(mask: np.ndarray, px: int) -> np.ndarray:
    img = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(px * 2 + 1))
    return np.asarray(img) > 0


def unlight_rune(im: np.ndarray, box_xy: tuple[int, int, int, int], glyph_of, grain_cols: slice, out: str, engrave: float = .62) -> None:
    """The strokes themselves light up, no halo on the stone: `out` keeps only the glyph pixels (lit, laid back on
    top by IntroEffects.tsx); the painting loses the halo and keeps the glyph engraved dark. Edits `im` in place."""
    x0, y0, x1, y1 = box_xy
    box = im[y0:y1, x0:x1]
    cyan = (box[..., 1] + box[..., 2]) / 2 - box[..., 0]
    glow = dilate(cyan > 70, 2)
    glyph = glyph_of(box, cyan)
    assert 150 < glow.sum() < box.shape[0] * box.shape[1] * .8, glow.sum()  # found the glyph, not the whole stone
    lit = np.dstack([box, glyph * 255]).astype(np.uint8)
    Image.fromarray(lit, 'RGBA').save(MENU / out)
    w = box.shape[1]
    gx = range(w)[grain_cols]
    unlit = erase(box, glow, (gx.start, 0, gx.stop, box.shape[0]), strength=.3)  # grain from plain stone at one side
    unlit[glyph] *= engrave
    im[y0:y1, x0:x1] = unlit


def main() -> None:
    painting = Image.open(SRC).convert('RGB')
    assert painting.size == (1376, 768), painting.size
    im = np.asarray(painting).astype(np.float32)

    # R: cyan > 95 is the whole R without the spill; stone grain from the box's left edge.
    unlight_rune(im, RUNE_BOX, lambda box, cyan: cyan > 95, slice(0, 12), 'rune-r-lit.png')
    # ᛟ: dimmer, so cyan cannot split strokes from halo; its strokes are the pixels with green > 150. The left
    # of its box is the dark vine pillar, so the stone grain comes from the right edge.
    unlight_rune(im, OTHALA_BOX, lambda box, cyan: box[..., 1] > 150, slice(-10, None), 'rune-othala-lit.png')  # same cut as the R, so both look alike when dark
    # ᚠ: like the ᛟ, its strokes are the pixels with green > 150; plain stone on the left of its box.
    unlight_rune(im, FEHU_BOX, lambda box, cyan: box[..., 1] > 150, slice(0, 10), 'rune-fehu-lit.png')

    # Wizard: refill the figure from the surrounding grass; the sprite stands on the same spot.
    hole_img = Image.new('L', painting.size, 0)
    ImageDraw.Draw(hole_img).polygon(WIZARD_POLY, fill=255)
    hole = dilate(np.asarray(hole_img) > 0, 3)
    im = erase(im, hole, (520, 690, 570, 740))

    Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(MENU / 'second-me-forest-clean.png')
    print('wrote', MENU / 'second-me-forest-clean.png', MENU / 'rune-r-lit.png', MENU / 'rune-othala-lit.png', MENU / 'rune-fehu-lit.png')


if __name__ == '__main__':
    main()
