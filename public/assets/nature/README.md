# Nature scenery and animation atlases

Derived only from user-provided assets in `Second Me/`. The original sources are unchanged.

- `scenery.png`: 5 transparent 128px cells from Mossy Assets / Mossy Tileset / Mossy - Decorations&Hazards.png. In order: large mossy boulder, low boulder, tall boulder, fern, moss rosette.
- `blueFlower.png`: 20 frames sampled every third frame from Plant Animations / Plant Animations / BlueFlower1. 10 columns, 128px cells, 10 fps.
- `glowPlant.png`: 30 frames sampled every third frame from Plant Animations / Plant Animations / Plant 1. 10 columns, 128px cells, 10 fps. The API name describes its scene role; the source is green swaying reeds without baked light.

All frames retain a shared crop, preserve aspect ratio and keep transparent padding. No color replacement or generated artwork is used. These packs use side-view artwork: scenery belongs on collision boundaries or outside walkable space, not as false obstacles on paths.

Rebuild with `node tools/prepare-nature-assets.cjs "path/to/Second Me"`. The script requires `sharp` and can also find the bundled Codex runtime dependency on Windows. No license text was present in the supplied Mossy/Plant folders; this provenance file does not grant rights to the source artwork.
