# BlueWizard character animations

Copied from the user-provided `Second Me/BlueWizard Animations/BlueWizard` pack.
Original PNGs are preserved, with filenames normalized to `00.png`–`19.png`.

- `idle/`: 20 frames from `2BlueWizardIdle`, played at 16 fps.
- `walk/`: 20 frames from `2BlueWizardWalk`, played at 24 fps.

The renderer crops a shared transparent margin and anchors the feet at the existing
character position. Left movement mirrors the artwork. Up/down movement uses the
pack's original view because separate directional artwork is not supplied.
Echo reuses these animations with a translucent cyan filter.

Integration: `src/game/rendering/wizardSprite.ts`.
The original procedural character remains available while images load or if loading fails.
No license text was included in the supplied BlueWizard folder; this file does not
grant additional rights to the source artwork.
