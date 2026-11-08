import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { ECHO_RUNES } from '../game/logic/echoRunes.ts';
import './EchoRunes.css';
export function EchoRuneStock({hud,engine,compact=false}:{hud:HUDState;engine?:GameEngine|null;compact?:boolean}){
 const vi=hud.language==='vi',boss=(engine?.currentLevel.id??1)>=2&&hud.screen==='playing';
 return <section className={compact?'echo-runes quick-runes':'echo-runes'} aria-label={vi?'Ấn nâng Echo':'Echo upgrade runes'}>
  <p>{vi?'ẤN NÂNG ECHO · DÙNG Ở MÀN 2–6':'ECHO RUNES · LEVELS 2–6'}</p>
  <div className="echo-rune-list">{ECHO_RUNES.map(r=>{
   const count=hud.echoRunes?.[r.id]??0,active=hud.activeEchoRunes?.includes(r.id),available=engine?.canUseEchoRune(r.id)??false;
   const detail=vi?r.detailVi:r.detailEn,name=vi?r.vi:r.en;
   return <button key={r.id} type="button" className={`echo-rune ${active?'rune-active':''}`} disabled={!available} style={{color:r.color}} title={`${name}: ${detail}${!boss?(vi?' Chỉ dùng trong màn 2–6.':' Levels 2–6 only.'):''}`} aria-label={`${r.glyph} ${name} ×${count}. ${detail}${active?(vi?' Đang hiệu lực.':' Active.'):''}`} onClick={()=>engine?.useEchoRune(r.id)}>
    <span className="rune-symbol">{r.glyph}</span><strong>{name}</strong><small>{active?(vi?'ĐANG HIỆU LỰC':'ACTIVE'):`× ${count}`}</small>{!compact&&<em>{detail}</em>}
   </button>;
  })}</div>
  {!compact&&<small className="rune-help">{vi?'Thắng mỗi màn 1–5: chọn 1 trong 3 ấn khác nhau, rút ngẫu nhiên từ bộ 5. Các lần thắng có thể gặp lại cùng loại. Mỗi lần kích hoạt tốn 1 ấn. Bền bỉ, Khuếch đại và Truy kích không cộng dồn; hết hiệu lực khi rời hoặc chơi lại màn.':'Each clear offers three distinct random runes from five. Choose one; later clears can repeat any type. Activating consumes one rune. Endurance, Amplification and Pursuit do not stack and expire when the level attempt ends or restarts.'}</small>}
 </section>;
}

export function RuneStone({id}:{id:string}){
 const paths:Record<string,string>={call:'M29 16V48M29 18H42V28H29M29 30H39V39H29',guard:'M23 48V22L32 16L41 22V48',power:'M25 48V16L42 27L25 37M25 31L42 48',lure:'M26 48V16L41 25M26 27L39 35',restore:'M24 47V17H39V29H24M31 30L41 47'};
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
