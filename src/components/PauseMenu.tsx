import {useEffect, useRef, useState} from 'react';
import {BookOpen, Home, Pause, Play, RotateCcw, Settings, X} from 'lucide-react';
import type {GameEngine, HUDState} from '../game/GameEngine';
import {SettingsPanel} from './CampaignUI';
import './PauseMenu.css';

export function PauseMenu({engine,hud}:{engine:GameEngine|null;hud:HUDState}) {
  const [settings,setSettings]=useState(false);
  const resume=useRef<HTMLButtonElement>(null);
  const vi=hud.language==='vi';
  useEffect(()=>{resume.current?.focus();},[]);
  // Keep Escape inside Settings; closing it returns to the paused game.
  useEffect(()=>{
    if(!settings)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setSettings(false);}};
    window.addEventListener('keydown',close,true);
    return()=>window.removeEventListener('keydown',close,true);
  },[settings]);
  return <div className="pause-menu-backdrop">
    {settings ? <SettingsPanel engine={engine} hud={hud} close={()=>{setSettings(false);requestAnimationFrame(()=>resume.current?.focus());}}/> :
    <section className="pause-menu pause-menu--pixel" role="dialog" aria-modal="true" aria-labelledby="pause-menu-title" onKeyDown={e=>{
      if(e.key!=='Tab')return;
      const buttons=Array.from(e.currentTarget.querySelectorAll('button'));
      const first=buttons[0],last=buttons[buttons.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }}>
      <div className="pause-menu-content">
      <header><span><Pause size={18}/>{vi?'NGHỈ CHÂN':'TAKE A BREATHER'}</span><button aria-label={vi?'Tiếp tục':'Resume'} onClick={()=>engine?.resumeGame()}><X size={20}/></button></header>
      <h2 id="pause-menu-title">{vi?'Tạm dừng':'Paused'}</h2>
      <p className="pause-menu-level">{hud.levelName} · {hud.levelSubtitle}</p>
      <dl><div><dt>HP</dt><dd>{Math.ceil(hud.health)}<small> / {hud.maxHealth??100}</small></dd></div><div><dt>MP</dt><dd>{Math.floor(hud.mana??100)}<small> / {hud.maxMana??100}</small></dd></div><div><dt>ECHO</dt><dd>{hud.echoCount}<small> / {hud.echoLimit}</small></dd></div></dl>
      <button ref={resume} className="pause-menu-resume" onClick={()=>engine?.resumeGame()}><Play size={19}/>{vi?'Tiếp tục hành trình':'Resume journey'}<kbd>Esc</kbd></button>
      <div className="pause-menu-options">
        <button onClick={()=>setSettings(true)}><Settings size={18}/>{vi?'Cài đặt':'Settings'}</button>
        <button onClick={()=>{engine?.resumeGame();engine?.openGuide();}}><BookOpen size={18}/>{vi?'Sổ tay':'Guide'}</button>
        <button onClick={()=>engine?.restartLevel()}><RotateCcw size={18}/>{vi?'Chơi lại màn':'Retry level'}</button>
        <button onClick={()=>engine?.goToLobby()}><Home size={18}/>{vi?'Về trại':'Back to camp'}</button>
      </div>
      <footer>{vi?'Hành trình đang được tạm dừng':'Your journey is on hold'}</footer>
      </div>
    </section>}
  </div>;
}
