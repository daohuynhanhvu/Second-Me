import {ChestGacha} from './ChestGacha.tsx';
import React, {useEffect, useState} from 'react';
import type {GameEngine, HUDState} from '../game/GameEngine.ts';
import {MECHANICAL_ENABLED,TIME_ITEM_CAP,TIME_ITEM_PRICE} from '../game/logic/campaign.ts';
import {TimeItemArt} from './TimeItemArt.tsx';
import './tanukiShop.css';

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
function Coin() { return <img className="tanuki-coin" src={asset('ui/raccoon-coin.png')} alt="" aria-hidden="true"/>; }

export function TanukiShop({engine, hud}: {engine: GameEngine|null; hud: HUDState}) {
  const vi = hud.language === 'vi';
  const [tab, setTab] = useState<'items'|'outfits'>('items');
  const [speech, setSpeech] = useState<'welcome'|'shop'|'bye'>('welcome');
  const [message, setMessage] = useState('');
  const [greeting, setGreeting] = useState({text: vi?'Kính chào!':'Welcome!', id:0});
  const [visible, setVisible] = useState(true);
  const [wave, setWave] = useState(1);
  const [frame, setFrame] = useState(17);
  const talk = (text: string, greet = false) => {
    setGreeting(previous=>({text,id:previous.id+1})); setVisible(true);
    if(greet) setWave(previous=>previous+1);
  };
  useEffect(()=>{ const timer=window.setTimeout(()=>setVisible(false),5000);return ()=>window.clearTimeout(timer); },[greeting.id]);
  useEffect(()=>{
    if(hud.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches){setFrame(0);return;}
    let tick=0;
    const timer=window.setInterval(()=>{
      tick++;
      if(tick<28) setFrame(17+tick);
      else { const idle=(tick-28)%65;setFrame(idle>=60?12+idle-60:Math.floor(idle*8/12)%12); }
    },1000/12);
    return ()=>window.clearInterval(timer);
  },[wave,hud.reducedMotion]);
  const purchase = (kind: 'time'|'ring') => {
    if (!engine) return;
    if (kind==='time' && hud.timeItems>=TIME_ITEM_CAP){talk(vi?'Túi đã đủ 99 vật phẩm rồi!':'You already have 99 of this item!');return;}
    if(hud.coins < (kind==='time'?TIME_ITEM_PRICE:30)){talk(vi?'Chưa đủ xu rồi… Hẹn bạn lần sau nhé!':'Not enough coins… Come back soon!');return;}
    if (kind === 'time') {if(!engine.buyTimeItem())return;} else engine.buyLimitRing();
    setMessage(vi?'Cảm ơn bạn đã mua hàng!':'Thank you for your purchase!');
    talk(vi?'Cảm ơn bạn! Chúc hành trình thuận lợi!':'Thank you! Have a safe journey!',true);
  };
  return <div className={`tanuki-shop${hud.reducedMotion?' reduced-motion':''}`} onPointerDownCapture={()=>{if(visible)setGreeting(previous=>({...previous,id:previous.id+1}));}} onKeyDownCapture={()=>{if(visible)setGreeting(previous=>({...previous,id:previous.id+1}));}}>
    <div className="tanuki-scene" aria-hidden="true"><img src={asset('ui/tanuki-shop-stage.png')} alt=""/><div className="tanuki-turn-sprite" style={{backgroundImage:`url(${asset('ui/tanuki-greeting.png')})`,backgroundPosition:`${(frame%9)*100/8}% ${Math.floor(frame/9)*100/4}%`}}/><i className="tanuki-flame tanuki-flame-lantern"/><i className="tanuki-flame tanuki-flame-lamp"/></div>
    <div className="tanuki-scene-controls">
      <div className="tanuki-speech" aria-live="polite" hidden={!visible}>{greeting.text}</div>
      <button className="tanuki-merchant" aria-label={vi?'Trò chuyện với Tanuki':'Talk to Tanuki'} onClick={()=>{setSpeech(speech === 'shop' ? 'welcome' : 'shop');talk(vi?(speech==='shop'?'Hôm nay bạn muốn tìm món gì?':'Mời mua hàng!'):(speech==='shop'?'What are you looking for today?':'Have a look!'),true);}}/>

    </div>
    <ChestGacha engine={engine} hud={hud}/>
    <header className="tanuki-header"><h1>{vi?'KHO BÁU THỜI GIAN':'TIME TREASURES'}</h1><div className="tanuki-wallet"><Coin/> <strong>{hud.coins.toLocaleString()}</strong> {vi?'xu':'coins'}</div></header>
    <button className="tanuki-back" onMouseEnter={()=>talk(vi?'Hẹn gặp lại!':'See you again!',true)} onFocus={()=>talk(vi?'Hẹn gặp lại!':'See you again!',true)} onClick={()=>engine?.goToLobby()}>‹ {vi?'VỀ SẢNH':'BACK TO LOBBY'}</button>
    <main className="tanuki-panel">
      <div className="tanuki-panel-heading"><span>✦ {vi?'QUẦY CỦA TANUKI':'TANUKI’S SHOP'} ✦</span><h2>{vi?'NƠI BÁN MỌI THỨ BẠN CẦN':'EVERYTHING FOR YOUR JOURNEY'}</h2></div>
      <div className="tanuki-tabs" role="tablist" aria-label={vi?'Danh mục cửa hàng':'Shop categories'}>
        <button role="tab" aria-selected={tab==='items'} onClick={()=>setTab('items')}>{vi?'VẬT PHẨM':'ITEMS'} <span aria-hidden="true">✦</span></button>
        <button role="tab" aria-selected={tab==='outfits'} onClick={()=>{setTab('outfits');talk(vi?'Hàng chưa về… Mình cũng mong lắm!':'Still waiting for stock… Me too!');}}>{vi?'TRANG PHỤC':'OUTFITS'} <span aria-hidden="true">♜</span></button>
      </div>
      <div className="tanuki-stock" role="tabpanel">
        {tab === 'outfits' ? <div className="tanuki-empty"><span>✧</span><p>{vi?'Đang nhập hàng, hãy chờ nha!':'New outfits are on their way. Please wait!'}</p></div> : <>
          <article className="tanuki-product"><div className="tanuki-product-art tanuki-time-art"><TimeItemArt/></div><div className="tanuki-product-copy"><h3>{vi?'Thêm một chút':'A Little More'}</h3><p>{vi?'Cộng 2 giây cho chặng hiện tại, tối đa 5 lần mỗi màn. Nhấn F để dùng.':'Add 2 seconds to the current leg, up to 5 times per level. Press F to use.'}</p><small>{vi?'Thường · Đang có':'Common · Owned'}: {hud.timeItems}/{TIME_ITEM_CAP}</small><div className="tanuki-product-bottom"><b><Coin/> {TIME_ITEM_PRICE} {vi?'xu':'coins'}</b><button disabled={hud.coins<TIME_ITEM_PRICE||hud.timeItems>=TIME_ITEM_CAP} onClick={()=>purchase('time')}>{hud.timeItems>=TIME_ITEM_CAP?(vi?'ĐÃ ĐẦY':'FULL'):(vi?'MUA':'BUY')}</button></div></div></article>
          <article className="tanuki-product"><div className="tanuki-product-art"><img src={asset('effects/echo-limit-ring.png')} alt=""/></div><div className="tanuki-product-copy"><h3>{vi?'Nhẫn tăng giới hạn':'Echo limit ring'}</h3><p>{vi?'Dùng một nhẫn để tăng giới hạn từ 4 lên 6 Echo trong màn hiện tại. Không cộng dồn.':'Use one ring to raise the Echo limit from 4 to 6 for this level. Does not stack.'}</p><small>{vi?'Đang có':'Owned'}: {hud.limitRings}</small><div className="tanuki-product-bottom"><b><Coin/> 30 {vi?'xu':'coins'}</b><button disabled={hud.coins<30} onClick={()=>purchase('ring')}>{vi?'MUA':'BUY'}</button></div></div></article>
          {MECHANICAL_ENABLED && <article className="tanuki-product"><div className="tanuki-product-copy"><h3>Rivet-07</h3><div className="tanuki-product-bottom"><b><Coin/> 100 {vi?'xu':'coins'}</b><button disabled={hud.mechanicalOwned||hud.coins<100} onClick={()=>engine?.buyMechanical()}>{hud.mechanicalOwned?(vi?'ĐÃ SỞ HỮU':'OWNED'):(vi?'MUA':'BUY')}</button></div></div></article>}
        </>}
      </div>
      <p className="tanuki-purchase-message" role="status">{message}</p>
    </main>
  </div>;
}
