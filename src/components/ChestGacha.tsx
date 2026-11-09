import {KeyRound} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import type {GameEngine,HUDState} from '../game/GameEngine.ts';
import {CHEST_POOL,type ChestRewardId} from '../game/logic/chest.ts';
import {ChestSprite,type ChestTier} from './ChestSprite.tsx';
import './chestGacha.css';

export function ChestGacha({engine,hud}:{engine:GameEngine|null;hud:HUDState}){
  const vi=hud.language==='vi';
  const [open,setOpen]=useState(false);
  const [opening,setOpening]=useState(false);
  const [tier,setTier]=useState<ChestTier|null>(null);
  const [results,setResults]=useState<ChestRewardId[]>([]);
  const [run,setRun]=useState(0);
  const trigger=useRef<HTMLButtonElement>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  const busy=useRef(false);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  useEffect(()=>{
    if(!opening)return;
    const timer=window.setTimeout(()=>{setOpening(false);busy.current=false;},800);
    return ()=>window.clearTimeout(timer);
  },[opening,run]);
  useEffect(()=>{
    if(!open)return;
    closeButton.current?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}else if(e.key==='Tab'){const buttons=Array.from(closeButton.current?.closest('section')?.querySelectorAll<HTMLButtonElement>('button:not(:disabled),summary')??[]);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
    window.addEventListener('keydown',key,true);
    return ()=>window.removeEventListener('keydown',key,true);
  },[open]);
  const draw=(count:1|10)=>{
    if(busy.current||!engine)return;
    const rewards=engine.openChest(count);if(!rewards)return;
    busy.current=true;setResults(rewards);setTier(rewards.includes('ring')?'fire':'gold');setOpening(true);setRun(n=>n+1);
  };
  return <>
    <button className="shop-reward-chest" ref={trigger} aria-label={vi?'Mở rương đỏ':'Open red chest'} onClick={()=>setOpen(true)}><ChestSprite/><span>{vi?'RƯƠNG ĐỎ':'RED CHEST'}</span></button>
    {open&&<div className="chest-backdrop" onClick={close}><section className="chest-panel" role="dialog" aria-modal="true" aria-labelledby="red-chest-heading" onClick={e=>e.stopPropagation()}>
      <header><h2 id="red-chest-heading">{vi?'RƯƠNG ĐỎ':'RED CHEST'}</h2><button ref={closeButton} aria-label={vi?'Đóng rương':'Close chest'} onClick={close}>×</button></header>
      <p className="chest-key-balance"><KeyRound size={16}/> {hud.chestKeys} {vi?'chìa khóa':'keys'}</p>
      <div className="chest-display"><ChestSprite key={run} tier={tier} reducedMotion={hud.reducedMotion}/></div>
      <div className="chest-results" aria-live="polite">{opening?<p>{vi?'Đang mở rương…':'Opening…'}</p>:results.length?<><p>{vi?'Đã nhận vào túi đồ':'Added to your inventory'}</p><ul>{CHEST_POOL.map(item=>{const count=results.filter(id=>id===item.id).length;return count?<li key={item.id} className={`chest-tier-${item.tier}`}>{vi?item.vi:item.en} ×{count}</li>:null;})}</ul></>:<p>{vi?'Mỗi lượt nhận một phần thưởng.':'One reward per draw.'}</p>}</div>
      <div className="chest-draw-buttons"><button disabled={opening||hud.chestKeys<5} onClick={()=>draw(1)}>{vi?'MỞ':'OPEN'} ×1 · 5 {vi?'chìa':'keys'}</button><button disabled={opening||hud.chestKeys<50} onClick={()=>draw(10)}>{vi?'MỞ':'OPEN'} ×10 · 50 {vi?'chìa':'keys'}</button></div>
      {hud.chestKeys<5&&<p>{vi?'Chưa đủ chìa khóa để mở rương.':'Not enough keys to open the chest.'}</p>}
      <details><summary>{vi?'Tỉ lệ phần thưởng':'Reward probabilities'}</summary><ul>{CHEST_POOL.filter(item=>item.weight>0).map(item=><li key={item.id}>{vi?item.vi:item.en}: {item.weight}%</li>)}</ul><p>{vi?'Mỗi lượt độc lập, kể cả mở x10. Cao cấp, nhân vật và trang phục chưa có trong rương.':'Every draw is independent, including x10. High-tier items, characters and outfits are not yet in the pool.'}</p></details>
    </section></div>}
  </>;
}
