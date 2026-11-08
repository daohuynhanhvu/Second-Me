import type { CSSProperties } from 'react';

// All coordinates follow the supplied 1376 × 768 painting. The art and this
// overlay scale together, so the camera and the menu stay completely still.
const fireflies = [
  [154, 256, 2.1, 0.3], [190, 237, 1.6, 2.2], [114, 374, 2.1, 1.1],
  [175, 352, 2.3, 3.7], [432, 337, 2.7, 0.9], [475, 371, 3.2, 2.8],
  [510, 407, 2.5, 4.1], [522, 344, 2, 1.8], [580, 363, 2.1, 0.4],
  [605, 351, 2.6, 3.2], [738, 309, 2.2, 1.6], [740, 343, 1.6, 4.7],
  [676, 393, 1.7, 2.5], [497, 529, 2.8, 0.7], [434, 533, 1.8, 3.4],
  [141, 514, 1.6, 2.9], [202, 580, 2.1, 1.3], [648, 508, 2.2, 4.3],
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
      </defs>
      <ellipse className="portal-breath" cx="309" cy="445" rx="104" ry="157" fill="url(#intro-portal-light)"/>
      <g clipPath="url(#intro-portal-clip)">
        {[0, 1, 2].map(index => <g className="plasma-wave" style={{ animationDelay: `${index * -1.3}s` }} key={index}>
          <path d={plasmaContour} fill="none" stroke="#86ffda" strokeWidth="19" filter="url(#intro-soft-glow)"/>
          <path d={plasmaContour} fill="none" stroke="#d0ffe7" strokeWidth="2.8" opacity=".55"/>
        </g>)}
        <ellipse className="portal-core" cx="309" cy="445" rx="55" ry="82" fill="url(#intro-portal-core)"/>
      </g>
      <g className="rune-glow rune-one" fill="none" stroke="#86fff0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M63 548 L53 508 L69 521 M55 518 L67 525"/>
      </g>
      <g className="rune-glow rune-two" fill="none" stroke="#86fff0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M568 546 L562 506 L585 520 L566 532 M566 532 L583 549"/>
      </g>
      <g className="rune-glow rune-three" fill="none" stroke="#86fff0" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1299 521 L1312 487 L1291 501 L1307 510 M1301 520 L1288 537"/>
      </g>
      <g className="intro-fireflies">
        {fireflies.map(([x, y, radius, delay], index) => <circle key={index} cx={x} cy={y} r={radius} fill="#ffe887" style={{ '--fly-delay': `${delay}s`, '--fly-duration': `${5 + index % 5}s`, '--fly-x': `${(index % 3 - 1) * 12}px` } as CSSProperties}/>)}
      </g>
    </svg>
  </div>;
}
