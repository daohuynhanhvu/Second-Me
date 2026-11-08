import { MechanicalPortrait } from './MechanicalPortrait.tsx';
import { IntroEffects } from './IntroEffects.tsx';
import React, { useEffect, useRef, useState } from 'react';
import { drawWizardSprite } from '../game/rendering/wizardSprite.ts';
import { drawSoldierSprite } from '../game/rendering/soldierSprite.ts';
import { localize } from '../localize.tsx';
import { translate } from '../i18n.ts';
import { ArrowRight, RotateCcw, Home, Pause, Volume2, VolumeX, Lock, Sword, Hammer, Check, Shield, Flame, Backpack, Bell, Settings, Map, Play, X, SlidersHorizontal, ShoppingBasket } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { MATERIALS, MECHANICAL_ENABLED } from '../game/logic/campaign.ts';
import { LEVELS } from '../game/logic/levels.ts';

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
  return hud.characterClass==='swordsman'
    ? <span className="selected-soldier-avatar"><KaelPortrait/></span>
    : <WizardAvatar/>;
}

export function Intro({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const [panel, setPanel] = useState<'none' | 'settings' | 'credits' | 'quit'>('none');
  const vi = hud.language === 'vi';
  const hasProgress = hud.completed.length > 0 || hud.forged;
  return <div className="intro-screen overlay" onKeyDown={event => {
    if (panel !== 'none' && ['Enter', ' ', 'Escape'].includes(event.key)) {
      event.stopPropagation();
      if (event.key === 'Escape') setPanel('none');
    }
  }}>
    <IntroEffects/>
    <h1 className="intro-accessible-title">SECOND ME</h1>
    <div className="intro-mobile-title" aria-hidden="true"><span>THE ANCIENT PATH REMEMBERS</span><strong>SECOND ME</strong><small>ECHOES OF THE WILD</small></div>
    <div className="intro-language" role="group" aria-label={vi ? 'Ngôn ngữ' : 'Language'}>
      <button type="button" className={!vi ? 'selected' : ''} aria-pressed={!vi} onClick={() => engine?.setLanguage('en')}>EN</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={vi ? 'selected' : ''} aria-pressed={vi} onClick={() => engine?.setLanguage('vi')}>VI</button>
    </div>
    <nav className="intro-menu" aria-label={vi ? 'Menu chính' : 'Main menu'}>
      <button className="intro-menu-item selected" onClick={() => engine?.openLobby()}><span aria-hidden="true">▹</span>{vi ? 'BẮT ĐẦU' : 'START GAME'}<span aria-hidden="true">◇</span></button>
      <button className="intro-menu-item" disabled={!hasProgress} onClick={() => engine?.continueGame()}>{vi ? 'TIẾP TỤC' : 'CONTINUE'}</button>
      <button className="intro-menu-item" onClick={() => setPanel('settings')}>{vi ? 'CÀI ĐẶT' : 'SETTINGS'}</button>
      <button className="intro-menu-item" onClick={() => setPanel('credits')}>{vi ? 'TÁC GIẢ' : 'CREDITS'}</button>
      <button className="intro-menu-item" onClick={() => setPanel('quit')}>{vi ? 'THOÁT' : 'QUIT'}</button>
    </nav>
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
    <details className="setting-controls"><summary>{hud.language==='vi'?'Xem điều khiển':'View controls'}</summary><p>{hud.language==='vi'?'WASD / phím mũi tên: di chuyển · E: ghi đường đi · Q: gọi Echo · 1–4: chọn Echo · C: tạm dừng / tiếp tục Echo · Shift + Q: hoán đổi · X: xóa Echo · F: dùng vật phẩm thời gian · Chuột trái: tấn công · Chuột phải / Space: kỹ năng · Shift: lướt né · Esc: tạm dừng':'WASD / arrow keys: move · E: record path · Q: summon Echo · 1–4: select Echo · C: pause / resume Echo · Shift + Q: swap · X: dismiss Echo · F: use time item · Left click: attack · Right click / Space: skill · Shift: dodge · Esc: pause'}</p></details>
    <button className="primary" onClick={close}>LƯU & ĐÓNG</button></div></div>);
}

const latestNews = { title: 'Diện mạo mới cho Aeris', description: 'Pháp sư Aeris khoác áo choàng xanh viền vàng theo phong cách pixel chibi. Các hướng nhìn và chuyển động của Aeris cùng Echo đã được làm mới.' };

export function Notifications({ close }: { close: () => void }) {
  return localize(<div className="modal-backdrop"><div className="panel news-panel"><div className="panel-top"><span className="eyebrow gold">THÔNG BÁO TRÒ CHƠI</span><button className="icon-close" aria-label="Đóng thông báo" onClick={close}><X size={18}/></button></div><h2>Tiếng vọng mới trong rừng</h2>
    <article className="news-feature"><span>MỚI · 08.11.2026</span><div><h3>{latestNews.title}</h3><p>{latestNews.description}</p></div></article>
    <article><time>08.11.2026</time><div><h3>Diện mạo mới cho Kael</h3><p>Kỵ sĩ Kael có diện mạo pixel chibi mới với tóc vàng, giáp bạc và áo choàng đỏ. Các hướng di chuyển và động tác chém cũng được làm mới.</p></div></article>
    <article><span>LÒ RÈN 1.5</span><div><h3>Thử thách từng chặng</h3><p>Năm màn đầu có 10 giây mỗi chặng. Mỗi 3 giây, mảnh thời gian rơi gần bạn; nhặt được cộng 4 giây. Bẫy dập và đá rơi giữ chân 0,25 giây; dây leo làm chậm cả một dải.</p></div></article>
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
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') { e.preventDefault(); engine?.goToMainMenu(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, bag, engine]);
  return localize(<div className="lobby-screen overlay"><div className="lobby-canopy"/><header className="lobby-header"><div><button className="character-entry" onClick={()=>engine?.openCharacters()} aria-label={hud.language==='vi'?'Chọn nhân vật':'Choose character'} title={hud.characterClass==='swordsman'?'Kael · Swordsman':'Aeris · Mage'}><SelectedCharacterAvatar hud={hud}/></button><span><b>SECOND ME</b><small>THE EMBERFORGE</small></span></div><nav><button className="lobby-home" onClick={()=>engine?.goToMainMenu()} title={hud.language==='vi'?'Về menu chính (Esc)':'Back to main menu (Esc)'}><Home size={15}/> {hud.language==='vi'?'MENU CHÍNH':'MAIN MENU'}</button><button onClick={()=>engine?.openCharacters()} aria-label={(hud.language==='vi'?'Chọn nhân vật: ':'Choose character: ')+(hud.characterClass==='swordsman'?'Kael':'Aeris')} title={(hud.language==='vi'?'Đang chọn: ':'Selected: ')+(hud.characterClass==='swordsman'?'Kael · Kiếm sĩ':'Aeris · Pháp sư')}><SelectedCharacterAvatar hud={hud}/> {hud.language==='vi'?'NHÂN VẬT':'CHARACTERS'} · {hud.characterClass==='swordsman'?'Kael':'Aeris'}</button><button onClick={()=>setBag(true)}><Backpack size={17}/> {hud.language==='vi'?'TÚI ĐỒ':'INVENTORY'}</button><button onClick={()=>setPanel('news')}><Bell size={17}/><i/> THÔNG BÁO</button><button onClick={()=>setPanel('settings')}><Settings size={17}/> CÀI ĐẶT</button></nav></header>
    <div className="lobby-layout"><aside className="lobby-welcome"><span className="eyebrow gold">TRẠI NGHỈ ECHO</span><h1>{complete ? 'Khu rừng đã thức giấc.' : hud.completed.length ? 'Hành trình vẫn đang gọi.' : 'Lối mòn đầu tiên đang chờ.'}</h1><p>{complete ? 'Toàn bộ ký ức đã được giải phóng. Bạn có thể quay lại bất kỳ màn nào.' : 'Thu hồi năm di vật, rèn vũ khí của class và đối mặt với Thủ Vệ Băng.'}</p>
      <button className="secondary lobby-character-link" onClick={()=>engine?.openCharacters()}>{hud.language==='vi'?'NHÂN VẬT & CLASS':'CHARACTERS & CLASSES'} <ArrowRight size={15}/></button>
      {!complete && <button className="primary lobby-continue" onClick={()=>hud.completed.length ? engine?.continueGame() : engine?.selectLevel(0)}><Play size={18}/>{hud.completed.length ? `TIẾP TỤC · MÀN 0${next+1}` : 'BẮT ĐẦU MÀN 01'}</button>}
      <button className="secondary lobby-shop-link" onClick={()=>engine?.openShop()}><ShoppingBasket size={18}/> {hud.language==='vi'?'CỬA HÀNG':'SHOP'} · {hud.coins} {hud.language==='vi'?'XU':'COINS'}</button>
      {complete && <div className="campaign-seal"><Sword size={24}/><span>CHIẾN DỊCH HOÀN TẤT<small>6 / 6 MÀN ĐÃ MỞ</small></span></div>}
      <button className="text-button new-run" onClick={()=>engine?.startGame()}><RotateCcw size={14}/> HÀNH TRÌNH MỚI</button>
    </aside>
    <section className="trail-map"><div className="map-title"><span><Map size={16}/> BẢN ĐỒ LỐI MÒN</span><small>{complete || hud.devUnlocked ? 'CHỌN MÀN ĐỂ CHƠI LẠI' : `${hud.completed.length} / 6 HOÀN THÀNH`}</small></div><div className="trail-grid">{LEVELS.map((level,index)=>{
      const unlocked = hud.devUnlocked || complete || (index <= hud.completed.length && (index < 5 || hud.forged));
      const cleared = index < 5 ? hud.completed.includes(index+1) : complete;
      return <button key={level.id} disabled={!unlocked} className={`map-node node-${index+1} ${cleared?'cleared':''}`} onClick={()=>engine?.selectLevel(index)}><span className="node-number">0{level.id}</span><div><small>{index===5?'BOSS':`CHẶNG ${index+1}`}</small><strong>{level.subtitle}</strong><em>{cleared?'ĐÃ HOÀN THÀNH':unlocked?'SẴN SÀNG':'CHƯA MỞ'}</em><span className="level-stars">{'★'.repeat(hud.bestStars[level.id]??0)}{'☆'.repeat(3-(hud.bestStars[level.id]??0))}</span></div>{unlocked?<ArrowRight size={17}/>:<Lock size={16}/>}</button>;
    })}</div></section>
    <aside className="lobby-side"><button className="lobby-card shop-card" onClick={()=>engine?.openShop()}><ShoppingBasket className="shop-icon" size={24}/><span><small>CỬA HÀNG</small><b>{hud.coins} {hud.language==='vi'?'xu':'coins'}</b><em>{hud.language==='vi'?'Mua vật phẩm thời gian':'Buy time items'}</em></span><ArrowRight size={16}/></button><button className="lobby-card news-card" onClick={()=>setPanel('news')}><Bell size={21}/><span><small>THÔNG BÁO MỚI</small><b>{latestNews.title}</b><em>Xem thay đổi trò chơi</em></span><ArrowRight size={16}/></button><div className="relic-card"><Backpack size={20}/><span><small>DI VẬT ĐÃ THU HỒI</small><b>{hud.completed.length} / 5</b></span><div>{MATERIALS.map((m,i)=><i key={m.id} className={hud.completed.includes(i+1)?'found':''}>{m.icon}</i>)}</div></div></aside></div>
    {bag&&<div className="modal-backdrop" onClick={()=>setBag(false)}><div className="panel inventory-modal" onClick={e=>e.stopPropagation()}><Inventory hud={hud} close={()=>setBag(false)}/></div></div>}
    {panel==='news'&&<Notifications close={()=>setPanel('none')}/>} {panel==='settings'&&<SettingsPanel engine={engine} hud={hud} close={()=>setPanel('none')}/>}</div>);
}

export function Shop({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const vi = hud.language === 'vi';
  return <div className="modal-backdrop shop-screen"><div className="panel shop-panel"><span className="eyebrow gold">{vi?'CỬA HÀNG TRẠI NGHỈ':'CAMP SHOP'}</span><h2>{vi?'Kho báu thời gian':'Time supplies'}</h2><p className="muted">{vi?'Xu nhận khi hoàn thành màn: 3 sao = 12 xu · 2 sao = 8 xu · 1 sao = 4 xu.':'Earn coins by finishing levels: 3 stars = 12 · 2 stars = 8 · 1 star = 4.'}</p><div className="shop-balance">✦ {hud.coins} {vi?'xu':'coins'}</div><div className="shop-item"><div className="shop-item-art">✧<small>+2s</small></div><div><h3>{vi?'Bình thời gian':'Time potion'}</h3><p>{vi?'Dùng một lần để cộng 2 giây cho chặng hiện tại. Nhấn F trong màn chơi.':'Single use: add 2 seconds to the current leg. Press F while playing.'}</p><small>{vi?'Đang có':'Owned'}: {hud.timeItems}</small></div><button className="primary" disabled={hud.coins < 5} onClick={()=>engine?.buyTimeItem()}>{vi?'MUA · 5 XU':'BUY · 5 COINS'}</button></div>{MECHANICAL_ENABLED && <div className="shop-item"><MechanicalPortrait/><div><h3>Rivet-07 · {vi?'Cơ giới':'Mechanic'}</h3><p>{vi?'Cưa máy · Quá tải: tăng tốc đánh trong 5 giây. Mở khóa vĩnh viễn.':'Chainblade · Overdrive: faster attacks for 5 seconds. Permanent unlock.'}</p></div><button className="primary" disabled={hud.mechanicalOwned || hud.coins<100} onClick={()=>engine?.buyMechanical()}>{hud.mechanicalOwned?(vi?'ĐÃ SỞ HỮU':'OWNED'):(vi?'MUA · 100 XU':'BUY · 100 COINS')}</button></div>}<button className="secondary" onClick={()=>engine?.goToLobby()}>{vi?'VỀ SẢNH':'BACK TO LOBBY'}</button></div></div>;
}

export function Inventory({ hud, close }: { hud: HUDState; close: () => void }) {
  const vi = hud.language === 'vi';
  return <div className="inventory-content"><div className="panel-top"><span className="eyebrow gold">{vi?'TÚI ĐỒ':'INVENTORY'}</span><button className="icon-close" aria-label={vi?'Đóng túi đồ':'Close inventory'} onClick={close}><X size={18}/></button></div><h2>{vi?'Vật phẩm của bạn':'Your items'}</h2><div className="inventory-currency"><span>✦</span><strong>{vi?'Xu':'Coins'}</strong><b>{hud.coins}</b></div><div className="inventory-currency"><span>✧</span><strong>{vi?'Bình thời gian +2 giây':'Time potion +2 seconds'}</strong><b>× {hud.timeItems}</b></div><span className="eyebrow gold">{vi?'DI VẬT':'RELICS'}</span>{MATERIALS.map((m,i)=><div className={'inventory-item '+(hud.completed.includes(i+1)?'found':'')} key={m.id}><span style={{color:m.color}}>{m.icon}</span><strong>{translate(m.name,hud.language)}</strong><small>{hud.completed.includes(i+1)?'× 1':'—'}</small></div>)}{hud.forged&&<div className="equipped">{hud.weapon==='staff'?'✦':'⚔'} {vi?'ĐÃ TRANG BỊ':'EQUIPPED'} · {hud.weapon==='staff'?(vi?'Trượng Echo':'Echo staff'):(vi?'Kiếm Echo':'Echo sword')}</div>}</div>;
}

const classOptions = [
  {name:'Aeris',id:'mage', icon:'✦', en:'Mage', vi:'Pháp sư', weaponEn:'Magic staff', weaponVi:'Trượng phép', ready:true},
  {name:'Sylva',id:'ranger', icon:'⌁', en:'Ranger', vi:'Xạ thủ', ready:false},
  {name:'Kael',id:'swordsman', icon:'⚔', en:'Swordsman', vi:'Kiếm sĩ', weaponEn:'Sword', weaponVi:'Kiếm', ready:true},
  {name:'Bastion',id:'tank', icon:'⬡', en:'Tank', vi:'Đỡ đòn', ready:false},
  {name:'Nyx',id:'assassin', icon:'◇', en:'Assassin', vi:'Sát thủ', ready:false},
  {name:'Rivet-07',id:'mechanical', icon:'⚙', en:'Mechanic', vi:'Cơ giới', weaponEn:'Chainblade',weaponVi:'Cưa máy',ready:true},
  {name:'Fenrir',id:'beast', icon:'◆', en:'Beast', vi:'Dã thú', ready:false},
] as const;

function SwordsmanPortrait() { return <span className="soldier-profile"><KaelPortrait/></span>; }

export function Characters({engine,hud}:{engine:GameEngine|null;hud:HUDState}) {
  const vi=hud.language==='vi';
  const [selected,setSelected]=useState<string>(hud.characterClass);
  const choice=classOptions.find(c=>c.id===selected)!;
  return <div className="characters-screen overlay"><div className="characters-shell"><header><span className="eyebrow gold">{vi?'NHÂN VẬT':'CHARACTERS'}</span><button className="secondary" onClick={()=>engine?.goToLobby()}>{vi?'VỀ SẢNH':'BACK TO LOBBY'}</button></header><div className="characters-layout"><aside className="class-sidebar"><h2>{vi?'Chọn class':'Choose a class'}</h2>{classOptions.filter(c=>MECHANICAL_ENABLED || c.id!=='mechanical').map(c=><button key={c.id} className={selected===c.id?'selected':''} onClick={()=>{setSelected(c.id);if(c.ready)engine?.selectClass(c.id);}}><span>{c.icon}</span><strong>{c.name} · {vi?c.vi:c.en}</strong><small>{c.id==='mechanical'&&!hud.mechanicalOwned?(vi?'SHOP · 100 XU':'SHOP · 100 COINS'):c.ready?(vi?'SẴN SÀNG':'READY'):(vi?'ĐANG THI CÔNG':'IN DEVELOPMENT')}</small></button>)}</aside><section className="character-detail"><div className="character-portrait">{choice.id==='mechanical'?<MechanicalPortrait/>:choice.id==='mage'?<span className="aeris-profile"><AerisPortrait/></span>:choice.id==='swordsman'?<SwordsmanPortrait/>:<span className="future-character">{choice.icon}</span>}</div><div className="character-description"><span className="eyebrow gold">{choice.id==='mechanical'&&!hud.mechanicalOwned?(vi?'MỞ KHÓA TRONG SHOP':'UNLOCK IN SHOP'):choice.ready?(vi?'NHÂN VẬT ĐÃ MỞ':'AVAILABLE CHARACTER'):(vi?'ĐANG TRONG TIẾN TRÌNH THI CÔNG':'UNDER CONSTRUCTION')}</span><h1>{choice.name}</h1><p>{vi?choice.vi:choice.en}</p>{choice.ready?<><p className="personal-skill-description">{choice.id==='mage'?(vi?'Chuột phải · Cầu sét: tối đa 3 cầu nhỏ, mỗi cầu tồn tại 6 giây.':'Right click · Storm Orbs: up to 3 small orbs, each lasts 6 seconds.'):choice.id==='swordsman'?(vi?'Chuột phải · Pháp trận ánh sáng: 5 giây, +20% sát thương và hồi 1 HP mỗi 2 giây khi đứng trong vòng.':'Right click · Light Sanctuary: 5 seconds, +20% damage and 1 HP every 2 seconds while inside.'):(vi?'Chuột phải · Quá tải: tăng gấp đôi tốc đánh trong 5 giây. Mở khóa trong shop với 100 xu.':'Right click · Overdrive: double attack speed for 5 seconds. Unlock in the shop for 100 coins.')}</p><p>{vi?'Vũ khí cố định':'Fixed weapon'}: <strong>{vi?choice.weaponVi:choice.weaponEn}</strong></p><p>{choice.id==='mechanical'?(vi?'Cận chiến bằng cưa máy.':'Melee attacks with a chainblade.'):choice.id==='mage'?(vi?'Tấn công bằng ma pháp từ trượng Echo.':'Casts magic through the Echo staff.'):(vi?'Cận chiến bằng kiếm Echo.':'Fights up close with the Echo sword.')}</p><span className="class-selected">{choice.id==='mechanical'&&!hud.mechanicalOwned?(vi?'CHƯA MỞ · SHOP 100 XU':'LOCKED · SHOP 100 COINS'):hud.characterClass===choice.id?(vi?'ĐANG ĐƯỢC CHỌN':'SELECTED'):(vi?'BẤM CLASS ĐỂ CHỌN':'CLICK CLASS TO SELECT')}</span></>:<div className="construction-notice"><strong>{vi?'Đang trong tiến trình thi công':'In development'}</strong><p>{vi?'Class này chưa thể vào trận. Hãy chọn Pháp sư hoặc Kiếm sĩ để chơi.':'This class is not playable yet. Choose Mage or Swordsman to play.'}</p></div>}</div></section></div></div></div>;
}

export function StaffArt({ large = false }: { large?: boolean }) {
  return <svg viewBox="0 0 100 210" className={large ? 'sword-art large' : 'sword-art'} aria-label="Trượng Echo"><defs><linearGradient id="staffWood" x1="0" x2="1"><stop stopColor="#57412f"/><stop offset=".5" stopColor="#b78b5c"/><stop offset="1" stopColor="#5f4734"/></linearGradient></defs><path d="M47 67Q41 121 44 200L55 200Q58 122 52 67Z" fill="url(#staffWood)" stroke="#d5b27a"/><path d="M50 69 20 43 32 17 50 8 68 17 80 43Z" fill="#48645e" stroke="#c8a56f" strokeWidth="4"/><path d="M50 18 64 40 50 60 36 40Z" fill="#8cf4ee" stroke="#e4ffff" strokeWidth="3"/><circle cx="50" cy="39" r="8" fill="#fff" opacity=".65"/><path d="M42 104q13 7 17-3M42 141q13 8 17-3M44 179q10 6 12-2" fill="none" stroke="#dbbb76" strokeWidth="4"/></svg>;
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
      })}</div></> : <><h2>Hợp tác với chính mình</h2><div className="help-grid"><p><kbd>W A S D</kbd> / phím mũi tên: di chuyển.</p><p><kbd>E</kbd> bắt đầu ghi; nhấn lần nữa để lưu. Echo đứng ở điểm cuối.</p><p><kbd>Q</kbd> gọi Echo. Để Echo giữ nút trong khi bạn vượt cổng. <kbd>X</kbd> xóa Echo.</p><p>5 màn đầu: 10 giây tới từng ấn thạch theo số, rồi 10 giây tới cổng thoát. Nhặt mảnh thời gian xuất hiện mỗi 3 giây để cộng 4 giây. Chỉ nhân vật chạm điểm mới được nạp giờ; nút cũ và Echo không nạp giờ.</p><p>Bẫy dập và đá rơi có viền vàng báo trước, gây mất 1 máu và giữ chân 0,25 giây khi trúng. Dây leo làm chậm 45% trên cả dải; có thể đi vòng.</p><p>Mỗi màn nhận một di vật khác nhau. Xong màn 5, ghép đủ năm di vật tại lò rèn.</p><p>Chuột trái tấn công; chuột phải hoặc <kbd>Space</kbd> dùng kỹ năng class; <kbd>F</kbd> dùng vật phẩm +2 giây. <kbd>Shift</kbd> lướt né; <kbd>Esc</kbd> tạm dừng.</p><p>Boss báo trước đòn đánh bằng vòng băng xanh. Né ra ngoài; Echo giữ ấn sẽ tăng sức mạnh.</p></div></>}
    </div></div>}
  </div>);
}

export function AdventureHUD({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const [bag, setBag] = useState(false);
  const [settings, setSettings] = useState(false);
  const boss = hud.bossHp > 0;
  return localize(<div className="adventure-hud overlay">
    <div className="hud-top"><div className="level-card"><small>{hud.levelName} / 06</small><strong>{hud.levelSubtitle}</strong><span>{Math.floor(hud.elapsedLevelTime / 60).toString().padStart(2,'0')}:{Math.floor(hud.elapsedLevelTime % 60).toString().padStart(2,'0')} <i/> <span className="hearts" aria-label={`${hud.health} trên 5 máu`}>{'♥'.repeat(hud.health)}<em>{'♡'.repeat(5-hud.health)}</em></span></span>
      {hud.echoDurationMs>0 && <div className="echo-timeline" aria-label="Echo timeline"><span>ECHO · {hud.echoCharges} lượt · {Math.ceil(hud.echoStability)} ổn định</span><div className="echo-timeline-track"><i style={{left:`${Math.min(100,hud.echoElapsedMs/hud.echoDurationMs*100)}%`}}/>{hud.echoEvents.map((event,index)=><b key={index} style={{left:`${Math.min(100,event.time/hud.echoDurationMs*100)}%`}} title={`${event.kind} · ${(event.time/1000).toFixed(1)}s`}>{event.kind==='attack'?'✦':'◆'}</b>)}</div></div>}
    </div>
      <div className="hud-tools"><span className="hud-wallet">✦ {hud.coins} · +2s ×{hud.timeItems}</span><button aria-label="Túi nguyên liệu" title="Túi nguyên liệu" onClick={() => setBag(!bag)}><Backpack size={17}/><span>{hud.forged ? hud.weapon==='staff'?'✦':<Sword size={13}/> : `${hud.completed.length}/5`}</span></button><button aria-label="Cài đặt" onClick={() => setSettings(true)}><Settings size={17}/></button><button aria-label="Bật tắt âm thanh" onClick={() => engine?.toggleAudio()}>{hud.isMuted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><button aria-label="Chơi lại màn" onClick={() => engine?.restartLevel()}><RotateCcw size={17}/></button><button aria-label="Pause game" onClick={() => engine?.pauseGame()}><Pause size={17}/></button></div>
    </div>
    {hud.legTimeRemaining !== null && <div className={'leg-clock ' + (hud.legTimeRemaining <= 2 ? 'urgent' : '')} role="timer" aria-label="Thời gian đến điểm kế tiếp"><div><span>{hud.checkpointIndex < hud.checkpointCount ? `ĐẾN ẤN THẠCH ${hud.checkpointIndex+1} / ${hud.checkpointCount}` : 'ĐẾN CỔNG THOÁT'}</span><strong>{hud.legTimeRemaining.toFixed(1)}<small>s</small></strong></div><div className="leg-track"><i style={{width: `${Math.min(100,hud.legTimeRemaining/10*100)}%`}}/></div><p>{hud.slowed ? 'DÂY LEO · TỐC ĐỘ −45%' : 'Điểm mới +10s · Echo giữ cổng'}</p></div>}
    {boss && <div className="boss-bar"><div><span>THỦ VỆ BĂNG</span><small>{hud.bossHp} / 240 · {translate('GIAI ĐOẠN',hud.language)} {hud.bossPhase} / 3</small></div><div className="health-track" role="progressbar" aria-label="Máu boss" aria-valuenow={hud.bossHp} aria-valuemin={0} aria-valuemax={240}><i style={{ width: `${hud.bossHp/240*100}%` }}/></div><p className="boss-armor">{hud.pillarsRemaining>0?(hud.language==='vi'?`PHÁ ${hud.pillarsRemaining} TRỤ ĐỂ GỠ GIÁP · GIÁP ${hud.bossArmor}`:`DESTROY ${hud.pillarsRemaining} PILLARS · ARMOR ${hud.bossArmor}`):(hud.language==='vi'?'BOSS ĐÃ MẤT GIÁP':'BOSS ARMOR BROKEN')}</p></div>}
    {hud.bannerMessage && <div className={'hud-banner ' + (boss ? 'boss-banner' : 'trail-banner')}>{hud.bannerMessage}</div>}
    {hud.activeBuff && <div className="combat-buff">{hud.activeBuff}</div>}
    {hud.dissonanceSeconds>0 && <div className="combat-buff" role="status">RẠN VỠ {hud.dissonanceSeconds.toFixed(1)} / 5s · Gọi Echo để bảo hộ</div>}
    {bag && <div className="inventory-panel"><Inventory hud={hud} close={()=>setBag(false)}/></div>}
    {settings && <SettingsPanel engine={engine} hud={hud} close={()=>setSettings(false)}/>} 
  </div>);
}

export function Completion({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const item = MATERIALS[(engine?.currentLevelIdx ?? 0)];
  const last = engine?.currentLevelIdx === 4;
  return localize(<div className="modal-backdrop"><div className="panel completion-panel"><span className="eyebrow gold">MỘT KÝ ỨC ĐƯỢC ĐÁNH THỨC</span><h2>Lối mòn đã mở</h2><p className="muted">{hud.levelName} · {hud.levelSubtitle}</p>
    <div className="completion-rating"><strong>{'★'.repeat(hud.lastRating?.stars ?? 0)}{'☆'.repeat(3-(hud.lastRating?.stars ?? 0))}</strong><span>+{hud.lastRating?.coins ?? 0} {hud.language==='vi'?'xu':'coins'} · {hud.elapsedLevelTime.toFixed(1)}s</span></div>
    <div className="reward-card"><span className="reward-glyph" style={{color:item?.color}}>{item?.icon}</span><div><small>{hud.lastReward ? 'NHẬN ĐƯỢC DI VẬT' : 'DI VẬT ĐÃ CÓ TRONG TÚI'}</small><h3>{item?.name}</h3><p>{item?.detail}</p></div><span className="reward-count">× 1</span></div>
    <div className="collection-line"><span>Nguyên liệu chế tạo {hud.weapon==='staff'?'trượng':'kiếm'}</span><strong>{hud.completed.length} / 5</strong></div><div className="material-pips">{MATERIALS.map((m,i)=><span key={m.id} className={hud.completed.includes(i+1)?'collected':''}>{m.icon}</span>)}</div>
    <button className="primary" onClick={() => engine?.nextLevel()}>{last ? <><Hammer size={19}/> ĐẾN LÒ RÈN CỔ</> : <>TIẾP TỤC · MÀN {(engine?.currentLevelIdx ?? 0)+2} <ArrowRight size={19}/></>}</button>
    <div className="button-row"><button className="secondary" onClick={() => engine?.restartLevel()}><RotateCcw size={15}/> CHƠI LẠI MÀN</button><button className="secondary" onClick={() => engine?.goToTitle()}><Home size={15}/> MENU</button></div>
  </div></div>);
}

export function Forge({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  return localize(<div className="modal-backdrop forge-backdrop"><div className="panel forge-panel"><div className="panel-top"><span className="eyebrow gold">TRẠM NGHỈ / SAU MÀN 05</span><span className="forge-badge"><Flame size={13}/> LÒ RÈN CỔ</span></div>
    <div className="forge-columns"><div><h2>{hud.forged ? hud.weapon==='staff'?'Một cây trượng.\nNăm ký ức.':'Một lưỡi kiếm.\nNăm ký ức.' : 'Từ những mảnh vỡ,\nrèn nên ánh sáng.'}</h2><p className="muted forge-description">{hud.forged ? `${hud.weapon==='staff'?'Trượng':'Kiếm'} Echo đã thức tỉnh. Phía sau cánh cổng cuối, Thủ Vệ Băng đang chờ bạn.` : `Năm lối mòn đưa bạn đến ngọn lửa này. Ghép các di vật để tạo ${hud.weapon==='staff'?'trượng phép':'thanh kiếm'} chạm tới Thủ Vệ Băng.`}</p>
      <div className="recipe-list">{MATERIALS.map((m,i)=><div className="recipe-item" key={m.id}><span className="recipe-icon" style={{color:m.color}}>{m.icon}</span><div><strong>{m.name}</strong><small>THU HỒI TỪ MÀN 0{i+1}</small></div><Check size={16}/></div>)}</div>
      <div className="sword-stats"><span>SÁT THƯƠNG <strong>15</strong></span><span>CỘNG HƯỞNG ECHO <strong>24</strong></span></div>
    </div><ForgeArt forged={hud.forged} weapon={hud.weapon}/></div>
    <div className="forge-footer"><p>{hud.forged ? 'Đã trang bị · Chuột trái tấn công · Chuột phải / Space kỹ năng' : 'Đủ 5 / 5 di vật · Chế tạo một lần cho hành trình này'}</p><button className="primary" disabled={!hud.forged && hud.completed.length < 5} onClick={() => hud.forged ? engine?.enterBoss() : engine?.forgeWeapon()}>{hud.forged ? <>BƯỚC VÀO ĐẤU TRƯỜNG <ArrowRight size={18}/></> : <><Hammer size={18}/> RÈN {hud.weapon==='staff'?'TRƯỢNG':'KIẾM'} ECHO</>}</button></div>
  </div></div>);
}

export function EndScreen({ engine, hud }: { engine: GameEngine | null; hud: HUDState }) {
  const won = hud.screen === 'ending';
  return localize(<div className="modal-backdrop"><div className="panel ending-panel"><div className="ending-emblem">{won ? <SwordArt/> : <Shield size={56}/>}</div><span className="eyebrow gold">{won ? 'HÀNH TRÌNH HOÀN TẤT / 06' : 'KÝ ỨC VẪN CÒN Ở ĐÂY'}</span><h2>{won ? 'Khu rừng thức giấc.' : hud.defeatReason === 'timeout' ? 'Hết thời gian.' : 'Đứng dậy lần nữa.'}</h2><p className="muted">{won ? 'Thủ Vệ Băng đã gục ngã. Toàn bộ sáu màn giờ đã mở trong sảnh để bạn tự do chơi lại.' : hud.defeatReason === 'timeout' ? 'Bạn có 10 giây cho mỗi chặng. Chạm ấn thạch theo số để nạp lại giờ; nhặt mảnh thời gian +4 giây, dùng Echo giữ cổng và tránh dây leo. Di vật đã thu thập vẫn được giữ lại.' : engine?.boss ? 'Di vật và vũ khí vẫn được giữ lại. Phá bốn trụ ở góc bản đồ trước, nhặt ô kỹ năng rơi mỗi 5 giây và dùng Echo đánh lạc hướng boss.' : 'Di vật đã thu thập vẫn được giữ lại. Tránh vùng bẫy khi viền vàng báo trước; dây leo làm chậm nhưng không mất máu.'}</p><button className="primary" onClick={() => won ? engine?.goToLobby() : engine?.restartLevel()}>{won ? <><Map size={18}/> VỀ SẢNH CHỌN MÀN</> : <><RotateCcw size={18}/> THỬ LẠI</>}</button>{won && <button className="secondary" onClick={()=>engine?.startGame()}><RotateCcw size={16}/> HÀNH TRÌNH MỚI</button>}<button className="text-button" onClick={() => engine?.goToLobby()}>VỀ SẢNH</button></div></div>);
}
