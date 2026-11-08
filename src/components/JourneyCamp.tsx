import React, { useState } from 'react';
import { ArrowRight, Check, Compass, Flame, Lock, Play, RotateCcw, ShoppingBasket, Snowflake, Sword, Users } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { LEVELS } from '../game/logic/levels.ts';
import { MATERIALS } from '../game/logic/campaign.ts';
import './JourneyCamp.css';

const positions = [[14,72],[28,36],[46,63],[61,32],[78,51],[88,17]];
export function JourneyCamp({engine,hud,complete,next}:{engine:GameEngine|null;hud:HUDState;complete:boolean;next:number}) {
  const vi=hud.language==='vi';
  const [inspect,setInspect]=useState<number|null>(null);
  const [touchInspect,setTouchInspect]=useState<number|null>(null);
  const active=inspect??next,level=LEVELS[active];
  const count=hud.completed.length+(complete?1:0);
  const unlocked=(i:number)=>hud.devUnlocked||complete||(i<=hud.completed.length&&(i<5||hud.forged));
  return <div className="journey-layout">
    <aside className="journey-camp">
      <div className="camp-overline"><Flame size={14}/>{vi?'TRẠI NGHỈ ECHO':'ECHO CAMP'}<span>{vi?'ĐÃ LƯU':'SAVED'}</span></div>
      <h1>{complete?(vi?'Khu rừng đã thức giấc.':'The forest awakens.'):(vi?'Lần theo tiếng vọng.':'Follow the echoes.')}</h1>
      <p className="camp-intro">{vi?'Giữa những tán cây, một ký ức vẫn đang chờ bạn tìm lại.':'Beyond the canopy, a forgotten memory is waiting to be found.'}</p>
      <div className="camp-progress"><span>{vi?'HÀNH TRÌNH CỦA BẠN':'YOUR JOURNEY'}<b>{String(count).padStart(2,'0')} <small>/ 06</small></b></span><div role="progressbar" aria-label={vi?'Tiến độ hành trình':'Journey progress'} aria-valuenow={count} aria-valuemin={0} aria-valuemax={6}><i style={{width:`${count/6*100}%`}}/></div></div>
      <div className="camp-relics"><span>{vi?'DI VẬT ĐÃ TÌM':'RELICS RECOVERED'}<b>{hud.completed.length}/5</b></span><div>{MATERIALS.map((material,i)=><span key={material.id} title={material.name} className={hud.completed.includes(i+1)?'found':''}>{hud.completed.includes(i+1)?<Check size={13}/>:<Lock size={12}/>}</span>)}</div></div>
      <button className="camp-hero" onClick={()=>engine?.openCharacters()}><span className="camp-hero-mark"><Users size={20}/></span><span><small>{vi?'NGƯỜI ĐỒNG HÀNH':'YOUR TRAVELER'}</small><b>{hud.characterClass==='swordsman'?'Kael':hud.characterClass==='mechanical'?'Rivet':'Aeris'}<em>{hud.characterClass==='swordsman'?(vi?'Kiếm sĩ':'Swordsman'):(vi?'Pháp sư':'Mage')}</em></b></span><ArrowRight size={16}/></button>
      <button className="camp-continue" onClick={()=>complete?engine?.selectLevel(0):hud.completed.length?engine?.continueGame():engine?.selectLevel(0)}><Play size={17} fill="currentColor"/><span>{complete?(vi?'KHÁM PHÁ LẠI':'EXPLORE AGAIN'):hud.completed.length?(vi?'TIẾP TỤC HÀNH TRÌNH':'CONTINUE JOURNEY'):(vi?'BẮT ĐẦU HÀNH TRÌNH':'BEGIN JOURNEY')}<small>{complete?'ECHO GROVE':LEVELS[next].subtitle}</small></span><ArrowRight size={18}/></button>
      <div className="camp-tools"><button onClick={()=>engine?.openShop()}><ShoppingBasket size={17}/><span>{vi?'Cửa hàng':'Shop'}</span><b>{hud.coins.toLocaleString(vi?'vi-VN':'en-US')}</b></button><button className="camp-new" onClick={()=>engine?.startGame()}><RotateCcw size={13}/>{vi?'Hành trình mới':'New journey'}</button></div>
      <p className="camp-footnote"><span/>{vi?'Tiến độ được lưu trên thiết bị này.':'Your journey is saved on this device.'}</p>
    </aside>
    <section className="journey-chart" aria-label={vi?'Bản đồ hành trình':'Journey map'}>
      <header className="chart-heading"><div><span><Compass size={13}/>{vi?'BẢN ĐỒ HÀNH TRÌNH':'THE WILDERNESS'}</span><h2>{vi?'Khu rừng của những ký ức':'A forest of forgotten memories'}</h2></div><span className="chart-chapter">{vi?'CHƯƠNG I':'CHAPTER I'}<b>THE EMBERFORGE</b></span></header>
      <div className="journey-world">
        <svg className="journey-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M14 72 C12 54 20 40 28 36 S37 70 46 63 S49 31 61 32 S66 56 78 51 S88 36 88 17"/></svg>
        <div className="chart-north" aria-hidden="true">N<span>↑</span></div>
        {LEVELS.map((item,i)=>{
          const ready=unlocked(i),done=i<5?hud.completed.includes(i+1):complete,current=i===next&&!complete;
          return <button key={item.id} className={`journey-stop ${done?'is-done':''} ${current?'is-current':''} ${i===5?'is-boss':''} ${inspect===i?'is-inspected':''}`} style={{left:`${positions[i][0]}%`,top:`${positions[i][1]}%`}} aria-disabled={!ready} onMouseEnter={()=>setInspect(i)} onMouseLeave={()=>{if(touchInspect===null)setInspect(null);}} onFocus={()=>setInspect(i)} onBlur={()=>{setInspect(null);setTouchInspect(null);}} onClick={()=>{
              if(window.matchMedia('(hover: none)').matches&&touchInspect!==i){setTouchInspect(i);setInspect(i);return;}
              if(ready)engine?.selectLevel(i);
            }} aria-label={`${String(i+1).padStart(2,'0')} · ${item.subtitle} · ${done?(vi?'Đã hoàn thành':'Cleared'):ready?(vi?'Sẵn sàng':'Ready'):(vi?'Chưa mở':'Locked')}`}>
            <span className="stop-medallion">{!ready?<Lock size={18}/>:i===5?<Snowflake size={23}/>:done?<Check size={21}/>:<span>{String(i+1).padStart(2,'0')}</span>}</span>
            <span className="stop-caption" role="tooltip" hidden={inspect!==i}><small>{i===5?(vi?'THỦ VỆ BĂNG':'FROST GUARDIAN'):`0${i+1}`}</small><strong>{item.subtitle}</strong>{done?<em>{'★'.repeat(hud.bestStars[item.id]??0)}{'☆'.repeat(3-(hud.bestStars[item.id]??0))}</em>:<em>{current&&ready?(vi?'ĐIỂM ĐẾN TIẾP THEO':'YOUR NEXT DESTINATION'):!ready?(vi?'CHƯA MỞ':'LOCKED'):(vi?'SẴN SÀNG':'READY')}</em>}</span>
          </button>;
        })}
        <span className="world-caption">{vi?'Mỗi lối mòn lưu giữ một tiếng vọng.':'Every trail holds an echo.'}</span>
      </div>
      <footer className="chart-detail"><span className={`detail-symbol ${inspect===5?'ice':''}`}>{inspect===5?<Snowflake size={23}/>:<Compass size={23}/>}</span><div>{inspect===null?<><small>{vi?'KHÁM PHÁ KHU RỪNG':'EXPLORE THE FOREST'}</small><strong>{vi?'Chọn lối mòn của bạn':'Choose your next trail'}</strong><p>{vi?'Rê chuột lên dấu mốc để xem thông tin. Chạm để xem trên điện thoại.':'Hover over a waypoint to reveal its story. On mobile, tap to preview.'}</p></>:<><small>{vi?'LỐI MÒN':'TRAIL'} 0{active+1}</small><strong>{level.subtitle}</strong><p>{active===5&&!hud.forged?(vi?'Thu thập 5 di vật và rèn vũ khí để mở đấu trường.':'Recover five relics and forge your weapon to enter.'):unlocked(active)?(vi?'Chọn dấu mốc để vào màn. Trên điện thoại, chạm lần nữa để vào.':'Select to enter. On mobile, tap again to enter.'):(vi?'Hoàn thành lối mòn trước để mở khóa.':'Complete the previous trail to unlock.')}</p></>}</div><span className="chart-legend"><i/>{vi?'ĐÃ KHÁM PHÁ':'EXPLORED'}<i/>{vi?'CHƯA MỞ':'UNDISCOVERED'}</span></footer>
    </section>
  </div>;
}
