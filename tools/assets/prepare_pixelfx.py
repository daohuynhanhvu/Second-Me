"""pixelfx sprite sheets -> sheets cropped to what the effect draws, for src/game/rendering/pixelfx.ts.

Input   <pixelfx>/records/<category>/<name>/<name>.png + .json   (node tools/render.mjs <ids> --sheet, see
        tools/assets/source/pixelfx/SOURCE.md and UPGRADE_PLAN.md §8)
Output  public/assets/effects/fx/<name>.png   every frame cropped to the box all frames fit in, re-packed in rows
        (256-colour palette PNG, see FULL_COLOUR)
        src/game/data/pixelfx.json             per effect: cell size, frames, fps, loop, columns, pivot (in the crop)
        IDS are the game's effects, INTRO the intro film's (some trimmed, see there)
Run from the repo root: python tools/assets/prepare_pixelfx.py C:/Users/Lenovo/Downloads/pixelfx
"""
import json, math, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/effects/fx'
TABLE = ROOT / 'src/game/data/pixelfx.json'
IDS = ('impacts/hit-spark impacts/crit-hit impacts/shield-block impacts/parry impacts/ground-slam melee/spin-slash '
       'melee/heavy-cleave moves/dash-strike projectiles/energy-disc holy/heal-aoe holy/holy-pillar holy/sunburst '
       'holy/smite holy/divine-shield arcane/spell-charge arcane/mana-burst arcane/blink-out arcane/blink-in '
       'arcane/arcane-beam arcane/time-stop ice/frost-nova ice/ice-lance ice/icicle-fall ice/ice-shatter '
       'ice/blizzard-vortex status/rage status/haste status/burning status/frozen fire/fireball '
       'lightning/lightning-strike').split()

# The intro film (INTRO_PLAN.md). Full-screen weather is only needed for one scene, not its whole 8-12 s loop:
# `seconds` keeps the start, `step` keeps every n-th frame (15 fps), `bottom` cuts off the strip of ground each
# weather effect draws along its foot (it shows above the film's letterbox and matches none of its scenes).
INTRO = {
    'weather/god-rays': dict(seconds=5.6, step=2, bottom=168), 'weather/fireflies': dict(seconds=5.6, step=2, bottom=150),
    'weather/fog': dict(seconds=5.6, step=2),
    'weather/snow': dict(seconds=7.6, step=2, bottom=158), 'weather/blizzard': dict(seconds=3, step=2, bottom=158),
    'weather/shooting-stars': dict(seconds=6.6, step=2), 'arcane/rune-circle': {}, 'arcane/magic-circle-cast': {},
    'holy/halo': {}, 'impacts/heavy-landing': {}, 'melee/sword-slash': {}, 'projectiles/magic-missile': {},
    'pickups/collect-burst': {}, 'transitions/pixel-dissolve': {}, 'transitions/shatter-wipe': {}, 'transitions/star-iris': {},
}

# 256-colour PNGs are 6-8x smaller and look the same (checked side by side), except where a wide soft
# gradient bands into rings: the lightning strike's darkened sky keeps all its colours.
FULL_COLOUR = {'lightning-strike'}

def main(pixelfx: Path):
    OUT.mkdir(parents=True, exist_ok=True)
    table = {}
    for fid in IDS + list(INTRO):
        name, o = fid.split('/')[1], INTRO.get(fid, {})
        src = pixelfx / 'records' / fid / name
        m = json.loads(src.with_suffix('.json').read_text())['meta']['pixelfx']
        sheet = Image.open(src.with_suffix('.png')).convert('RGBA')
        (W, H), C, N = m['frameSize'], m['columns'], m['frames']
        step, fps = o.get('step', 1), m['fps']
        keep = range(0, min(N, round(o['seconds'] * fps)) if 'seconds' in o else N, step)
        cells = [sheet.crop(((i % C) * W, (i // C) * H, (i % C) * W + W, (i // C) * H + o.get('bottom', H))) for i in keep]
        N, fps = len(cells), fps / step
        boxes = [c.getbbox() for c in cells if c.getbbox()]
        x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
        x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
        w, h = x1 - x0, y1 - y0
        cols = max(1, min(N, math.ceil(math.sqrt(N * h / w))))   # roughly square sheet
        out = Image.new('RGBA', (w * cols, h * math.ceil(N / cols)))
        for i, c in enumerate(cells):
            out.paste(c.crop((x0, y0, x1, y1)), ((i % cols) * w, (i // cols) * h))
        if name not in FULL_COLOUR: out = out.quantize(256, method=Image.Quantize.FASTOCTREE)
        out.save(OUT / f'{name}.png', optimize=True)
        table[name] = {'id': fid, 'w': w, 'h': h, 'frames': N, 'fps': fps, 'loop': m['loop'], 'columns': cols,
                       'pivot': [m['pivot'][0] - x0, m['pivot'][1] - y0]}
        print(f'{fid:28s} {w}x{h} x{N} -> {(OUT / f"{name}.png").stat().st_size // 1024} KB')
    TABLE.write_text(json.dumps(table, indent=1) + '\n')

if __name__ == '__main__':
    main(Path(sys.argv[1]))
