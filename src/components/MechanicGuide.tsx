import React, { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Check, Link, Snowflake, Sparkles, X } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { GUIDE_TOPICS, type GuideTopic } from '../game/logic/tutorials.ts';
import './MechanicGuide.css';

export function MechanicGuide({engine,hud}:{engine:GameEngine|null;hud:HUDState}) {
  const ref=useRef<HTMLDivElement>(null),open=!!hud.guideTopic||hud.guideLibrary===true;
  const vi=hud.language==='vi';
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(hud.guideTopic)engine?.dismissGuide();else engine?.closeGuide();return;}
      if(event.key==='Tab'){
        const buttons=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button')??[]);const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
      if(event.key!=='Tab')event.stopPropagation();
    };
    window.addEventListener('keydown',key,true);
    return()=>{window.removeEventListener('keydown',key,true);previous?.focus();};
  },[open,hud.guideTopic,engine]);
  if(!open)return null;
  const topic=hud.guideTopic,copy=topic?GUIDE_TOPICS[topic][vi?'vi':'en']:null;
  return <div className={`mechanic-guide-backdrop ${hud.guideLibrary?'is-library':''}`}>
    <div ref={ref} className="mechanic-guide" role="dialog" aria-modal="true" aria-labelledby="mechanic-guide-title">
      <header><span><BookOpen size={15}/>{vi?'SỔ TAY TIẾNG VỌNG':'THE ECHO FIELD GUIDE'}</span><button aria-label={vi?'Đóng hướng dẫn':'Close guide'} onClick={()=>topic?engine?.dismissGuide():engine?.closeGuide()}><X size={18}/></button></header>
      {copy?<>
        <div className="guide-kicker">{vi?'CƠ CHẾ MỚI · GAME ĐANG TẠM DỪNG':'NEW MECHANIC · GAME PAUSED'}</div>
        <h2 id="mechanic-guide-title">{copy[0]}</h2>
        {topic==='links'&&<div className="guide-link-diagram" aria-hidden="true"><span><Sparkles size={19}/><small>RUNE 1</small></span><i/><span><Link size={19}/><small>{vi?'CỔNG 1':'GATE 1'}</small></span></div>}
        {topic==='shield'&&<div className="guide-link-diagram" aria-hidden="true"><span>4 × <Snowflake size={19}/></span><i/><span>{vi?'KHIÊN BOSS':'BOSS SHIELD'}</span></div>}
        <p>{copy[1]}</p><div className="guide-control-note">{copy[2]}</div>
        <footer><button className="guide-library-link" onClick={()=>engine?.openGuide()}>{vi?'Xem sổ tay':'Open field guide'}</button><button className="guide-ack" onClick={()=>engine?.dismissGuide()}>{vi?'ĐÃ HIỂU · CHƠI TIẾP':'GOT IT · CONTINUE'}<ArrowRight size={16}/></button></footer>
      </>:<>
        <div className="guide-kicker">{vi?'TRA CỨU CƠ CHẾ · GAME ĐANG TẠM DỪNG':'MECHANICS LIBRARY · GAME PAUSED'}</div><h2 id="mechanic-guide-title">{vi?'Sổ tay hành trình':'Your field guide'}</h2>
        <div className="guide-topic-list">{(Object.keys(GUIDE_TOPICS) as GuideTopic[]).map(id=><button key={id} onClick={()=>engine?.replayGuide(id)}><span>{GUIDE_TOPICS[id][vi?'vi':'en'][0]}</span>{engine?.guides.seen.has(id)?<Check size={14}/>:<ArrowRight size={14}/>}</button>)}</div>
        <footer><small>{vi?'Dấu ✓ là mục đã xem.':'Checked topics have been read.'}</small><button className="guide-ack" onClick={()=>engine?.closeGuide()}>{vi?'QUAY LẠI GAME':'RETURN TO GAME'}<ArrowRight size={16}/></button></footer>
      </>}
    </div>
  </div>;
}
