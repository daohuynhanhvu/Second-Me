"""Main-menu painting: remove the painted wizard (src/components/MenuWizard.tsx walks the in-game Aeris in), and make the R rune blinkable.

Input   tools/assets/source/second-me-forest-clean.png   (the original painting, untouched)
Output  public/assets/menu/second-me-forest-clean.png     painting without the wizard, R rune unlit (engraved)
        public/assets/menu/rune-r-lit.png                  the original lit R, laid back on top and faded in/out

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
WIZARD_POLY = [(640, 610), (654, 622), (630, 640), (664, 651), (662, 667), (655, 673), (657, 744),
               (594, 744), (590, 669), (572, 655), (574, 639), (609, 627), (625, 610)]


def dilate(mask: np.ndarray, px: int) -> np.ndarray:
    img = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(px * 2 + 1))
    return np.asarray(img) > 0


def main() -> None:
    painting = Image.open(SRC).convert('RGB')
    assert painting.size == (1376, 768), painting.size
    im = np.asarray(painting).astype(np.float32)

    # R rune: the strokes themselves light up, no halo on the stone. The overlay keeps only the glyph
    # pixels (cyan > 95: the whole R without the spill); the base loses the spill and keeps the R engraved dark.
    x0, y0, x1, y1 = RUNE_BOX
    box = im[y0:y1, x0:x1]
    cyan = (box[..., 1] + box[..., 2]) / 2 - box[..., 0]
    glow = dilate(cyan > 70, 2)
    glyph = cyan > 95
    assert 150 < glow.sum() < box.shape[0] * box.shape[1] * .8, glow.sum()  # found the glyph, not the whole stone
    lit = np.dstack([box, glyph * 255]).astype(np.uint8)
    Image.fromarray(lit, 'RGBA').save(MENU / 'rune-r-lit.png')
    unlit = erase(box, glow, (0, 0, 12, box.shape[0]), strength=.3)  # grain from the stone's left edge
    unlit[glyph] *= .62
    im[y0:y1, x0:x1] = unlit

    # Wizard: refill the figure from the surrounding grass; the sprite stands on the same spot.
    hole_img = Image.new('L', painting.size, 0)
    ImageDraw.Draw(hole_img).polygon(WIZARD_POLY, fill=255)
    hole = dilate(np.asarray(hole_img) > 0, 3)
    im = erase(im, hole, (520, 690, 570, 740))

    Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(MENU / 'second-me-forest-clean.png')
    print('wrote', MENU / 'second-me-forest-clean.png', MENU / 'rune-r-lit.png')


if __name__ == '__main__':
    main()
