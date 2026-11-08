import React, {useEffect, useState} from 'react';
import type {GameEngine, HUDState} from '../game/GameEngine.ts';
import {MECHANICAL_ENABLED} from '../game/logic/campaign.ts';
import './tanukiShop.css';

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
function Coin() { return <img className="tanuki-coin" src={asset('ui/raccoon-coin.png')} alt="" aria-hidden="true"/>; }

export function TanukiShop({engine, hud}: {engine: GameEngine|null; hud: HUDState}) {
  const vi = hud.language === 'vi';
  const [tab, setTab] = useState<'items'|'outfits'>('items');
  const [speech, setSpeech] = useState<'welcome'|'shop'|'bye'>('welcome');
  const [chestOpen, setChestOpen] = useState(true);
  const [chestDialog, setChestDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [turnRequest, setTurnRequest] = useState(0);
  const [turnFrame, setTurnFrame] = useState(0);
  useEffect(() => {
    if (!turnRequest || hud.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTurnFrame(0); return; }
    let frame = 0;
    const timer = window.setInterval(() => {
      frame++;
      if (frame >= 8) { window.clearInterval(timer); setTurnFrame(0); }
      else setTurnFrame(frame);
    }, 120);
    return () => window.clearInterval(timer);
  }, [turnRequest, hud.reducedMotion]);
  useEffect(() => {
    if (!chestDialog) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); setChestDialog(false); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [chestDialog]);
  const say = speech === 'bye' ? (vi?'Hẹn gặp lại!':'See you again!') : speech === 'shop' ? (vi?'Mời mua hàng!':'Have a look!') : (vi?'Chào mừng!':'Welcome!');
  const purchase = (kind: 'time'|'ring') => {
    if (!engine || hud.coins < (kind === 'time' ? 5 : 30)) return;
    if (kind === 'time') engine.buyTimeItem(); else engine.buyLimitRing();
    setMessage(vi?'Cảm ơn bạn đã mua hàng!':'Thank you for your purchase!');
  };
  return <div className={`tanuki-shop${hud.reducedMotion?' reduced-motion':''}`}>
    <div className="tanuki-scene" aria-hidden="true"><img src={asset('ui/tanuki-shop-stage.png')} alt=""/><div className="tanuki-turn-sprite" style={{backgroundImage:`url(${asset('ui/tanuki-shop-turn.png')})`,backgroundPosition:`${(turnFrame%4)*100/3}% ${Math.floor(turnFrame/4)*100}%`}}/><i className="tanuki-flame tanuki-flame-lantern"/><i className="tanuki-flame tanuki-flame-lamp"/></div>
    <div className="tanuki-scene-controls">
      <div className="tanuki-speech" aria-live="polite">{say}</div>
      <button className="tanuki-merchant" aria-label={vi?'Trò chuyện với Tanuki':'Talk to Tanuki'} onClick={()=>{setSpeech(speech === 'shop' ? 'welcome' : 'shop');setTurnRequest(n=>n+1);}}/>
      <button className={`tanuki-chest ${chestOpen?'':'is-closed'}`} aria-label={vi?'Mở rương thưởng':'Open reward chest'} onClick={()=>{setChestOpen(false);setChestDialog(true);}}>
        {!chestOpen && <span className="tanuki-closed-chest" aria-hidden="true"><i/></span>}
        <span className="tanuki-chest-label">{vi?'RƯƠNG THƯỞNG':'REWARD CHEST'}</span>
      </button>
    </div>
    <header className="tanuki-header"><h1>{vi?'KHO BÁU THỜI GIAN':'TIME TREASURES'}</h1><div className="tanuki-wallet"><Coin/> <strong>{hud.coins.toLocaleString()}</strong> {vi?'xu':'coins'}</div></header>
    <button className="tanuki-back" onMouseEnter={()=>setSpeech('bye')} onMouseLeave={()=>setSpeech('welcome')} onFocus={()=>setSpeech('bye')} onBlur={()=>setSpeech('welcome')} onClick={()=>engine?.goToLobby()}>‹ {vi?'VỀ SẢNH':'BACK TO LOBBY'}</button>
    <main className="tanuki-panel">
      <div className="tanuki-panel-heading"><span>✦ {vi?'QUẦY CỦA TANUKI':'TANUKI’S SHOP'} ✦</span><h2>{vi?'NƠI BÁN MỌI THỨ BẠN CẦN':'EVERYTHING FOR YOUR JOURNEY'}</h2></div>
      <div className="tanuki-tabs" role="tablist" aria-label={vi?'Danh mục cửa hàng':'Shop categories'}>
        <button role="tab" aria-selected={tab==='items'} onClick={()=>setTab('items')}>{vi?'VẬT PHẨM':'ITEMS'} <span aria-hidden="true">✦</span></button>
        <button role="tab" aria-selected={tab==='outfits'} onClick={()=>setTab('outfits')}>{vi?'TRANG PHỤC':'OUTFITS'} <span aria-hidden="true">♜</span></button>
      </div>
      <div className="tanuki-stock" role="tabpanel">
        {tab === 'outfits' ? <div className="tanuki-empty"><span>✧</span><p>{vi?'Đang nhập hàng, hãy chờ nha!':'New outfits are on their way. Please wait!'}</p></div> : <>
          <article className="tanuki-product"><div className="tanuki-product-art tanuki-clock" aria-hidden="true"><svg viewBox="0 0 32 40" aria-hidden="true" shapeRendering="crispEdges"><path fill="#4d291b" d="M6 2h20v4h-2v4h-2v4h-2v4h-2v4h2v4h2v4h2v4h2v4H6v-4h2v-4h2v-4h2v-4h2v-4h-2v-4h-2v-4H8V6H6z"/><path fill="#e3aa57" d="M8 3h16v3H8zm0 31h16v3H8z"/><path fill="#a2dbea" d="M10 7h12v4h-2v4h-2v3h-4v-3h-2v-4h-2zm4 16h4v3h2v4h2v3H10v-3h2v-4h2z"/><path fill="#ffc650" d="M11 11h10v2h-2v3h-6v-3h-2zm3 17h4v2h2v3h-8v-3h2z"/></svg><b>+2s</b></div><div className="tanuki-product-copy"><h3>{vi?'Bình thời gian':'Time potion'}</h3><p>{vi?'Dùng một lần để cộng 2 giây cho chặng hiện tại. Nhấn F trong màn chơi.':'Use once to add 2 seconds to the current leg. Press F while playing.'}</p><small>{vi?'Đang có':'Owned'}: {hud.timeItems}</small><div className="tanuki-product-bottom"><b><Coin/> 5 {vi?'xu':'coins'}</b><button disabled={hud.coins<5} onClick={()=>purchase('time')}>{vi?'MUA':'BUY'}</button></div></div></article>
          <article className="tanuki-product"><div className="tanuki-product-art"><img src={asset('effects/echo-limit-ring.png')} alt=""/></div><div className="tanuki-product-copy"><h3>{vi?'Nhẫn tăng giới hạn':'Echo limit ring'}</h3><p>{vi?'Dùng một nhẫn để tăng giới hạn từ 4 lên 6 Echo trong màn hiện tại. Không cộng dồn.':'Use one ring to raise the Echo limit from 4 to 6 for this level. Does not stack.'}</p><small>{vi?'Đang có':'Owned'}: {hud.limitRings}</small><div className="tanuki-product-bottom"><b><Coin/> 30 {vi?'xu':'coins'}</b><button disabled={hud.coins<30} onClick={()=>purchase('ring')}>{vi?'MUA':'BUY'}</button></div></div></article>
          {MECHANICAL_ENABLED && <article className="tanuki-product"><div className="tanuki-product-copy"><h3>Rivet-07</h3><div className="tanuki-product-bottom"><b><Coin/> 100 {vi?'xu':'coins'}</b><button disabled={hud.mechanicalOwned||hud.coins<100} onClick={()=>engine?.buyMechanical()}>{hud.mechanicalOwned?(vi?'ĐÃ SỞ HỮU':'OWNED'):(vi?'MUA':'BUY')}</button></div></div></article>}
        </>}
      </div>
      <p className="tanuki-purchase-message" role="status">{message}</p>
    </main>
    {chestDialog && <div className="tanuki-dialog-backdrop" onClick={()=>setChestDialog(false)}><section className="tanuki-dialog" role="dialog" aria-modal="true" aria-labelledby="tanuki-chest-title" onClick={e=>e.stopPropagation()}><span className="tanuki-dialog-icon">✦</span><h2 id="tanuki-chest-title">{vi?'RƯƠNG THƯỞNG':'REWARD CHEST'}</h2><p>{vi?'Rương thưởng đang được chuẩn bị. Hẹn gặp bạn khi rương mở nhé!':'The reward chest is being prepared. Come back when it opens!'}</p><button autoFocus onClick={()=>setChestDialog(false)}>{vi?'QUAY LẠI CỬA HÀNG':'BACK TO SHOP'}</button></section></div>}
  </div>;
}
