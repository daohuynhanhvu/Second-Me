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

function spiralPath(phase: number) {
  return Array.from({ length: 110 }, (_, index) => {
    const t = index / 109;
    const radius = 7 + 121 * t;
    const angle = phase + t * Math.PI * 4.6;
    const x = 309 + Math.cos(angle) * radius * 0.77;
    const y = 445 + Math.sin(angle) * radius * 1.18;
    return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

const spirals = [0, Math.PI * 2 / 3, Math.PI * 4 / 3].map(spiralPath);

export function IntroEffects() {
  return <div className="intro-scene-effects" aria-hidden="true">
    <div className="intro-foliage-patch foliage-left"/>
    <div className="intro-foliage-patch foliage-center"/>
    <div className="intro-foliage-patch foliage-right"/>
    <svg className="intro-magic" viewBox="0 0 1376 768" preserveAspectRatio="none">
      <defs>
        <clipPath id="intro-portal-clip"><ellipse cx="309" cy="445" rx="105" ry="158"/></clipPath>
        <radialGradient id="intro-portal-light"><stop offset="0" stopColor="#bdffcb" stopOpacity=".23"/><stop offset=".55" stopColor="#2ae9bd" stopOpacity=".14"/><stop offset="1" stopColor="#19d5b2" stopOpacity="0"/></radialGradient>
        <filter id="intro-soft-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
      </defs>
      <ellipse className="portal-breath" cx="309" cy="445" rx="104" ry="157" fill="url(#intro-portal-light)"/>
      <g clipPath="url(#intro-portal-clip)">
        <g className="portal-vortex">
          {spirals.map((path, index) => <g key={index}>
            <path d={path} fill="none" stroke={index === 0 ? '#dbffb1' : '#60f4d0'} strokeWidth="13" strokeLinecap="round" opacity=".46" filter="url(#intro-soft-glow)"/>
            <path d={path} fill="none" stroke={index === 0 ? '#e7ffb6' : '#8dffe1'} strokeWidth={index === 0 ? 2.8 : 1.9} strokeLinecap="round" opacity=".55"/>
          </g>)}
        </g>
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
