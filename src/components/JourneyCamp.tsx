import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Flame, Lock, Play, RotateCcw, Snowflake, Users, Backpack, X, Bell } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { LEVELS } from '../game/logic/levels.ts';
import { RuneLoadoutEditor, RuneStone } from './EchoRunes.tsx';
import './JourneyCamp.css';
import './JourneyCampV2.css';
import './JourneyCampScene.css';
import { JourneyAmbience } from './JourneyAmbience.tsx';

// Traced in the painting's native 1536x1024 coordinates, including each bend.
const trailSegments = [
 'M215 737 C213 670 246 624 278 604 C310 580 365 580 382 548 C402 514 392 487 412 462 C428 436 439 425 434 410 L430 369',
 'M430 369 L434 420 C482 426 500 474 509 520 C517 569 523 586 575 599 C624 611 668 639 707 645',
 'M707 645 C744 620 749 584 757 552 C766 522 791 516 782 488 C776 465 760 454 765 424 C772 385 797 360 840 353 C877 350 908 339 937 328',
 'M937 328 C977 339 1006 352 1004 390 C999 429 1011 449 1050 464 C1101 483 1149 508 1198 522',
 'M1198 522 C1240 491 1271 448 1278 405 C1284 379 1327 362 1355 346 C1382 331 1377 303 1364 278 C1355 248 1351 210 1352 174',
];
const positions = [[14,72],[28,36],[46,63],[61,32],[78,51],[88,17]];
export function JourneyCamp({engine,hud,complete,next,traveler,onNews}:{engine:GameEngine|null;hud:HUDState;complete:boolean;next:number;traveler?:React.ReactNode;onNews?:()=>void}) {
  const vi=hud.language==='vi';
  const [runeEditor,setRuneEditor]=useState(false);
  const [preparing,setPreparing]=useState(false);
  useEffect(()=>{if(!preparing)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();setPreparing(false);}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[preparing]);
  const [inspect,setInspect]=useState<number|null>(null);
  const [touchInspect,setTouchInspect]=useState<number|null>(null);

  const count=hud.completed.length+(complete?1:0);
  const unlocked=(i:number)=>hud.devUnlocked||complete||(i<=hud.completed.length&&(i<5||hud.forged));
  return <div className="journey-layout">{runeEditor&&<RuneLoadoutEditor hud={hud} engine={engine} close={()=>setRuneEditor(false)}/>}
    {preparing&&<div className="modal-backdrop camp-prepare-backdrop" onClick={()=>setPreparing(false)}><section className="panel camp-preparation" data-lobby-dialog role="dialog" aria-modal="true" aria-label={vi?'Chuẩn bị hành trình':'Prepare for the trail'} onClick={e=>e.stopPropagation()}>
      <button className="camp-prepare-close" aria-label={vi?'Đóng':'Close'} onClick={()=>setPreparing(false)}><X size={19}/></button><span className="eyebrow gold">{vi?'TRẠI NGHỈ ECHO':'ECHO CAMP'}</span><h2>{vi?'Chuẩn bị cho lối mòn':'Ready for the trail'}</h2>
      <button className="camp-prepare-option" onClick={()=>{setPreparing(false);engine?.openCharacters();}}><span className="prepare-avatar">{traveler??<Users size={30}/>}</span><div><small>{vi?'NGƯỜI ĐỒNG HÀNH':'YOUR TRAVELER'}</small><strong>{hud.characterClass==='swordsman'?'Kael':hud.characterClass==='mechanical'?'Rivet':'Aeris'}</strong><p>{vi?'Chọn nhân vật và xem kỹ năng':'Choose a hero and explore their skills'}</p></div><ArrowRight size={18}/></button>
      <button className="camp-prepare-option" onClick={()=>{setPreparing(false);setRuneEditor(true);}}><span className="prepare-rune"><RuneStone id={hud.runeLoadout?.[0]??'call'}/></span><div><small>{vi?'5 Ô RUNE':'FIVE RUNE SLOTS'}</small><strong>{vi?'Ấn nâng Echo':'Echo runes'}</strong><p>{hud.runeLoadout?.length??0} / 5 {vi?'ô đã chọn · Thay đổi bộ rune':'slots filled · Change your rune set'}</p></div><ArrowRight size={18}/></button>
      <div className="camp-prepare-tools"><button onClick={()=>{setPreparing(false);onNews?.();}}><Bell size={14}/>{vi?'Tin mới':'News'}</button><button onClick={()=>{setPreparing(false);engine?.goToMainMenu();}}>{vi?'Menu chính':'Main menu'}</button><button onClick={()=>engine?.startGame()}><RotateCcw size={13}/>{vi?'Hành trình mới':'New journey'}</button></div>
    </section></div>}
    <aside className="journey-camp integrated-camp">
      <header className="rest-heading"><span><Flame size={17}/>{vi?'TRẠI NGHỈ ECHO':'ECHO CAMP'}</span><span>{count} / 6</span></header>
      <div className={`rest-scene${hud.reducedMotion?' rest-still':''}`}>
        <div className="rest-firelight" aria-hidden="true"/><div className="rest-embers" aria-hidden="true"><i/><i/><i/></div>
        <button className="rest-hero" onClick={()=>engine?.openCharacters()} aria-label={vi?'Đổi nhân vật':'Change character'}><span>{traveler??<Users size={50}/>}</span></button>
        <div className="rest-scene-caption"><span>{vi?'BÊN ÁNH LỬA TRẠI':'BY THE CAMPFIRE'}</span><strong>{hud.characterClass==='swordsman'?'Kael':hud.characterClass==='mechanical'?'Rivet':'Aeris'}</strong><button onClick={()=>engine?.openCharacters()}>{vi?'Đổi nhân vật':'Change hero'} <ArrowRight size={14}/></button></div>
      </div>
      <div className="rest-kit"><div><span>{vi?'SẴN SÀNG LÊN ĐƯỜNG':'READY FOR THE TRAIL'}</span><p>{hud.runeLoadout?.length??0} / 5 {vi?'rune đã chọn':'runes equipped'}</p></div><button className="rest-prepare" onClick={()=>setPreparing(true)}><Backpack size={18}/>{vi?'Chuẩn bị':'Prepare'}</button></div>
      <div className="rest-departure"><span>{complete?(vi?'HÀNH TRÌNH MỚI':'ANOTHER JOURNEY'):(vi?'ĐIỂM ĐẾN TIẾP THEO':'NEXT DESTINATION')}</span><div className="rest-destination"><b>{String((complete?0:next)+1).padStart(2,'0')}</b><strong>{LEVELS[complete?0:next].subtitle}</strong></div>
        <button className="camp-continue" onClick={()=>complete?engine?.selectLevel(0):hud.completed.length?engine?.continueGame():engine?.selectLevel(0)}><Play size={19} fill="currentColor"/><span>{complete?(vi?'KHÁM PHÁ LẠI':'EXPLORE AGAIN'):hud.completed.length?(vi?'TIẾP TỤC HÀNH TRÌNH':'CONTINUE JOURNEY'):(vi?'LÊN ĐƯỜNG':'BEGIN JOURNEY')}</span><ArrowRight size={18}/></button>
      </div>
      <footer className="rest-progress"><div role="progressbar" aria-label={vi?'Tiến độ hành trình':'Journey progress'} aria-valuenow={count} aria-valuemin={0} aria-valuemax={6}>{Array.from({length:6},(_,i)=><i key={i} className={i<count?'explored':i===next?'next':''}/>)}</div><span>{vi?'Đã lưu hành trình':'Journey saved'}</span></footer>
    </aside>
    <section className="journey-chart" aria-label={vi?'Bản đồ hành trình':'Journey map'}>
      <div className={`journey-world${hud.reducedMotion?' map-still':''}`}>
        <svg className="journey-path" viewBox="0 0 1536 1024" aria-hidden="true">
          {trailSegments.map((d,i)=><path key={i} d={d} className={unlocked(i+1)?'trail-open':'trail-locked'}/>)}
        </svg>
        <JourneyAmbience/>

        <div className="chart-north" aria-hidden="true">N<span>↑</span></div>
        {LEVELS.map((item,i)=>{
          const ready=unlocked(i),done=i<5?hud.completed.includes(i+1):complete,current=i===next&&!complete;
          return <button key={item.id} className={`journey-stop ${done?'is-done':''} ${current?'is-current':''} ${i===5?'is-boss':''} ${inspect===i?'is-inspected':''}`} style={{left:`${positions[i][0]}%`,top:`${positions[i][1]}%`}} aria-disabled={!ready} onMouseEnter={()=>setInspect(i)} onMouseLeave={()=>{if(touchInspect===null)setInspect(null);}} onFocus={()=>setInspect(i)} onBlur={()=>{setInspect(null);setTouchInspect(null);}} onClick={()=>{
              if(window.matchMedia('(hover: none)').matches&&touchInspect!==i){setTouchInspect(i);setInspect(i);return;}
              if(ready)engine?.selectLevel(i);
            }} aria-label={`${String(i+1).padStart(2,'0')} · ${item.subtitle} · ${done?(vi?'Đã hoàn thành':'Cleared'):ready?(vi?'Sẵn sàng':'Ready'):(vi?'Chưa mở':'Locked')}`}>
            <span className="stop-medallion">{!ready?<Lock size={18}/>:i===5?<Snowflake size={23}/>:done?<Check size={21}/>:<span>{String(i+1).padStart(2,'0')}</span>}</span>
            <span className="stop-caption" data-idle={inspect===null} role="tooltip" hidden={inspect!==i&&!(inspect===null&&current&&ready)}><small>{i===5?(vi?'THỦ VỆ BĂNG':'FROST GUARDIAN'):`0${i+1}`}</small><strong>{item.subtitle}</strong>{done?<em>{'★'.repeat(hud.bestStars[item.id]??0)}{'☆'.repeat(3-(hud.bestStars[item.id]??0))}</em>:<em>{current&&ready?(vi?'Bắt đầu hành trình':'Begin your journey'):!ready?(vi?'CHƯA MỞ':'LOCKED'):(vi?'SẴN SÀNG':'READY')}</em>}</span>
          </button>;
        })}
        <span className="world-caption">{vi?'Mỗi lối mòn lưu giữ một tiếng vọng.':'Every trail holds an echo.'}</span>
      </div>

    </section>
  </div>;
}
