# Kael intermediate costumes

`kael-costumes.png` is an RGBA animation atlas reconstructed from the two costume references supplied for this change. It preserves the icy blond/silver/blue/navy and silver-haired black/purple costume designs.

The atlas is eight columns by eight rows. Rows 0–3: Iceblade Knight; rows 4–7: Voidflame Knight. Each costume has front walking, back walking, right walking and sword-slash rows, with eight frames each. Left is mirrored by the renderer. Coordinates are calculated from actual image dimensions. Assets load from Vite's base URL.

Runtime renderer: `src/game/rendering/knightOutfits.ts`. The same art is used in shop, character selection, player and Echo rendering. Combo attacks map each existing hit's timing onto the slash row. Combat geometry, damage, MP and cooldown values are unchanged. Additional sword, sanctuary, shield and pickup effects are tinted through cached palette sheets.

Shop IDs: `ice-knight`, `void-knight`. Both are swordsman-only, intermediate rarity, 100 coins, cap 1. Ownership is part of the existing campaign save; equipped choices use the existing per-hero outfit save. Legacy free palettes remain available. Restarting campaign progress retains paid outfits, as it retains existing cosmetics.
