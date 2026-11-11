import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Flame, Lock, Play, Snowflake, Users, Backpack } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { LEVELS } from '../game/logic/levels.ts';
import { RuneLoadoutEditor } from './EchoRunes.tsx';
import './JourneyCamp.css';
import './JourneyCampV2.css';
import './JourneyCampScene.css';
import './JourneyCampPixel.css';
import { JourneyAmbience } from './JourneyAmbience.tsx';
import { translate } from '../i18n.ts';

// Traced in the painting's native 1536x1024 coordinates, including each bend.
const trailSegments = [
 'M215 725 C213 670 246 624 278 604 C310 580 365 580 382 548 C402 514 392 487 412 462 C428 436 439 425 434 410 L440 350',
 'M440 350 L434 420 C482 426 500 474 509 520 C517 569 523 586 575 599 C624 611 660 630 690 630',
 'M690 630 C744 620 749 584 757 552 C766 522 791 516 782 488 C776 465 760 454 765 424 C772 385 797 360 840 353 C877 350 900 315 920 310',
 'M920 310 C977 339 1006 352 1004 390 C999 429 1011 449 1050 464 C1101 483 1149 508 1200 515',
 'M1200 515 C1240 491 1271 448 1278 405 C1284 379 1327 362 1355 346 C1382 331 1377 303 1364 278 C1355 248 1355 225 1355 205',
];
// Centre of each clearing in the same native coordinates (= the trail ends above).
const stops = [[215,725],[440,350],[690,630],[920,310],[1200,515],[1355,205]];
const WALK_MS = 2400, HERO_KEY = 'secondme.journeyHeroAt';
export function JourneyCamp({engine,hud,complete,next,traveler}:{engine:GameEngine|null;hud:HUDState;complete:boolean;next:number;traveler?:React.ReactNode;onNews?:()=>void}) {
  const vi=hud.language==='vi';
  const [runeEditor,setRuneEditor]=useState(false);
  const [inspect,setInspect]=useState<number|null>(null);
  const [touchInspect,setTouchInspect]=useState<number|null>(null);

  const count=hud.completed.length+(complete?1:0);
  const here=complete?5:Math.min(next,5);
  const trailRefs=useRef<(SVGPathElement|null)[]>([]);
  const walker=useRef<HTMLDivElement>(null);
  // The hero stands at the current stop; on arrival it walks the last trail from the previous one (not with Reduce motion).
  useEffect(()=>{
    const el=walker.current,trail=trailRefs.current[here-1];
    const put=(x:number,y:number)=>{if(el){el.style.left=`${x/15.36}%`;el.style.top=`${y/10.24}%`;}};
    put(stops[here][0],stops[here][1]);
    // Walk only when this stop is newer than the one the hero last reached (not on every visit to the map).
    let seen=-1;try{seen=Number(localStorage.getItem(HERO_KEY)??-1);localStorage.setItem(HERO_KEY,String(here));}catch{}
    if(!el||!trail||here===0||hud.reducedMotion||seen<0||seen>=here)return;
    const len=trail.getTotalLength();let raf=0;const t0=performance.now();
    const step=(now:number)=>{const k=Math.min(1,(now-t0)/WALK_MS),pt=trail.getPointAtLength(len*(1-(1-k)*(1-k)));put(pt.x,pt.y);el.classList.toggle('is-walking',k<1);if(k<1)raf=requestAnimationFrame(step);};
    raf=requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(raf);
  },[here,hud.reducedMotion]);
  const unlocked=(i:number)=>hud.devUnlocked||complete||(i<=hud.completed.length&&(i<5||hud.forged));
  return <div className="journey-layout">{runeEditor&&<RuneLoadoutEditor hud={hud} engine={engine} close={()=>setRuneEditor(false)}/>}
    <aside className="journey-camp integrated-camp">
      <header className="rest-heading"><span><Flame size={17}/>{vi?'TRẠI NGHỈ ECHO':'ECHO CAMP'}</span><span>{count} / 6</span></header>
      <div className={`rest-scene${hud.reducedMotion?' rest-still':''}`}>
        <div className="rest-firelight" aria-hidden="true"/><div className="rest-embers" aria-hidden="true"><i/><i/><i/></div>
        <button className="rest-hero" onClick={()=>engine?.openCharacters()} aria-label={vi?'Đổi nhân vật':'Change character'}><span>{traveler??<Users size={50}/>}</span></button>
        <div className="rest-scene-caption"><strong>{hud.characterClass==='swordsman'?'Kael':hud.characterClass==='mechanical'?'Rivet':'Aeris'}</strong><button onClick={()=>engine?.openCharacters()}>{vi?'Đổi nhân vật':'Change hero'} <ArrowRight size={14}/></button></div>
      </div>
      <div className="rest-kit"><div><span>{vi?'BỘ RUNE':'RUNE LOADOUT'}</span><p>{hud.runeLoadout?.length??0} / 5 {vi?'ấn đã chọn':'equipped'}</p></div><button className="rest-prepare" onClick={()=>setRuneEditor(true)}><Backpack size={18}/>{vi?'Đổi rune':'Edit runes'}</button></div>
      <div className="rest-departure"><span>{complete?(vi?'HÀNH TRÌNH MỚI':'ANOTHER JOURNEY'):(vi?'ĐIỂM ĐẾN TIẾP THEO':'NEXT DESTINATION')}</span><div className="rest-destination"><b>{String((complete?0:next)+1).padStart(2,'0')}</b><strong>{translate(LEVELS[complete?0:next].subtitle,hud.language)}</strong></div>
        <button className="camp-continue" onClick={()=>complete?engine?.selectLevel(0):hud.completed.length?engine?.continueGame():engine?.selectLevel(0)}><Play size={19} fill="currentColor"/><span>{complete?(vi?'KHÁM PHÁ LẠI':'EXPLORE AGAIN'):hud.completed.length?(vi?'TIẾP TỤC HÀNH TRÌNH':'CONTINUE JOURNEY'):(vi?'LÊN ĐƯỜNG':'BEGIN JOURNEY')}</span><ArrowRight size={18}/></button>
      </div>
      <footer className="rest-progress"><div role="progressbar" aria-label={vi?'Tiến độ hành trình':'Journey progress'} aria-valuenow={count} aria-valuemin={0} aria-valuemax={6}>{Array.from({length:6},(_,i)=><i key={i} className={i<count?'explored':i===next?'next':''}/>)}</div></footer>
    </aside>
    <section className="journey-chart" aria-label={vi?'Bản đồ hành trình':'Journey map'}>
      <div className={`journey-world${hud.reducedMotion?' map-still':''}`}>
        <svg className="journey-path" viewBox="0 0 1536 1024" aria-hidden="true">
          {trailSegments.map((d,i)=><path key={i} ref={e=>{trailRefs.current[i]=e;}} d={d} className={`${unlocked(i+1)?'trail-open':'trail-locked'}${i+1===here?' trail-live':''}`}/>)}
        </svg>
        <JourneyAmbience still={hud.reducedMotion}/>

        <div className="map-traveler" ref={walker} aria-hidden="true"><span>{traveler}</span></div>
        {LEVELS.map((item,i)=>{
          const ready=unlocked(i),done=i<5?hud.completed.includes(i+1):complete,current=i===next&&!complete;
          return <button key={item.id} className={`journey-stop ${done?'is-done':''} ${current?'is-current':''} ${i===5?'is-boss':''} ${inspect===i?'is-inspected':''}`} style={{left:`${stops[i][0]/15.36}%`,top:`${stops[i][1]/10.24}%`}} aria-disabled={!ready} onMouseEnter={()=>setInspect(i)} onMouseLeave={()=>{if(touchInspect===null)setInspect(null);}} onFocus={()=>setInspect(i)} onBlur={()=>{setInspect(null);setTouchInspect(null);}} onClick={()=>{
              if(window.matchMedia('(hover: none)').matches&&touchInspect!==i){setTouchInspect(i);setInspect(i);return;}
              if(ready)engine?.selectLevel(i);
            }} aria-label={`${String(i+1).padStart(2,'0')} · ${translate(item.subtitle,hud.language)} · ${done?(vi?'Đã hoàn thành':'Cleared'):ready?(vi?'Sẵn sàng':'Ready'):(vi?'Chưa mở':'Locked')}`}>
            <span className="stop-medallion">{!ready?<Lock size={18}/>:i===5?<Snowflake size={23}/>:<span>{String(i+1).padStart(2,'0')}</span>}</span>
            <span className="stop-caption" data-idle={inspect===null} role="tooltip" hidden={inspect!==i&&!(inspect===null&&current&&ready)}><small>{i===5?(vi?'THỦ VỆ BĂNG':'FROST GUARDIAN'):`0${i+1}`}</small><strong>{translate(item.subtitle,hud.language)}</strong>{done?<em>{'★'.repeat(hud.bestStars[item.id]??0)}{'☆'.repeat(3-(hud.bestStars[item.id]??0))}</em>:<em>{current&&ready?(vi?'Bắt đầu hành trình':'Begin your journey'):!ready?(vi?'CHƯA MỞ':'LOCKED'):(vi?'SẴN SÀNG':'READY')}</em>}</span>
          </button>;
        })}
      </div>

    </section>
  </div>;
}
