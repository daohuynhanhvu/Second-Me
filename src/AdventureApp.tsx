import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, type HUDState } from './game/GameEngine.ts';
import { Intro, Lobby, Shop, Characters, AdventureHUD, Completion, Forge, EndScreen } from './components/CampaignUI.tsx';
import { CinematicIntro } from './components/CinematicIntro.tsx';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { localize } from './localize.tsx';

const initial: HUDState = { screen:'intro', levelName:'LEVEL 01', levelSubtitle:'ECHO GROVE', recordingStatus:'idle', echoCharges:2, echoStability:0, echoElapsedMs:0, echoDurationMs:0, echoEvents:[], dissonanceSeconds:0,
  recordingTimeRemaining:8000, echoStatus:'none', echoCount:0, isMuted:false, bannerMessage:'', elapsedLevelTime:0,
  completed:[], forged:false, lastReward:null, health:5, bossHp:0, bossPhase:0, attackCooldown:0, dodgeCooldown:0, legTimeRemaining:null, checkpointIndex:0, checkpointCount:0, slowed:false, defeatReason:'damage', volume:.25, voiceVolume:1, reducedMotion:false, showHints:true, devUnlocked:false, language:'en', characterClass:'mage', weapon:'staff', coins:0, timeItems:0, bestStars:{}, lastRating:null, skillCooldown:0, bossArmor:0, pillarsRemaining:0, activeBuff:'', skillDrop:null, mechanicalOwned:false };
export default function AdventureApp({ prepare }: { prepare?: (engine: GameEngine) => void } = {}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ref = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState(initial);
  const [introRun, setIntroRun] = useState(1); // 0 = not playing; bump to (re)play the cinematic
  useEffect(() => {
    const engine = new GameEngine(); ref.current = engine;
    engine.levelLoading = true;   // levels open through the loading screen
    engine.setCanvas(canvas.current); engine.onHUDChange = state => setHud({ ...state }); engine.start();
    prepare?.(engine);
    return () => engine.stop();
  }, []);
  const filmPlaying = hud.screen === 'intro' && introRun > 0;
  useEffect(() => { if (ref.current) ref.current.suspendVisuals = filmPlaying; }, [filmPlaying]);
  const engine = ref.current;
  const lang = hud.language === 'vi' ? 'vi' : 'en';
  return localize(<main className="adventure-app" lang={hud.language} translate="no"><div className="game-stage"><canvas ref={canvas} width={1280} height={720} data-testid="game-canvas"/>
    {hud.screen === 'intro' && <Intro engine={engine} hud={hud}/>}
    {hud.screen === 'intro' && introRun > 0 && <CinematicIntro key={introRun} lang={hud.language} reducedMotion={hud.reducedMotion} onDone={() => setIntroRun(0)}/>}
    {hud.screen === 'loading' && <LoadingScreen key={hud.loadingLevel ?? 'lobby'} language={lang} reducedMotion={hud.reducedMotion}
      level={hud.loadingLevel == null ? null : { levelId: hud.loadingLevel, character: hud.characterClass, lang }}
      onReveal={() => ref.current?.revealLoadedLevel()} onDone={() => ref.current?.finishLoading()}/>}
    {hud.screen === 'lobby' && <Lobby engine={engine} hud={hud}/>}
    {hud.screen === 'shop' && <Shop engine={engine} hud={hud}/>}
    {hud.screen === 'characters' && <Characters engine={engine} hud={hud}/>}
    {hud.screen === 'playing' && <AdventureHUD engine={engine} hud={hud}/>}
    {hud.screen === 'victory' && <Completion engine={engine} hud={hud}/>}
    {hud.screen === 'forge' && <Forge engine={engine} hud={hud}/>}
    {(hud.screen === 'ending' || hud.screen === 'defeat') && <EndScreen engine={engine} hud={hud}/>}
    {hud.screen === 'paused' && <div className="modal-backdrop"><div className="panel pause-panel"><span className="eyebrow gold">MỘT KHOẢNG LẶNG</span><h2>Tạm dừng</h2><button className="primary" onClick={()=>engine?.resumeGame()}>TIẾP TỤC</button><button className="secondary" onClick={()=>engine?.restartLevel()}>CHƠI LẠI MÀN</button><button className="text-button" onClick={()=>engine?.goToLobby()}>VỀ SẢNH</button></div></div>}
  </div></main>);
}
