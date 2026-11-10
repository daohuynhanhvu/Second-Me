import type { CSSProperties } from 'react';
import { MenuWizard } from './MenuWizard.tsx';

// All coordinates follow the supplied 1376 × 768 painting. The art and this
// overlay scale together, so the camera and the menu stay completely still.
// Centers of the isolated yellow and green glows removed from the original
// painting. Each now has its own drift and twinkle instead of a baked-in light.
const fireflies = [
  [972, 32, 'gold'], [1088, 51, 'gold'], [1011, 62, 'gold'], [1035, 69, 'gold'],
  [981, 75, 'gold'], [954, 87, 'gold'], [1060, 93, 'gold'], [976, 97, 'gold'],
  [948, 106, 'gold'], [999, 105, 'gold'], [996, 120, 'gold'], [1021, 135, 'gold'],
  [191, 239, 'gold'], [155, 259, 'gold'], [401, 274, 'mint'], [437, 295, 'mint'],
  [598, 281, 'mint'], [740, 293, 'gold'], [762, 299, 'mint'], [682, 299, 'mint'],
  [524, 311, 'mint'], [741, 317, 'gold'], [130, 319, 'gold'], [433, 339, 'gold'],
  [755, 340, 'mint'], [127, 350, 'gold'], [649, 351, 'gold'], [671, 354, 'mint'],
  [605, 360, 'gold'], [521, 363, 'gold'], [579, 367, 'gold'], [480, 372, 'gold'],
  [782, 377, 'mint'], [707, 395, 'mint'], [594, 399, 'mint'], [427, 400, 'mint'],
  [750, 402, 'gold'], [543, 407, 'gold'], [503, 410, 'gold'], [456, 412, 'mint'],
  [630, 416, 'gold'], [477, 450, 'gold'], [551, 456, 'mint'], [507, 464, 'gold'],
  [193, 477, 'mint'], [434, 481, 'mint'], [446, 511, 'gold'], [534, 528, 'gold'],
  [428, 537, 'gold'], [426, 555, 'mint'], [490, 579, 'gold'], [689, 557, 'mint'],
  [535, 547, 'mint'], [1343, 583, 'gold'], [848, 642, 'gold'], [1101, 696, 'gold'],
] as const;

const portalMotes = [
  [252, 325], [279, 323], [359, 332], [264, 334], [373, 335],
  [241, 350], [248, 349], [226, 362], [288, 364], [321, 374],
  [391, 380], [252, 379], [401, 395], [257, 424], [313, 427],
  [301, 434], [318, 433], [324, 447], [278, 451], [314, 472],
  [308, 487], [308, 489], [293, 497], [225, 551], [228, 550],
  [376, 578], [342, 333], [304, 461], [314, 452], [271, 533],
  [380, 548], [246, 578], [358, 578], [371, 601], [303, 533],
] as const;

// These soft plasma contours travel inward. The spiral lines in the painting
// remain untouched, and no element in the stone arch is transformed.
const plasmaContour = Array.from({ length: 96 }, (_, index) => {
  const angle = index / 96 * Math.PI * 2;
  const ripple = 1 + Math.sin(angle * 5) * .025 + Math.sin(angle * 9) * .015;
  const x = 309 + Math.cos(angle) * 84 * ripple;
  const y = 445 + Math.sin(angle) * 126 * ripple;
  return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(' ') + ' Z';

export function IntroEffects() {
  return <div className="intro-scene-effects" aria-hidden="true">
    <div className="intro-foliage-patch foliage-left"/>
    <div className="intro-foliage-patch foliage-center"/>
    <div className="intro-foliage-patch foliage-right"/>
    <svg className="intro-magic" viewBox="0 0 1376 768" preserveAspectRatio="none">
      <defs>
        <clipPath id="intro-portal-clip"><ellipse cx="309" cy="445" rx="105" ry="158"/></clipPath>
        <radialGradient id="intro-portal-light"><stop offset="0" stopColor="#bdffcb" stopOpacity=".23"/><stop offset=".55" stopColor="#2ae9bd" stopOpacity=".14"/><stop offset="1" stopColor="#19d5b2" stopOpacity="0"/></radialGradient>
        <radialGradient id="intro-portal-core"><stop offset="0" stopColor="#d7ffe5" stopOpacity=".62"/><stop offset=".38" stopColor="#52ffc9" stopOpacity=".32"/><stop offset="1" stopColor="#31e8b6" stopOpacity="0"/></radialGradient>
        <filter id="intro-soft-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
        <radialGradient id="intro-swirl-fade"><stop offset=".9" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
        {/* Solid out to 90%: the gold ring sits at 85-95% of the radius, so an earlier fade let the static painted gold show through. */}
        <mask id="intro-swirl-mask" maskUnits="userSpaceOnUse" x="180" y="260" width="260" height="380"><ellipse cx="309" cy="445" rx="108" ry="162" fill="url(#intro-swirl-fade)"/></mask>
      </defs>
      {/* The painted swirl itself (gold arms included) spins: a copy of the painting rotated about the
          portal centre in a frame stretched 1.5x vertically, so the ellipse maps onto itself; the
          feathered mask blends its edge into the static arch. */}
      <g mask="url(#intro-swirl-mask)">
        <g transform="translate(309 445) scale(1 1.5)">
          <g className="portal-swirl">
            <image href="/assets/menu/second-me-forest-clean.png" width="1376" height="768" transform="scale(1 .6667) translate(-309 -445)" preserveAspectRatio="none"/>
          </g>
        </g>
      </g>
      <ellipse className="portal-breath" cx="309" cy="445" rx="104" ry="157" fill="url(#intro-portal-light)"/>
      <g clipPath="url(#intro-portal-clip)">
        {[0, 1, 2].map(index => <g className="plasma-wave" style={{ animationDelay: `${index * -1.3}s` }} key={index}>
          <path d={plasmaContour} fill="none" stroke="#86ffda" strokeWidth="19" filter="url(#intro-soft-glow)"/>
          <path d={plasmaContour} fill="none" stroke="#d0ffe7" strokeWidth="2.8" opacity=".55"/>
        </g>)}
        <ellipse className="portal-core" cx="309" cy="445" rx="55" ry="82" fill="url(#intro-portal-core)"/>
        <g className="portal-motes">
          {portalMotes.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={1.4 + index % 4 * .35} fill={index % 5 === 0 ? '#e8ffc4' : '#9dffe6'} style={{
            '--mote-x': `${(309 - x) * .75}px`,
            '--mote-y': `${(445 - y) * .75}px`,
            '--mote-delay': `${-index * .43}s`,
            '--mote-duration': `${3.4 + index % 6 * .44}s`,
          } as CSSProperties}/>)}
        </g>
      </g>
      {/* The ᚠ at the far left: like the R and the ᛟ, its strokes alone light up, in step with them. */}
      <image className="rune-lit" href="/assets/menu/rune-fehu-lit.png" x="42" y="494" width="48" height="80" preserveAspectRatio="none"/>
      {/* Painting's R is baked unlit (tools/assets/prepare_menu_wizard_rune.py); this is the original lit R. */}
      <image className="rune-lit" href="/assets/menu/rune-r-lit.png" x="548" y="484" width="52" height="82" preserveAspectRatio="none"/>
      {/* The in-game Aeris walks out of the portal to where the painted wizard stood. */}
      <MenuWizard/>
      {/* The ᛟ by the menu frame works like the R (same script): its strokes alone light up, in step with the R. */}
      <image className="rune-lit" href="/assets/menu/rune-othala-lit.png" x="1274" y="476" width="50" height="58" preserveAspectRatio="none"/>
      <g className="intro-fireflies">
        {fireflies.map(([x, y, kind], index) => <circle key={index} cx={x} cy={y} r={kind === 'gold' ? 2.2 + index % 3 * .5 : 1.7 + index % 3 * .45} fill={kind === 'gold' ? '#ffe887' : '#83ffe1'} style={{
          '--fly-color': kind === 'gold' ? '#ffe078' : '#53f6d5',
          '--fly-delay': `${-index * .71}s`,
          '--fly-duration': `${6.4 + index % 7 * .61}s`,
          '--twinkle-duration': `${3.1 + index % 5 * .73}s`,
          '--fly-x1': `${index % 2 ? 10 + index % 8 : -11 - index % 7}px`,
          '--fly-y1': `${-9 - index % 9}px`,
          '--fly-x2': `${index % 3 ? -8 - index % 9 : 11 + index % 6}px`,
          '--fly-y2': `${-18 - index % 11}px`,
          '--fly-x3': `${index % 2 ? -5 - index % 8 : 8 + index % 6}px`,
          '--fly-y3': `${-5 - index % 6}px`,
        } as CSSProperties}/>)}
      </g>
    </svg>
  </div>;
}
