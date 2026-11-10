"""Effect GIFs -> transparent sprite sheets (one row, frames left to right) for src/game/rendering/vfx.ts.

Input   tools/assets/source/vfx/*.gif        (user-supplied effect animations, kept as they came)
Output  public/assets/effects/vfx-*.png      and a table of each sheet's cell size and frame count (printed;
                                             vfx.ts holds the same numbers and vfx.test.ts checks the files)

Two kinds of source:
  pixel   flat pixel art on one exact background colour -> that colour becomes transparent, nothing else changes
  glow    soft glows on a grey background -> un-blended from it (alpha = how far the pixel is from the background,
          colour = what it must have been before blending), so the glow sits on any scene without a grey box
Run from the repo root: python tools/assets/prepare_vfx_sheets.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools/assets/source/vfx'
OUT = ROOT / 'public/assets/effects'

# name: (source gif, kind, crop box in the gif or None, output cell width or None = as cropped, frames to keep)
SHEETS = {
    'vfx-shield-cross': ('holy-shield-cross.gif', 'pixel', None, None, slice(0, 11)),     # frame 11 is empty
    'vfx-sparkle': ('sparkle-burst.gif', 'pixel', None, None, slice(0, 12)),                  # frame 12 is empty
    'vfx-slash': ('crescent-slash.gif', 'pixel', None, None, slice(0, 7)),                 # frame 7 is empty
    'vfx-ground-ring': ('ground-ring.gif', 'pixel', None, None, slice(1, 11)),             # 0 and 11 are empty
    'vfx-hex-shield': ('hex-energy-shield.gif', 'glow', (23, 33, 455, 465), 144, slice(2, 20)),  # 0-1 a dot, 20 empty
    'vfx-time-clock': ('time-clock-circle.gif', 'glow', (16, 16, 176, 176), None, slice(0, 15)),   # frame 15 is empty
}


def frames_of(path: Path) -> list[np.ndarray]:
    return [np.asarray(f.convert('RGB')).astype(np.float32) for f in ImageSequence.Iterator(Image.open(path))]


def key_pixel(rgb: np.ndarray, bg: np.ndarray) -> np.ndarray:
    alpha = (np.abs(rgb - bg).sum(-1) > 0) * 255.0
    return np.dstack([rgb, alpha])


def unblend_glow(rgb: np.ndarray, bg: np.ndarray) -> np.ndarray:
    alpha = np.clip(((rgb - bg) / (255 - bg)).max(-1), 0, 1)
    alpha[alpha < 0.04] = 0                                   # GIF palette noise in the flat background
    colour = np.where(alpha[..., None] > 0, bg + (rgb - bg) / np.maximum(alpha[..., None], 1e-6), 0)
    return np.dstack([np.clip(colour, 0, 255), alpha * 255])


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (gif, kind, box, cell_w, keep) in SHEETS.items():
        frames = frames_of(SRC / gif)
        bg = frames[0][0, 0].copy()
        cells = []
        for rgb in frames[keep]:
            rgba = (key_pixel if kind == 'pixel' else unblend_glow)(rgb, bg)
            img = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
            if box:
                img = img.crop(box)
            if cell_w and cell_w != img.width:
                # Premultiplied while scaling, or transparent pixels' colour bleeds into the edges.
                img = img.convert('RGBa').resize((cell_w, round(img.height * cell_w / img.width)), Image.LANCZOS).convert('RGBA')
            cells.append(img)
        assert cells and any(c.getbbox() for c in cells), name
        assert cells[0].getbbox() and cells[-1].getbbox(), f'{name}: first and last kept frames must not be empty'
        w, h = cells[0].size
        sheet = Image.new('RGBA', (w * len(cells), h))
        for i, c in enumerate(cells):
            sheet.paste(c, (i * w, 0))
        sheet.save(OUT / f'{name}.png', optimize=True)
        print(f"{name}: {len(cells)} frames of {w}x{h}, {(OUT / f'{name}.png').stat().st_size // 1024} KB")


if __name__ == '__main__':
    main()
