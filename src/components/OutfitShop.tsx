import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {SHOP_OUTFITS,orderedShopOutfits,type ShopOutfitId} from '../game/logic/outfits.ts';
import {rarityName,RARITY_COLORS} from '../game/logic/rarity.ts';
import {drawKnightOutfit} from '../game/rendering/knightOutfits.ts';
import {drawSoldierSprite} from '../game/rendering/soldierSprite.ts';
import {drawWizardSprite} from '../game/rendering/wizardSprite.ts';
import type {GameEngine,HUDState} from '../game/GameEngine.ts';
import './OutfitShop.css';
export function OutfitPortrait({id}:{id:ShopOutfitId}){
 const product=SHOP_OUTFITS.find(o=>o.id===id)!;
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const draw=()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,84,84);if(product.hero==='mage')drawWizardSprite(ctx,42,69,'down',false,false,0,product.outfit);else if(product.rarity==='refined')drawKnightOutfit(ctx,42,69,'down',false,0,false,0,product.outfit);else drawSoldierSprite(ctx,42,69,'down',false,false,0,false,0,product.outfit);};draw();const timer=window.setInterval(draw,250);return()=>window.clearInterval(timer);},[id]);
 return <canvas ref={ref} width={84} height={84} aria-hidden="true"/>;
}
export function OutfitShop({engine,hud}:{engine:GameEngine|null;hud:HUDState}){
 const vi=hud.language==='vi',[selected,setSelected]=useState<ShopOutfitId>('mage-frost'),[confirm,setConfirm]=useState(false),[message,setMessage]=useState('');
 const dialog=useRef<HTMLDivElement>(null),buy=useRef<HTMLButtonElement>(null),product=SHOP_OUTFITS.find(p=>p.id===selected)!;
 const owned=(hud.ownedOutfits??[]).includes(selected),equipped=hud.outfits?.[product.hero]===product.outfit;
 const close=()=>{setConfirm(false);buy.current?.focus();};
 useEffect(()=>{if(!confirm)return;dialog.current?.querySelector('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}if(e.key==='Tab'){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[confirm]);
 return <div className="outfit-shop" role="tabpanel" aria-label={vi?'Trang phục':'Outfits'}>
  <div className="outfit-shop-list">{orderedShopOutfits(hud.ownedOutfits??[]).map(p=><button key={p.id} aria-pressed={p.id===selected} onClick={()=>{setSelected(p.id);setMessage('');}} style={{borderColor:p.id===selected?RARITY_COLORS[p.rarity]:undefined}}><OutfitPortrait id={p.id}/><span>{vi?p.vi:p.en}<small>{rarityName(p.rarity,vi).toLocaleUpperCase(vi?'vi-VN':'en-US')} · {vi?(p.hero==='mage'?'PHÁP SƯ':'KIẾM SĨ'):(p.hero==='mage'?'MAGE':'SWORDSMAN')}</small><small>{(hud.ownedOutfits??[]).includes(p.id)?'1/1':'0/1'} · {p.price} {vi?'xu':'coins'}</small></span></button>)}</div>
  <div className="outfit-shop-description"><strong style={{color:product.color}}>{vi?product.vi:product.en}</strong><p>{vi?product.detailVi:product.detailEn}</p><small>{vi?'Chỉ thay đổi ngoại hình và màu hiệu ứng.':'Appearance and effect colors only.'}</small><span role="status">{message}</span></div>
  <div className="outfit-shop-actions"><button ref={buy} disabled={!engine||(owned?equipped:hud.coins<product.price)} onClick={()=>{if(owned){if(engine?.setCharacterOutfit(product.hero,product.outfit))setMessage(vi?'Đã mặc trang phục.':'Outfit equipped.');}else setConfirm(true);}}>{owned?(equipped?(vi?'ĐANG MẶC':'EQUIPPED'):(vi?'MẶC':'EQUIP')):hud.coins<product.price?(vi?`CẦN ${product.price} XU`:`NEED ${product.price} COINS`):(vi?`MUA · ${product.price} XU`:`BUY · ${product.price} COINS`)}</button></div>
  {confirm&&createPortal(<div className="trading-confirm-backdrop" onClick={close}><div ref={dialog} className="trading-confirm" role="dialog" aria-modal="true" aria-labelledby="outfit-buy-title" onClick={e=>e.stopPropagation()}><h2 id="outfit-buy-title">{vi?'XÁC NHẬN MUA':'CONFIRM PURCHASE'}</h2><p>{vi?product.vi:product.en} · {product.price} {vi?'xu':'coins'}</p><p>{rarityName(product.rarity,vi)} · {vi?(product.hero==='mage'?'Pháp sư':'Kiếm sĩ'):(product.hero==='mage'?'Mage':'Swordsman')} · {vi?'Giới hạn 1/1':'Limit 1/1'}</p><footer><button disabled={owned||hud.coins<product.price} onClick={()=>{const ok=engine?.buyOutfit(selected);setMessage(ok?(vi?'Đã mua! Chọn MẶC để sử dụng.':'Purchased! Choose EQUIP to wear it.'):(vi?'Không thể mua trang phục này.':'Cannot purchase this outfit.'));close();}}>{vi?`MUA · ${product.price} XU`:`BUY · ${product.price} COINS`}</button><button onClick={close}>{vi?'HỦY':'CANCEL'}</button></footer></div></div>,document.querySelector('.trading-world')??document.body)}
 </div>;
}
