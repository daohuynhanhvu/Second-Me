# pixelfx effects

`public/assets/effects/ice-spikes.png` is the sprite sheet of the `ice/ice-spikes` effect from
[pixelfx](https://github.com/patch-gg/pixelfx) (MIT, see `LICENSE` here), exported with:

    node tools/render.mjs ice/ice-spikes --sheet

`ice-spikes.json` is the sheet's Aseprite-style description: 91 frames of 264 x 112, 30 fps, 7 columns,
one-shot, pivot (24, 96) = where the frost line starts on the ground; the effect runs to the right of it.

`public/assets/effects/arcane-orb.png` is `arcane/arcane-orb` (Aeris's spell bolts), exported with:

    node tools/render.mjs arcane/arcane-orb --sheet

`arcane-orb.json` describes the export: 72 frames of 136 x 112, 30 fps, looping. Each frame was then cropped to
the orb, x 28..108 and y 8..76 (80 x 68, 8 columns): this drops the light it casts on the ground. The orb's
centre is (40, 44) in the cropped cell (68, 52 in the original).
The orb itself is adapted by pixelfx from Sprite Fusion's open-source energy orb
(https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.

`public/assets/effects/fx/*.png` are the 31 effects listed in `tools/assets/prepare_pixelfx.py` (UPGRADE_PLAN.md §8),
exported with `node tools/render.mjs <ids> --sheet` and then cropped and re-packed by that script, which also writes
`src/game/data/pixelfx.json` (cell size, frames, fps, loop, columns, pivot in the crop).
