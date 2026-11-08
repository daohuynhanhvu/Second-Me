# Loading screen art

| File | Made by | From |
|---|---|---|
| `background.jpg` | `tools/assets/prepare_loading_screen.py` | `tools/assets/source/loading-mockup.png` (painted mockup; the live UI is erased from it) |
| `portal-swirl.png`, `portal-streaks.png` | same script | the mockup's portal vortex and its energy streaks, cut out for animation |
| `wizard-run.png` | `tools/assets/prepare_wizard_run.py` | `tools/assets/source/wizard-run-sheet.png` (8-frame run cycle) |
| `portal-arch.png`, `portal-front.png`, `bar-frame.png`, `title.png`, `background-empty.jpg` | `tools/assets/prepare_portal_transition.py` | `background.jpg`: the arch, the bar's stone channel and the title cut out as sprites, and the painting without them, for the portal transition |

The layout data lives in `src/game/data/loadingLayout.json` and `src/game/data/wizardRun.json`.
The code is in `src/game/loading/` (scene, preloader) and `src/components/LoadingScreen.tsx`.

The screen shows on the first load into the lobby (every asset) and whenever a level is
entered: picking a level, the next level, the boss, or Continue. A level load fetches only
the files that level uses and skips what is already loaded. Restarting a level stays instant.

Rebuild after changing a source image:

```bash
python -I -X utf8 tools/assets/prepare_wizard_run.py
python -I -X utf8 tools/assets/prepare_loading_screen.py
python -I -X utf8 tools/assets/prepare_portal_transition.py   # after prepare_loading_screen.py
```

## Portal transition

When loading has really finished (and the wizard has finished his stride), the screen plays
about 6.3 s: **move** (1.5 s) the arch slides to the screen centre while the title, the bar,
the percentage, the status lines and the caption sink away; **rotate** (1.5 s) the arch turns
about its vertical axis from the painted three-quarter view to face the camera; **activate**
(1.3 s) the stone rumbles, then the whole arch (stone, vines and vortex) bends into a
counter-clockwise spiral while chips break off and particles spiral in; **dive** (2.1 s) the
camera zooms in on the centre while the spiral winds tighter and faster and the arch is drawn
into the eye, the tunnel opens behind it, turquoise fills the screen and a white flash hands
over to the next screen, where `AdventureApp` fades it out. With reduced motion (or if the
transition art has not loaded) it is a plain fade.

There is no painted front view of the arch: `portal-front.png` is built from the painting by
mirroring the near pillar and the near half of the opening. The turn is a pseudo-3D slab:
pillar, opening and far pillar are column bands whose widths go from their painted
(foreshortened) widths to their front-on ones. The spiral is a WebGL fragment shader
(`src/game/loading/portalTwist.ts`) that warps the front-facing arch and vortex, redrawn into a
560 px layer each frame, along a counter-clockwise spiral, sampled nearest-neighbour so the
stones stay blocks of pixels. Without WebGL the arch just turns and shrinks in 2D. From 2x zoom
the dive renders at half resolution (same pixels).

## Dev checks (`pnpm dev` only; ignored in builds)

- The FPS / frame-time overlay shows in the top-left corner.
- `?loadDelay=250` delays each file by 250 ms, to watch progress the way it looks on a slow connection.
- `?holdLoading=1` keeps the screen up after 100%, for profiling.
- `?stress=4` multiplies particle counts by 4.
- In the console, `__loadingScene.transitionReport()` gives the real frame times of each transition stage.
- In the console, `__loadingScene.benchmark(200, true)` renders 200 frames back to back. It forces a GPU sync every frame and returns the per-frame cost.
