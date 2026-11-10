import { useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import './BossIntro.css';

// Snowflakes: fixed spread (no randomness, so every showing looks the same and nothing re-rolls on render).
const SNOW = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100, size: 2 + (i % 3) * 2, delay: -((i * 0.61) % 6), duration: 5 + (i % 5) * 1.3, drift: (i % 2 ? 1 : -1) * (8 + (i % 4) * 6),
}));

/**
 * Boss cutscene before the Frost Guardian fight: a frost band sweeps across, the Guardian lands on the right
 * (screen shake, snow burst) and breathes in its idle loop, its name stamps in on the left, then the briefing
 * and the start button rise in. ~2.9 s; a tap anywhere skips to the end. Enter still starts the fight (engine).
 */
export function BossIntro({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const vi = hud.language === 'vi';
  const [skipped, setSkipped] = useState(false);
  return <div className={`boss-cut${skipped || hud.reducedMotion ? ' is-skipped' : ''}`} role="dialog" aria-modal="true" aria-labelledby="boss-intro-name"
    onPointerDown={() => setSkipped(true)}>
    <div className="boss-cut-snow" aria-hidden="true">
      {SNOW.map((f, i) => <i key={i} style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s`, '--drift': `${f.drift}px` } as CSSProperties}/>)}
    </div>
    <div className="boss-cut-band" aria-hidden="true"><i/><i/></div>
    <div className="boss-cut-guardian" aria-hidden="true"><div className="boss-cut-sprite"/><div className="boss-cut-burst"/></div>

    <section className="boss-cut-copy">
      <span className="boss-cut-eyebrow">{vi ? 'ĐẤU TRƯỜNG CUỐI · VI' : 'FINAL ENCOUNTER · VI'}</span>
      <h2 id="boss-intro-name">FROST<br/>GUARDIAN</h2>
      <span className="boss-cut-alias">THỦ VỆ BĂNG</span>
      <p className="boss-cut-story">{vi ? 'Kẻ canh giữ ngủ yên đã thức giấc. Bốn trụ băng đang bảo vệ hắn.' : 'The sleeping guardian has awakened. Four frost pillars make it invulnerable.'}</p>
      <div className="boss-cut-brief">
        <ol>
          <li><b>{vi ? 'PHÁ BỐN TRỤ' : 'BREAK FOUR PILLARS'}</b><span>{vi ? 'Mỗi trụ 60 HP. Còn bất kỳ trụ nào, boss miễn sát thương. Cứ mất 25% máu, khiên bật lại và bốn trụ hồi sinh.' : '60 HP each. The boss takes no damage while any pillar remains. Every 25% of health it loses, its shield and the four pillars return.'}</span></li>
          <li><b>{vi ? 'PHỐI HỢP VỚI ECHO' : 'FIGHT WITH YOUR ECHOES'}</b><span>{vi ? 'Echo hút sự chú ý của boss và hỗ trợ tấn công.' : 'Echoes draw the boss’s attention and help you attack.'}</span></li>
          <li><b>{vi ? 'NÉ ĐÒN, RỒI PHẢN CÔNG' : 'DODGE, THEN STRIKE'}</b><span>{vi ? 'Rời vùng báo đòn. Tấn công khi hắn vừa đập xuống và đang hồi sức.' : 'Leave marked attack zones. Counterattack during recovery after each slam.'}</span></li>
        </ol>
        <div className="boss-cut-stats">240 HP · {vi ? '4 ĐOẠN KHIÊN · 3 GIAI ĐOẠN' : '4 SHIELD BARS · 3 PHASES'}</div>
        <button autoFocus className="boss-cut-start" onClick={() => engine?.beginBossFight()}>{vi ? 'BẮT ĐẦU TRẬN ĐẤU' : 'FACE THE GUARDIAN'} <ArrowRight size={20}/></button>
      </div>
    </section>
  </div>;
}
