import './JourneyFinale.css';
import { TrailInventory } from './TrailInventory.tsx';
import { TanukiShop } from './TanukiShop.tsx';
import { puzzleBalance } from '../game/logic/balance.ts';
import { ECHO_RUNES } from '../game/logic/echoRunes.ts';
import { EchoRuneStock, RuneChoicePicker, RuneChoiceDialog } from './EchoRunes.tsx';
import { JourneyCamp } from './JourneyCamp.tsx';
import { MechanicalPortrait } from './MechanicalPortrait.tsx';
import { IntroEffects } from './IntroEffects.tsx';
import { ComboPreview } from './ComboShowcase.tsx';
import React, { useEffect, useRef, useState } from 'react';
import { drawWizardSprite } from '../game/rendering/wizardSprite.ts';
import { drawSoldierSprite } from '../game/rendering/soldierSprite.ts';
import { localize } from '../localize.tsx';
import { translate } from '../i18n.ts';
import { BookOpen, ArrowRight, RotateCcw, Home, Pause, Volume2, VolumeX, Lock, Sword, Hammer, Check, Shield, Flame, Backpack, Bell, Settings, Map, Play, X, SlidersHorizontal, ShoppingBasket } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { MECHANICAL_ENABLED } from '../game/logic/campaign.ts';
import { LEVELS } from '../game/logic/levels.ts';

function CoinIcon() { return <img className="raccoon-coin" src={`${import.meta.env.BASE_URL}assets/ui/raccoon-coin.png`} alt="" aria-hidden="true"/>; }

function AerisPortrait() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => { const ctx = ref.current?.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, 70, 70); drawWizardSprite(ctx, 35, 55, 'down', false, false, 0); } };
    draw(); const timer = window.setInterval(draw, 250); return () => window.clearInterval(timer);
  }, []);
  return <canvas ref={ref} width={70} height={70} role="img" aria-label="Aeris"/>;
}
function WizardAvatar({className=''}:{className?:string}) { return <span className={`wizard-avatar ${className}`}><AerisPortrait/></span>; }
function KaelPortrait() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => { const ctx = ref.current?.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, 70, 70); drawSoldierSprite(ctx, 35, 55, 'down', false, false, 0); } };
    draw(); const timer = window.setInterval(draw, 250); return () => window.clearInterval(timer);
  }, []);
  return <canvas ref={ref} width={70} height={70} role="img" aria-label="Kael"/>;
}
function SelectedCharacterAvatar({hud}:{hud:HUDState}) {
  if(hud.characterClass==='mechanical')return <MechanicalPortrait/>;
  return hud.characterClass==='swordsman'
    ? <span className="selected-soldier-avatar"><KaelPortrait/></span>
    : <WizardAvatar/>;
}

export function Intro({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const [panel, setPanel] = useState<'none' | 'settings' | 'credits' | 'quit'>('none');
  const vi = hud.language === 'vi';
  const hasProgress = hud.completed.length > 0 || hud.forged;
  // At most one highlighted item: the one under the mouse (none once it leaves), or the one
  // moved to with the arrow keys. -1 = none; Enter then falls through to "start".
  const items = [
    { label: vi ? 'BẮT ĐẦU' : 'START GAME', disabled: false, act: () => engine?.openLobby() },
    { label: vi ? 'TIẾP TỤC' : 'CONTINUE', disabled: !hasProgress, act: () => engine?.continueGame() },
    { label: vi ? 'CÀI ĐẶT' : 'SETTINGS', disabled: false, act: () => setPanel('settings') },
    { label: vi ? 'TÁC GIẢ' : 'CREDITS', disabled: false, act: () => setPanel('credits') },
    { label: vi ? 'THOÁT' : 'QUIT', disabled: false, act: () => setPanel('quit') },
  ];
  const [selected, setSelected] = useState(-1);
  const menu = useRef({ items, selected, panel });
  menu.current = { items, selected, panel };
  useEffect(() => {
    // Capture phase, so Enter opens the chosen item instead of the engine's "Enter = start".
    const onKey = (event: KeyboardEvent) => {
      const m = menu.current;
      if (m.panel !== 'none' || document.querySelector('.cinematic-intro')) return;
      const step = event.key === 'ArrowDown' || event.key === 's' ? 1 : event.key === 'ArrowUp' || event.key === 'w' ? -1 : 0;
      if (step) {
        event.preventDefault();
        let i = m.selected < 0 ? (step > 0 ? -1 : 0) : m.selected;
        do i = (i + step + m.items.length) % m.items.length; while (m.items[i].disabled);
        setSelected(i);
      } else if ((event.key === 'Enter' || event.key === ' ') && m.selected >= 0) {
        event.preventDefault(); event.stopPropagation();
        m.items[m.selected].act();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  return <div className="intro-screen overlay" onKeyDown={event => {
    if (panel !== 'none' && ['Enter', ' ', 'Escape'].includes(event.key)) {
      event.stopPropagation();
      if (event.key === 'Escape') setPanel('none');
    }
  }}>
    <div className="intro-artwork">
    <IntroEffects/>
    <h1 className="intro-accessible-title">SECOND ME</h1>
    <div className="intro-mobile-title" aria-hidden="true"><span>THE ANCIENT PATH REMEMBERS</span><strong>SECOND ME</strong><small>ECHOES OF THE WILD</small></div>
    <div className="intro-language" role="group" aria-label={vi ? 'Ngôn ngữ' : 'Language'}>
      <button type="button" className={!vi ? 'selected' : ''} aria-pressed={!vi} onClick={() => engine?.setLanguage('en')}>EN</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={vi ? 'selected' : ''} aria-pressed={vi} onClick={() => engine?.setLanguage('vi')}>VI</button>
    </div>
    <nav className="intro-menu" aria-label={vi ? 'Menu chính' : 'Main menu'}>
      {items.map((item, i) => (
        // A stone slab (mainMenu.css): its face, carrying the label, rises when selected.
        <button key={i} type="button" className={`intro-menu-item${i === selected ? ' selected' : ''}`} disabled={item.disabled}
          style={{ '--slab': i } as React.CSSProperties}
          onMouseEnter={() => !item.disabled && setSelected(i)} onMouseLeave={() => setSelected(-1)} onClick={item.act}>
          <span className="intro-menu-face"><span className="intro-menu-label">{item.label}</span></span>
        </button>
      ))}
    </nav>
    </div>
    {panel === 'settings' && <SettingsPanel engine={engine} hud={hud} close={() => setPanel('none')}/>}
    {(panel === 'credits' || panel === 'quit') && <div className="modal-backdrop intro-dialog" onClick={() => setPanel('none')}><div className="panel" role="dialog" aria-modal="true" aria-label={panel === 'credits' ? (vi ? 'Tác giả' : 'Credits') : (vi ? 'Thoát trò chơi' : 'Quit game')} onClick={event => event.stopPropagation()}>
      <div className="panel-top"><span className="eyebrow gold">{panel === 'credits' ? (vi ? 'TÁC GIẢ' : 'CREDITS') : (vi ? 'THOÁT TRÒ CHƠI' : 'QUIT GAME')}</span><button className="icon-close" aria-label={vi ? 'Đóng' : 'Close'} onClick={() => setPanel('none')}><X size={18}/></button></div>
      <h2>SECOND ME</h2><p className="muted">{panel === 'credits' ? (vi ? 'Một chuyến phiêu lưu Echo đang được phát triển. Cảm ơn bạn đã đồng hành cùng khu rừng.' : 'An Echo adventure in development. Thank you for exploring the forest with us.') : (vi ? 'Bạn có thể đóng tab trình duyệt để thoát game. Tiến độ đã được lưu trên máy này.' : 'Close this browser tab to leave the game. Your progress is saved on this device.')}</p>
      <button className="primary" onClick={() => setPanel('none')}>{vi ? 'QUAY LẠI' : 'BACK TO MENU'}</button>
    </div></div>}
  </div>;
}

export function SettingsPanel({ engine, hud, close }: { engine: GameEngine | null; hud: HUDState; close: () => void }) {
  return localize(<div className="modal-backdrop"><div className="panel settings-panel"><div className="panel-top"><span className="eyebrow gold">CÀI ĐẶT TRÒ CHƠI</span><button className="icon-close" aria-label="Đóng cài đặt" onClick={close}><X size={18}/></button></div><h2>Điều chỉnh trải nghiệm</h2>
    <label className="setting-row"><span><Volume2 size={18}/><b>Âm lượng</b><small>Âm thanh hiệu ứng và môi trường</small></span><input aria-label="Âm lượng" type="range" min="0" max="1" step="0.05" value={hud.volume} onChange={e=>engine?.setVolume(Number(e.target.value))}/><strong>{Math.round(hud.volume*100)}%</strong></label>
    <label className="setting-row"><span><Volume2 size={18}/><b>Giọng nói</b><small>Lồng tiếng nhân vật và người kể chuyện</small></span><input aria-label="Giọng nói" type="range" min="0" max="1" step="0.05" value={hud.voiceVolume} onChange={e=>engine?.setVoiceVolume(Number(e.target.value))}/><strong>{Math.round(hud.voiceVolume*100)}%</strong></label>
    <label className="setting-row switch-row"><span><VolumeX size={18}/><b>Tắt âm</b><small>Tắt toàn bộ âm thanh trò chơi</small></span><input type="checkbox" checked={hud.isMuted} onChange={()=>engine?.toggleAudio()}/><i/></label>
    <label className="setting-row switch-row"><span><SlidersHorizontal size={18}/><b>Giảm chuyển động</b><small>Giảm sương, rung và hiệu ứng lặp</small></span><input type="checkbox" checked={hud.reducedMotion} onChange={e=>engine?.setReducedMotion(e.target.checked)}/><i/></label>
    <label className="setting-row switch-row"><span><Map size={18}/><b>Nhãn trong màn</b><small>Hiện nhãn mảnh thời gian</small></span><input type="checkbox" checked={hud.showHints} onChange={e=>engine?.setShowHints(e.target.checked)}/><i/></label>
    <label className="setting-row"><span><Map size={18}/><b>Language</b><small>Choose the game language</small></span><select aria-label="Language" value={hud.language} onChange={e=>engine?.setLanguage(e.target.value as 'en' | 'vi')}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label>
    <details className="setting-controls"><summary>{hud.language==='vi'?'Xem điều khiển':'View controls'}</summary><p>{hud.language==='vi'?'WASD / phím mũi tên: di chuyển · E: ghi đường đi · Q: gọi Echo · 1–6: chọn Echo · C: tạm dừng / tiếp tục Echo · Shift + Q: hoán đổi · X: thu hồi Echo lâu nhất · F: dùng vật phẩm thời gian · Chuột trái: tấn công · Chuột phải / Space: kỹ năng · Shift: lướt né · Esc: tạm dừng':'WASD / arrow keys: move · E: record path · Q: summon Echo · 1–6: select Echo · C: pause / resume Echo · Shift + Q: swap · X: recall oldest Echo · F: use time item · Left click: attack · Right click / Space: skill · Shift: dodge · Esc: pause'}</p></details>
    <button className="primary" onClick={close}>LƯU & ĐÓNG</button></div></div>);
}

const latestNews = { title: 'Rương đỏ đã mở', description: 'Dùng 5 chìa khóa mở một lượt hoặc 50 chìa khóa mở 10 lượt. Xem tỉ lệ thưởng ngay trong rương.' };

export function Notifications({ close }: { close: () => void }) {
  return localize(<div className="modal-backdrop"><div className="panel news-panel"><div className="panel-top"><span className="eyebrow gold">THÔNG BÁO TRÒ CHƠI</span><button className="icon-close" aria-label="Đóng thông báo" onClick={close}><X size={18}/></button></div><h2>Tiếng vọng mới trong rừng</h2>
    <article className="news-feature"><span>MỚI · 09.11.2026</span><div><h3>{latestNews.title}</h3><p>{latestNews.description}</p></div></article><article><time>08.11.2026</time><div><h3>Cửa hàng Tanuki mới</h3><p>Ghé quầy Tanuki để mua vật phẩm và trò chuyện.</p></div></article><article><time>08.11.2026</time><div><h3>Diện mạo mới cho xu</h3><p>Xu gấu mèo pixel đã xuất hiện trong cửa hàng, túi đồ và phần thưởng của game.</p></div></article><article><time>08.11.2026</time><div><h3>Nhẫn tăng giới hạn</h3><p>Mua nhẫn trong cửa hàng với giá 30 xu để tăng giới hạn lên 6 Echo trong một màn. Hiệu ứng không cộng dồn.</p></div></article><article><time>08.11.2026</time><div><h3>Thứ tự thu hồi Echo</h3><p>Nhấn X để thu hồi Echo đã ở trên sân lâu nhất trước, theo thứ tự triệu hồi.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Chiêu gai băng của boss</h3><p>Vòng phép băng xuất hiện cảnh báo, sau đó gai băng trồi lên gây sát thương rồi tan biến.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Echo tự chiến đấu</h3><p>Echo thu hút kẻ địch, tự chiến đấu trong phạm vi gần và mất ổn định theo sát thương và chỉ bị thu hồi khi ổn định về 0.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Hiệu ứng nổ băng của boss</h3><p>Vòng băng xoay rồi nổ thành những mảnh xanh khi Thủ Vệ Băng tung chiêu.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Cửa hàng trên thanh menu</h3><p>Cửa hàng đã chuyển lên thanh trên cùng của sảnh, ngay cạnh nút về menu chính.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Hiệu ứng băng mới của boss</h3><p>Vòng băng xanh của Thủ Vệ Băng xoay trước khi gây sát thương rồi biến mất.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Điều chỉnh hướng nhìn nhân vật</h3><p>Nhân vật và Echo giờ quay theo hướng di chuyển, kể cả trong đấu trường boss.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Giao diện chọn nhân vật mới</h3><p>Màn chọn nhân vật có diện mạo rừng cổ mới. Xem trước Aeris hoặc Kael và nhấn Xác nhận để bắt đầu hành trình.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Trượng phép và cầu sét mới</h3><p>Trượng của Aeris có tinh thể xanh và kích thước cân đối hơn. Cầu phép và cầu sét được làm mới theo phong cách pixel xanh lam.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Diện mạo mới cho Aeris</h3><p>Pháp sư Aeris khoác áo choàng xanh viền vàng theo phong cách pixel chibi. Các hướng nhìn và chuyển động của Aeris cùng Echo đã được làm mới.</p></div></article>
    <article><time>08.11.2026</time><div><h3>Diện mạo mới cho Kael</h3><p>Kỵ sĩ Kael có diện mạo pixel chibi mới với tóc vàng, giáp bạc và áo choàng đỏ. Các hướng di chuyển và động tác chém cũng được làm mới.</p></div></article>
    <article><span>LÒ RÈN 1.5</span><div><h3>Thử thách từng chặng</h3><p>Năm màn đầu có thời gian theo độ khó từng chặng. Mỗi chặng có một mảnh +3 giây; các rune cuối cần nhiều Echo giữ đồng thời. Bẫy dập và đá rơi giữ chân 0,25 giây; dây leo làm chậm cả một dải.</p></div></article>
    <article><time>06.11.2026</time><div><h3>Sảnh hành trình đã mở</h3><p>Chọn màn, xem tiến độ, điều chỉnh cài đặt và chơi lại bất kỳ màn nào sau khi hoàn thành chiến dịch.</p></div></article>
  </div></div>);
}

export function Lobby({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const [panel, setPanel] = useState<'none'|'news'|'settings'>('none');
  const [bag, setBag] = useState(false);
  const complete = engine?.campaign.bossDefeated === true;
  const next = Math.min(hud.completed.length, 5);
  // Esc returns to the main menu, unless a lobby panel is open (Esc is for closing it then).
  useEffect(() => {
    if (panel !== 'none' || bag) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape' && !document.querySelector('[data-lobby-dialog]')) { e.preventDefault(); engine?.goToMainMenu(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, bag, engine]);
  return localize(<div className="lobby-screen overlay journey-lobby"><div className="lobby-canopy"/><header className="lobby-header"><button className="camp-brand" onClick={()=>engine?.goToMainMenu()} aria-label={hud.language==='vi'?'Về menu chính':'Back to main menu'}><SelectedCharacterAvatar hud={hud}/><span><b>SECOND ME</b><small>THE EMBERFORGE</small></span></button><nav aria-label={hud.language==='vi'?'Tiện ích trại nghỉ':'Camp utilities'}><button onClick={()=>setBag(true)} aria-label={hud.language==='vi'?'Túi đồ':'Inventory'} title={hud.language==='vi'?'Túi đồ':'Inventory'}><Backpack size={22}/></button><button onClick={()=>engine?.openShop()} aria-label={hud.language==='vi'?'Cửa hàng':'Shop'} title={hud.language==='vi'?'Cửa hàng':'Shop'}><ShoppingBasket size={22}/></button><button onClick={()=>setPanel('settings')} aria-label={hud.language==='vi'?'Cài đặt':'Settings'} title={hud.language==='vi'?'Cài đặt':'Settings'}><Settings size={22}/></button></nav></header>
    <JourneyCamp engine={engine} hud={hud} complete={complete} next={next} traveler={<SelectedCharacterAvatar hud={hud}/>} onNews={()=>setPanel('news')}/>
    {bag&&<div className="modal-backdrop inventory-backdrop" onClick={()=>document.dispatchEvent(new Event('close-trail-inventory'))}><div className="panel inventory-modal forest-dialog" onClick={e=>e.stopPropagation()}><Inventory engine={engine} hud={hud} close={()=>setBag(false)}/></div></div>}
    <RuneChoiceDialog engine={engine} hud={hud}/>{panel==='news'&&<Notifications close={()=>setPanel('none')}/>} {panel==='settings'&&<SettingsPanel engine={engine} hud={hud} close={()=>setPanel('none')}/>}</div>);
}

export function Shop({engine, hud}: {engine: GameEngine | null; hud: HUDState}) { return <TanukiShop engine={engine} hud={hud}/>; }

export function Inventory({ hud, close,engine }: { hud: HUDState; close: () => void;engine?:GameEngine|null }) {
  return <TrailInventory hud={hud} engine={engine??null} close={close}/>;
}

type SelectableCharacter = 'mage' | 'swordsman' | 'mechanical';

export function Characters({engine, hud}: {engine: GameEngine | null; hud: HUDState}) {
  const vi = hud.language === 'vi';
  const [selected, setSelected] = useState<SelectableCharacter>(hud.characterClass);
  const roster: {id: SelectableCharacter; name: string; roleVi: string; roleEn: string}[] = [
    {id:'mage', name:'Aeris', roleVi:'Pháp sư', roleEn:'Mage'},
    {id:'swordsman', name:'Kael', roleVi:'Kiếm sĩ', roleEn:'Swordsman'},
    ...(MECHANICAL_ENABLED && hud.mechanicalOwned ? [{id:'mechanical' as const, name:'Rivet-07', roleVi:'Cơ giới', roleEn:'Mechanic'}] : []),
  ];
  const choice = roster.find(c => c.id === selected) ?? roster[0];
  const portrait = (id: SelectableCharacter) => id === 'mage' ? <AerisPortrait/> : id === 'swordsman' ? <KaelPortrait/> : <MechanicalPortrait/>;
  const detail = choice.id === 'mage'
    ? (vi ? 'Pháp sư sử dụng trượng Echo và cầu sét. Kỹ năng triệu hồi tối đa 3 cầu sét trong 6 giây.' : 'A mage who channels the Echo staff and lightning. Summon up to three storm orbs for six seconds.')
    : choice.id === 'swordsman'
    ? (vi ? 'Kiếm sĩ cận chiến với Kiếm Echo. Pháp trận ánh sáng tăng sát thương và hồi máu trong 5 giây.' : 'A close-range fighter wielding the Echo sword. Light Sanctuary boosts damage and restores health for five seconds.')
    : (vi ? 'Chiến binh cơ giới dùng cưa máy. Kỹ năng Quá tải tăng tốc đánh trong 5 giây.' : 'A mechanical fighter wielding a chainblade. Overdrive boosts attack speed for five seconds.');
  const confirm = () => { if (!engine) return; engine.selectClass(choice.id); engine.goToLobby(); };
  return <div className="characters-screen overlay hero-select-screen">
    <div className="hero-select-scene" role="dialog" aria-modal="true" aria-labelledby="hero-select-title">
      <h1 id="hero-select-title" className="hero-select-title">{vi ? 'CHỌN NHÂN VẬT' : 'CHOOSE YOUR HERO'}</h1>
      <button className="hero-select-back" onClick={() => engine?.goToLobby()} aria-label={vi ? 'Về sảnh' : 'Back to lobby'}>Back</button>
      <div className="hero-select-grid" role="group" aria-label={vi ? 'Chọn nhân vật' : 'Choose character'}>
        {Array.from({length:8}, (_, i) => {
          const c = roster[i];
          return c ? <button key={c.id} type="button" className={'hero-slot' + (choice.id === c.id ? ' is-selected' : '')} onClick={() => setSelected(c.id)} aria-pressed={choice.id === c.id} aria-label={`${c.name} · ${vi ? c.roleVi : c.roleEn}`}>
            <span className="hero-slot-label">{c.name} · {vi ? c.roleVi : c.roleEn}</span><span className="hero-slot-figure">{portrait(c.id)}</span>
          </button> : <div key={`empty-${i}`} className="hero-slot hero-slot-empty" aria-hidden="true"><span>✧</span></div>;
        })}
      </div>
      <section className="hero-select-info" aria-live="polite">
        <div className="hero-info-portrait">{choice.id === 'mage' || choice.id === 'swordsman' ? <ComboPreview key={choice.id} hero={choice.id}/> : portrait(choice.id)}</div>
        <div className="hero-info-copy"><h2>{choice.name} · {vi ? choice.roleVi : choice.roleEn}</h2><p>{detail}</p><small>{vi ? 'VŨ KHÍ' : 'WEAPON'} · {choice.id === 'mage' ? (vi ? 'Trượng phép' : 'Magic staff') : choice.id === 'swordsman' ? (vi ? 'Kiếm' : 'Sword') : (vi ? 'Cưa máy' : 'Chainblade')}</small></div>
        <div className="hero-info-action"><span>{choice.id === hud.characterClass ? (vi ? 'ĐANG CHỌN' : 'CURRENT HERO') : (vi ? 'NHÂN VẬT SẴN SÀNG' : 'HERO READY')}</span><button type="button" onClick={confirm} disabled={!engine}>{vi ? 'XÁC NHẬN' : 'CONFIRM'}</button><button type="button" className="hero-info-cancel" onClick={() => engine?.goToLobby()}>{vi ? 'VỀ SẢNH' : 'BACK TO LOBBY'}</button></div>
      </section>
    </div>
  </div>;
}

export function StaffArt({ large = false }: { large?: boolean }) {
  return <svg viewBox="0 0 100 210" className={large ? 'sword-art large' : 'sword-art'} aria-label="Trượng Echo" shapeRendering="crispEdges"><path d="M43 75H57V202H43Z" fill="#261b18"/><path d="M47 79H54V198H47Z" fill="#75503a"/><path d="M27 30H39V51H61V30H73V57H66V70H58V83H42V70H34V57H27Z" fill="#2a1d19"/><path d="M32 34H38V55H44V68H56V68H62V55H68V34H72V57H65V69H58V78H42V69H35V57H32Z" fill="#76513a"/><path d="M44 13H56V20H64V45H58V56H42V45H36V20H44Z" fill="#073e67"/><path d="M46 17H54V23H60V42H54V51H46V44H40V23H46Z" fill="#078fc4"/><path d="M46 22H51V26H55V31H51V41H46V36H43V27H46Z" fill="#68e6ff"/><path d="M47 28H51V33H47Z" fill="#e1ffff"/></svg>;
}

export function SwordArt({ large = false }: { large?: boolean }) {
  return localize(<svg viewBox="0 0 100 210" className={large ? 'sword-art large' : 'sword-art'} aria-label="Kiếm Echo">
    <defs><linearGradient id="blade" x1="0" x2="1"><stop stopColor="#7ab8b0"/><stop offset=".48" stopColor="#e6fff1"/><stop offset=".52" stopColor="#b9eee0"/><stop offset="1" stopColor="#4f948b"/></linearGradient></defs>
    <path d="M50 8 63 31 58 139 42 139 37 31Z" fill="url(#blade)" stroke="#c7ede0"/>
    <path d="M50 24V129" stroke="#eaffdc" opacity=".8"/><path d="m50 55 5 10-5 11-5-11Z" fill="#326f63"/>
    <path d="m17 139 14-7 19 5 19-5 14 7-6 10-27-6-27 6Z" fill="#d4ac6d" stroke="#f1d29b"/>
    <rect x="44" y="144" width="12" height="41" rx="3" fill="#684a38"/>
    {[151,160,169,178].map(y => <path key={y} d={`m44 ${y} 12-4`} stroke="#bb9062"/>)}
    <path d="m50 183 10 10-10 10-10-10Z" fill="#b48b55"/><circle cx="50" cy="141" r="7" fill="#80e7cc"/>
  </svg>);
}
export function ForgeArt({ forged, weapon }: { forged: boolean; weapon: 'staff'|'sword' }) {
  return localize(<div className={'forge-art ' + (forged ? 'is-forged' : '')}>
    <div className="forge-halo"/><div className="forge-sparks"><i/><i/><i/><i/><i/></div>
    {forged ? weapon === 'staff' ? <StaffArt large/> : <SwordArt large/> : <svg viewBox="0 0 340 260" aria-label="Lò rèn cổ">
      <path d="M55 235V98L85 52h170l30 46v137Z" fill="#303c32" stroke="#75806a" strokeWidth="3"/>
      <path d="M102 194v-73a68 68 0 0 1 136 0v73Z" fill="#121b18" stroke="#626e54" strokeWidth="8"/>
      <path d="M128 181c-32-43 25-43 25-87 30 20 10 48 27 48 11-13 7-27 7-27 44 40 40 63 22 76Z" fill="#ee9255"/>
      <path d="M157 189c-13-17 7-40 14-54 0 19 23 30 15 54Z" fill="#ffe1a3"/>
      <path d="M84 197h180l-19 21h-27l10 25H123l10-25h-30Z" fill="#6b7662" stroke="#a0aa89" strokeWidth="3"/>
      <path d="M60 92h46m128 0h46M75 63l-10 17m210-17 10 17" stroke="#9aa180" strokeWidth="5"/>
      <path d="M154 61h32l-16 23Z" fill="#a6d8bc"/>
    </svg>}
    <span className="forge-art-caption">{forged ? weapon === 'staff' ? 'ECHO STAFF · ĐÃ THỨC TỈNH' : 'ECHO BLADE · ĐÃ THỨC TỈNH' : 'LỬA THIÊNG ĐANG CHỜ'}</span>
  </div>);
}

export function Title({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const [tab, setTab] = useState<'none' | 'trails' | 'help'>('none');
  return localize(<div className="title-screen overlay">
    <div className="title-top"><span className="eyebrow">THE OVERGROWN RUINS / CHAPTER II</span><span className="version">THE EMBERFORGE</span></div>
    <div className="title-lockup"><span className="eyebrow gold">KÝ ỨC · LỬA THIÊNG · LƯỠI KIẾM</span><h1>SECOND ME</h1><p className="title-sub">ECHOES OF THE WILD</p><div className="title-rule"/><p className="title-description">Để quá khứ dẫn lối.<br/>Thu hồi năm di vật. Rèn kiếm. Đánh thức khu rừng.</p>
      <div className="title-actions">{hud.completed.length > 0 && <button className="primary" onClick={() => engine?.continueGame()}>TIẾP TỤC HÀNH TRÌNH <ArrowRight size={18}/></button>}
        <button className={hud.completed.length ? 'secondary' : 'primary'} onClick={() => engine?.startGame()}>{hud.completed.length ? 'HÀNH TRÌNH MỚI' : 'BẮT ĐẦU HÀNH TRÌNH'} <ArrowRight size={18}/></button>
        <div className="button-row"><button className="text-button" onClick={() => setTab('trails')}>CÁC MÀN CHƠI</button><button className="text-button" onClick={() => setTab('help')}>CÁCH CHƠI</button></div>
      </div>
    </div><div className="title-footer">5 MÀN GIẢI ĐỐ <span>◇</span> 1 LÒ RÈN <span>◇</span> 1 TRẬN BOSS</div>
    {tab !== 'none' && <div className="modal-backdrop"><div className="panel trail-panel"><div className="panel-top"><span className="eyebrow gold">{tab === 'trails' ? 'HÀNH TRÌNH CỦA BẠN' : 'DẤU VẾT CỦA QUÁ KHỨ'}</span><button className="text-button" onClick={() => setTab('none')}>ĐÓNG ×</button></div>
      {tab === 'trails' ? <><h2>Những lối mòn</h2><div className="trail-list">{LEVELS.map((level, index) => {
        const unlocked = index <= hud.completed.length && (index < 5 || hud.forged);
        return <button key={level.id} disabled={!unlocked} onClick={() => engine?.selectLevel(index)} className="trail-item"><span className="trail-number">0{level.id}</span><span><strong>{level.subtitle}</strong><small>{level.description}</small></span>{!unlocked ? <Lock size={17}/> : hud.completed.includes(level.id) ? <Check size={18}/> : <ArrowRight size={18}/>}</button>;
      })}</div></> : <><h2>Hợp tác với chính mình</h2><div className="help-grid"><p><kbd>W A S D</kbd> / phím mũi tên: di chuyển.</p><p><kbd>E</kbd> bắt đầu ghi; nhấn lần nữa để lưu. Echo đứng ở điểm cuối.</p><p><kbd>1–6</kbd> chọn Echo; <kbd>C</kbd> tạm dừng; <kbd>Shift + Q</kbd> hoán đổi khi đường thẳng không bị chặn.</p><p><kbd>Q</kbd> gọi Echo. Để Echo giữ nút trong khi bạn vượt cổng. <kbd>X</kbd> xóa Echo.</p><p>5 màn đầu: thời gian mỗi chặng thay đổi theo màn. Đặt Echo giữ các rune được ghi bên cổng cuối; màn 5 có 5 rune nhưng chỉ cần giữ đúng 4 rune cuối. Mỗi chặng có tối đa một mảnh +3 giây và dùng một bình +2 giây; không thể farm vô hạn. Chỉ nhân vật chạm rune kế tiếp mới được nạp giờ.</p><p>Bẫy dập và đá rơi có viền vàng báo trước, gây 20 sát thương và giữ chân 0,25 giây khi trúng. Dây leo làm chậm 45% trên cả dải; có thể đi vòng.</p><p>Sau mỗi màn 1–5, chọn một trong ba ấn Echo ngẫu nhiên. Hoàn thành năm màn để mở trạm chuẩn bị; không tiêu hao ấn để mở boss.</p><p>Chuột trái tấn công; chuột phải hoặc <kbd>Space</kbd> dùng kỹ năng class; <kbd>F</kbd> dùng vật phẩm +2 giây. <kbd>Shift</kbd> lướt né; <kbd>Esc</kbd> tạm dừng.</p><p>Boss báo trước đòn đánh bằng vòng băng xanh. Né ra ngoài; Echo giữ ấn sẽ tăng sức mạnh.</p></div></>}
    </div></div>}
  </div>);
}

export function AdventureHUD({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const [bag, setBag] = useState(false);
  const [settings, setSettings] = useState(false);
  const boss = hud.bossHp > 0;
  return localize(<div className="adventure-hud overlay">
    <div className="hud-top"><div className="level-card"><small>{hud.levelName}{hud.training?' · DEV':' / 06'}</small><strong>{hud.levelSubtitle}</strong><span>{Math.floor(hud.elapsedLevelTime / 60).toString().padStart(2,'0')}:{Math.floor(hud.elapsedLevelTime % 60).toString().padStart(2,'0')} <i/> <span className="player-health" role="meter" aria-label={hud.language==='vi'?'Máu nhân vật':'Player health'} aria-valuenow={hud.health} aria-valuemin={0} aria-valuemax={engine?.maxHealth??100}><b style={{width:`${hud.health/(engine?.maxHealth??100)*100}%`}}/><strong>{hud.health} / {engine?.maxHealth??100} HP</strong></span></span>
      {(hud.enemiesRemaining??0)>0&&<small>{hud.language==='vi'?`QUÁI CANH ĐƯỜNG · ${hud.enemiesRemaining}`:`TRAIL ENEMIES · ${hud.enemiesRemaining}`}</small>}
      {(hud.echoCount>0 || hud.echoDurationMs>0) && <div className="echo-timeline" aria-label="Echo timeline"><span>ECHO {hud.echoCount}/{hud.echoLimit} · {hud.echoCharges} {hud.language==='vi'?'lượt':'charges'} · {Math.ceil(hud.echoStability)} {hud.language==='vi'?'ổn định':'stability'}</span>{hud.echoDurationMs>0 && <div className="echo-timeline-track"><i style={{left:`${Math.min(100,hud.echoElapsedMs/hud.echoDurationMs*100)}%`}}/>{hud.echoEvents.map((event,index)=><b key={index} style={{left:`${Math.min(100,event.time/hud.echoDurationMs*100)}%`}} title={`${event.kind} · ${(event.time/1000).toFixed(1)}s`}>{event.kind==='attack'?'✦':'◆'}</b>)}</div>}</div>}
    </div>
      <div className="hud-tools"><button aria-label={hud.language==='vi'?'Mở sổ tay cơ chế':'Open mechanics guide'} title={hud.language==='vi'?'Sổ tay cơ chế':'Mechanics guide'} onClick={()=>engine?.openGuide()}><BookOpen size={17}/></button><span className="hud-wallet"><CoinIcon/> {hud.coins} · +2s ×{hud.timeItems}</span><button aria-label={hud.language==='vi'?'Túi đồ':'Inventory'} title={hud.language==='vi'?'Túi đồ':'Inventory'} onClick={() => setBag(!bag)}><Backpack size={17}/><span>{Object.values(hud.echoRunes??{}).reduce((a,n)=>a+n,0)}</span></button><button aria-label="Cài đặt" onClick={() => setSettings(true)}><Settings size={17}/></button><button aria-label="Bật tắt âm thanh" onClick={() => engine?.toggleAudio()}>{hud.isMuted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><button aria-label="Chơi lại màn" onClick={() => engine?.restartLevel()}><RotateCcw size={17}/></button><button aria-label="Pause game" onClick={() => engine?.pauseGame()}><Pause size={17}/></button></div>
    </div>
    {hud.legTimeRemaining !== null && <div className={'leg-clock ' + (hud.legTimeRemaining <= 2 ? 'urgent' : '')} role="timer" aria-label="Thời gian đến điểm kế tiếp"><div><span>{hud.checkpointIndex < hud.checkpointCount ? `ĐẾN ẤN THẠCH ${hud.checkpointIndex+1} / ${hud.checkpointCount}` : 'ĐẾN CỔNG THOÁT'}</span><strong>{hud.legTimeRemaining.toFixed(1)}<small>s</small></strong></div><div className="leg-track"><i style={{width: `${Math.min(100,hud.legTimeRemaining/(hud.legTimeBudget??16)*100)}%`}}/></div><p>{hud.slowed ? 'DÂY LEO · TỐC ĐỘ −45%' : (hud.language==='vi'?`Rune cổng cuối: ${hud.runesHeld??0}/${hud.runesRequired??0} · Chặng mới ${hud.legTimeBudget??16}s`:`Final seal: ${hud.runesHeld??0}/${hud.runesRequired??0} · New leg ${hud.legTimeBudget??16}s`)}</p></div>}
    {boss && <div className="boss-bar"><div><span>THỦ VỆ BĂNG</span><small>{hud.bossHp} / 240 · {translate('GIAI ĐOẠN',hud.language)} {hud.bossPhase} / 3</small></div><div className="health-track" role="progressbar" aria-label="Máu boss" aria-valuenow={hud.bossHp} aria-valuemin={0} aria-valuemax={240}><i style={{ width: `${hud.bossHp/240*100}%` }}/></div><p className="boss-armor">{hud.pillarsRemaining>0?(hud.language==='vi'?`PHÁ ${hud.pillarsRemaining} TRỤ ĐỂ GỠ GIÁP · GIÁP ${hud.bossArmor}`:`DESTROY ${hud.pillarsRemaining} PILLARS · ARMOR ${hud.bossArmor}`):(hud.language==='vi'?'BOSS ĐÃ MẤT GIÁP':'BOSS ARMOR BROKEN')}</p></div>}
    {hud.bannerMessage && <div className={'hud-banner ' + (boss ? 'boss-banner' : 'trail-banner')}>{hud.bannerMessage}</div>}
    {hud.activeBuff && <div className="combat-buff">{hud.activeBuff}</div>}
    {hud.dissonanceSeconds>0 && <div className="combat-buff" role="status">RẠN VỠ {hud.dissonanceSeconds.toFixed(1)} / 5s · Gọi Echo để bảo hộ</div>}
    {/* Selected runes are managed and activated inside Inventory. */}
    {bag && <div className="modal-backdrop inventory-backdrop" onClick={()=>document.dispatchEvent(new Event('close-trail-inventory'))}><div className="panel inventory-modal forest-dialog" onClick={e=>e.stopPropagation()}><Inventory engine={engine} hud={hud} close={()=>setBag(false)}/></div></div>}
    {settings && <SettingsPanel engine={engine} hud={hud} close={()=>setSettings(false)}/>} 
  </div>);
}

function VictoryOrnaments(){
 return <div className="victory-ornaments" aria-hidden="true"><span>✦</span><i/><i/><i/><i/><i/></div>;
}

function VictoryStars({count,vi}:{count:number;vi:boolean}){
 return <div className="victory-stars" role="img" aria-label={`${count} / 3 ${vi?'sao':'stars'}`}>
  {[0,1,2].map(i=><span key={i} className={`victory-star ${i<count?'earned':'unearned'}`} style={{'--star-delay':`${.2+i*.24}s`} as React.CSSProperties}>
   <svg viewBox="0 0 100 100" aria-hidden="true" shapeRendering="crispEdges">
    <path d="M44 6H56V18H62V30H68V36H94V48H82V60H74V70H80V88H68V82H56V76H44V82H32V88H20V70H26V60H18V48H6V36H32V30H38V18H44Z" className="star-outline"/>
    <path d="M48 14H52V26H58V38H70V42H84V46H74V56H66V68H70V78H64V72H54V66H46V72H36V78H30V68H34V56H26V46H16V42H30V38H42V26H48Z" className="star-face"/>
    <path d="M48 14H52V47L16 42H30V38H42V26H48Z" className="star-light"/>
    <path d="M52 47L70 78H64V72H54V66H46V72H36V78H30L46 48Z" className="star-shade"/>
   </svg><i>✦</i>
  </span>)}
 </div>;
}

export function Completion({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const last=engine?.currentLevelIdx===4,vi=hud.language==='vi',pending=!!hud.pendingRuneChoices?.length;
  return <div className="modal-backdrop victory-backdrop"><div role="dialog" aria-modal="true" aria-label={vi?"Chiến thắng":"Victory"} className="panel completion-panel rune-completion woodland-victory"><VictoryOrnaments/><span className="eyebrow gold">{vi?'MỘT KÝ ỨC ĐƯỢC ĐÁNH THỨC':'A MEMORY AWAKENED'}</span><h2>{vi?'HOÀN THÀNH MÀN':'TRAIL COMPLETE'}</h2><p className="muted">{hud.levelName} · {hud.levelSubtitle}</p>
    <VictoryStars count={hud.lastRating?.stars??0} vi={vi}/>
    <div className="victory-loot"><span>+{hud.lastRating?.keys??0} <small>{vi?'CHÌA KHÓA':'KEYS'}</small></span><i/><span><CoinIcon/> +{hud.lastRating?.coins??0} <small>{vi?'XU':'COINS'}</small></span><i/><span><b>◷</b> {hud.elapsedLevelTime.toFixed(1)}<small> SEC</small></span></div>
    <RuneChoicePicker hud={hud} engine={engine}/>
    <p className="rune-reward-note">{vi?'Dùng ấn trong màn 2–6. Mỗi lần dùng tiêu hao 1 ấn; hiệu ứng kết thúc khi rời hoặc chơi lại màn.':'Use in levels 2–6. Each activation consumes one rune; buffs expire on leaving or retrying.'}</p>
    <div className="collection-line"><span>{vi?'Tiến độ mở đấu trường':'Arena unlock progress'}</span><strong>{hud.completed.length} / 5</strong></div><div className="victory-progress" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} className={hud.completed.includes(i+1)?"complete":""}/>)}</div>
    <button className="primary" disabled={pending} onClick={()=>engine?.nextLevel()}>{pending?(vi?'CHỌN MỘT ẤN ĐỂ TIẾP TỤC':'CHOOSE A RUNE TO CONTINUE'):last?(vi?'ĐẾN TRẠM CHUẨN BỊ':'PREPARE FOR THE GUARDIAN'):`${vi?'TIẾP TỤC · MÀN':'CONTINUE · LEVEL'} ${(engine?.currentLevelIdx??0)+2}`} <ArrowRight size={19}/></button>
    <div className="button-row"><button className="secondary" disabled={pending} onClick={()=>engine?.restartLevel()}><RotateCcw size={15}/>{vi?'CHƠI LẠI MÀN':'RETRY LEVEL'}</button><button className="secondary" onClick={()=>engine?.goToTitle()}><Home size={15}/>{vi?'MENU':'MENU'}</button></div>
  </div></div>;
}

export function Forge({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const vi=hud.language==='vi',hero=hud.characterClass==='swordsman'?'Kael':hud.characterClass==='mechanical'?'Rivet-07':'Aeris';
  return localize(<div className="modal-backdrop forge-backdrop"><div className="panel forge-panel hero-preparation" role="dialog" aria-modal="true" aria-labelledby="forge-title"><div className="panel-top"><span className="eyebrow gold">TRẠM NGHỈ / SAU MÀN 05</span><span className="forge-badge"><Flame size={13}/> LÒ RÈN CỔ</span></div>
    <div className="forge-columns"><div><h2 id="forge-title">{vi?`Đánh thức\ntiếng vọng ${hero}.`:`Awaken\n${hero}’s Echo.`}</h2><p className="muted forge-description">{hud.forged?(hud.language==='vi'?'Vũ khí Echo đã thức tỉnh. Chuẩn bị những ấn bạn muốn dùng trước trận Thủ Vệ Băng.':'Your Echo weapon is ready. Review your runes before facing the Frost Guardian.'):(hud.language==='vi'?'Hoàn thành năm màn để thức tỉnh vũ khí. Việc chuẩn bị này không tiêu hao ấn nâng Echo.':'Complete five trails to awaken your weapon. Preparation does not consume Echo upgrade runes.')}</p>
      <EchoRuneStock engine={engine} hud={hud}/><p className="rune-reward-note">{hud.language==='vi'?'Không cần đủ cả 5 loại ấn để mở boss. Ấn chưa dùng vẫn nằm trong túi.':'No complete rune set is required to enter the arena. Unused runes stay in your inventory.'}</p>
      <div className="sword-stats"><span>ATK <strong>15</strong></span><span>{hud.language==='vi'?'COMBO 4 ĐÒN':'4-HIT COMBO'} <strong>12 · 14 · 17 · 33</strong></span></div>
    </div><div className={`forge-hero ${hud.forged?'is-awakened':''}`} data-character={hud.characterClass} role="img" aria-label={vi?`Bóng nhân vật ${hero}`:`${hero} silhouette`}><div className="hero-echo-ring"/><div className="hero-shadow"><SelectedCharacterAvatar hud={hud}/></div><span className="forge-hero-name">{hero}</span><small>{hud.forged?(vi?'TIẾNG VỌNG ĐÃ THỨC TỈNH':'ECHO AWAKENED'):(vi?'KÝ ỨC ĐANG HỘI TỤ':'MEMORIES CONVERGE')}</small></div></div>
    <div className="forge-footer"><p>{hud.forged ? 'Đã trang bị · Chuột trái tấn công · Chuột phải / Space kỹ năng' : (hud.language==='vi'?'Đã hoàn thành 5 / 5 màn · Không tiêu hao ấn Echo':'Five trails completed · No Echo runes consumed')}</p><button className="primary" disabled={!hud.forged && hud.completed.length < 5} onClick={() => hud.forged ? engine?.enterBoss() : engine?.forgeWeapon()}>{hud.forged ? <>BƯỚC VÀO ĐẤU TRƯỜNG <ArrowRight size={18}/></> : <><Hammer size={18}/> RÈN {hud.weapon==='staff'?'TRƯỢNG':'KIẾM'} ECHO</>}</button></div>
  </div></div>);
}

function DefeatScreen({engine,hud}:{engine:GameEngine|null;hud:HUDState}){
 const vi=hud.language==='vi',timeout=hud.defeatReason==='timeout',boss=!!engine?.boss;
 const seconds=puzzleBalance((engine?.currentLevelIdx??0)+1).legSeconds;
 const hint=timeout
  ?(vi?`Mỗi chặng có ${seconds} giây. Chạm rune theo thứ tự để nạp lại giờ; nhặt mảnh thời gian +3 giây và để Echo giữ cổng.`:`Each leg gives you ${seconds} seconds. Reach runes in order to refill the timer, collect +3s shards and leave Echoes holding the gates.`)
  :boss
   ?(vi?'Phá bốn trụ trước để gỡ giáp boss. Gọi Echo hỗ trợ, né vòng băng trước khi gai trồi lên và tận dụng kỹ năng rơi trên sân.':'Break all four pillars to remove the Guardian’s armor. Summon Echoes, dodge frost warnings and collect the arena skill drops.')
   :(vi?'Né khỏi vùng cảnh báo trước khi bẫy hoặc quái ra đòn. Gọi Echo hỗ trợ chiến đấu và giữ rune để mở đường.':'Leave warning zones before traps or enemies strike. Let Echoes help in combat and hold runes to open the path.');
 return <div className="modal-backdrop defeat-backdrop"><section className="defeat-stage" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
  <span className="defeat-kicker">{vi?'MỘT LẦN VẤP NGÃ · CHƯA PHẢI KẾT THÚC':'ONE FALL · NOT THE END'}</span>
  <h2 id="defeat-title">{timeout?(vi?'HẾT THỜI GIAN':'TIME RAN OUT'):(vi?'GỤC NGÃ':'FALLEN')}</h2>
  <p className="defeat-level">{hud.levelName} · {hud.levelSubtitle}</p>
  <div className="defeat-sigil" aria-hidden="true"><svg viewBox="0 0 120 120" shapeRendering="crispEdges">
   <path d="M32 10H88V18H99V32H106V84H98V99H85V108H33V100H21V85H14V34H22V20H32Z" fill="#192c28" stroke="#52675a" strokeWidth="3"/>
   <path d="M33 21H83V29H92V83H84V94H34V85H26V35H33Z" fill="#243a31"/>
   <path d="M40 80V40L59 30L78 40V80M59 30V65" fill="none" stroke="#ba8d6c" strokeWidth="5"/>
   <path d="M69 10L59 37L68 49L52 67L60 79L45 108" fill="none" stroke="#091812" strokeWidth="8"/>
   <path d="M72 10L62 37L71 49L55 67L63 79L48 108" fill="none" stroke="#a87e5d" strokeWidth="2"/>
   <path d="M10 91H17V98H10ZM96 108H103V114H96ZM5 54H10V60H5Z" fill="#76816a"/>
  </svg><i/><i/><i/></div>
  <div className="defeat-stats"><span>{vi?'THỜI GIAN':'TIME'} <b>{hud.elapsedLevelTime.toFixed(1)}s</b></span><span>{vi?'MÀN CHƠI':'TRAIL'} <b>{String((engine?.currentLevelIdx??0)+1).padStart(2,'0')}</b></span></div>
  <div className="defeat-hint"><span>{vi?'LẦN NÀY, THỬ CÁCH KHÁC':'A DIFFERENT APPROACH'}</span><p>{hint}</p></div>
  <p className="defeat-kept">{vi?'Ấn chưa dùng và tiến trình vẫn được giữ lại.':'Unused runes and campaign progress are safe.'}</p>
  {engine?.canUseSupply('revive')&&<button className="defeat-retry" onClick={()=>engine.useSupply('revive')}>{vi?'DÙNG TRỤC PHỤC SINH · VỀ PHÁP ĐÀN':'USE SCROLL · REVIVE AT ALTAR'}</button>}
  <button className="defeat-retry" onClick={()=>engine?.restartLevel()}><RotateCcw size={18}/>{vi?'THỬ LẠI':'TRY AGAIN'}<ArrowRight size={17}/></button>
  <button className="defeat-return" onClick={()=>engine?.goToLobby()}><Map size={15}/>{vi?'VỀ SẢNH CHỌN MÀN':'BACK TO THE TRAILS'}</button>
 </section></div>;
}

export function EndScreen({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  if(hud.screen!=='ending')return <DefeatScreen engine={engine} hud={hud}/>;
  const vi=hud.language==='vi',hero=hud.characterClass==='swordsman'?'Kael':hud.characterClass==='mechanical'?'Rivet-07':'Aeris';
  return <div className="modal-backdrop finale-backdrop"><section className="journey-finale" role="dialog" aria-modal="true" aria-labelledby="finale-title">
    <header className="finale-heading"><span>{vi?'HÀNH TRÌNH HOÀN TẤT':'JOURNEY COMPLETE'}</span><b>VI / VI</b></header>
    <div className="finale-body"><div className="finale-hero" data-character={hud.characterClass}><div className="hero-echo-ring"/><div className="finale-portrait"><SelectedCharacterAvatar hud={hud}/></div><span>{hero}</span><small>{vi?'NGƯỜI GÌN GIỮ KÝ ỨC':'KEEPER OF ECHOES'}</small></div>
    <div className="finale-story"><span className="finale-kicker">{vi?'THỦ VỆ BĂNG ĐÃ GỤC NGÃ':'THE FROST GUARDIAN HAS FALLEN'}</span><h2 id="finale-title">{vi?'Khu rừng\nđã thức giấc.':'The forest\nawakens.'}</h2><p>{vi?'Qua sáu thử thách, bạn và những tiếng vọng đã đưa ký ức trở về khu rừng. Hành trình này sẽ được ghi nhớ.':'Through six trials, you and your Echoes have returned the forest’s memories. Your journey will be remembered.'}</p>
    <div className="finale-seals" aria-label={vi?'Đã hoàn thành 6 màn':'All six trials completed'}>{['I','II','III','IV','V','VI'].map(n=><span key={n}>{n}<Check size={12}/></span>)}</div>
    <div className="finale-stats"><span>{vi?'THỜI GIAN ĐẤU BOSS':'BOSS BATTLE'}<b>{hud.elapsedLevelTime.toFixed(1)}s</b></span><span>{vi?'XẾP HẠNG':'RATING'}<b aria-label={`${hud.lastRating?.stars??0} / 3`}>{'★'.repeat(hud.lastRating?.stars??0)}{'☆'.repeat(3-(hud.lastRating?.stars??0))}</b></span></div>
    <p className="finale-key-reward">+{hud.lastRating?.keys??0} {vi?'CHÌA KHÓA MỞ RƯƠNG':'CHEST KEYS'}</p>
    <p className="finale-saved">{vi?'Tiến trình đã lưu · Cả sáu màn đã mở để chơi lại.':'Progress saved · All six trails are open for replay.'}</p></div></div>
    <footer className="finale-actions"><button className="secondary" onClick={()=>engine?.restartLevel()}><RotateCcw size={17}/>{vi?'ĐẤU LẠI BOSS':'REMATCH GUARDIAN'}</button><button className="primary" onClick={()=>engine?.goToLobby()}><Map size={18}/>{vi?'VỀ SẢNH CHỌN MÀN':'BACK TO THE TRAILS'}<ArrowRight size={17}/></button></footer>
  </section></div>;
}
