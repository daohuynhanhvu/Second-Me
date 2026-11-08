# Hand-drawn forest art

Made only from the user's "Secondme asset" sheets. The source files are not changed.

| File | Source | Frames | Used for |
|---|---|---|---|
| `crusher.png` | Bẫy Nghiền Đá | 4: open, slamming, shut, reopening | crusher traps |
| `spikes.png` | bẫy gai | 6: down → tips → up → stab → retract | spike traps |
| `rocks.png` | Bẫy Đá Rơi & Vòng Cảnh Báo | 3: warning ring, boulder, rubble | falling-rock traps |
| `vines.png` | Dây Gai Rào Chắn | 4: sprout, grown, dense, withered (dense is used) | slowing vines |
| `door.png` | cửa | 5: shut → fully open | rune gates |
| `button.png` | nút | 5: raised → pressed and glowing | rune pressure plates |
| `portalStart.png` | cổng xuất phát | 6: summoning sequence | player spawn |
| `portalExit.png` | cổng kết thúc màn | 6: dormant → open vortex | level exit |
| `ground.jpg` | nền map (upper copy of the repeating tile, without the generator mark) | – | forest floor |
| `decor.png` | trang trí map | 33 props | floor clutter, wall-block props, border props |

Each strip is one row of equal cells. The white paper is converted to transparency, and
frames are aligned on their solid core so animations don't jitter. Cell sizes, anchors and
core boxes are in `src/game/data/forestAtlas.json`, and prop groups are in
`src/game/rendering/forestSprites.ts`.

Rebuild after changing a sheet:

```bash
python -I -X utf8 tools/assets/prepare_forest_assets.py "path/to/Secondme asset"
```

It needs only numpy and Pillow.
