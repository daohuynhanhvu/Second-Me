import './components/ForestDialogs.css';
import {LandscapeGate} from './components/LandscapeGate.tsx';
import {readLandscapeRequirement} from './game/logic/orientation.ts';
import { installScreenControls, FullscreenButton } from './components/FullscreenButton.tsx';
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, readSavedSettings, type HUDState } from './game/GameEngine.ts';
import { Intro, Lobby, Shop, Characters, AdventureHUD, Completion, Forge, EndScreen } from './components/CampaignUI.tsx';
import { CinematicIntro } from './components/CinematicIntro.tsx';
import { StudioSplash } from './components/StudioSplash.tsx';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { localize } from './localize.tsx';
import { MechanicGuide } from './components/MechanicGuide.tsx';

const initial: HUDState = { screen:'intro', levelName:'LEVEL 01', levelSubtitle:'ECHO GROVE', recordingStatus:'idle', echoCharges:2, echoStability:0, echoElapsedMs:0, echoDurationMs:0, echoEvents:[], dissonanceSeconds:0,
  recordingTimeRemaining:8000, echoStatus:'none', echoCount:0, isMuted:false, bannerMessage:'', elapsedLevelTime:0,
  completed:[], forged:false, lastReward:null, health:100, bossHp:0, bossPhase:0, attackCooldown:0, dodgeCooldown:0, legTimeRemaining:null, checkpointIndex:0, checkpointCount:0, slowed:false, defeatReason:'damage', volume:.25, effectsVolume:1, musicVolume:1, voiceVolume:1, reducedMotion:false, showHints:true, devUnlocked:false, language:'en', characterClass:'mage', weapon:'staff', coins:0, timeItems:0, limitRings:0, chestKeys:0, echoLimit:4, limitRingActive:false, bestStars:{}, lastRating:null, skillCooldown:0, bossArmor:0, pillarsRemaining:0, activeBuff:'', skillDrop:null, mechanicalOwned:false };
export default function AdventureApp({ prepare }: { prepare?: (engine: GameEngine) => void } = {}) {
  const [portraitBlocked,setPortraitBlocked]=useState(readLandscapeRequirement);
  useEffect(() => installScreenControls(), []);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ref = useRef<GameEngine | null>(null);
  // The saved language (and motion setting) from the first frame: the intro plays before the engine reports in.
  const [hud, setHud] = useState<HUDState>(() => ({ ...initial, ...readSavedSettings() }));
  const [introRun, setIntroRun] = useState(1);
  const [splash, setSplash] = useState(true);   // the studio card, once per page load, before the intro film
  const [portalFlash, setPortalFlash] = useState(0);   // the loading portal's closing flash, fading over the next screen // 0 = not playing; bump to (re)play the cinematic
  useEffect(() => {
    const engine = new GameEngine(); ref.current = engine;
    engine.tutorialEnabled = true;
    engine.levelLoading = true;   // levels open through the loading screen
    if (import.meta.env.DEV) (window as unknown as { __engine?: GameEngine }).__engine = engine;   // console checks
    engine.setOrientationBlocked(readLandscapeRequirement());
    engine.setCanvas(canvas.current); engine.onHUDChange = state => setHud({ ...state }); engine.start();
    prepare?.(engine);
    return () => engine.stop();
  }, []);
  useEffect(()=>{
    const update=()=>{const blocked=readLandscapeRequirement();ref.current?.setOrientationBlocked(blocked);setPortraitBlocked(blocked);};update();
    const media=window.matchMedia('(pointer: coarse)');window.addEventListener('resize',update);window.addEventListener('orientationchange',update);media.addEventListener('change',update);
    return()=>{window.removeEventListener('resize',update);window.removeEventListener('orientationchange',update);media.removeEventListener('change',update);};
  },[]);
  const filmPlaying = hud.screen === 'intro' && (splash || introRun > 0);
  useEffect(() => { if (ref.current) ref.current.suspendVisuals = filmPlaying; }, [filmPlaying]);
  const engine = ref.current;
  const lang = hud.language === 'vi' ? 'vi' : 'en';
  return localize(<main className="adventure-app" lang={hud.language} translate="no">{portraitBlocked&&<LandscapeGate vi={hud.language==='vi'}/>}<div className="game-stage" data-screen={hud.screen} inert={portraitBlocked}><canvas ref={canvas} width={1280} height={720} data-testid="game-canvas"/>
    {hud.screen === 'intro' && <Intro engine={engine} hud={hud}/>}
    {hud.screen === 'intro' && splash && <StudioSplash paused={portraitBlocked} onDone={() => setSplash(false)}/>}
    {hud.screen === 'intro' && !splash && introRun > 0 && <CinematicIntro key={introRun} lang={hud.language} reducedMotion={hud.reducedMotion} paused={portraitBlocked} onDone={() => setIntroRun(0)}/>}
    {hud.screen === 'loading' && <LoadingScreen key={hud.loadingLevel ?? 'lobby'} language={lang} reducedMotion={hud.reducedMotion}
      level={hud.loadingLevel == null ? null : { levelId: hud.loadingLevel, character: hud.characterClass, lang }} portal={!!hud.loadingFromMenu}
      onReveal={() => ref.current?.revealLoadedLevel()} onDone={flash => { if (flash) setPortalFlash(n => n + 1); ref.current?.finishLoading(); }}/>}
    {portalFlash > 0 && <div key={portalFlash} className="portal-flash" aria-hidden="true" onAnimationEnd={() => setPortalFlash(0)}/>}
    {hud.screen === 'lobby' && <Lobby engine={engine} hud={hud}/>}
    {hud.screen === 'shop' && <Shop engine={engine} hud={hud}/>}
    {hud.screen === 'characters' && <Characters engine={engine} hud={hud}/>}
    {hud.screen === 'playing' && <AdventureHUD engine={engine} hud={hud}/>}
    {/* The boss cutscene first; its mechanic guide follows once the fight begins (the game is frozen meanwhile). */}
    {hud.screen === 'playing' && !hud.bossIntroduction && <MechanicGuide engine={engine} hud={hud}/>}
    {hud.screen === 'victory' && <Completion engine={engine} hud={hud}/>}
    {hud.screen === 'forge' && <Forge engine={engine} hud={hud}/>}
    {(hud.screen === 'ending' || hud.screen === 'defeat') && <EndScreen engine={engine} hud={hud}/>}
    {/* Lobby and play have it in their toolbars; the loading transition stays clean, and the forge panel fills a
        phone screen corner to corner, so no free corner there (F still works everywhere). */}
    {!['lobby', 'playing', 'loading', 'forge'].includes(hud.screen) && <FullscreenButton floating vi={hud.language === 'vi'}/>}
    {hud.screen === 'paused' && <div className="modal-backdrop"><div className="panel pause-panel"><span className="eyebrow gold">MỘT KHOẢNG LẶNG</span><h2>Tạm dừng</h2><button className="primary" onClick={()=>engine?.resumeGame()}>TIẾP TỤC</button><button className="secondary" onClick={()=>engine?.restartLevel()}>CHƠI LẠI MÀN</button><button className="text-button" onClick={()=>engine?.goToLobby()}>VỀ SẢNH</button></div></div>}
  </div></main>);
}
