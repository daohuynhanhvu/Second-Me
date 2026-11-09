import {useDialogClose} from './useDialogClose.ts';
import {createPortal} from 'react-dom';
import {useState,useEffect} from 'react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { ECHO_RUNES, type EchoRuneId } from '../game/logic/echoRunes.ts';
import './EchoRunes.css';
import './RuneLoadout.css';
export function EchoRuneStock({hud,engine,compact=false,summaryOnly=false}:{hud:HUDState;engine?:GameEngine|null;compact?:boolean;summaryOnly?:boolean}){
 const vi=hud.language==='vi',boss=(engine?.currentLevel.id??1)>=2&&hud.screen==='playing';
 const [editing,setEditing]=useState(false);
 const [peek,setPeek]=useState<{id:EchoRuneId;left:number;top:number;bottom:number;width:number}|null>(null);
 const preview=(id:EchoRuneId,element:HTMLButtonElement)=>{const rect=element.getBoundingClientRect();setPeek({id,left:rect.left,top:rect.top,bottom:rect.bottom,width:rect.width});};
 useEffect(()=>{const hide=()=>setPeek(null);const outside=(event:PointerEvent)=>{if(!(event.target as Element)?.closest('.echo-rune'))hide();};window.addEventListener('resize',hide);window.addEventListener('scroll',hide,true);window.addEventListener('pointerdown',outside);return()=>{window.removeEventListener('resize',hide);window.removeEventListener('scroll',hide,true);window.removeEventListener('pointerdown',outside);};},[]);
 const info=peek&&ECHO_RUNES.find(r=>r.id===peek.id),tipWidth=Math.min(340,typeof window==='undefined'?340:window.innerWidth-24),above=!!peek&&peek.top>=140;

 const runes=(hud.runeLoadout??[]).map(id=>ECHO_RUNES.find(r=>r.id===id)!).filter(Boolean);
 return <section className={compact?'echo-runes quick-runes':'echo-runes'} aria-label={vi?'Ấn nâng Echo':'Echo upgrade runes'}>
  <p>{vi?'ẤN ĐÃ CHỌN · 5 Ô':'CHOSEN RUNES · 5 SLOTS'} <button className="rune-edit-link" onClick={()=>{setPeek(null);setEditing(true);}}>{vi?'ĐỔI RUNE':'CHANGE RUNES'}</button></p>{editing&&<RuneLoadoutEditor hud={hud} engine={engine??null} close={()=>setEditing(false)}/>}
  <div className="echo-rune-list">{runes.map(r=>{
   const count=hud.echoRunes?.[r.id]??0,active=hud.activeEchoRunes?.includes(r.id),available=engine?.canUseEchoRune(r.id)??false;
   const detail=vi?r.detailVi:r.detailEn,name=vi?r.vi:r.en;
   return <button key={r.id} type="button" className={`echo-rune ${active?'rune-active':''}`} disabled={!summaryOnly&&!available} style={{color:r.color}} title={summaryOnly?undefined:`${name}: ${detail}${!boss?(vi?' Chỉ dùng trong màn 2–6.':' Levels 2–6 only.'):''}`} aria-describedby={summaryOnly&&peek?.id===r.id?'forge-rune-function':undefined} onMouseEnter={e=>{if(summaryOnly)preview(r.id,e.currentTarget);}} onMouseLeave={()=>{if(summaryOnly)setPeek(null);}} onFocus={e=>{if(summaryOnly)preview(r.id,e.currentTarget);}} onBlur={()=>setPeek(null)} aria-label={`${r.glyph} ${name} ×${count}. ${detail}${active?(vi?' Đang hiệu lực.':' Active.'):''}`} onClick={e=>summaryOnly?preview(r.id,e.currentTarget):engine?.useEchoRune(r.id)}>
    <span className="stock-rune-stone"><RuneStone id={r.id}/></span><strong>{name}</strong><small>{active?(vi?'ĐANG HIỆU LỰC':'ACTIVE'):`× ${count}`}</small>{!compact&&!summaryOnly&&<em>{detail}</em>}
   </button>;
  })}{Array.from({length:5-runes.length},(_,i)=><button key={`empty-${i}`} className="echo-rune empty-rune" onClick={()=>setEditing(true)} aria-label={vi?'Chọn rune cho ô trống':'Choose a rune for this slot'}><span>+</span><small>{vi?'Ô TRỐNG':'EMPTY'}</small></button>)}</div>
  {summaryOnly&&peek&&info&&createPortal(<div lang={vi?'vi':'en'} className="rune-function-tip" id="forge-rune-function" role="tooltip" style={{width:tipWidth,left:Math.max(12,Math.min(window.innerWidth-tipWidth-12,peek.left+peek.width/2-tipWidth/2)),top:above?peek.top-9:peek.bottom+9,transform:above?'translateY(-100%)':undefined,maxHeight:above?peek.top-20:window.innerHeight-peek.bottom-20}}><strong style={{color:info.color}}>{vi?info.vi:info.en}</strong><p>{vi?info.detailVi:info.detailEn}</p><small>{vi?'Chỉ xem công năng · Không tiêu hao ấn':'Preview only · No rune consumed'}</small></div>,document.body)}
  {!compact&&!summaryOnly&&<small className="rune-help">{vi?'Thắng mỗi màn 1–5: chọn 1 trong 3 ấn khác nhau, rút ngẫu nhiên từ bộ 12. Các lần thắng có thể gặp lại cùng loại. Mỗi lần kích hoạt tốn 1 ấn. Các buff cả màn không cộng dồn cùng loại; hết hiệu lực khi rời hoặc chơi lại màn.':'Each clear offers three distinct random runes from twelve. Choose one; later clears can repeat any type. Activating consumes one rune. Attempt buffs of the same type do not stack and expire when the level attempt ends or restarts.'}</small>}
 </section>;
}

export function RuneLoadoutEditor({hud,engine,close:onClose}:{hud:HUDState;engine:GameEngine|null;close:()=>void}){
 const {closing,close}=useDialogClose(onClose);
 const vi=hud.language==='vi',[slot,setSlot]=useState(0),selected=hud.runeLoadout??[],owned=ECHO_RUNES.filter(r=>(hud.echoRunes?.[r.id]??0)>0);
 useEffect(()=>{engine?.setRuneEditing(true);const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}};window.addEventListener('keydown',key,true);return()=>{engine?.setRuneEditing(false);window.removeEventListener('keydown',key,true);};},[engine,close]);
 const [notice,setNotice]=useState('');
 const equipRune=(id:EchoRuneId)=>{
  const existing=selected.indexOf(id);
  if(existing>=0){setNotice(vi?`Rune này đã được chọn ở ô ${existing+1}. Bộ rune được giữ nguyên.`:`This rune is already selected in slot ${existing+1}. Your loadout is unchanged.`);return;}
  if(engine?.setRuneSlot(slot,id))setNotice('');
 };
 const focused=ECHO_RUNES.find(r=>r.id===selected[slot]);
 return createPortal(<div lang={vi ? 'vi' : 'en'} className={`modal-backdrop rune-loadout-backdrop forest-dialog-backdrop ${closing?'is-leaving':''}`} onClick={close}><section className="panel rune-loadout-editor forest-dialog" data-lobby-dialog role="dialog" aria-modal="true" aria-label={vi?'Đổi rune':'Change runes'} onClick={e=>e.stopPropagation()}>
  <div className="loadout-scenery" aria-hidden="true"><i/><i/><i/><i/></div>
  <button className="loadout-close" onClick={close} aria-label={vi?'Đóng':'Close'}>×</button>
  <div className="loadout-equipped">
   <header><small>{vi?'BỘ RUNE CỦA BẠN':'YOUR RUNE SET'}</small><h2>{vi?'Chọn 5 rune mang theo':'Choose your five runes'}</h2></header>
   <div className="loadout-slots">{Array.from({length:5},(_,i)=>{const r=ECHO_RUNES.find(r=>r.id===selected[i]);return <button key={i} aria-pressed={slot===i} onClick={()=>{setSlot(Math.min(i,selected.length));setNotice('');}}><small>{i+1}</small>{r?<span className="slot-stone" style={{color:r.color}}><RuneStone id={r.id}/></span>:<span className="empty-socket" aria-hidden="true"><svg viewBox="0 0 48 56" shapeRendering="crispEdges"><path d="M9 4H39V10H43V46H37V52H11V46H5V10H9Z" fill="#171d18" stroke="#68725a" strokeWidth="2"/><path d="M24 15L34 28L24 41L14 28Z" fill="none" stroke="#58634d" strokeWidth="2"/><path d="M24 23V33M19 28H29" stroke="#75805f" strokeWidth="2"/></svg></span>}<span>{r?(vi?r.vi:r.en):(vi?'Trống':'Empty')}</span></button>;})}</div>
   <p className={`loadout-instruction ${notice?'loadout-warning':''}`} role="status" aria-live="polite">{notice||(vi?`Chọn ô ${slot+1}, rồi bấm rune muốn thay ở danh sách. Đổi ô không tiêu hao ấn.`:`Select slot ${slot+1}, then pick a rune from the library. Changing slots spends no runes.`)}</p>
   <div className="loadout-preview">{focused?<><div style={{color:focused.color}}><RuneStone id={focused.id}/></div><small>{vi?'ẤN ĐANG CHỌN':'SELECTED RUNE'} · 0{slot+1}</small><h3>{vi?focused.vi:focused.en}</h3><p>{vi?focused.detailVi:focused.detailEn}</p><span>× {hud.echoRunes?.[focused.id]??0} {vi?'trong túi':'in inventory'}</span></>:<><div className="loadout-empty-art"><RuneStone id="call"/><RuneStone id="guard"/><RuneStone id="restore"/></div><small>{vi?'Ô RUNE CHƯA TRANG BỊ':'UNEQUIPPED RUNE SLOT'}</small><h3>{owned.length?(vi?'Chọn một ấn cho hành trình':'Choose a rune for the trail'):(vi?'Tiếng vọng đầu tiên đang chờ':'Your first Echo awaits')}</h3><p>{owned.length?(vi?'Chọn rune trong kho bên cạnh để đặt vào ô này.':'Pick an owned rune from the collection to fill this slot.'):(vi?'Hoàn thành màn 1–5 và chọn phần thưởng để sở hữu rune. Các ấn chưa có vẫn xem được trong danh sách.':'Complete trails 1–5 and choose a reward to earn runes. Browse the collection to see what awaits.')}</p></>}</div>
  </div>
  <div className="loadout-library"><div className="loadout-list-heading"><span>{vi?`ĐANG SỞ HỮU ${owned.length} / ${ECHO_RUNES.length} LOẠI`:`OWNED ${owned.length} / ${ECHO_RUNES.length} TYPES`}</span><small>{vi?'Cuộn để xem ↓':'Scroll to explore ↓'}</small></div>
   <div className="loadout-owned" tabIndex={0} aria-label={vi?'Danh sách toàn bộ rune':'All runes'}>{ECHO_RUNES.map(r=><button key={r.id} disabled={!(hud.echoRunes?.[r.id]??0)} aria-pressed={selected[slot]===r.id} onClick={()=>equipRune(r.id)}><span className="library-stone" style={{color:r.color}}><RuneStone id={r.id}/></span><div><strong>{vi?r.vi:r.en}</strong><p>{vi?r.detailVi:r.detailEn}</p></div><small>{(hud.echoRunes?.[r.id]??0)>0?`×${hud.echoRunes?.[r.id]}`:(vi?'CHƯA CÓ':'LOCKED')}</small></button>)}</div>
  </div>
  <footer><button disabled={!selected[slot]} onClick={()=>{engine?.setRuneSlot(slot,null);setNotice('');}}>{vi?'BỎ KHỎI Ô':'CLEAR SLOT'}</button><button onClick={close}>{vi?'XONG':'DONE'} →</button></footer>
  <small className="loadout-note">{vi?'Buff đã kích hoạt giữ đến hết lượt chơi · Đổi ô không kích hoạt rune':'Active buffs last until the attempt ends · Changing slots does not activate runes'}</small>
 </section></div>,document.body);
}

export function RuneStone({id}:{id:string}){
 const paths:Record<string,string>={call:'M29 16V48M29 18H42V28H29M29 30H39V39H29',guard:'M23 48V22L32 16L41 22V48',power:'M25 48V16L42 27L25 37M25 31L42 48',lure:'M26 48V16L41 25M26 27L39 35',restore:'M24 47V17H39V29H24M31 30L41 47',rapid:'M40 17L24 32L40 47',vamp:'M22 18L32 29L42 18M32 29V49',cleave:'M23 19L39 29L23 39M41 25L25 35L41 45',anchor:'M32 49V17M21 28L32 17L43 28',regen:'M24 17V48L40 39L24 31L40 23L24 17',swap:'M23 18V47L41 18V47L23 18',execute:'M32 16L44 29L32 42L20 29L32 16M25 36L20 49M39 36L44 49'};
 return <svg className="rune-stone" viewBox="0 0 64 72" shapeRendering="crispEdges" aria-hidden="true">
 <ellipse cx="32" cy="65" rx="26" ry="5" fill="#000" opacity=".3"/>
 <path d="M18 3H46V7H52V13H56V57H51V63H13V59H8V16H12V8H18Z" fill="#182d29"/>
 <path d="M18 6H45V10H50V16H53V54H48V59H16V55H12V17H16V11H18Z" fill="#496058"/>
 <path d="M20 10H43V14H48V52H44V55H19V51H16V20H20Z" fill="#30483f"/>
 <path d="M18 6H45V10H20V14H16V48H12V17H16V11H18Z" fill="#6d8270"/>
 <path d="M19 55H44V51H49V20H53V54H48V59H16V55Z" fill="#233b33"/>
 <path d="M18 12H24V15H18ZM44 44H48V48H44ZM17 38H21V40H17ZM37 11H41V13H37" fill="#7e9871" opacity=".65"/>
 <path d={paths[id]} fill="none" stroke="#071a15" strokeWidth="6" transform="translate(1 2)"/>
 <path d={paths[id]} fill="none" stroke="currentColor" strokeWidth="3"/>
 <path d="M11 51H18V55H23V59H14V56H11ZM45 9H51V17H47V14H42V11H45Z" fill="#698748"/>
 </svg>;
}

export function RuneChoicePicker({hud,engine}:{hud:HUDState;engine:GameEngine|null}){
 const vi=hud.language==='vi';
 if(!hud.pendingRuneChoices?.length){const rune=ECHO_RUNES.find(r=>r.id===hud.lastRuneReward);return <div className="rune-claimed" role="status">{rune&&<span style={{color:rune.color}}><RuneStone id={rune.id}/></span>}<div><small>{vi?'ĐÃ NHẬN ẤN':'RUNE CLAIMED'}</small><h3>{rune?(vi?rune.vi:rune.en):(vi?'Phần thưởng đã nhận':'Reward collected')}</h3><p>{vi?'Đã cất vào túi · Dùng trong màn 2–6':'Added to inventory · Use in levels 2–6'}</p></div><b>✓</b></div>;}
 return <section className="rune-choice" aria-label={vi?'Chọn một ấn nâng Echo':'Choose one Echo rune'}>
  <h3>{vi?'CHỌN 1 TRONG 3 ẤN':'CHOOSE 1 OF 3 RUNES'}</h3>
  <p>{vi?'Ba lựa chọn ngẫu nhiên. Chọn một, hai ấn còn lại sẽ biến mất.':'Three random choices. Keep one; the other two disappear.'}</p>
  <div className="rune-choice-grid">{hud.pendingRuneChoices.map(id=>{const rune=ECHO_RUNES.find(r=>r.id===id)!;return <button key={id} onClick={()=>engine?.chooseRune(id)} style={{color:rune.color}} aria-label={`${vi?'Chọn':'Choose'} ${vi?rune.vi:rune.en}`}><span className="rune-art"><RuneStone id={rune.id}/></span><strong>{vi?rune.vi:rune.en}</strong><p>{vi?rune.detailVi:rune.detailEn}</p><small>{vi?'CHỌN ẤN NÀY':'KEEP THIS RUNE'}</small></button>;})}</div>
 </section>;
}
export function RuneChoiceDialog({hud,engine}:{hud:HUDState;engine:GameEngine|null}){
 if(!hud.pendingRuneChoices?.length)return null;
 return <div className="modal-backdrop rune-choice-dialog"><div className="panel rune-choice-panel" role="dialog" aria-modal="true" aria-label={hud.language==='vi'?'Phần thưởng đang chờ':'Unclaimed rune reward'}><RuneChoicePicker hud={hud} engine={engine}/></div></div>;
}
