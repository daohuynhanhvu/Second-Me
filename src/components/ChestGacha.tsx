import {ChestKeyIcon} from './ChestKeyIcon.tsx';
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
  const [showRates,setShowRates]=useState(false);
  const [run,setRun]=useState(0);
  const trigger=useRef<HTMLButtonElement>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  const busy=useRef(false);
  const close=()=>{setOpen(false);setShowRates(false);trigger.current?.focus();};
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
    <button className="shop-reward-chest" ref={trigger} aria-label={vi?'Mở rương thưởng':'Open reward chest'} onClick={()=>setOpen(true)}><ChestSprite/></button>
    {open&&<div className="chest-backdrop" onClick={close}><section className="chest-panel" role="dialog" aria-modal="true" aria-label={vi?'Rương thưởng':'Reward chest'} onClick={e=>e.stopPropagation()}>
      <header><button ref={closeButton} aria-label={vi?'Đóng rương':'Close chest'} onClick={close}>×</button></header>
      <p className="chest-key-balance"><ChestKeyIcon size={28}/> {hud.chestKeys} {vi?'chìa khóa':'keys'}</p>
      <div className="chest-display"><ChestSprite key={run} tier={tier} reducedMotion={hud.reducedMotion}/></div>
      <div className="chest-results" aria-live="polite">{opening?<p>{vi?'Đang mở rương…':'Opening…'}</p>:results.length?<><p>{vi?'Đã nhận vào túi đồ':'Added to your inventory'}</p><ul>{CHEST_POOL.map(item=>{const count=results.filter(id=>id===item.id).length;return count?<li key={item.id} className={`chest-tier-${item.tier}`}>{vi?item.vi:item.en} ×{count}</li>:null;})}</ul></>:<p>{vi?'Mỗi lượt nhận một phần thưởng.':'One reward per draw.'}</p>}</div>
      <div className="chest-draw-buttons"><button disabled={opening||hud.chestKeys<5} onClick={()=>draw(1)}><span className="chest-draw-title">{vi?'MỞ':'OPEN'} ×1</span><span className="chest-draw-cost"><ChestKeyIcon size={20}/>5 {vi?'chìa khóa':'keys'}</span></button><button disabled={opening||hud.chestKeys<50} onClick={()=>draw(10)}><span className="chest-draw-title">{vi?'MỞ':'OPEN'} ×10</span><span className="chest-draw-cost"><ChestKeyIcon size={20}/>50 {vi?'chìa khóa':'keys'}</span></button></div>
      {hud.chestKeys<5&&<p>{vi?'Chưa đủ chìa khóa để mở rương.':'Not enough keys to open the chest.'}</p>}
      <button className="chest-rate-toggle" type="button" aria-expanded={showRates} aria-controls="chest-rates" onClick={()=>setShowRates(value=>!value)}>{vi?(showRates?'Ẩn tỉ lệ':'Xem tỉ lệ'):(showRates?'Hide rates':'View rates')}</button>
    </section>{showRates&&<aside className="chest-rates" id="chest-rates" aria-label={vi?'Tỉ lệ phần thưởng':'Reward probabilities'} onClick={e=>e.stopPropagation()}>
        <strong>{vi?'Tỉ lệ thưởng':'Drop rates'}</strong>
        <ul>{CHEST_POOL.filter(item=>item.weight>0).map(item=><li key={item.id}><span>{vi?item.vi:item.en}</span><b>{item.weight}%</b></li>)}</ul>
        <small>{vi?'Mỗi lượt tính riêng, kể cả mở ×10.':'Each draw rolls separately, including ×10.'}</small>
      </aside>}</div>}
  </>;
}
