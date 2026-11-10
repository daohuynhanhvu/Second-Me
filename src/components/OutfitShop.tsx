import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {SHOP_OUTFITS,type ShopOutfitId} from '../game/logic/outfits.ts';
import {drawKnightOutfit} from '../game/rendering/knightOutfits.ts';
import {ComboPreview} from './ComboShowcase.tsx';
import type {GameEngine,HUDState} from '../game/GameEngine.ts';
import './OutfitShop.css';
export function OutfitPortrait({id}:{id:ShopOutfitId}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let raf=0;const draw=()=>{const ctx=ref.current?.getContext('2d');if(ctx){ctx.clearRect(0,0,84,84);if(drawKnightOutfit(ctx,42,69,'down',false,0,false,0,id))return;}raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[id]);
 return <canvas ref={ref} width={84} height={84} aria-hidden="true"/>;
}
export function OutfitShop({engine,hud}:{engine:GameEngine|null;hud:HUDState}){
 const vi=hud.language==='vi',[selected,setSelected]=useState<ShopOutfitId>('ice-knight'),[confirm,setConfirm]=useState(false),[message,setMessage]=useState('');
 const dialog=useRef<HTMLDivElement>(null),buy=useRef<HTMLButtonElement>(null),product=SHOP_OUTFITS.find(p=>p.id===selected)!;
 const owned=(hud.ownedOutfits??[]).includes(selected),equipped=hud.outfits?.swordsman===selected;
 const close=()=>{setConfirm(false);buy.current?.focus();};
 useEffect(()=>{if(!confirm)return;dialog.current?.querySelector('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}if(e.key==='Tab'){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[confirm]);
 return <div className="outfit-shop" role="tabpanel" aria-label={vi?'Trang phục Kiếm sĩ':'Swordsman outfits'}>
  <div className="outfit-shop-list">{SHOP_OUTFITS.map(p=><button key={p.id} aria-pressed={p.id===selected} onClick={()=>{setSelected(p.id);setMessage('');}} style={{borderColor:p.id===selected?p.color:undefined}}><OutfitPortrait id={p.id}/><span>{vi?p.vi:p.en}<small>{vi?'TRUNG CẤP · KIẾM SĨ':'INTERMEDIATE · SWORDSMAN'}</small><small>{(hud.ownedOutfits??[]).includes(p.id)?'1/1':'0/1'} · 100 {vi?'xu':'coins'}</small></span></button>)}</div>
  <div className="outfit-shop-preview"><ComboPreview hero="swordsman" outfit={selected} reducedMotion={hud.reducedMotion}/></div>
  <strong style={{color:product.color}}>{vi?product.vi:product.en}</strong><p>{vi?product.detailVi:product.detailEn}</p><small>{vi?'Chỉ thay đổi ngoại hình và màu hiệu ứng.':'Appearance and effect colors only.'}</small>
  <div className="outfit-shop-actions"><button ref={buy} disabled={!engine||(owned?equipped:hud.coins<100)} onClick={()=>{if(owned){if(engine?.setCharacterOutfit('swordsman',selected))setMessage(vi?'Đã mặc cho Kiếm sĩ.':'Equipped for the swordsman.');}else setConfirm(true);}}>{owned?(equipped?(vi?'ĐANG MẶC':'EQUIPPED'):(vi?'MẶC':'EQUIP')):hud.coins<100?(vi?'CẦN 100 XU':'NEED 100 COINS'):(vi?'MUA · 100 XU':'BUY · 100 COINS')}</button></div>
  <span role="status">{message}</span>
  {confirm&&createPortal(<div className="trading-confirm-backdrop" onClick={close}><div ref={dialog} className="trading-confirm" role="dialog" aria-modal="true" aria-labelledby="outfit-buy-title" onClick={e=>e.stopPropagation()}><h2 id="outfit-buy-title">{vi?'XÁC NHẬN MUA':'CONFIRM PURCHASE'}</h2><p>{vi?product.vi:product.en} · 100 {vi?'xu':'coins'}</p><p>{vi?'Trung cấp · Dành riêng cho Kiếm sĩ · Giới hạn 1/1':'Intermediate · Swordsman only · Limit 1/1'}</p><footer><button disabled={owned||hud.coins<100} onClick={()=>{const ok=engine?.buyOutfit(selected);setMessage(ok?(vi?'Đã mua! Chọn MẶC để sử dụng.':'Purchased! Choose EQUIP to wear it.'):(vi?'Không thể mua trang phục này.':'Cannot purchase this outfit.'));close();}}>{vi?'MUA · 100 XU':'BUY · 100 COINS'}</button><button onClick={close}>{vi?'HỦY':'CANCEL'}</button></footer></div></div>,document.querySelector('.trading-world')??document.body)}
 </div>;
}
