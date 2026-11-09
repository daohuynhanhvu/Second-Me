import {SHOP_ITEMS} from '../game/logic/shopItems.ts';
import {ShopItemIcon} from './ShopItemIcon.tsx';
import {useDialogClose} from './useDialogClose.ts';
import {useEffect,useRef,useState} from 'react';
import {KeyRound,Backpack,X,ArrowRight,ShieldCheck} from 'lucide-react';
import type {GameEngine,HUDState} from '../game/GameEngine.ts';
import {ECHO_RUNES} from '../game/logic/echoRunes.ts';
import {RuneLoadoutEditor,RuneStone} from './EchoRunes.tsx';
import './TrailInventory.css';
export function TrailInventory({engine,hud,close:onClose}:{engine:GameEngine|null;hud:HUDState;close:()=>void}){
 const {closing,close}=useDialogClose(onClose);
 const vi=hud.language==='vi',[inspect,setInspect]=useState(0),[editing,setEditing]=useState(false),root=useRef<HTMLDivElement>(null),closeRef=useRef(close);closeRef.current=close;
 const ids=hud.runeLoadout??[],rune=ECHO_RUNES.find(r=>r.id===ids[inspect]),active=rune&&hud.activeEchoRunes?.includes(rune.id),playing=hud.screen==='playing';
 const number=(n:number)=>n.toLocaleString(vi?'vi-VN':'en-US');
 useEffect(()=>{
  engine?.setInventoryOpen(true);const before=document.activeElement as HTMLElement|null;root.current?.querySelector<HTMLButtonElement>('.inventory-close')?.focus();
  const key=(e:KeyboardEvent)=>{if(document.querySelector('.rune-loadout-editor'))return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeRef.current();}else if(e.key==='Tab'){
   const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }};
  const requestClose=()=>closeRef.current();document.addEventListener('close-trail-inventory',requestClose);
  window.addEventListener('keydown',key,true);return()=>{document.removeEventListener('close-trail-inventory',requestClose);engine?.setInventoryOpen(false);window.removeEventListener('keydown',key,true);if(before?.isConnected)before.focus();};
 },[engine]);
 return <div className={`trail-inventory ${closing?'is-leaving':''}`} ref={root} data-lobby-dialog role="dialog" aria-modal="true" aria-labelledby="inventory-heading">
  {editing&&<RuneLoadoutEditor engine={engine} hud={hud} close={()=>setEditing(false)}/>}
  <header className="inventory-heading"><span className="inventory-emblem"><Backpack size={25}/></span><div><small>{vi?'HÀNH TRANG ECHO':'ECHO TRAVEL KIT'}</small><h2 id="inventory-heading">{vi?'Túi hành trình':'Trail inventory'}</h2></div><div className="inventory-wallet"><img src={`${import.meta.env.BASE_URL}assets/ui/raccoon-coin.png`} alt=""/><b>{number(hud.coins)}</b><small>{vi?'XU':'COINS'}</small></div><button className="inventory-close" onClick={close} aria-label={vi?'Đóng túi đồ':'Close inventory'}><X size={20}/></button></header>
  <div className="inventory-scroll">
   <h3 className="inventory-section-title">{vi?'VẬT PHẨM HỖ TRỢ':'TRAIL SUPPLIES'}</h3>
   <div className="inventory-supplies"><article><span className="supply-icon"><KeyRound size={30}/></span><div><h3>{vi?'Chìa khóa rương':'Chest keys'} <b>× {number(hud.chestKeys)}</b></h3><p>{vi?'Chỉ dùng mở rương · 5 chìa khóa mỗi lượt':'Chest only · 5 keys per draw'}</p></div></article>
    <article><span className="supply-icon time"><ShopItemIcon id="time"/></span><div><h3>{vi?'Bình thời gian':'Time potion'} <b>× {number(hud.timeItems)}</b></h3><p>{vi?'+2 giây · Tối đa 5 lần mỗi màn':'+2 seconds · Up to 5 uses per level'}</p></div>{playing&&<button disabled={!engine?.canUseTimeItem()} onClick={()=>engine?.useTimeItem()}>{vi?'DÙNG':'USE'}</button>}</article>
    <article><span className="supply-icon"><ShopItemIcon id="ring"/></span><div><h3>{vi?'Nhẫn giới hạn':'Echo limit ring'} <b>× {number(hud.limitRings)}</b></h3><p>{hud.limitRingActive?(vi?'Đang hiệu lực · Tối đa 6 Echo':'Active · Up to 6 Echoes'):(vi?'+2 giới hạn Echo · Không cộng dồn':'+2 Echo limit · Does not stack')}</p></div>{playing&&<button disabled={!hud.limitRings||hud.limitRingActive} onClick={()=>engine?.useLimitRing()}>{hud.limitRingActive?(vi?'ĐÃ DÙNG':'ACTIVE'):(vi?'DÙNG':'USE')}</button>}</article>
    {SHOP_ITEMS.filter(i=>i.id!=='time'&&i.id!=='ring').map(item=>{
      const id=item.id;
      const count=hud.supplies?.[id]??0;
      if(count===0&&!(id==='chances'&&(hud.chanceCharges??0)>0)&&!(id==='aid'&&hud.aidUnlocked))return null;
      return <article key={id}><span className="supply-icon"><ShopItemIcon id={id}/></span><div><h3>{vi?item.vi:item.en} <b>× {number(count)}</b></h3><p>{vi?item.detailVi:item.detailEn}</p>{id==='chances'&&<small>{vi?'TỰ ĐỘNG · Lượt còn lại trong món đã mở: ':'PASSIVE · Charges in opened item: '}{hud.chanceCharges??0}</small>}{hud.usedSupplies?.includes(id)&&<small>{vi?'Đã dùng trong màn này':'Used this level'}</small>}</div>{playing&&id!=='chances'&&id!=='revive'&&<button disabled={!engine?.canUseSupply(id)} onClick={()=>engine?.useSupply(id)}>{vi?'DÙNG':'USE'}</button>}</article>;
    })}
   </div>
   <div className="inventory-runes-title"><h3 className="inventory-section-title">{vi?'5 Ô RUNE ĐÃ CHỌN':'FIVE SELECTED RUNES'}</h3><button onClick={()=>setEditing(true)}>{vi?'ĐỔI RUNE':'CHANGE RUNES'}<ArrowRight size={12}/></button></div>
   <div className="inventory-rune-slots">{Array.from({length:5},(_,i)=>{const r=ECHO_RUNES.find(r=>r.id===ids[i]);return <button key={i} className={inspect===i?'inspecting':''} aria-pressed={inspect===i} aria-label={r?(vi?r.vi:r.en):(vi?`Ô trống ${i+1}`:`Empty slot ${i+1}`)} onClick={()=>{setInspect(i);if(!r)setEditing(true);}}><small>{i+1}</small>{r?<span style={{color:r.color}}><RuneStone id={r.id}/></span>:<span className="inventory-empty">◇</span>}<strong>{r?(vi?r.vi:r.en):(vi?'Ô trống':'Empty')}</strong>{r&&<em>× {number(hud.echoRunes?.[r.id]??0)}</em>}</button>;})}</div>
   <section className="inventory-rune-description" aria-live="polite">{rune?<><div><span>{active?(vi?'ĐANG HIỆU LỰC':'ACTIVE THIS ATTEMPT'):(vi?'ẤN NÂNG ECHO':'ECHO UPGRADE RUNE')}</span><h3>{vi?rune.vi:rune.en}</h3><p>{vi?rune.detailVi:rune.detailEn}</p></div>{playing&&<button disabled={!engine?.canUseEchoRune(rune.id)} onClick={()=>engine?.useEchoRune(rune.id)}>{active?(vi?'ĐANG DÙNG':'ACTIVE'):(vi?'DÙNG ẤN':'USE RUNE')}</button>}</>:<div><h3>{vi?'Sẵn sàng cho một tiếng vọng mới':'Room for a new Echo'}</h3><p>{vi?'Thắng màn để nhận ấn. Chọn Đổi rune để xem kho và sắp xếp 5 ô mang theo.':'Clear trails to earn runes. Choose Change runes to browse your collection and arrange five slots.'}</p></div>}</section>
   <p className="inventory-usage-note">{playing?(vi?'Trận đấu đang tạm dừng khi mở túi. Dùng rune tiêu hao 1 ấn.':'Combat is paused while the bag is open. Activating a rune consumes one charge.'):(vi?'Rune dùng trong màn 2–6. Bạn có thể xem và đổi bộ rune tại đây.':'Runes are used in levels 2–6. Inspect and change your rune set here.')}</p>
  </div>
  <footer className="inventory-footer"><span><ShieldCheck size={15}/>{hud.forged?(hud.weapon==='staff'?(vi?'Trượng Echo đã trang bị':'Echo staff equipped'):(vi?'Kiếm Echo đã trang bị':'Echo sword equipped')):(vi?'Vật phẩm lưu trên thiết bị':'Items saved on this device')}</span><button onClick={close}>{vi?'XONG':'DONE'}</button></footer>
 </div>;
}
