"""Home-screen icons (iPhone "Add to Home Screen", Android install): Aeris facing the viewer on forest green.

Input   public/assets/aeris/Aeris_Walk.png      (row 2, frame 0: the front view the hero select uses)
Output  public/icons/icon-512.png, public/icons/apple-touch-icon.png (180 px)
Run from the repo root: python tools/assets/prepare_app_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/icons'
FRONT = (57, 538, 201, 751)  # opaque bounds of the front frame in the sheet


def icon(size: int) -> Image.Image:
    img = Image.new('RGBA', (size, size), '#0b1f16')  # opaque: iOS paints transparency black
    d = ImageDraw.Draw(img)
    rim = max(4, size // 32)
    d.rectangle([rim, rim, size - rim - 1, size - rim - 1], outline='#e6c46e', width=rim)
    hero = Image.open(ROOT / 'public/assets/aeris/Aeris_Walk.png').convert('RGBA').crop(FRONT)
    hero.putalpha(hero.getchannel('A').point(lambda a: 255 if a >= 180 else 0))  # the game's hard edge
    k = size * 0.72 / hero.height
    hero = hero.resize((round(hero.width * k), round(hero.height * k)), Image.NEAREST)
    img.alpha_composite(hero, ((size - hero.width) // 2, (size - hero.height) // 2 + size // 40))
    return img.convert('RGB')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon(512).save(OUT / 'icon-512.png')
    icon(180).save(OUT / 'apple-touch-icon.png')
    print('wrote', OUT / 'icon-512.png', OUT / 'apple-touch-icon.png')


if __name__ == '__main__':
    main()
