# Magic effects used in SECOND ME

Artwork: **Super Pixel Effects Gigapack (Free Version) — Will Tice / unTied Games**.

These are unchanged PNG spritesheets selected from the pack supplied in
`Second Me/Super Pixel Effects Gigapack (Free Version) v3.2.0`.
Only three sheets are shipped; individual source frames are not duplicated.
The original license summary is preserved in `license.txt`, and original frame
coordinates are preserved in each `*.frames.txt` file.

| Runtime file | Source animation | Frame size | Layout | Frames | Duration at 15 fps |
| --- | --- | --- | --- | --- | --- |
| summon.png | Sci-fi/scifi_warp_003/scifi_warp_003_small_blue | 64 × 64 | 12 columns, 1 row | 12 | 0.8 seconds |
| rune.png | Magic Bursts/round_sparkle_burst_002/round_sparkle_burst_002_small_green | 32 × 32 | 18 columns, 1 row | 18 | 1.2 seconds |
| sparkle.png | Fantasy Spells/status_sparkling_001/status_sparkling_001_small_yellow | 48 × 48 | 5 columns, 5 rows (last cell unused) | 24 | 1.6 seconds |

The PNGs total 27,157 bytes. The artist recommends 15 fps; the renderer preserves
that timing. Cyan summon and green activation are one-shot animations. Gold
sparkles loop for the exit portal. The runtime does not recolor the originals.

## Integration

`src/game/rendering/magicEffects.ts` exposes:

- `loadMagicEffects()` — starts the three image loads once, returns a promise
  resolving to whether all sheets loaded. Rendering safely skips missing sheets.
- `drawMagicLoop(ctx, 'sparkle', x, y, gameTimeSeconds, options)` — ambient loop.
- `drawMagicBurst(ctx, 'summon' | 'rune', x, y, elapsedSeconds, options)` — one-shot
  effect; returns false before the event, after its end, or before the image loads.
- `getMagicDuration(kind)` — effect lifetime, in seconds.

`options` supports `size` (square side in world pixels) and `alpha`. Loops also
support a deterministic `phase` offset in seconds. All effects are centered on
the supplied point. Use game time rather than wall time so pausing freezes them.

## Attribution

Include the following in the game's visible credits:

> Super Pixel Effects Gigapack — Will Tice / unTied Games

Creator: https://untiedgames.itch.io/super-pixel-effects-gigapack
The included license links to its full terms at
http://untiedgames.com/files/license.txt.
