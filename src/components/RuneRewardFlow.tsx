import {useEffect,useState} from 'react';
import {ArrowRight,Home,RotateCcw,Backpack} from 'lucide-react';
import type {GameEngine,HUDState} from '../game/GameEngine.ts';
import {ECHO_RUNES} from '../game/logic/echoRunes.ts';
import {RuneStone,RUNE_SHORT} from './EchoRunes.tsx';
import {VictoryStars} from './CampaignUI.tsx';
import {TrailInventory} from './TrailInventory.tsx';
import './RuneRewardFlow.css';
export function RuneRewardFlow({engine,hud}:{engine:GameEngine|null;hud:HUDState}){
 const vi=hud.language==='vi',pending=!!hud.pendingRuneChoices?.length;
 const [rolling,setRolling]=useState(pending&&!hud.reducedMotion),[tick,setTick]=useState(0),[bag,setBag]=useState(false);
 const signature=hud.pendingRuneChoices?.join(',')??'';
 useEffect(()=>{if(!signature||hud.reducedMotion){setRolling(false);return;}setRolling(true);let n=0;const timer=window.setInterval(()=>{setTick(++n);if(n>=10){window.clearInterval(timer);setRolling(false);}},95);return()=>window.clearInterval(timer);},[signature,hud.reducedMotion]);
 const claimed=ECHO_RUNES.find(r=>r.id===hud.lastRuneReward);
 return <div className="modal-backdrop reward-flow-backdrop"><section className={`reward-flow ${pending?'is-choosing':'is-claimed'}`} role="dialog" aria-modal="true" aria-labelledby="reward-flow-title" aria-busy={rolling}>
  <header><h2 id="reward-flow-title">{pending?(rolling?(vi?'ĐÁ CỔ ĐANG HIỆN…':'REVEALING RUNES…'):(vi?'CHỌN ĐÁ CỔ!':'CHOOSE YOUR RUNE!')):(vi?'HOÀN THÀNH MÀN!':'TRAIL COMPLETE!')}</h2></header>
  <div className="reward-flow-body">{pending?<>
   <p className="reward-intro" role="status">{rolling?(vi?'Ký ức đang hội tụ…':'Memories are gathering…'):(vi?'Chọn 1 trong 3 ấn để thêm vào túi đồ.':'Choose one of three runes for your inventory.')}</p>
   <div className={`reward-three ${rolling?'is-rolling':''}`}>{hud.pendingRuneChoices!.map((id,i)=>{const rune=ECHO_RUNES.find(r=>r.id===id)!;const art=rolling?ECHO_RUNES[(tick+i*4)%ECHO_RUNES.length]:rune;return <button key={i} disabled={rolling} onClick={()=>engine?.chooseRune(id)} aria-label={`${vi?'Chọn':'Choose'} ${vi?rune.vi:rune.en}`} style={{'--rune-glow':rune.color} as React.CSSProperties}><div className="reward-pedestal"><RuneStone id={art.id}/></div><strong>{rolling?'✦ ✦ ✦':vi?rune.vi:rune.en}</strong><p>{rolling?(vi?'Đang khám phá…':'Discovering…'):RUNE_SHORT[id][vi?0:1]}</p><span>{vi?'CHỌN':'CHOOSE'} <ArrowRight size={16}/></span></button>;})}</div>
   <small className="reward-rule">{vi?'Nhận 1 ấn · Dùng cho Echo ở màn 2–6 · Kích hoạt trong túi đồ':'Keep 1 rune · Use for Echoes in levels 2–6 · Activate from inventory'}</small>
  </>:<>
   <p className="reward-intro">{hud.levelName} · {hud.levelSubtitle}</p>
   <VictoryStars count={hud.lastRating?.stars??0} vi={vi}/>
   {claimed&&<div className="reward-chosen" role="status" style={{'--rune-glow':claimed.color} as React.CSSProperties}><div className="reward-pedestal"><RuneStone id={claimed.id}/></div><small>{vi?'ẤN ĐÃ NHẬN':'RUNE RECEIVED'}</small><h3>{vi?claimed.vi:claimed.en}</h3><p>{RUNE_SHORT[claimed.id][vi?0:1]}</p></div>}
   <div className="reward-totals"><span>+{hud.lastRating?.keys??0} {vi?'CHÌA KHÓA':'KEYS'}</span><span>+{hud.lastRating?.coins??0} {vi?'XU':'COINS'}</span><span>{hud.elapsedLevelTime.toFixed(1)}s</span></div>
   <button className="reward-next" onClick={()=>engine?.nextLevel()}>{engine?.currentLevelIdx===4?(vi?'CHUẨN BỊ ĐẤU BOSS':'PREPARE FOR THE BOSS'):(vi?'ĐI TIẾP':'NEXT')} <ArrowRight size={20}/></button>
  </>}</div>
  <footer>{pending?<><button disabled={rolling} onClick={()=>engine?.restartLevel()}><RotateCcw size={17}/>{vi?'CHƠI LẠI':'RETRY LEVEL'}</button><button onClick={()=>engine?.goToLobby()}><Home size={17}/>{vi?'VỀ TRẠI':'BACK TO CAMP'}</button></>:<><button onClick={()=>engine?.goToLobby()}><Home size={17}/>{vi?'VỀ TRẠI':'BACK TO CAMP'}</button><button onClick={()=>setBag(true)}><Backpack size={17}/>{vi?'TÚI ĐỒ':'INVENTORY'}</button></>}</footer>
 </section>{bag&&<div className="modal-backdrop inventory-backdrop"><div className="panel inventory-modal forest-dialog"><TrailInventory engine={engine} hud={hud} close={()=>setBag(false)}/></div></div>}</div>;
}
