import {OutfitShop} from './OutfitShop.tsx';
import {useEffect,useRef,useState} from 'react';
import {ChestGacha} from './ChestGacha.tsx';
import {ShopItemIcon} from './ShopItemIcon.tsx';
import {SHOP_ITEMS,type ShopItemId} from '../game/logic/shopItems.ts';
import type {GameEngine,HUDState} from '../game/GameEngine.ts';
import './tanukiTradingPost.css';
const displayItems=[...SHOP_ITEMS.filter(i=>i.id==='time'||i.id==='ring'),...SHOP_ITEMS.filter(i=>i.id!=='time'&&i.id!=='ring'&&i.id!=='aid')];
const poseOffsets=[[0,0],[18,-2],[7,6],[18,6]];
const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/ui/${name}`;
export function TanukiShop({engine,hud}:{engine:GameEngine|null;hud:HUDState}){
 const vi=hud.language==='vi',viewport=useRef<HTMLDivElement>(null),dialog=useRef<HTMLFormElement>(null),buyButton=useRef<HTMLButtonElement>(null),reactionUntil=useRef(0);
 const [ready,setReady]=useState(false),[greetingRun,setGreetingRun]=useState(0),[scale,setScale]=useState(1),[selected,setSelected]=useState<ShopItemId>('time'),[tab,setTab]=useState<'items'|'outfits'>('items'),[confirm,setConfirm]=useState(false),[quantity,setQuantity]=useState(1),[message,setMessage]=useState(''),[pose,setPose]=useState(0),[speech,setSpeech]=useState(true);
 const [hovered,setHovered]=useState<ShopItemId|null>(null);
 const item=SHOP_ITEMS.find(i=>i.id===selected)!;
 const preview=SHOP_ITEMS.find(i=>i.id===(hovered??selected))!;
 const stock=(id:ShopItemId)=>id==='time'?hud.timeItems:id==='ring'?hud.limitRings:hud.supplies?.[id]??0;
 const unlocked=selected!=='aid'||!!hud.aidUnlocked,room=item.cap-stock(selected),affordable=item.price?Math.floor(hud.coins/item.price):room,maxQuantity=Math.max(0,Math.min(room,affordable));
 const close=()=>{setConfirm(false);buyButton.current?.focus();};
 useEffect(()=>{const element=viewport.current;if(!element)return;const resize=()=>setScale(Math.min(element.clientWidth/1280,element.clientHeight/720));resize();const observer=new ResizeObserver(resize);observer.observe(element);return()=>observer.disconnect();},[]);
 useEffect(()=>{
  let mounted=true;
  const load=(src:string)=>new Promise<void>(resolve=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>resolve();image.src=src;if(image.complete)resolve();});
  void Promise.all([load(asset('tanuki-market-sunset.png')),load(asset('tanuki-merchant-poses.png'))]).then(()=>{if(mounted)setReady(true);});
  return()=>{mounted=false;};
 },[]);
 useEffect(()=>{
  if(!ready)return;
  setSpeech(true);setGreetingRun(n=>n+1);reactionUntil.current=performance.now()+1800;
  setPose(hud.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:2);
 },[ready]);
 useEffect(()=>{if(!ready||hud.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;let tick=0;const interval=window.setInterval(()=>{tick++;if(performance.now()>=reactionUntil.current)setPose(tick%32===30?1:0);},160);return()=>window.clearInterval(interval);},[ready,hud.reducedMotion]);
 useEffect(()=>{if(!ready||!speech)return;const timeout=window.setTimeout(()=>setSpeech(false),7000);return()=>window.clearTimeout(timeout);},[ready,speech,message,greetingRun]);
 useEffect(()=>{if(!confirm)return;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}else if(e.key==='Tab'){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input')??[]),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[confirm]);
 const select=(id:ShopItemId)=>{setSelected(id);setQuantity(1);setMessage('');};
 const purchase=()=>{
  if(selected==='aid'||!unlocked||quantity<1||quantity>maxQuantity||!engine?.buyShopItem(selected,quantity)){setMessage(vi?'Không thể mua. Kiểm tra xu và chỗ trống trong túi.':'Cannot purchase. Check your coins and inventory capacity.');return;}
  setMessage(vi?`Đã nhận ${quantity} × ${item.vi}. Cảm ơn bạn!`:`Received ${quantity} × ${item.en}. Thank you!`);reactionUntil.current=performance.now()+1500;setPose(3);setSpeech(true);close();
 };
 return <div className="tanuki-trading-shop" ref={viewport}><div className="trading-world" style={{transform:`translate(-50%,-50%) scale(${scale})`}}>
  <img className="trading-background" src={asset('tanuki-market-sunset.png')} alt=""/>
  <div className="trading-fireflies" aria-hidden="true"><i/><i/><i/><i/></div>
  <button className={`trading-merchant ${hud.reducedMotion?'merchant-still':''}`} data-pose={pose} aria-label={vi?'Trò chuyện với Tanuki':'Talk to Tanuki'} onClick={()=>{setMessage('');setSpeech(true);setGreetingRun(n=>n+1);reactionUntil.current=performance.now()+1800;setPose(2);}}><span aria-hidden="true" style={{backgroundImage:`url(${asset('tanuki-merchant-poses.png')})`,backgroundPosition:`${pose%2*100}% ${Math.floor(pose/2)*100}%`,transform:`translate(${poseOffsets[pose][0]}px,${poseOffsets[pose][1]}px)`}}/></button>
  {/* The counter in front of Tanuki: the same painting, cut to the counter, so Tanuki stands behind it. */}
  <div className="trading-counter-front" aria-hidden="true" style={{backgroundImage:`url(${asset('tanuki-market-sunset.png')})`}}/>
  {ready&&<div className="trading-speech" role="status">{message||(vi?'Xin chào! Bạn muốn mua gì nào?':'Welcome! What would you like?')}</div>}
  <ChestGacha engine={engine} hud={hud}/>
  <div className="trading-wallet"><img src={asset('raccoon-coin.png')} alt=""/><span>{vi?'XU':'GOLD'}: <b>{hud.coins.toLocaleString(vi?'vi-VN':'en-US')}</b></span></div>
  <section className="trading-catalogue" aria-label={vi?'Quầy hàng Tanuki':'Tanuki’s shop'}>
   <div className="trading-tabs" role="tablist"><button role="tab" aria-selected={tab==='items'} onClick={()=>setTab('items')}>{vi?'VẬT PHẨM':'ITEMS'} <ShopItemIcon id="healSmall"/></button><button role="tab" aria-selected={tab==='outfits'} onClick={()=>setTab('outfits')}>{vi?'TRANG PHỤC':'OUTFITS'} <span aria-hidden="true">♜</span></button></div>

   <div className="trading-hint">{tab==='outfits'?(vi?'6 TRANG PHỤC · PHÁP SƯ & KIẾM SĨ':'6 OUTFITS · MAGE & SWORDSMAN'):vi?`${displayItems.length} VẬT PHẨM · CUỘN ĐỂ XEM TẤT CẢ`:`${displayItems.length} ITEMS · SCROLL TO SEE ALL`}</div>
   {tab==='items'?<><div className="trading-items" onMouseLeave={()=>setHovered(null)} role="tabpanel" aria-label={vi?'Vật phẩm':'Items'}>{displayItems.map(product=><button key={product.id} onMouseEnter={()=>setHovered(product.id)} onFocus={()=>setHovered(product.id)} onBlur={()=>setHovered(null)} aria-pressed={selected===product.id} onClick={()=>select(product.id)} className={selected===product.id?'selected':''}><ShopItemIcon id={product.id}/><span>{vi?product.vi:product.en}<small>{vi?'Đang có':'Owned'}: {stock(product.id).toLocaleString(vi?'vi-VN':'en-US')}</small></span><b>{`${product.price} ${vi?'xu':'coins'}`}</b></button>)}</div>
   <div className="trading-product-info" aria-live="polite"><header><strong>{vi?preview.vi:preview.en}</strong><small>{vi?'Trong túi':'Owned'} {stock(preview.id).toLocaleString()} / {preview.cap.toLocaleString()}</small></header><p>{vi?preview.detailVi:preview.detailEn}</p>{selected==='chances'&&(hud.chanceCharges??0)>0&&<small>{vi?'Món đang dùng còn ':'Opened item has '}{hud.chanceCharges} {vi?'lượt':'charges left'}</small>}</div></>:<OutfitShop engine={engine} hud={hud}/>}
  </section>
  <div className="trading-actions"><button className="trading-buy" hidden={tab==='outfits'} ref={buyButton} disabled={tab!=='items'||selected==='aid'||!unlocked||maxQuantity<1} onClick={()=>{setQuantity(1);setConfirm(true);}}>{selected==='aid'?(vi?'PHẦN THƯỞNG HÀNH TRÌNH':'JOURNEY REWARD'):!unlocked?(vi?'CHƯA MỞ KHÓA':'LOCKED'):room<=0?(vi?'TÚI ĐÃ ĐẦY':'INVENTORY FULL'):affordable<1?(vi?'CHƯA ĐỦ XU':'NOT ENOUGH COINS'):vi?'MUA':'BUY'}</button><button className="trading-leave" onClick={()=>engine?.goToLobby()}>← {vi?'QUAY LẠI':'BACK'}</button></div>
  {confirm&&<div className="trading-confirm-backdrop" onClick={close}><form ref={dialog} className="trading-confirm" role="dialog" aria-modal="true" aria-labelledby="trading-confirm-title" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();purchase();}}>
   <header><h2 id="trading-confirm-title">{vi?'XÁC NHẬN MUA?':'CONFIRM PURCHASE?'}</h2><button type="button" aria-label={vi?'Đóng xác nhận':'Close confirmation'} onClick={close}>×</button></header>
   <div className="trading-confirm-item"><ShopItemIcon id={selected}/><div><strong>{vi?item.vi:item.en}</strong><p>{vi?item.detailVi:item.detailEn}</p></div></div>
   <label className="trading-quantity"><span>{vi?'SỐ LƯỢNG':'QUANTITY'}</span><button type="button" aria-label={vi?'Giảm số lượng':'Decrease quantity'} disabled={quantity<=1} onClick={()=>setQuantity(n=>Math.max(1,n-1))}>‹</button><input type="number" aria-label={vi?'Số lượng':'Quantity'} min={1} max={maxQuantity} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(maxQuantity,Number(e.target.value)||1)))}/><button type="button" aria-label={vi?'Tăng số lượng':'Increase quantity'} disabled={quantity>=maxQuantity} onClick={()=>setQuantity(n=>Math.min(maxQuantity,n+1))}>›</button></label>
   <p className="trading-total">{vi?'GIÁ':'PRICE'}: {item.price} · {vi?'TỔNG':'TOTAL'}: <b>{item.price*quantity} {vi?'xu':'coins'}</b></p>
   <footer><button type="submit" disabled={quantity<1||quantity>maxQuantity}>{vi?'XÁC NHẬN':'YES · BUY'}</button><button type="button" onClick={close}>{vi?'HỦY':'CANCEL'}</button></footer>
  </form></div>}
  {!ready&&<div className="trading-loading" role="status">{vi?'Tanuki đang mở quầy…':'Tanuki is opening the stall…'}</div>}
 </div></div>;
}
