# Loading screen art

| File | Made by | From |
|---|---|---|
| `background.jpg` | `tools/assets/prepare_loading_screen.py` | `tools/assets/source/loading-mockup.png` (painted mockup; the live UI is erased from it) |
| `portal-swirl.png`, `portal-streaks.png` | same script | the mockup's portal vortex and its energy streaks, cut out for animation |
| `wizard-run.png` | `tools/assets/prepare_wizard_run.py` | `tools/assets/source/wizard-run-sheet.png` (8-frame run cycle) |

The layout data lives in `src/game/data/loadingLayout.json` and `src/game/data/wizardRun.json`.
The code is in `src/game/loading/` (scene, preloader) and `src/components/LoadingScreen.tsx`.

The screen shows on the first load into the lobby (every asset) and whenever a level is
entered: picking a level, the next level, the boss, or Continue. A level load fetches only
the files that level uses and skips what is already loaded. Restarting a level stays instant.

Rebuild after changing a source image:

```bash
python -I -X utf8 tools/assets/prepare_wizard_run.py
python -I -X utf8 tools/assets/prepare_loading_screen.py
```

## Dev checks (`pnpm dev` only; ignored in builds)

- The FPS / frame-time overlay shows in the top-left corner.
- `?loadDelay=250` delays each file by 250 ms, to watch progress the way it looks on a slow connection.
- `?holdLoading=1` keeps the screen up after 100%, for profiling.
- `?stress=4` multiplies particle counts by 4.
- In the console, `__loadingScene.benchmark(200, true)` renders 200 frames back to back. It forces a GPU sync every frame and returns the per-frame cost.
