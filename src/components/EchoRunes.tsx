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
  {!compact&&<small className="rune-help">{vi?'Thắng mỗi màn 1–5: chọn 1 trong 3 ấn khác nhau, rút ngẫu nhiên từ bộ 5. Các lần thắng có thể gặp lại cùng loại. Mỗi lần kích hoạt tốn 1 ấn. Bền bỉ, Khuếch đại và Dẫn dụ không cộng dồn; hết hiệu lực khi rời hoặc chơi lại màn.':'Each clear offers three distinct random runes from five. Choose one; later clears can repeat any type. Activating consumes one rune. Endurance, Amplification and Luring do not stack and expire when the level attempt ends or restarts.'}</small>}
 </section>;
}

export function RuneChoicePicker({hud,engine}:{hud:HUDState;engine:GameEngine|null}){
 const vi=hud.language==='vi';
 if(!hud.pendingRuneChoices?.length)return <p className="rune-reward-note">{hud.lastRuneReward?`${ECHO_RUNES.find(r=>r.id===hud.lastRuneReward)?.glyph} · ${vi?'Đã cất ấn vào túi. Dùng ở màn 2–6.':'Rune stored. Use it in levels 2–6.'}`:(vi?'Ấn đã được cất trong túi.':'Your rune is in your inventory.')}</p>;
 return <section className="rune-choice" aria-label={vi?'Chọn một ấn nâng Echo':'Choose one Echo rune'}>
  <h3>{vi?'CHỌN 1 TRONG 3 ẤN':'CHOOSE 1 OF 3 RUNES'}</h3>
  <p>{vi?'Ba lựa chọn ngẫu nhiên. Chọn một, hai ấn còn lại sẽ biến mất.':'Three random choices. Keep one; the other two disappear.'}</p>
  <div className="rune-choice-grid">{hud.pendingRuneChoices.map(id=>{const rune=ECHO_RUNES.find(r=>r.id===id)!;return <button key={id} onClick={()=>engine?.chooseRune(id)} style={{color:rune.color}} aria-label={`${vi?'Chọn':'Choose'} ${vi?rune.vi:rune.en}`}><span className="rune-symbol">{rune.glyph}</span><strong>{vi?rune.vi:rune.en}</strong><p>{vi?rune.detailVi:rune.detailEn}</p><small>{vi?'CHỌN ẤN NÀY':'KEEP THIS RUNE'}</small></button>;})}</div>
 </section>;
}
export function RuneChoiceDialog({hud,engine}:{hud:HUDState;engine:GameEngine|null}){
 if(!hud.pendingRuneChoices?.length)return null;
 return <div className="modal-backdrop rune-choice-dialog"><div className="panel rune-choice-panel" role="dialog" aria-modal="true" aria-label={hud.language==='vi'?'Phần thưởng đang chờ':'Unclaimed rune reward'}><RuneChoicePicker hud={hud} engine={engine}/></div></div>;
}
