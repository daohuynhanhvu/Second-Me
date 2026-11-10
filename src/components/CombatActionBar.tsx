import { Sword, Snowflake, Shield, Users, Wind, Sparkles, Circle, Square } from 'lucide-react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import './CombatActionBar.css';
import { TouchSkills } from './TouchControls.tsx';
export function CombatActionBar({engine,hud,touch=false}:{engine:GameEngine|null;hud:HUDState;touch?:boolean}){
 const vi=hud.language==='vi',mage=hud.characterClass==='mage',mechanical=hud.characterClass==='mechanical';
 const skill=mage?(vi?'Gai băng':'Ice Spikes'):mechanical?(vi?'Quá tải':'Overdrive'):(vi?'Thánh vực':'Sanctuary');
 const actions=[
  {id:'attack',name:vi?(mage?'Bắn phép':'Tấn công'):(mage?'Cast':'Attack'),key:vi?'CHUỘT TRÁI':'LMB',icon:mage?<Sparkles/>:<Sword/>,cooldown:hud.attackCooldown,max:.55,disabled:false,detail:vi?'Bấm liên tiếp để nối combo 4 đòn.':'Press repeatedly to chain a four-hit combo.',run:()=>engine?.attack()},
  {id:'skill',name:skill,key:vi?'SPACE / CHUỘT PHẢI':'SPACE / RMB',icon:mage?<Snowflake/>:mechanical?<Sparkles/>:<Shield/>,cooldown:hud.skillCooldown,max:mage?6:mechanical?10:9,disabled:hud.skillCooldown>0||(hud.mana??100)<(hud.skillManaCost??25),detail:mage?(vi?'Vùng gai băng: ưu tiên boss, rồi quái gần nhất, cuối cùng vị trí chuột.':'Ice eruption: boss first, then nearest enemy, otherwise the cursor.'):(vi?'Kích hoạt kỹ năng riêng của nhân vật.':'Activate your hero’s special skill.'),run:()=>engine?.useSkill()},
  {id:'dodge',name:vi?'Né tránh':'Dodge',key:'SHIFT',icon:<Wind/>,cooldown:hud.dodgeCooldown,max:1.2,disabled:hud.dodgeCooldown>0,detail:vi?'Né đòn theo hướng di chuyển.':'Evade in your movement direction.',run:()=>engine?.dodge()},
  // Touch only: there is no E key to record the path an Echo replays.
  ...(touch?[{id:'record',name:hud.recordingStatus==='recording'?(vi?'Dừng ghi':'Stop'):(vi?'Ghi hình':'Record'),key:'E',icon:hud.recordingStatus==='recording'?<Square fill="currentColor"/>:<Circle fill="currentColor"/>,cooldown:0,max:1,disabled:false,detail:vi?'Ghi đường đi để Echo lặp lại.':'Record a path for an Echo to replay.',run:()=>engine?.toggleRecording()}]:[]),
  {id:'echo',name:vi?'Gọi Echo':'Summon Echo',key:'Q',icon:<Users/>,cooldown:0,max:1,disabled:hud.echoCharges<=0,detail:vi?'Gọi Echo từ ký ức đã ghi bằng E.':'Summon an Echo from the memory recorded with E.',run:()=>engine?.spawnEcho()},
 ];
 if(touch)return <TouchSkills actions={actions} mana={hud.mana??100} maxMana={hud.maxMana??100} manaCost={hud.skillManaCost??25} charges={hud.echoCharges} recording={hud.recordingStatus==='recording'} vi={vi}/>;
 return <div className="combat-action-bar" role="group" aria-label={vi?'Chiêu và điều khiển chiến đấu':'Combat abilities and controls'}><div className="combat-mana" role="meter" aria-label="MP" aria-valuenow={Math.floor(hud.mana??100)} aria-valuemin={0} aria-valuemax={hud.maxMana??100}><span><b>MP</b> {Math.floor(hud.mana??100)} / {hud.maxMana??100}</span><i style={{width:`${(hud.mana??100)/(hud.maxMana??100)*100}%`}}/></div>{actions.map(a=><button key={a.id} className={`combat-action action-${a.id}${a.cooldown>0?' is-recovering':''}`} disabled={a.disabled} title={`${a.name} · ${a.key}\n${a.detail}`} aria-label={`${a.name} · ${a.key}${a.cooldown>0?` · ${a.cooldown.toFixed(1)}s`:''}`} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();a.run();}}>
  <kbd>{a.key}</kbd><span className="combat-action-icon">{a.icon}{a.cooldown>0&&<b className="combat-action-timer">{a.cooldown.toFixed(1)}<small>s</small></b>}{a.id==='echo'&&<b className="combat-action-charges">{hud.echoCharges}</b>}</span><strong>{a.name}</strong>{a.id==='skill'&&<span className="combat-mana-cost">{hud.skillManaCost??25} MP</span>}<span className="combat-action-track" aria-hidden="true"><i style={{width:`${Math.max(0,1-a.cooldown/a.max)*100}%`}}/></span>
 </button>)}</div>;
}
