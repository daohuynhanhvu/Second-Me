import { createEnemies, updateEnemies, type Enemy } from './logic/enemies.ts';
import { ECHO_RUNES, type EchoRuneId, type EchoRuneStock } from './logic/echoRunes.ts';
import { segmentCircle, segmentWall } from './logic/combatGeometry.ts';
import { puzzleBalance, SHARD_BONUS, PUZZLE_HINTS } from './logic/balance.ts';
import { TutorialDirector, type GuideTopic } from './logic/tutorials.ts';
import { isPuzzleExitOpen } from './logic/puzzle.ts';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Direction,
  GameScreen,
  LevelData,
  MovementSample,
  EchoEvent,
  RecordingStatus,
  EchoStatus,
} from './logic/types.ts';
import { resolveMovement, getActiveObstacles, resolveSpawnPosition, rectIntersects, getCharacterBoundingBox } from './logic/collision.ts';
import { trapEffects } from './logic/traps.ts';
import {
  RecordingManager,
  interpolateSample,
  MAX_RECORDING_DURATION_MS,
} from './logic/recorder.ts';
import {
  updatePressurePlates,
  updateSecurityDoors,
  checkExitReached,
} from './logic/puzzle.ts';
import { LEVELS } from './logic/levels.ts';
import { sounds } from './logic/sound.ts';
import { GameRenderer } from './rendering/renderer.ts';
import { MECHANICAL_ENABLED, Campaign, createBoss, updateBoss, type BossState, type CharacterClass } from './logic/campaign.ts';
import { renderAdventure } from './rendering/adventure.ts';
import { drawPortalEnergy, finishPixelFrame } from './rendering/portalEffects.ts';
import { translate, setCurrentLanguage, type Language } from '../i18n.ts';
import { voice, type VoiceRole } from './logic/voice.ts';
import { music, type MusicScene } from './logic/music.ts';
import { Combo, COMBO_HITS, comboDamage, hitDuration, type ComboHero } from './logic/combo.ts';
import { preloadComboSprites, comboPose } from './rendering/comboSprites.ts';

/** A spell from Aeris's combo in flight: it moves, and strikes what it touches. */
export interface ComboShot { x: number; y: number; vx: number; vy: number; life: number; radius: number; amount: number; heavy: boolean; pierce: boolean; group: Set<object> }
export interface ComboFx { kind: 'arc' | 'spin' | 'impact' | 'nova' | 'charge'; x: number; y: number; angle: number; radius: number; life: number; max: number; heavy?: boolean; flip?: boolean }
export interface DamageText { x: number; y: number; text: string; life: number; max: number; heavy: boolean; blocked?: boolean }
/** Hit circles of the combat targets (game px), for sword arcs and spells. */
const PILLAR_R = 26, BOSS_R = 44, ENEMY_R = 26;
// The game has no physical metre scale; 40 world units approximate one metre.
const ECHO_COMBAT_RADIUS = 3 * 40;
const ECHO_COMBAT_SPEED = 110;
const ECHO_MAX_HITS = 3;
type CombatTarget = BossState | BossState['pillars'][number] | Enemy;
/** Kael's swings: reach of the arc's centre in front of him, its radius, how many it can hit. */
const KAEL_SWINGS = [
  { reach: 46, radius: 48, max: 1 },          // Quick Slash
  { reach: 48, radius: 52, max: 1 },          // Reverse Slash
  { reach: 0, radius: 84, max: Infinity },    // Spinning Slash: all around him
  { reach: 54, radius: 76, max: Infinity },   // Heavy Finisher: bigger, after the dash
];
const FINISHER_DASH = 42;                     // px Kael lunges during the finisher's dash frames

export type CombatSkill = 'fire' | 'lightning' | 'stone' | 'haste' | 'armor' | 'wave';
const CLASS_SKILLS: Record<CharacterClass, CombatSkill[]> = { mage: ['fire','lightning','stone'], swordsman: ['haste','armor','wave'], mechanical: ['fire','armor','haste'] };

export interface HUDState {
  guideTopic?: GuideTopic|null;
  guideLibrary?: boolean;
  screen: GameScreen;
  levelName: string;
  levelSubtitle: string;
  recordingStatus: RecordingStatus;
  recordingTimeRemaining: number;
  echoStatus: EchoStatus;
  echoCount: number; // 0 or 1
  echoCharges: number;
  echoStability: number;
  echoHitsRemaining?: number;
  echoElapsedMs: number;
  echoDurationMs: number;
  echoEvents: EchoEvent[];
  dissonanceSeconds: number;
  isMuted: boolean;
  bannerMessage: string;
  elapsedLevelTime: number;
  bestTime?: number;
  completed: number[];
  forged: boolean;
  lastReward: number | null;
  lastRuneReward?:EchoRuneId|null;
  echoRunes?:EchoRuneStock;
  activeEchoRunes?:EchoRuneId[];
  pendingRuneChoices?:EchoRuneId[];
  enemiesRemaining?:number;
  health: number;
  bossHp: number;
  bossPhase: number;
  attackCooldown: number;
  dodgeCooldown: number;
  legTimeRemaining: number | null;
  checkpointIndex: number;
  checkpointCount: number;
  legTimeBudget?: number;
  runesHeld?: number;
  runesRequired?: number;
  slowed: boolean;
  defeatReason: 'timeout' | 'damage';
  volume: number;
  reducedMotion: boolean;
  voiceVolume: number;
  showHints: boolean;
  devUnlocked: boolean;
  language: Language;
  characterClass: CharacterClass;
  weapon: 'staff' | 'sword';
  coins: number;
  timeItems: number;
  limitRings: number;
  echoLimit: number;
  limitRingActive: boolean;
  bestStars: Record<number, number>;
  lastRating: { stars: number; coins: number } | null;
  skillCooldown: number;
  bossArmor: number;
  pillarsRemaining: number;
  activeBuff: string;
  skillDrop: CombatSkill | null;
  mechanicalOwned: boolean;
  /** Level id the loading screen is preparing, or null for the first load into the lobby. */
  loadingLevel?: number | null;
  /** True when this load was started from the main menu (Start / Continue): it ends with the portal. */
  loadingFromMenu?: boolean;
}

export class GameEngine {
  // Screen state
  public screen: GameScreen = 'intro';
  /** Set by the UI while the cinematic intro covers the stage. */
  public suspendVisuals = false;
  /**
   * Set by the app UI: entering a level (picking one, the next one, the boss) shows the
   * loading screen first. Off by default, so tests and headless runs enter levels directly.
   */
  public levelLoading = false;
  /** The level the loading screen is preparing; `built` once it is set up behind the screen. */
  private pendingLevel: { idx: number; built: boolean; after?: () => void } | null = null;
  /** The current load began on the main menu, so it ends with the portal (otherwise a fade into the level). */
  private loadingFromMenu = false;
  private stageBlank = false;
  /** The menu screen whose still backdrop has been drawn (lobby, shop, characters). */
  private backdropFor: GameScreen | null = null;
  public currentLevelIdx: number = 0;
  public currentLevel: LevelData;

  // Player state
  public player = {
    x: 0,
    y: 0,
    direction: 'right' as Direction,
    isMoving: false,
    speed: 200, // 200 pixels/sec as specified
  };

  // Echo state
  private echoShape: {
    colorSlot?: number;
    x: number;
    y: number;
    direction: Direction;
    isMoving: boolean;
    elapsedMs: number;
    status: 'replaying' | 'paused' | 'finished';
    samples: MovementSample[];
    events?: EchoEvent[];
    nextEvent?: number;
    stability?: number;
    combatLife?: number;
    aggroTime?: number;
    attackTimer?: number;
    hitsTaken?: number;
    attackFlash?: number;
    attackTarget?: { x: number; y: number };
    combatAnchor?: { x: number; y: number };
    returnBlockedFor?: number;
    characterClass?: CharacterClass;
  } | null = null;
  public echoes: NonNullable<GameEngine['echoShape']>[] = [];
  public selectedEcho = 0;
  public get echo() { return this.echoes[this.selectedEcho]??null; }
  public set echo(value: GameEngine['echoShape']) {
    if(value) this.echoes[this.selectedEcho]=value;
    else {this.echoes.splice(this.selectedEcho,1);this.selectedEcho=Math.max(0,Math.min(this.selectedEcho,this.echoes.length-1));}
  }
  public selectEcho(index:number) {if(index>=0&&index<this.echoes.length){this.selectedEcho=index;this.notifyHUD();}}
  public pauseEcho() {if(this.screen==='playing'&&this.echo){this.echo.status=this.echo.status==='paused'?'replaying':'paused';this.notifyHUD();}}

  // Recording
  public recorder = new RecordingManager();
  public echoCharges = 3;
  public limitRingActive = false;
  public get echoLimit() { return this.limitRingActive ? 6 : 4; }
  private echoFreeSummon = true;
  public dissonanceSeconds = 0;
  private swapCooldown = 0;
  private echoGrace = 0;
  private pingTarget: {x:number;y:number;life:number}|null = null;
  public campaign = new Campaign();
  public readonly guides = new TutorialDirector();
  public tutorialEnabled = false;
  public dismissGuide(){this.guides.dismiss();this.heldKeys.clear();this.notifyHUD();}
  public openGuide(){this.guides.openLibrary();this.heldKeys.clear();this.notifyHUD();}
  public replayGuide(topic:GuideTopic){this.guides.replay(topic);this.notifyHUD();}
  public closeGuide(){this.guides.closeLibrary();this.heldKeys.clear();this.notifyHUD();}
  public boss: BossState | null = null;
  public bossDeathElapsed = 0;
  private bossDeathPending = false;
  // Voice-over bookkeeping (lines are pre-rendered; see src/game/logic/voice.ts).
  private lastVoicedLevel = -1;
  private idleTime = 0;
  private lastBossPhase = 1;
  private lastBossMode = '';
  private bossLowVoiced = false;
  /** An ultimate's hit waits for its shout so the skill name lands with the impact. */
  private pendingUltimate: { kind: CombatSkill; time: number } | null = null;
  private get voiceRole(): VoiceRole { return this.characterClass === 'swordsman' ? 'kael' : this.characterClass === 'mechanical' ? 'rivet' : 'aeris'; }
  public health = 5;
  public invulnerability = 0;
  public attackCooldown = 0;
  public attackFlash = 0;
  public attackAngle = 0;
  public summonEffects: {x:number;y:number;life:number}[] = [];
  public exitTravelRemaining = 0;
  private exitOpenedAt: number | null = null;
  public combatHits: { x: number; y: number; damage: number; life: number; broken: boolean }[] = [];
  public dodgeCooldown = 0;
  public dodgeTime = 0;
  public lastReward: number | null = null;
  public lastRuneReward:EchoRuneId|null=null;
  public activeEchoRunes=new Set<EchoRuneId>();
  public enemies:Enemy[]=[];
  public legTimeRemaining: number | null = null;
  public timePickup: { x: number; y: number } | null = null;
  public pickupSpawnTimer = 5;
  private shardClaimedThisLeg = false;
  private timeItemUsedThisLeg = false;
  public trappedTime = 0;
  public checkpointIndex = 0;
  public slowed = false;
  public defeatReason: 'timeout' | 'damage' = 'damage';
  public reducedMotion = false;
  public showHints = true;
  public devUnlocked = false;
  public language: Language = 'en';
  public characterClass: CharacterClass = 'mage';
  public lastRating: { stars: number; coins: number } | null = null;
  public skillCooldown = 0;
  public orbitOrbs: { angle:number; life:number; tick:number }[] = [];
  public lightCircle: { x:number; y:number; life:number; heal:number } | null = null;
  public overdrive = 0;
  public get insideLightCircle() { return !!this.lightCircle && Math.hypot(this.player.x-this.lightCircle.x,this.player.y-this.lightCircle.y)<=58; }
  public buyMechanical() { if(!MECHANICAL_ENABLED || this.screen !== 'shop') return; this.campaign.buyMechanical(); this.notifyHUD(); }

  public magicShots: { x: number; y: number; targetX: number; targetY: number; age: number; skill: boolean; duration?:number }[] = [];
  /** Kael's / Aeris's four-hit normal attack (logic/combo.ts); null for other classes. */
  public combo: Combo | null = null;
  /** Where the combo is aimed (latest press). */
  public comboAim = { x: 0, y: 0 };
  public comboShots: ComboShot[] = [];
  public comboFx: ComboFx[] = [];
  public damageTexts: DamageText[] = [];
  private lunge = { time: 0, vx: 0, vy: 0 };
  public skillDrop: { kind: CombatSkill; x: number; y: number; fall: number } | null = null;
  public skillDropTimer = 5;
  public stoneShield = 0;
  public armorShield = 0;
  public hasteTime = 0;
  public fireBurnTime = 0;
  public fireBurnTick = 0;
  public combatFlash: { x:number;y:number;kind:CombatSkill;time:number } | null = null;
  private devKeyCount = 0;
  private lastDevKeyAt = 0;

  // Rendering & audio
  public renderer = new GameRenderer();
  private gameTime = 0;
  private elapsedLevelTime = 0;
  private bannerMessage = '';
  private bannerTimer = 0;

  // Input
  private heldKeys = new Set<string>();

  // Loop management
  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // State sync to React UI (throttled to ~10-15Hz or discrete changes)
  public onHUDChange: ((state: HUDState) => void) | null = null;
  private lastHUDNotify = 0;

  constructor() {
    this.campaign.load();
    this.loadSettings();
    setCurrentLanguage(this.language);
    if (typeof document !== 'undefined') document.title = this.language === 'vi' ? 'SECOND ME — Lò rèn lửa' : 'SECOND ME — The Emberforge';
    this.currentLevel = this.cloneLevel(LEVELS[0]);
    this.initPlayer();
  }

  private loadSettings() {
    try {
      if (typeof localStorage === 'undefined') return;
      const value = JSON.parse(localStorage.getItem('second-me-settings-v1') ?? '{}');
      sounds.setMuted(value.muted === true);
      sounds.setVolume(typeof value.volume === 'number' ? value.volume : 0.25);
      sounds.setVoiceVolume(typeof value.voiceVolume === 'number' ? value.voiceVolume : 1);
      this.reducedMotion = value.reducedMotion === true;
      this.showHints = value.showHints !== false;
      this.language = value.language === 'vi' ? 'vi' : 'en';
      this.characterClass = MECHANICAL_ENABLED && value.characterClass === 'mechanical' && this.campaign.mechanicalOwned ? 'mechanical' : value.characterClass === 'swordsman' ? 'swordsman' : 'mage';
      setCurrentLanguage(this.language);
      voice.lang = this.language;
      if (typeof document !== 'undefined') document.body.classList.toggle('reduced-motion', this.reducedMotion);
    } catch { /* Defaults keep the game playable. */ }
  }

  private saveSettings() {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('second-me-settings-v1', JSON.stringify({
      muted: sounds.getMuted(), volume: sounds.getVolume(), voiceVolume: sounds.getVoiceVolume(), reducedMotion: this.reducedMotion, showHints: this.showHints, language: this.language, characterClass: this.characterClass,
    })); } catch { /* Ignore unavailable storage. */ }
  }

  private cloneLevel(source: LevelData): LevelData {
    return {
      ...source,
      walls: source.walls.map((w) => ({ ...w })),
      plates: source.plates.map((p) => ({ ...p })),
      doors: source.doors.map((d) => ({ ...d })),
      exit: { ...source.exit },
      decorations: source.decorations?.map((dc) => ({ ...dc })),
      traps: source.traps?.map(trap => ({ ...trap })),
    };
  }

  private initPlayer() {
    const obstacles = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
    const safeSpawn = resolveSpawnPosition(
      this.currentLevel.playerSpawn.x,
      this.currentLevel.playerSpawn.y,
      24,
      24,
      obstacles
    );
    this.player.x = safeSpawn.x;
    this.player.y = safeSpawn.y;
    this.player.direction = this.currentLevel.playerSpawn.direction;
    this.player.isMoving = false;
  }

  public setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    if (canvas) {
      this.ctx = canvas.getContext('2d');
    } else {
      this.ctx = null;
    }
  }

  public showBanner(msg: string, durationSec: number = 2.5) {
    this.bannerMessage = translate(msg, this.language);
    this.bannerTimer = durationSec;
    this.notifyHUD();
  }

  public start(autostart: boolean = false) {
    this.bindInputs();
    if (autostart) {
      this.startGame();
    } else {
      this.screen = 'intro';
      document.body.dataset.state = 'intro';
      this.notifyHUD();
    }
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public openLobby() {
    this.loadingFromMenu = this.screen === 'intro';
    this.pendingLevel = null;
    this.screen = 'loading';
    this.heldKeys.clear();
    document.body.dataset.state = 'loading';
    this.notifyHUD();
  }

  public finishLoading() {
    if (this.screen !== 'loading') return;
    const next = this.pendingLevel;
    if (!next) { this.goToLobby(); return; }
    this.revealLoadedLevel();
    this.pendingLevel = null;
    this.beginLevel();
    next.after?.();
  }

  /**
   * Called as the loading screen starts to fade: builds the pending level and lets the canvas
   * draw it, so the fade uncovers the level instead of the previous screen. Play (update,
   * input, voice) only starts in finishLoading.
   */
  public revealLoadedLevel() {
    const next = this.pendingLevel;
    if (this.screen !== 'loading' || !next || next.built) return;
    this.currentLevelIdx = next.idx;
    this.buildLevel();
    next.built = true;
  }

  /** Enters level `idx`, through the loading screen when the UI has one (see levelLoading). */
  private enterLevel(idx: number, after?: () => void) {
    if (!this.levelLoading) { this.currentLevelIdx = idx; this.restartLevel(); after?.(); return; }
    if (this.screen === 'loading') return;   // already on its way to a level
    this.loadingFromMenu = this.screen === 'intro';   // Continue on the main menu
    voice.stopAll();
    this.pendingLevel = { idx, built: false, after };
    this.screen = 'loading';
    this.heldKeys.clear();
    document.body.dataset.state = 'loading';
    this.notifyHUD();
  }

  public goToLobby() {
    this.activeEchoRunes.clear();
    voice.stopAll();
    this.screen = 'lobby';
    this.heldKeys.clear();
    document.body.dataset.state = 'lobby';
    this.notifyHUD();
  }
  /** Back to the painted title menu (from the lobby and its sub-screens). Progress is kept. */
  public goToMainMenu() {
    if (this.screen !== 'lobby' && this.screen !== 'shop' && this.screen !== 'characters') return;
    voice.stopAll();
    this.screen = 'intro';
    this.heldKeys.clear();
    document.body.dataset.state = 'intro';
    this.notifyHUD();
  }
  public openShop() { if (this.screen !== 'lobby') return; this.screen = 'shop'; document.body.dataset.state = 'shop'; this.notifyHUD(); }
  public openCharacters() { if (this.screen !== 'lobby') return; this.screen = 'characters'; document.body.dataset.state = 'characters'; this.notifyHUD(); }
  public buyTimeItem() { if (this.screen !== 'shop') return; if (this.campaign.buyTimeItem()) this.showBanner('Time potion purchased'); else this.showBanner('Not enough coins'); this.notifyHUD(); }
  public buyLimitRing() { if (this.screen !== 'shop') return; if (this.campaign.buyLimitRing()) this.showBanner(this.language==='vi'?'Đã mua nhẫn tăng giới hạn.':'Limit ring purchased.'); else this.showBanner(this.language==='vi'?'Không đủ xu.':'Not enough coins.'); this.notifyHUD(); }
  public useLimitRing() {
    if (this.screen !== 'playing' || this.guides.blocking || this.exitTravelRemaining>0 || this.bossDeathPending || (this.boss && this.boss.hp<=0) || !this.campaign.useLimitRing()) return false;
    if (!this.limitRingActive) { this.limitRingActive=true; this.echoCharges+=2; }
    this.showBanner(this.language==='vi'?'Nhẫn đã dùng · Giới hạn 6 Echo trong màn này.':'Ring used · Echo limit is 6 for this level.');
    this.notifyHUD(); return true;
  }
  public selectClass(value: CharacterClass) { if (this.screen !== 'lobby' && this.screen !== 'characters') return; if(value === 'mechanical' && (!MECHANICAL_ENABLED || !this.campaign.mechanicalOwned)) return; this.characterClass = value; this.saveSettings(); this.notifyHUD(); }
  public get weapon(): 'staff' | 'sword' { return this.characterClass === 'mage' ? 'staff' : 'sword'; }
  public useTimeItem() { if (this.screen !== 'playing' || this.legTimeRemaining === null || this.timeItemUsedThisLeg || !this.campaign.useTimeItem()) return false; this.timeItemUsedThisLeg = true; this.legTimeRemaining += 2; this.showBanner('+2s · Time potion used'); this.notifyHUD(); return true; }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.unbindInputs();
  }

  public startGame() {
    if(this.campaign.pendingRuneChoices.length){this.goToLobby();return;}
    this.campaign.reset();
    this.currentLevelIdx = 0;
    this.screen = 'playing';
    document.body.dataset.state = 'playing';
    this.restartLevel();
  }

  public continueGame() {
    if(this.campaign.pendingRuneChoices.length){this.goToLobby();return;}
    if (this.campaign.bossDefeated) { this.goToLobby(); return; }
    if (this.campaign.canForge) {
      this.currentLevelIdx = 4;
      this.restartLevel();
      this.nextLevel();
    } else this.selectLevel(this.campaign.unlockedLevel);
  }

  public pauseGame() {
    if (this.screen === 'playing' && !this.bossDeathPending) {
      this.screen = 'paused';
      document.body.dataset.state = 'paused';
      this.notifyHUD();
    }
  }

  public resumeGame() {
    if (this.screen === 'paused') {
      this.screen = 'playing';
      document.body.dataset.state = 'playing';
      this.notifyHUD();
    }
  }

  /** Restarts the current level at once (restart, retry after defeat: already loaded). */
  public restartLevel() {
    if(this.campaign.pendingRuneChoices.length){this.goToLobby();return;}
    this.buildLevel();
    this.beginLevel();
  }

  /** Fresh state for the current level, without starting play. */
  private buildLevel() {
    this.heldKeys.clear();
    this.renderer.reset();
    this.currentLevel = this.cloneLevel(LEVELS[this.currentLevelIdx]);
    this.initPlayer();
    this.echoes = [];
    this.selectedEcho=0;
    this.echoCharges = 3;
    this.limitRingActive = false;
    this.echoFreeSummon = true;
    this.dissonanceSeconds = 0;
    this.swapCooldown = 0;
    this.echoGrace = 0;
    this.pingTarget = null;
    this.recorder.clear();
    this.elapsedLevelTime = 0;
    this.legTimeRemaining = !this.devUnlocked && this.currentLevel.id <= 5 ? puzzleBalance(this.currentLevel.id).legSeconds : null;
    this.timePickup = null;
    this.pickupSpawnTimer = puzzleBalance(this.currentLevel.id).shardInterval;
    this.shardClaimedThisLeg = false; this.timeItemUsedThisLeg = false;
    this.trappedTime = 0;
    this.checkpointIndex = 0;
    this.slowed = false;
    this.defeatReason = 'damage';
    this.health = 5;
    this.invulnerability = this.attackCooldown = this.attackFlash = this.dodgeCooldown = this.dodgeTime = 0;
    this.combatHits = [];
    this.summonEffects = []; this.exitTravelRemaining = 0; this.exitOpenedAt = null;
    this.boss = this.currentLevel.id === 6 ? createBoss() : null;
    this.enemies=createEnemies(this.currentLevel);
    this.magicShots = [];
    this.combo?.cancel(); this.comboShots = []; this.comboFx = []; this.damageTexts = []; this.lunge.time = 0;
    preloadComboSprites();
    this.orbitOrbs = []; this.lightCircle = null; this.overdrive = 0;
    this.skillDrop = null; this.skillDropTimer = 5;
    this.stoneShield = this.armorShield = this.hasteTime = this.fireBurnTime = this.fireBurnTick = 0;
    this.combatFlash = null;
    this.skillCooldown = 0;
    this.lastRating = null;
    this.bossDeathElapsed = 0;
    this.bossDeathPending = false;
    this.lastReward = null;this.lastRuneReward=null;this.activeEchoRunes.clear();
  }

  private beginLevel() {
    this.screen = 'playing';
    document.body.dataset.state = 'playing';
    this.showBanner(`Bắt đầu lại ${this.currentLevel.name}`);
    if(this.tutorialEnabled)this.guides.offer(this.currentLevel.id===6?'shield':'echo');
    if(this.currentLevel.id<=5)this.showBanner(this.language==='vi'?PUZZLE_HINTS[this.currentLevel.id-1]:this.currentLevel.description,6);
    this.voiceLevelStart();
    this.notifyHUD();
  }

  /** Opening line for a level: the boss taunts in the arena; heroes speak on first entry only. */
  private voiceLevelStart() {
    voice.stopAll();
    void voice.preload(this.voiceRole);
    if (this.boss) {
      // The Guardian laughs at the intruders, then the hero answers with a battle cry.
      void voice.preload('guardian');
      voice.say('guardian', 'intro', { delay: 0.6 });
      voice.say(this.voiceRole, 'combatStart', { delay: 4.4 });
    } else if (this.lastVoicedLevel !== this.currentLevel.id) voice.say(this.voiceRole, 'dialogue', { delay: 0.5 });
    this.lastVoicedLevel = this.currentLevel.id;
    this.idleTime = 0; this.lastBossPhase = 1; this.lastBossMode = ''; this.bossLowVoiced = false; this.pendingUltimate = null;
  }

  public nextLevel() {
    if(this.campaign.pendingRuneChoices.length)return;
    if (this.currentLevel.id === 5) {
      voice.say('narrator', 'dialogue', { id: 'forge', delay: 0.4 });
      this.screen = 'forge';
      this.heldKeys.clear();
      document.body.dataset.state = 'forge';
      this.notifyHUD();
      return;
    }
    if (this.currentLevelIdx + 1 < LEVELS.length) {
      this.enterLevel(this.currentLevelIdx + 1, () => {
        this.showBanner(`${this.currentLevel.name}: ${this.currentLevel.subtitle}`);
        this.notifyHUD();
      });
    } else {
      // The final completion action starts a fresh run.
      this.campaign.reset();
      this.enterLevel(0);
    }
  }

  public selectLevel(idx: number) {
    if(this.campaign.pendingRuneChoices.length){this.goToLobby();return;}
    const campaignComplete = this.campaign.bossDefeated;
    if (!this.devUnlocked && !campaignComplete && (idx > this.campaign.unlockedLevel || (idx === 5 && !this.campaign.forged))) return;
    if (idx >= 0 && idx < LEVELS.length) this.enterLevel(idx);
  }

  public goToTitle() { this.goToLobby(); }

  public toggleAudio() { sounds.toggleMute(); this.saveSettings(); this.notifyHUD(); }
  public setVolume(value: number) { sounds.setVolume(value); this.saveSettings(); this.notifyHUD(); }
  public setVoiceVolume(value: number) { sounds.setVoiceVolume(value); this.saveSettings(); this.notifyHUD(); }
  public setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    if (typeof document !== 'undefined') document.body.classList.toggle('reduced-motion', value);
    this.saveSettings(); this.notifyHUD();
  }
  public setShowHints(value: boolean) { this.showHints = value; this.saveSettings(); this.notifyHUD(); }
  public setLanguage(value: Language) { this.language = value; setCurrentLanguage(value); voice.lang = value; if (typeof document !== 'undefined') document.title = value === 'vi' ? 'SECOND ME — Lò rèn lửa' : 'SECOND ME — The Emberforge'; this.saveSettings(); this.notifyHUD(); }

  public unlockDevMode() {
    this.devUnlocked = true;
    this.legTimeRemaining = null;
    this.campaign.completed = [1,2,3,4,5];
    this.campaign.forged = true;
    this.campaign.mechanicalOwned = true;
    this.campaign.coins = 99999;
    this.campaign.timeItems = 99999;
    this.campaign.save();
    this.notifyHUD();
  }

  public forgeWeapon() {
    if (this.screen !== 'forge' || !this.campaign.forge()) return;
    sounds.playVictory();
    this.notifyHUD();
  }

  public enterBoss() {
    if (this.screen !== 'forge' || !this.campaign.forged) return;
    this.enterLevel(5);
  }

  private finishBossHit() {
    if (!this.boss) return;
    this.renderer.emitMagic('sparkle', this.boss.x, this.boss.y, 80);
    sounds.playPlateActivate();
    if (this.boss.hp <= 0) {
      this.lastRating = this.campaign.completeLevel(this.currentLevel.id, this.elapsedLevelTime);
      this.campaign.bossDefeated = true;
      this.campaign.save();
      this.bossDeathPending = true;
      this.bossDeathElapsed = 0;
      this.heldKeys.clear();
      sounds.playVictory();
      voice.say('guardian', 'defeat');
      voice.say(this.voiceRole, 'victory', { delay: 2.4 });
    } else voice.say('guardian', 'damage', { chance: 0.25, cooldown: 7 });
    this.notifyHUD();
  }

  private combatAim() {
    const enemy=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-this.player.x,e.y-this.player.y)<450&&!getActiveObstacles(this.currentLevel.walls,this.currentLevel.doors).some(w=>segmentWall(this.player,e,w,0)!==null)).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];
    if(enemy)return {x:enemy.x,y:enemy.y};
    const pillar = this.boss?.pillars.filter(p=>p.hp>0).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];
    return pillar ? {x:pillar.x,y:pillar.y} : this.boss ? {x:this.boss.x,y:this.boss.y} : null;
  }

  private damageCombatTarget(x:number,y:number,amount:number,radius=65) {
    const enemy=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<=radius).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
    if(enemy) return this.strike(enemy, amount);
    if (!this.boss || this.bossDeathPending || this.boss.hp<=0) return false;
    const pillar=this.boss.pillars.find(p=>p.hp>0 && Math.hypot(p.x-x,p.y-y)<=radius);
    if(pillar) return this.strike(pillar, amount);
    if(Math.hypot(this.boss.x-x,this.boss.y-y)>radius) return false;
    return this.strike(this.boss, amount);
  }

  /**
   * The game's one damage rule, for every hit: Light Sanctuary adds 20%; an enemy or a pillar
   * takes the damage, the boss takes it only once every pillar is down. Shows the damage number.
   */
  private strike(target: CombatTarget, amount: number, heavy = false): boolean {
    if (this.enemies.includes(target as Enemy)) {
      const enemy = target as Enemy;
      if (enemy.hp <= 0) return false;
      if(this.insideLightCircle)amount*=1.2;const dealt=Math.min(enemy.hp,amount);enemy.hp=Math.max(0,enemy.hp-amount);enemy.hitFlash=.18;
      this.combatHits.push({x:enemy.x,y:enemy.y-30,damage:Math.round(dealt*10)/10,life:.7,broken:enemy.hp===0});this.combatHits=this.combatHits.slice(-24);
      this.renderer.emitMagic('sparkle',enemy.x,enemy.y,heavy?48:24);sounds.playIceHit(false);
      if(enemy.hp===0){enemy.deathAge=0;if(this.legTimeRemaining!==null)this.legTimeRemaining=Math.min(puzzleBalance(this.currentLevel.id).legSeconds,this.legTimeRemaining+3);this.echoCharges=Math.min(this.echoLimit-(this.echoFreeSummon?1:0),this.echoCharges+1);this.showBanner(this.language==='vi'?'Hạ quái · +3 giây · +1 lượt Echo':'Enemy defeated · +3s · +1 Echo charge');}
      this.notifyHUD();return true;
    }
    if (!this.boss || this.bossDeathPending || this.boss.hp<=0) return false;
    if(this.insideLightCircle) amount *= 1.2;
    if(target !== this.boss) {
      const pillar = target as BossState['pillars'][number];
      const dealt = Math.min(pillar.hp, amount);
      pillar.hp=Math.max(0,pillar.hp-amount);
      pillar.hitFlash = .2;
      this.combatHits.push({ x: pillar.x, y: pillar.y - 20, damage: dealt, life: .7, broken: pillar.hp === 0 });
      this.combatHits = this.combatHits.slice(-24);
      sounds.playIceHit(pillar.hp === 0);
      this.boss.armor=this.boss.pillars.filter(p=>p.hp>0).length*25;
      this.renderer.emitMagic('sparkle',pillar.x,pillar.y,65);
      if(pillar.hp===0) {
        pillar.destroyedAge = 0;
        if (this.boss.armor === 0) {
          this.boss.shieldBreak = 1;
          this.boss.mode = 'recover'; this.boss.timer = 1.8;
          this.boss.burstCooldown = Math.max(2, this.boss.burstCooldown);
          this.boss.burstRemaining = 0; this.boss.burstAreas = []; this.boss.projectiles = [];
        }
        this.echoCharges=Math.min(this.echoLimit-(this.echoFreeSummon?1:0),this.echoCharges+1);
        voice.say(this.voiceRole, 'kill');
        if(this.boss.armor===0) voice.say('guardian', 'event', { id: 'armor', delay: 1.2 });
      }
      if(pillar.hp===0)this.showBanner(this.boss.armor===0
        ? (this.language==='vi'?'Bốn trụ đã bị phá · Boss mất giáp!':'All four pillars destroyed · Boss armor broken!')
        : (this.language==='vi'?`Đã phá trụ · Còn ${this.boss.armor/25} trụ`:`Pillar destroyed · ${this.boss.armor/25} remaining`));
      this.notifyHUD(); return true;
    }
    if(this.boss.pillars.some(p=>p.hp>0)) {
      this.renderer.emitMagic('sparkle',this.boss.x,this.boss.y,35);
      this.addDamageText(this.boss.x, this.boss.y - 60, 0, false, this.language==='vi'?'MIỄN':'IMMUNE');
      return false;
    }
    this.boss.hp=Math.max(0,this.boss.hp-amount);
    this.combatHits.push({ x: this.boss.x, y: this.boss.y - 35, damage: amount, life: .7, broken: false });
    this.combatHits = this.combatHits.slice(-24);
    sounds.playIceHit(false);
    this.boss.hitFlash=.18;
    this.finishBossHit(); return true;
  }

  private addDamageText(x: number, y: number, amount: number, heavy: boolean, label?: string) {
    const max = heavy ? 1.1 : 0.8;
    this.damageTexts.push({ x: x + (Math.random() - 0.5) * 14, y, text: label ?? String(Math.round(amount)), life: max, max, heavy, blocked: !!label });
    if (this.damageTexts.length > 24) this.damageTexts.shift();
  }

  /** Living targets with their hit radius: enemies, then the boss's pillars and the boss. */
  private combatTargets(): { t: CombatTarget; r: number }[] {
    const list: { t: CombatTarget; r: number }[] = this.enemies.filter(e => e.hp > 0).map(t => ({ t, r: ENEMY_R }));
    if (this.boss && !this.bossDeathPending && this.boss.hp > 0) {
      for (const p of this.boss.pillars) if (p.hp > 0) list.push({ t: p, r: PILLAR_R });
      list.push({ t: this.boss, r: BOSS_R });
    }
    return list;
  }

  /**
   * Strikes every target whose hit circle overlaps (x, y, radius) and that no wall hides from
   * the hero, nearest first, at most `max` of them, each at most once per hit (`group` holds
   * those already struck).
   */
  private damageArea(x: number, y: number, radius: number, amount: number, group: Set<object>, max: number, heavy = false) {
    const walls = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
    const near = this.combatTargets()
      .map(({ t, r }) => ({ t, r, d: Math.hypot(t.x - x, t.y - y) }))
      .filter(({ t, r, d }) => d <= radius + r && !walls.some(w => segmentWall(this.player, t, w) !== null));
    near.sort((a, b) => a.d - b.d);
    let hits = 0;
    for (const { t } of near) {
      if (hits >= max) break;
      if (group.has(t)) continue;
      group.add(t);
      this.strike(t, amount, heavy);
      this.renderer.emitMagic('sparkle', t.x, t.y, heavy ? 70 : 40);
      hits++;
    }
    return hits;
  }

  private updateMagicShots(dt:number) {
    const walls=getActiveObstacles(this.currentLevel.walls,this.currentLevel.doors);
    this.magicShots=this.magicShots.filter(shot=>{
      const duration=shot.duration??.3, before=Math.min(1,shot.age/duration);
      shot.age+=dt;const after=Math.min(1,shot.age/duration);
      const point=(t:number)=>({x:shot.x+(shot.targetX-shot.x)*t,y:shot.y+(shot.targetY-shot.y)*t});
      const a=point(before),b=point(after);
      let first=Infinity;
      for(const wall of walls){const t=segmentWall(a,b,wall);if(t!==null)first=Math.min(first,t);}
      let hit:{x:number;y:number}|undefined;
      for(const target of [...this.enemies.filter(e=>e.hp>0),...(this.boss?[...this.boss.pillars.filter(p=>p.hp>0),this.boss]:[])]) {
        const t=segmentCircle(a,b,target,target===this.boss?40:26);
        if(t!==null&&t<first){first=t;hit=target;}
      }
      if(hit)this.damageCombatTarget(hit.x,hit.y,shot.skill?40:15,10);
      return first===Infinity&&shot.age<duration;
    });
  }

  private spawnCombatSkill() {
    if(!this.boss||this.skillDrop)return;
    const skills=CLASS_SKILLS[this.characterClass];
    const kind=skills[Math.floor(Math.random()*skills.length)];
    const angle=Math.random()*Math.PI*2;
    const x=Math.max(80,Math.min(1200,this.player.x+Math.cos(angle)*105));
    const y=Math.max(85,Math.min(630,this.player.y+Math.sin(angle)*105));
    this.skillDrop={kind,x,y,fall:0};
    this.showBanner(this.language==='vi'?'Ấn kỹ năng đã xuất hiện trên mặt đất.':'A skill rune has appeared on the ground.');
  }

  private collectCombatSkill(kind:CombatSkill) {
    const aim=this.combatAim();
    const names:Record<CombatSkill,[string,string]>={
      fire:['Fire bolt: 35 damage + burn','Đạn lửa: 35 sát thương + đốt'],
      lightning:['Lightning: 50 damage','Tia sét: 50 sát thương'],
      stone:['Stone shield: block 2 hits','Khiên đá: chặn 2 đòn'],
      haste:['Haste: attack twice as fast for 6s','Tăng tốc chém gấp đôi trong 6 giây'],
      armor:['Armor: block 1 hit','Giáp: chặn 1 đòn'],
      wave:['Sword wave: 55 damage','Kiếm quang: 55 sát thương'],
    };
    this.showBanner(names[kind][this.language==='vi'?1:0],3);
    this.combatFlash={x:this.player.x,y:this.player.y,kind,time:.65};
    if(kind==='stone')this.stoneShield=2;
    else if(kind==='armor')this.armorShield=1;
    else if(kind==='haste')this.hasteTime=6;
    else if(aim) {
      if(kind==='lightning' || kind==='wave') {
        // Ultimate: shout the build-up, and release the hit on the skill name.
        const length = voice.lengthOf(this.voiceRole, kind);
        const said = voice.say(this.voiceRole, 'ultimate', { id: kind });
        const hold = said && length ? Math.min(1.6, Math.max(0, length - 0.45)) : 0;
        if(hold > 0) { this.pendingUltimate = { kind, time: hold }; this.combatFlash={x:this.player.x,y:this.player.y,kind,time:hold+.2}; this.notifyHUD(); return; }
      } else voice.say(this.voiceRole, 'skill', { id: kind });
      this.releaseCombatSkill(kind);
      return;
    }
    if(kind==='stone' || kind==='armor' || kind==='haste') voice.say(this.voiceRole, 'skill', { id: kind });
    this.notifyHUD();
  }

  private releaseCombatSkill(kind:CombatSkill) {
    const aim=this.combatAim();
    if(!aim) return;
    const damage=kind==='fire'?35:kind==='lightning'?50:55;
    if(this.damageCombatTarget(aim.x,aim.y,damage,65) && kind==='fire' && this.boss?.armor===0) { this.fireBurnTime=3; this.fireBurnTick=1; }
    this.combatFlash={x:aim.x,y:aim.y,kind,time:.65};
    this.notifyHUD();
  }

  private comboHero(): ComboHero | null {
    return this.characterClass === 'swordsman' || this.characterClass === 'mage' ? this.characterClass : null;
  }

  /** The combo for the current hero (a new one when the hero changes). */
  private comboFor(): Combo | null {
    const hero = this.comboHero();
    if (!hero) { this.combo = null; return null; }
    if (!this.combo || this.combo.hits !== COMBO_HITS[hero]) this.combo = new Combo(COMBO_HITS[hero]);
    return this.combo;
  }

  /** Haste (Kael's pickup) and Overdrive play the combo twice as fast, as they did the old swing. */
  private get comboSpeed() { return this.hasteTime > 0 || this.overdrive > 0 ? 2 : 1; }

  public attack(target?: { x: number; y: number }) {
    if (this.screen !== 'playing' || this.bossDeathPending || this.exitTravelRemaining > 0) return;
    const combo = this.comboFor();
    if (combo) {
      if (this.dodgeTime > 0) return;                   // mid-dodge: no attack
      this.comboAim = target ?? this.combatAim() ?? {
        x: this.player.x + (this.player.direction === 'left' ? -180 : this.player.direction === 'right' ? 180 : 0),
        y: this.player.y + (this.player.direction === 'up' ? -180 : this.player.direction === 'down' ? 180 : 0) };
      const step = combo.press();
      if (step >= 0) this.startComboHit(step);
      this.notifyHUD();
      return;
    }
    if (this.attackCooldown > 0) return;
    this.attackCooldown = this.hasteTime>0 || this.overdrive>0 ? .27 : .55;
    const recordedAim = target ?? this.combatAim() ?? { x: this.player.x + (this.player.direction === 'left' ? -180 : this.player.direction === 'right' ? 180 : 0), y: this.player.y + (this.player.direction === 'up' ? -180 : this.player.direction === 'down' ? 180 : 0) };
    this.attackAngle = Math.atan2(recordedAim.y - this.player.y, recordedAim.x - this.player.x);
    const dx=recordedAim.x-this.player.x,dy=recordedAim.y-this.player.y;
    if(Math.hypot(dx,dy)>1)this.player.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    this.recorder.recordEvent({kind:'attack',x:this.player.x,y:this.player.y,targetX:recordedAim.x,targetY:recordedAim.y});
    voice.say(this.voiceRole, 'attack');
    if (this.characterClass === 'mage') {
      const origin={x:this.player.x+(this.player.direction==='left'?-20:20),y:this.player.y-24};
      const dx=recordedAim.x-origin.x,dy=recordedAim.y-origin.y,reach=Math.hypot(dx,dy),scale=Math.min(1,450/Math.max(1,reach));
      const targetX=origin.x+dx*scale,targetY=origin.y+dy*scale;
      this.magicShots.push({...origin,targetX,targetY,age:0,skill:false,duration:Math.max(.08,Math.hypot(targetX-origin.x,targetY-origin.y)/900)});
      this.attackFlash=.16;
    } else {
      this.attackFlash = 0.22;
      const candidates=[...this.enemies.filter(e=>e.hp>0),...(this.boss?[...this.boss.pillars.filter(p=>p.hp>0),this.boss]:[])];
      const hit=candidates.filter(p=>{
        const dx=p.x-this.player.x,dy=p.y-this.player.y,distance=Math.hypot(dx,dy);
        const angle=Math.atan2(dy,dx)-this.attackAngle;
        return distance<=112&&Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=Math.PI/2.5;
      }).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];
      if(hit&&!getActiveObstacles(this.currentLevel.walls,this.currentLevel.doors).some(w=>segmentWall(this.player,hit,w)!==null))
        this.damageCombatTarget(hit.x,hit.y,this.currentLevel.plates.some(p=>p.isPressed)?24:15,10);
    }
    this.notifyHUD();
  }

  /** A combo hit begins: record it for the Echo, voice it, start Kael's finisher dash. */
  private startComboHit(step: number) {
    const hero = this.comboHero();
    if (!hero) return;
    const hit = COMBO_HITS[hero][step];
    this.recorder.recordEvent({kind:'attack',x:this.player.x,y:this.player.y,targetX:this.comboAim.x,targetY:this.comboAim.y});
    voice.say(this.voiceRole, 'attack');
    this.attackCooldown = hitDuration(hit) / this.comboSpeed;      // the HUD's "recovering" hint
    const dx = this.comboAim.x - this.player.x, dy = this.comboAim.y - this.player.y, d = Math.hypot(dx, dy) || 1;
    if (hero === 'swordsman' && hit.heavy) {
      // Dash over the finisher's dash frames (1-2), toward the target but not into it.
      const reach = Math.min(FINISHER_DASH, Math.max(0, d - 60));
      const t = hit.frameTime * 2;
      this.lunge = { time: t, vx: dx / d * reach / t, vy: dy / d * reach / t };
    }
    if (hero === 'mage' && hit.heavy) this.comboFx.push({ kind: 'charge', x: this.player.x, y: this.player.y + 6, angle: 0, radius: 70, life: hitDuration(hit) * 0.6, max: hitDuration(hit) * 0.6 });
  }

  /** A combo hit's hit frame: the one moment it deals damage. */
  private landComboHit(step: number) {
    const hero = this.comboHero();
    if (!hero) return;
    const hit = COMBO_HITS[hero][step];
    const empowered = hero === 'swordsman' && this.currentLevel.plates.some(p => p.isPressed);
    const amount = comboDamage(hero, step, empowered);
    const px = this.player.x, py = this.player.y - 18;             // body centre
    const angle = Math.atan2(this.comboAim.y - py, this.comboAim.x - px);
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const group = new Set<object>();                               // targets this hit has struck
    if (hero === 'swordsman') {
      const sw = KAEL_SWINGS[step];
      const cx = px + ux * sw.reach, cy = py + uy * sw.reach;
      this.damageArea(cx, cy, sw.radius, amount, group, sw.max, !!hit.heavy);
      if (step === 2) this.comboFx.push({ kind: 'spin', x: px, y: py + 8, angle, radius: sw.radius, life: 0.3, max: 0.3 });
      else this.comboFx.push({ kind: 'arc', x: px + ux * 18, y: py + uy * 18, angle, radius: sw.radius * 0.75, life: 0.22, max: 0.22, heavy: hit.heavy, flip: step === 1 });
      if (hit.heavy) { this.comboFx.push({ kind: 'impact', x: cx, y: cy, angle, radius: 46, life: 0.35, max: 0.35 }); sounds.playPlateActivate(); }
    } else {
      const shot = (a: number, speed: number, radius: number, pierce: boolean, fromX = px + Math.cos(a) * 18, fromY = py - 4 + Math.sin(a) * 18) =>
        this.comboShots.push({ x: fromX, y: fromY, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 460 / speed, radius, amount, heavy: false, pierce, group });
      if (step === 0) shot(angle, 560, 8, false);
      else if (step === 1) for (const off of [-0.24, 0, 0.24]) shot(angle + off, 600, 7, false);
      else if (step === 2) {
        // Three orbs set off from their places on the orbit, each through whatever it meets.
        for (let i = 0; i < 3; i++) {
          const oa = angle + i * Math.PI * 2 / 3;
          const ox = px + Math.cos(oa) * 34, oy = py + Math.sin(oa) * 24;
          const tx = this.comboAim.x + Math.cos(oa) * 22, ty = this.comboAim.y + Math.sin(oa) * 22;
          shot(Math.atan2(ty - oy, tx - ox), 470, 9, true, ox, oy);
        }
      } else {
        this.damageArea(px, py + 8, 150, amount, group, Infinity, true);
        this.comboFx.push({ kind: 'nova', x: px, y: py + 8, angle: 0, radius: 150, life: 0.45, max: 0.45 });
        sounds.playPlateActivate();
      }
    }
    this.notifyHUD();
  }

  /** Moves spells, Kael's dash, effects and numbers; runs the combo's clock. */
  private updateCombo(dt: number) {
    this.combo?.update(dt * this.comboSpeed, s => this.startComboHit(s), s => this.landComboHit(s));
    if (this.lunge.time > 0) {
      const step = Math.min(dt, this.lunge.time);
      this.lunge.time -= step;
      const obstacles = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
      const r = resolveMovement(this.player.x, this.player.y, this.player.x + this.lunge.vx * step, this.player.y + this.lunge.vy * step, 24, 24, obstacles);
      this.player.x = r.x; this.player.y = r.y;
    }
    // Spells sweep their path each frame, so they cannot skip a target or pass through a wall.
    const walls = this.comboShots.length ? getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors) : [];
    for (const shot of this.comboShots) {
      const a = { x: shot.x, y: shot.y }, b = { x: shot.x + shot.vx * dt, y: shot.y + shot.vy * dt };
      shot.x = b.x; shot.y = b.y; shot.life -= dt;
      let wallAt = Infinity;
      for (const w of walls) { const t = segmentWall(a, b, w); if (t !== null) wallAt = Math.min(wallAt, t); }
      const hits = this.combatTargets()
        .filter(({ t }) => !shot.group.has(t))
        .map(({ t, r }) => ({ t, at: segmentCircle(a, b, t, r + shot.radius) }))
        .filter((h): h is { t: CombatTarget; at: number } => h.at !== null && h.at < wallAt)
        .sort((p, q) => p.at - q.at);
      for (const { t, at } of hits) {
        shot.group.add(t);
        this.strike(t, shot.amount, shot.heavy);
        this.renderer.emitMagic('sparkle', a.x + (b.x - a.x) * at, a.y + (b.y - a.y) * at, 36);
        if (!shot.pierce) { shot.life = 0; break; }
      }
      if (wallAt < Infinity && shot.life > 0) {
        shot.life = 0;
        this.renderer.emitMagic('sparkle', a.x + (b.x - a.x) * wallAt, a.y + (b.y - a.y) * wallAt, 14);
      }
    }
    this.comboShots = this.comboShots.filter(s => s.life > 0);
    for (const fx of this.comboFx) fx.life -= dt;
    this.comboFx = this.comboFx.filter(f => f.life > 0);
    for (const t of this.damageTexts) t.life -= dt;
    this.damageTexts = this.damageTexts.filter(t => t.life > 0);
  }

  public useSkill(_target?: { x: number; y: number }) {
    if (this.screen !== 'playing' || this.bossDeathPending || this.exitTravelRemaining > 0 || this.skillCooldown > 0) return;
    if (this.characterClass === 'mage') {
      if(this.orbitOrbs.length >= 3) return;
      const aim = _target ?? this.combatAim() ?? this.player;
      this.recorder.recordEvent({kind:'skill',x:this.player.x,y:this.player.y,targetX:aim.x,targetY:aim.y});
      this.orbitOrbs.push({angle: this.orbitOrbs.length*Math.PI*2/3, life:6, tick:0});
      this.skillCooldown = 1;
    } else if(this.characterClass === 'swordsman') {
      this.recorder.recordEvent({kind:'skill',x:this.player.x,y:this.player.y,targetX:this.player.x,targetY:this.player.y});
      this.lightCircle = {x:this.player.x,y:this.player.y,life:5,heal:0};
      this.skillCooldown = 9;
    } else {
      this.overdrive = 5;
      this.recorder.recordEvent({kind:'skill',x:this.player.x,y:this.player.y,targetX:this.player.x,targetY:this.player.y});
      this.skillCooldown = 10;
    }
    // Shout the real skill name: Storm Orbs / Light Sanctuary; Rivet's Overdrive is its ultimate.
    if (this.characterClass === 'mage') voice.say('aeris', 'skill', { id: 'orbs' });
    else if (this.characterClass === 'swordsman') voice.say('kael', 'skill', { id: 'sanctuary' });
    else voice.say('rivet', 'ultimate', { id: 'overdrive' });
    this.notifyHUD();
  }

  private updatePersonalSkill(dt:number) {
    this.overdrive = Math.max(0,this.overdrive-dt);
    for(const orb of this.orbitOrbs) {
      orb.life-=dt; orb.angle+=dt*3; orb.tick-=dt;
      if(orb.life>0 && orb.tick<=0) {
        orb.tick=.5;
        this.damageCombatTarget(this.player.x+Math.cos(orb.angle)*36,this.player.y-12+Math.sin(orb.angle)*28,4,22);
      }
    }
    this.orbitOrbs=this.orbitOrbs.filter(o=>o.life>0);
    if(this.lightCircle) {
      this.lightCircle.life-=dt;
      if(this.lightCircle.life<=0) this.lightCircle=null;
      else if(this.insideLightCircle) {
        this.lightCircle.heal+=dt;
        if(this.lightCircle.heal>=2) {this.lightCircle.heal-=2;this.health=Math.min(5,this.health+1);this.notifyHUD();}
      }
    }
  }

  public dodge() {
    if (this.screen !== 'playing' || (!this.boss&&!this.enemies.some(e=>e.hp>0)) || this.dodgeCooldown > 0) return;
    this.combo?.cancel(); this.lunge.time = 0;           // a dodge breaks the combo
    this.dodgeTime = 0.16;
    this.dodgeCooldown = 1.2;
    this.invulnerability = Math.max(this.invulnerability, 0.4);
    voice.say(this.voiceRole, 'dodge');
  }

  private takeDamage() {
    if (this.invulnerability > 0) return;
    if(this.stoneShield>0) { this.stoneShield--; this.invulnerability=.3; this.notifyHUD(); return; }
    if(this.armorShield>0) { this.armorShield--; this.invulnerability=.3; this.notifyHUD(); return; }
    this.health = Math.max(0, this.health - 1);
    this.invulnerability = 1.3;
    this.combo?.cancel(); this.lunge.time = 0;           // staggered: the combo is lost
    this.renderer.particles.emit(this.player.x, this.player.y, 18, '#fb7185', 75, 4, 0.6);
    if (this.health === 0) {
      this.defeatReason = 'damage';
      this.screen = 'defeat'; this.heldKeys.clear(); document.body.dataset.state = 'gameover';
      voice.say(this.voiceRole, 'defeat');
      if (this.boss) voice.say('guardian', 'victory', { delay: 2.2 });
    } else if (this.health <= 2) voice.say(this.voiceRole, 'lowHealth'); // breathless, not just another grunt
    else voice.say(this.voiceRole, 'damage');
    this.notifyHUD();
  }

  private spawnTimePickup() {
    const obstacles = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 45 + Math.random() * 65;
      const x = Math.max(55, Math.min(1225, this.player.x + Math.cos(angle) * distance));
      const y = Math.max(55, Math.min(665, this.player.y + Math.sin(angle) * distance));
      const box = getCharacterBoundingBox(x, y, 24, 24);
      if (obstacles.some(obstacle => rectIntersects(box, obstacle))) continue;
      if ((this.currentLevel.traps ?? []).some(trap => rectIntersects(box, trap))) continue;
      if (this.currentLevel.plates.some(plate => rectIntersects(box, plate))) continue;
      this.timePickup = { x, y };
      return;
    }
  }

  // --- Core Gameplay Actions ---

  public toggleRecording() {
    if (this.screen !== 'playing') return;

    if (this.recorder.getStatus() === 'recording') {
      this.recorder.stopRecording(
        this.player.x,
        this.player.y,
        this.player.direction,
        this.player.isMoving
      );
      sounds.playRecordStop();
      this.showBanner('Đã lưu đường đi! Nhấn E để gọi Echo.');
    } else {
      // Start recording
      this.recorder.startRecording(
        this.player.x,
        this.player.y,
        this.player.direction
      );
      sounds.playRecordStart();
      this.renderer.particles.emit(
        this.player.x,
        this.player.y,
        15,
        '#ef4444',
        50,
        3,
        0.5
      );
      this.showBanner(this.language==='vi'?'ĐANG GHI… Đi tới mục tiêu, rồi nhấn E lần nữa.':'RECORDING… Reach the target, then press E again.');
    }
    this.notifyHUD();
  }

  public spawnEcho() {
    if (this.screen !== 'playing') return;
    if(this.echoes.length>=this.echoLimit){this.showBanner(this.language==='vi'?`Tối đa ${this.echoLimit} Echo. Thu hồi một Echo trước khi gọi thêm.`:`Maximum ${this.echoLimit} Echoes. Recall one before summoning another.`);return;}

    // Summoning commits the endpoint before any subsequent player movement.
    if (this.recorder.stopRecording(
      this.player.x,
      this.player.y,
      this.player.direction,
      false
    )) {
      sounds.playRecordStop();
    }
    // An Echo owns its recording; a later recording cannot move its destination.
    const samples = this.recorder.getSamples().map(sample => ({ ...sample }));
    if (samples.length === 0) {
      this.showBanner(this.language==='vi'?'Chưa có bản ghi. Nhấn E để ghi đường đi trước.':'No recording yet. Press E to record a path.');
      return;
    }
    if (!this.echoFreeSummon && this.echoCharges <= 0) {
      this.showBanner(this.language==='vi'?'Hết lượt triệu hồi. Chạm ấn thạch để hồi.':'No Echo charges. Reach a rune to restore one.');
      return;
    }

    // Spawn or reset Echo
    const first = samples[0];
    const obstacles = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
    const safeEchoSpawn = resolveSpawnPosition(first.x, first.y, 24, 24, obstacles);
    if (this.echoFreeSummon) this.echoFreeSummon=false;
    else this.echoCharges--;

    this.selectedEcho=this.echoes.length;
    this.echo = {
      colorSlot:[0,1,2,3,4,5].find(slot=>!this.echoes.some(e=>e.colorSlot===slot))??0,
      x: safeEchoSpawn.x,
      y: safeEchoSpawn.y,
      direction: first.direction,
      isMoving: true,
      elapsedMs: 0,
      status: 'replaying',
      samples,
      events: this.recorder.getEvents().map(event=>({...event})),
      nextEvent: 0,
      stability: 100,
      aggroTime: this.currentLevel.id>=2 ? (this.activeEchoRunes.has('lure')?6:3) : undefined,
      attackTimer: 0,
      hitsTaken: 0,
      characterClass: this.characterClass,
    };

    sounds.playEchoSpawn();
    this.summonEffects.push({x:safeEchoSpawn.x,y:safeEchoSpawn.y,life:1});
    this.renderer.particles.emit(first.x, first.y, 25, '#22d3ee', 80, 4, 0.7);
    this.showBanner('Echo đã xuất hiện và đang phát lại đường đi.');
    this.notifyHUD();
  }

  public dismissEcho() {
    if (this.screen !== 'playing') return;
    const oldest = this.echoes[0];
    if (oldest) {
      const selected = this.echo;
      this.renderer.particles.emit(
        oldest.x,
        oldest.y,
        20,
        '#a855f7',
        60,
        3,
        0.5
      );
      sounds.playEchoDismiss();
      this.echoes.shift();
      this.selectedEcho = selected && selected !== oldest ? this.echoes.indexOf(selected) : 0;
      this.showBanner('Đã xóa Echo.');
      this.notifyHUD();
    }
  }

  public chooseRune(id:EchoRuneId):boolean {
    if(!['victory','lobby'].includes(this.screen)||!this.campaign.chooseRune(id))return false;
    this.lastRuneReward=id;this.notifyHUD();return true;
  }
  public canUseEchoRune(id:EchoRuneId):boolean {
    if(this.screen!=='playing'||this.currentLevel.id<2||(this.boss&&this.boss.hp<=0)||this.bossDeathPending||this.exitTravelRemaining>0||this.guides.blocking||!((this.campaign.echoRunes[id]??0)>0))return false;
    if(id==='call')return this.echoCharges+(this.echoFreeSummon?1:0)<this.echoLimit;
    if(id==='restore')return this.echoes.some(e=>(e.stability??100)<100);
    return !this.activeEchoRunes.has(id);
  }
  public useEchoRune(id:EchoRuneId):boolean {
    if(!ECHO_RUNES.some(r=>r.id===id)||!this.canUseEchoRune(id)||!this.campaign.spendRune(id))return false;
    if(id==='call')this.echoCharges=Math.min(this.echoLimit-(this.echoFreeSummon?1:0),this.echoCharges+1);
    else if(id==='restore')for(const echo of this.echoes)echo.stability=Math.min(100,(echo.stability??100)+50);
    else {this.activeEchoRunes.add(id);if(id==='lure')for(const echo of this.echoes)echo.aggroTime=Math.max(echo.aggroTime??0,6);}
    const rune=ECHO_RUNES.find(r=>r.id===id)!;
    this.showBanner(`${rune.glyph} ${this.language==='vi'?rune.vi:rune.en} · ${this.language==='vi'?'Đã dùng 1 ấn':'1 rune consumed'}`);
    this.notifyHUD();return true;
  }

  /** Each enemy attack counts as one hit, independently of the stability/swap meter. */
  private hitEcho(echo: NonNullable<GameEngine['echoShape']>, stabilityLoss: number) {
    if (!this.echoes.includes(echo)) return;
    echo.hitsTaken = (echo.hitsTaken ?? 0) + 1;
    echo.stability = Math.max(0, (echo.stability ?? 100) - stabilityLoss * (this.activeEchoRunes.has('guard') ? .65 : 1));
    if (echo.hitsTaken >= ECHO_MAX_HITS) {
      const selected = this.echo;
      this.echoes = this.echoes.filter(e => e !== echo);
      this.selectedEcho = Math.max(0, selected === echo ? Math.min(this.selectedEcho, this.echoes.length - 1) : this.echoes.indexOf(selected!));
      this.echoGrace = 2;
    }
  }

  /** Interrupt the recording while enemies are inside a fixed, invisible 3m combat leash. */
  private updateEchoCombat(echo: NonNullable<GameEngine['echoShape']>, dt: number): boolean {
    echo.attackFlash = Math.max(0, (echo.attackFlash ?? 0) - dt);
    echo.attackTimer = Math.max(0, (echo.attackTimer ?? 0) - dt);
    const anchor = echo.combatAnchor ?? {x: echo.x, y: echo.y};
    const walls = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
    const targets: (Enemy | BossState)[] = this.enemies.filter(e => e.hp > 0);
    if (this.boss && this.boss.hp > 0 && !this.bossDeathPending) targets.push(this.boss);
    const target = targets.filter(t => Math.hypot(t.x-anchor.x, t.y-anchor.y) <= ECHO_COMBAT_RADIUS && !walls.some(w => segmentWall(echo, t, w, 0) !== null))
      .sort((a,b) => Math.hypot(a.x-echo.x, a.y-echo.y) - Math.hypot(b.x-echo.x, b.y-echo.y))[0];
    if (!target && !echo.combatAnchor) return false;
    if (target && !echo.combatAnchor) echo.combatAnchor = anchor;
    const destination = target ?? anchor;
    const dx = destination.x-echo.x, dy = destination.y-echo.y, distance = Math.hypot(dx,dy);
    // Aeris can cast from range, which also helps her defend a rune without abandoning it.
    const reach = target ? (echo.characterClass === 'mage' ? 100 : target === this.boss ? 70 : 42) : 2;
    if (!target && distance <= reach) {
      echo.x = anchor.x; echo.y = anchor.y; echo.combatAnchor = undefined; echo.returnBlockedFor = 0;
      echo.isMoving = false;
      return false;
    }
    if (distance > reach) {
      const amount = Math.min(distance-reach, ECHO_COMBAT_SPEED * (this.activeEchoRunes.has('lure') ? 1.25 : 1) * dt);
      const x = echo.x + dx / distance * amount, y = echo.y + dy / distance * amount;
      const resolved = resolveMovement(echo.x, echo.y, x, y, 24, 24, walls);
      // Reject corner-assist nudges outside the original 3m circle.
      const inBounds = Math.hypot(resolved.x-anchor.x, resolved.y-anchor.y) <= ECHO_COMBAT_RADIUS + .001;
      const moved = inBounds && Math.hypot(resolved.x-echo.x, resolved.y-echo.y) > .01;
      if (moved) { echo.x=resolved.x; echo.y=resolved.y; echo.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'); }
      echo.isMoving = moved;
      echo.returnBlockedFor = !target && !moved ? (echo.returnBlockedFor ?? 0) + dt : 0;
      // A closing door can make the old anchor unreachable. Resume instead of freezing forever.
      if ((echo.returnBlockedFor ?? 0) >= 1) { echo.combatAnchor=undefined; echo.returnBlockedFor=0; }
    } else {
      echo.isMoving = false;
      if (target && echo.attackTimer <= 0) {
        echo.direction = Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
        echo.attackFlash = .22; echo.attackTarget = {x: target.x, y: target.y};
        this.strike(target, 15 * (this.activeEchoRunes.has('power') ? 1.3 : 1));
        this.renderer.emitMagic('sparkle', target.x, target.y, 40);
        echo.attackTimer = .65;
      }
    }
    return true;
  }

  private replayEchoEvent(event: EchoEvent) {
    if (!this.echo || (!this.boss&&!this.enemies.some(e=>e.hp>0))) return;
    const originX=this.echo.x, originY=this.echo.y;
    const angle=Math.atan2(event.targetY-event.y,event.targetX-event.x);
    const targets=[...this.enemies.filter(e=>e.hp>0),...(this.boss?[...this.boss.pillars.filter(p=>p.hp>0),...(this.boss.armor===0?[this.boss]:[])]:[])];
    const target=targets.filter(p=>Math.hypot(p.x-originX,p.y-originY)<(event.kind==='skill'?180:150))
      .map(p=>({p,offset:Math.abs(Math.atan2(Math.sin(Math.atan2(p.y-originY,p.x-originX)-angle),Math.cos(Math.atan2(p.y-originY,p.x-originX)-angle)))}))
      .filter(item=>item.offset<=(this.pingTarget&&Math.hypot(item.p.x-this.pingTarget.x,item.p.y-this.pingTarget.y)<45?Math.PI/6:Math.PI/9))
      .sort((a,b)=>(this.pingTarget?Math.hypot(a.p.x-this.pingTarget.x,a.p.y-this.pingTarget.y)-Math.hypot(b.p.x-this.pingTarget.x,b.p.y-this.pingTarget.y):a.offset-b.offset))[0]?.p;
    const x=target?.x??originX+Math.cos(angle)*120, y=target?.y??originY+Math.sin(angle)*120;
    this.damageCombatTarget(x,y,(event.kind==='skill'?15:10)*(this.activeEchoRunes.has('power')?1.3:1), event.kind==='skill'?75:65);
    this.renderer.emitMagic('sparkle',x,y,event.kind==='skill'?65:36);
  }

  public swapEcho() {
    if(this.screen!=='playing'||!this.echo||this.swapCooldown>0||(this.echo.stability??100)<30)return;
    const obstacles=getActiveObstacles(this.currentLevel.walls,this.currentLevel.doors);
    const dx=this.echo.x-this.player.x,dy=this.echo.y-this.player.y;
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
    for(let i=0;i<=steps;i++) {
      const box=getCharacterBoundingBox(this.player.x+dx*i/steps,this.player.y+dy*i/steps,24,24);
      if(obstacles.some(obstacle=>rectIntersects(box,obstacle))) {
        this.showBanner(this.language==='vi'?'Không thể hoán đổi xuyên tường hoặc cổng.':'Swap path is blocked.');return;
      }
    }
    const x=this.player.x,y=this.player.y;
    this.player.x=this.echo.x;this.player.y=this.echo.y;
    this.echo.x=x;this.echo.y=y;
    this.echo.samples=this.echo.samples.map(sample=>({...sample,x:sample.x-dx,y:sample.y-dy}));
    this.echo.combatAnchor=undefined; this.echo.returnBlockedFor=0;
    this.echo.stability=(this.echo.stability??100)-30;
    this.swapCooldown=7;this.invulnerability=Math.max(.2,this.invulnerability);
    this.notifyHUD();
  }

  // --- Input Handling ---

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default browser scroll on arrow keys / space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    // Movement is held in heldKeys; one-shot actions must run once per press.
    if (e.repeat) return;
    if(this.tutorialEnabled&&this.guides.blocking){
      if(e.code==='Escape'){if(this.guides.active)this.dismissGuide();else this.closeGuide();}
      return;
    }
    if (this.bossDeathPending) return;

    const key = e.key.toLowerCase();
    const code = e.code;

    if (key === 'y') {
      const now = performance.now();
      this.devKeyCount = now - this.lastDevKeyAt <= 2500 ? this.devKeyCount + 1 : 1;
      this.lastDevKeyAt = now;
      if (this.devKeyCount >= 4) { this.devKeyCount = 0; this.unlockDevMode(); }
      return;
    }

    if (this.screen === 'forge') {
      if (code === 'Enter') this.campaign.forged ? this.enterBoss() : this.forgeWeapon();
      return;
    }
    if (this.screen === 'ending') {
      if (code === 'Enter') this.startGame();
      return;
    }
    if (this.screen === 'defeat') {
      if (code === 'Enter' || code === 'KeyT') this.restartLevel();
      return;
    }

    // Title screen start
    if (this.screen === 'intro') {
      if (e.target instanceof HTMLElement && e.target.closest('button, input, select')) return;
      if (code === 'Enter' || code === 'Space') {
        this.openLobby();
      }
      return;
    }
    if (this.screen === 'loading') return;
    if (this.screen === 'shop' || this.screen === 'characters') { if (code === 'Escape') this.goToLobby(); return; }
    if (this.screen === 'lobby') return;

    // Victory screen start next
    if (this.screen === 'victory') {
      if (code === 'Enter' || code === 'Space') {
        this.nextLevel();
      }
      return;
    }

    // Pause toggle
    if (code === 'Escape' || key === 'p') {
      if (this.screen === 'playing') {
        this.pauseGame();
      } else if (this.screen === 'paused') {
        this.resumeGame();
      }
      return;
    }

    // Mute toggle
    if (key === 'm') {
      this.toggleAudio();
      return;
    }

    // Restart key [T]
    if (key === 't') {
      this.restartLevel();
      return;
    }

    // In playing state
    if (this.screen === 'playing') {
      if (/^(Digit|Numpad)[1-6]$/.test(code)) { this.selectEcho(Number(code.slice(-1)) - 1); return; }
      if (key === 'c') { this.pauseEcho(); return; }
      if (code === 'Space') { this.useSkill(); return; }
      if (code === 'ShiftLeft' || code === 'ShiftRight') { this.dodge(); return; }
      if (key === 'f') { this.useTimeItem(); return; }
      if (key === 'e') {
        this.toggleRecording();
      } else if (key === 'q') {
        if(e.shiftKey)this.swapEcho();else this.spawnEcho();
      } else if (key === 'x') {
        this.dismissEcho();
      }
    }

    this.heldKeys.add(code);
    this.heldKeys.add(key);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
    this.heldKeys.delete(e.key.toLowerCase());
  };

  private handleWindowBlur = () => {
    this.heldKeys.clear();
    this.pauseGame();
  };

  private handleCanvasMouseDown = (e: MouseEvent) => {
    if ((e.button !== 0 && e.button !== 2) || !this.canvas || this.screen !== 'playing') return;
    const bounds = this.canvas.getBoundingClientRect();
    const target = { x: (e.clientX - bounds.left) * this.canvas.width / bounds.width,
      y: (e.clientY - bounds.top) * this.canvas.height / bounds.height };
    if (e.shiftKey && this.echo) { this.pingTarget={...target,life:4}; this.showBanner(this.language==='vi'?'Echo ưu tiên mục tiêu đã đánh dấu.':'Echo target marked.'); return; }
    if (e.button === 2) { e.preventDefault(); this.useSkill(target); }
    else this.attack(target);
  };
  private handleCanvasContextMenu = (e: MouseEvent) => { if (this.screen === 'playing') e.preventDefault(); };

  private bindInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    this.canvas?.addEventListener('mousedown', this.handleCanvasMouseDown);
    this.canvas?.addEventListener('contextmenu', this.handleCanvasContextMenu);
  }

  private unbindInputs() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    this.canvas?.removeEventListener('mousedown', this.handleCanvasMouseDown);
    this.canvas?.removeEventListener('contextmenu', this.handleCanvasContextMenu);
  }

  /** Which background track fits right now (files and naming: src/game/logic/music.ts). */
  private musicScene(): MusicScene {
    if (this.suspendVisuals) return 'intro';
    switch (this.screen) {
      case 'playing': case 'paused': case 'victory': case 'forge': return this.boss ? 'boss' : 'level';
      case 'defeat': return 'defeat';
      case 'ending': return 'ending';
      default: return 'menu';
    }
  }

  // --- Game Loop ---

  private loop = (timestamp: number) => {
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Clamp dt to max 0.05s as required by game guidelines
    const dt = Math.max(0, Math.min(rawDt, 0.05));

    if (this.screen === 'playing') {
      this.update(dt);
    }

    // While a full-screen cinematic covers the stage, skip the hidden canvas and HUD churn.
    // The loading screen covers the stage: skip the hidden canvas until a level is set up behind
    // it. Blank it once, so the fade-out never uncovers the previous level's last frame.
    if (this.screen === 'loading' && !this.pendingLevel?.built) {
      if (!this.stageBlank && this.ctx && this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = '#071510';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.stageBlank = true;
      }
    } else if (this.screen === 'lobby' || this.screen === 'shop' || this.screen === 'characters') {
      // These menus cover the stage almost entirely (91-96% opaque): draw it once as their
      // backdrop and leave it, instead of redrawing a hidden level every frame.
      this.stageBlank = false;
      if (this.backdropFor !== this.screen && !this.suspendVisuals) { this.render(); this.backdropFor = this.screen; }
    } else {
      this.stageBlank = false;
      this.backdropFor = null;
      if (!this.suspendVisuals) this.render();
    }
    music.set(this.musicScene(), this.screen === 'paused');

    // Check throttled HUD update
    if (!this.suspendVisuals && timestamp - this.lastHUDNotify >= 80) {
      this.lastHUDNotify = timestamp;
      this.notifyHUD();
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private discoverMechanics() {
    if(this.enemies.some(e=>e.hp>0&&Math.hypot(e.x-this.player.x,e.y-this.player.y)<230))this.guides.offer('enemies');
    if(this.currentLevel.id>=2&&Object.values(this.campaign.echoRunes).some(n=>n>0))this.guides.offer('upgradeRunes');
    const offer=(id:GuideTopic)=>this.guides.offer(id);
    if(this.boss){
      offer('shield');
      if(this.echoes.length)offer('decoy');
      if(this.boss.armor===0)offer('vulnerable');
      return;
    }
    if(this.currentLevel.id===5&&this.checkpointIndex>=3)offer('recycle');
    if(this.echoes.length>=2)offer('multi');
    if(this.currentLevel.plates.some(p=>Math.hypot(this.player.x-p.x-p.width/2,this.player.y-p.y-p.height/2)<140))offer('links');
    if(this.timePickup)offer('time');
    for(const trap of this.currentLevel.traps??[])if(Math.hypot(this.player.x-trap.x-trap.width/2,this.player.y-trap.y-trap.height/2)<150)offer(trap.kind);
  }

  private update(dt: number) {
    if (this.screen !== 'playing') return;
    if(this.tutorialEnabled){
      const previousTopic=this.guides.active;
      if(!this.guides.blocking)this.discoverMechanics();
      if(this.guides.blocking){this.heldKeys.clear();if(previousTopic!==this.guides.active)this.notifyHUD();return;}
    }
    if (this.exitTravelRemaining > 0) {
      this.exitTravelRemaining = Math.max(0,this.exitTravelRemaining-dt);
      this.elapsedLevelTime += dt;
      if (this.exitTravelRemaining === 0) this.handleVictory();
      return;
    }
    for (const effect of this.summonEffects) effect.life -= dt;
    this.summonEffects = this.summonEffects.filter(effect=>effect.life>0);
    if (this.bossDeathPending) {
      this.bossDeathElapsed += dt;
      if (this.bossDeathElapsed >= 1.05) {
        this.bossDeathPending = false;
        this.screen = 'ending';
        document.body.dataset.state = 'gameover';
        this.notifyHUD();
      }
      return;
    }
    // Expire before accepting a checkpoint: arriving after zero cannot rescue a run.
    if (this.legTimeRemaining !== null) {
      this.legTimeRemaining = Math.max(0, this.legTimeRemaining - dt);
      if (this.legTimeRemaining <= 0.000001) {
        this.legTimeRemaining = 0;
        this.defeatReason = 'timeout';
        voice.say(this.voiceRole, 'defeat');
        this.screen = 'defeat';
        this.heldKeys.clear();
        document.body.dataset.state = 'gameover';
        this.notifyHUD();
        return;
      }
    }
    this.gameTime += dt;
    this.swapCooldown=Math.max(0,this.swapCooldown-dt);
    this.elapsedLevelTime += dt;
    // Idle bark after standing still for a while (voice director enforces a long cooldown).
    this.idleTime = this.player.isMoving ? 0 : this.idleTime + dt;
    if (this.idleTime > 14) { this.idleTime = 0; voice.say(this.voiceRole, 'idle'); }
    if(this.pingTarget) {this.pingTarget.life-=dt;if(this.pingTarget.life<=0)this.pingTarget=null;}
    const altar=this.currentLevel.playerSpawn;
    const outsideAltar=Math.hypot(this.player.x-altar.x,this.player.y-altar.y)>85;
    this.echoGrace=Math.max(0,this.echoGrace-dt);
    if(!this.boss || !outsideAltar || this.echoes.length>0) this.dissonanceSeconds=0;
    else if(this.echoGrace<=0) {
      this.dissonanceSeconds+=dt;
      if(this.dissonanceSeconds>=5) {
        this.dissonanceSeconds-=5;
        this.takeDamage();
        if(this.screen!=='playing')return;
        this.showBanner(this.language==='vi'?'Rạn vỡ ký ức: cần Echo để bảo hộ.':'Dissonance: summon Echo for protection.');
      }
    }
    this.trappedTime = Math.max(0, this.trappedTime - dt);
    if (this.legTimeRemaining !== null) {
      this.pickupSpawnTimer -= dt;
      if (this.pickupSpawnTimer <= 0 && !this.shardClaimedThisLeg && !this.timePickup) {
        this.pickupSpawnTimer = puzzleBalance(this.currentLevel.id).shardInterval;
        this.spawnTimePickup();
      }
      if (this.timePickup && Math.hypot(this.player.x - this.timePickup.x, this.player.y - this.timePickup.y) < 30) {
        this.legTimeRemaining += SHARD_BONUS;
        this.shardClaimedThisLeg = true;
        this.timePickup = null;
        this.showBanner(this.language==='vi'?`+${SHARD_BONUS}s · Mỗi chặng chỉ có một mảnh thời gian`:`+${SHARD_BONUS}s · One time shard per leg`);
      }
    }
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.updatePersonalSkill(dt);
    this.hasteTime=Math.max(0,this.hasteTime-dt);
    if(this.combatFlash) { this.combatFlash.time-=dt; if(this.combatFlash.time<=0)this.combatFlash=null; }
    if(this.pendingUltimate) { this.pendingUltimate.time-=dt; if(this.pendingUltimate.time<=0) { const k=this.pendingUltimate.kind; this.pendingUltimate=null; this.releaseCombatSkill(k); } }
    if(this.boss) {
      this.skillDropTimer-=dt;
      if(this.skillDropTimer<=0) { this.skillDropTimer+=5; this.spawnCombatSkill(); }
      if(this.skillDrop) {
        this.skillDrop.fall=Math.min(1,this.skillDrop.fall+dt/.7);
        if(this.skillDrop.fall>=1 && Math.hypot(this.player.x-this.skillDrop.x,this.player.y-this.skillDrop.y)<34) {
          const kind=this.skillDrop.kind;this.skillDrop=null;this.collectCombatSkill(kind);
        }
      }
      if(this.fireBurnTime>0) { this.fireBurnTime=Math.max(0,this.fireBurnTime-dt);this.fireBurnTick-=dt;
        if(this.fireBurnTick<=0) { this.fireBurnTick+=1; this.damageCombatTarget(this.boss.x,this.boss.y,5,70); }
      }
    }
    this.updateCombo(dt);
    this.updateMagicShots(dt);
    const enemyEchoes=[...this.echoes];
    updateEnemies(this.enemies,this.currentLevel,this.player,enemyEchoes,dt,target=>{
      if(target.echoIndex===null)this.takeDamage();
      else {const echo=enemyEchoes[target.echoIndex];if(echo)this.hitEcho(echo,25);}
    });
    if(this.screen!=='playing')return;
    this.attackFlash = Math.max(0, this.attackFlash - dt);
    for (const hit of this.combatHits) hit.life -= dt;
    this.combatHits = this.combatHits.filter(hit => hit.life > 0);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.dodgeTime = Math.max(0, this.dodgeTime - dt);

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerMessage = '';
      }
    }

    // 1. Process player movement
    const effects = trapEffects(this.currentLevel.traps ?? [], this.player, this.elapsedLevelTime);
    this.slowed = effects.slowed;
    let moveX = 0;
    let moveY = 0;

    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) moveY -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) moveY += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveX += 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const invLen = 1 / Math.SQRT2;
      moveX *= invLen;
      moveY *= invLen;
    }
    if (this.dodgeTime > 0) {
      if (!moveX && !moveY) {
        moveX = this.player.direction === 'right' ? 1 : this.player.direction === 'left' ? -1 : 0;
        moveY = this.player.direction === 'down' ? 1 : this.player.direction === 'up' ? -1 : 0;
      }
      moveX *= 3.6; moveY *= 3.6;
    }

    if (this.trappedTime > 0) { moveX = 0; moveY = 0; }
    const isMoving = moveX !== 0 || moveY !== 0;
    this.player.isMoving = isMoving;

    if (isMoving) {
      // Determine facing direction
      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.player.direction = moveX > 0 ? 'right' : 'left';
      } else {
        this.player.direction = moveY > 0 ? 'down' : 'up';
      }

      // Footstep sound tick
      if (Math.random() < 0.08) {
        sounds.playFootstep();
      }

      // Calculate target position
      const targetX = this.player.x + moveX * this.player.speed * effects.speedMultiplier * dt;
      const targetY = this.player.y + moveY * this.player.speed * effects.speedMultiplier * dt;

      // Obstacle collision resolution (walls and closed doors)
      const obstacles = getActiveObstacles(
        this.currentLevel.walls,
        this.currentLevel.doors
      );
      const resolved = resolveMovement(
        this.player.x,
        this.player.y,
        targetX,
        targetY,
        24,
        24,
        obstacles
      );
      this.player.x = resolved.x;
      this.player.y = resolved.y;
    }
    // 2. Update Recording if active
    if (this.recorder.getStatus() === 'recording') {
      const recResult = this.recorder.updateRecording(
        dt * 1000,
        this.player.x,
        this.player.y,
        this.player.direction,
        this.player.isMoving
      );
      if (recResult.autoStopped) {
        sounds.playRecordStop();
        this.showBanner('Đã ghi đủ 8 giây. Nhấn E để gọi Echo.');
      }
    }

    // 3. Update Echo if active
    const selected=this.echo;
    for(const active of [...this.echoes]) {
    this.selectedEcho=this.echoes.indexOf(active);
    const fighting = this.echo ? this.updateEchoCombat(this.echo, dt) : false;
    if (this.echo && !fighting && this.echo.status === 'replaying') {
      this.echo.elapsedMs += dt * 1000;
      while(this.echo && (this.echo.events?.[this.echo.nextEvent??0]?.time??Infinity)<=this.echo.elapsedMs) {
        const event=this.echo.events![this.echo.nextEvent??0];
        this.echo.nextEvent=(this.echo.nextEvent??0)+1;
        this.replayEchoEvent(event);
      }
      const sample = interpolateSample(
        this.echo.samples,
        this.echo.elapsedMs
      );

      const obstacles = getActiveObstacles(
        this.currentLevel.walls,
        this.currentLevel.doors
      );
      const resolvedEcho = resolveMovement(
        this.echo.x,
        this.echo.y,
        sample.x,
        sample.y,
        24,
        24,
        obstacles
      );

      this.echo.x = resolvedEcho.x;
      this.echo.y = resolvedEcho.y;
      this.echo.direction = sample.direction;
      this.echo.isMoving = sample.isMoving;

      if (sample.isFinished && this.echo.status === 'replaying') {
        this.echo.status = 'finished';
        this.echo.isMoving = false;
        // Echo reached final position!
        this.renderer.particles.emit(
          this.echo.x,
          this.echo.y,
          10,
          '#22d3ee',
          30,
          2.5,
          0.4
        );
      }
    }
    if((this.boss||this.enemies.length) && this.echo) {
      this.echo.aggroTime=Math.max(0,(this.echo.aggroTime??0)-dt);
    }
    if(this.echo?.status==='paused' || this.echo?.status==='finished') {
      this.echo.stability=Math.max(0,(this.echo.stability??100)-dt*(this.echo.status==='paused'?(this.boss?8:1.5):0)*(this.activeEchoRunes.has('guard')?.65:1));
    }

    }
    this.selectedEcho=Math.max(0,selected?this.echoes.indexOf(selected):0);

    // 4. Update Renderer animations & particles
    this.renderer.update(dt, this.player.isMoving);

    // 5. Update Pressure Plates
    const targetPlate = this.currentLevel.plates[this.checkpointIndex];
    if (this.currentLevel.id <= 5 && (this.legTimeRemaining !== null || this.devUnlocked) && targetPlate &&
        rectIntersects(getCharacterBoundingBox(this.player.x, this.player.y, 24, 24), targetPlate)) {
      this.checkpointIndex++;
      this.echoCharges=Math.min(this.echoLimit-(this.echoFreeSummon?1:0),this.echoCharges+1);
      this.legTimeRemaining = this.devUnlocked ? null : puzzleBalance(this.currentLevel.id).legSeconds;
      this.shardClaimedThisLeg = false; this.timeItemUsedThisLeg = false; this.timePickup = null;
      this.pickupSpawnTimer = puzzleBalance(this.currentLevel.id).shardInterval;
      this.showBanner(this.devUnlocked ? (this.language==='vi'?'Đã kích hoạt ấn thạch · Không giới hạn thời gian':'Rune activated · No time limit') : this.checkpointIndex < this.currentLevel.plates.length
        ? (this.language==='vi'?`Chặng mới ${puzzleBalance(this.currentLevel.id).legSeconds}s · Đến rune ${this.checkpointIndex+1}!`:`New leg · ${puzzleBalance(this.currentLevel.id).legSeconds}s · Reach rune ${this.checkpointIndex + 1}!`)
        : (this.language==='vi'?'Giữ tất cả rune bằng Echo, rồi tới cổng thoát!':'Hold every rune with Echoes, then reach the exit!'));
    }
    const plateUpdates = updatePressurePlates(
      this.currentLevel.plates,
      this.player,
      this.echoes,
      dt
    );
    if (plateUpdates.activatedIds.length > 0) {
      sounds.playPlateActivate();
      for (const id of plateUpdates.activatedIds) {
        const pl = this.currentLevel.plates.find((p) => p.id === id);
        if (pl) {
          this.renderer.particles.emit(
            pl.x + pl.width / 2,
            pl.y + pl.height / 2,
            12,
            '#22d3ee',
            50,
            3,
            0.5
          );
        }
      }
    }
    if (plateUpdates.deactivatedIds.length > 0) {
      sounds.playPlateDeactivate();
    }

    // 6. Update Security Doors
    const doorUpdates = updateSecurityDoors(
      this.currentLevel.doors,
      this.currentLevel.plates,
      this.player,
      this.echoes,
      dt
    );
    if (doorUpdates.openedDoorIds.length > 0) {
      sounds.playDoorOpen();
    }
    if (doorUpdates.closedDoorIds.length > 0) {
      sounds.playDoorClose();
    }

    // 7. Check Exit Portal Victory Condition
    const afterMove = trapEffects(this.currentLevel.traps ?? [], this.player, this.elapsedLevelTime);
    this.slowed = afterMove.slowed;
    if (afterMove.damage && this.invulnerability <= 0) {
      this.trappedTime = Math.max(this.trappedTime, 0.25);
      this.takeDamage();
    }
    for (const hazard of this.currentLevel.hazards ?? []) {
      const active = (this.elapsedLevelTime + hazard.offset) % hazard.period < 0.9;
      if (active && Math.hypot(this.player.x - hazard.x, this.player.y - hazard.y) < hazard.radius + 10) this.takeDamage();
    }
    if (this.screen !== 'playing') return;
    if (this.boss) {
      const previousPhase=this.boss.phase;
      const boss = this.boss;
      const bossEchoes = [...this.echoes];
      const echoTarget = bossEchoes.slice().sort((a,b)=>Math.hypot(a.x-boss.x,a.y-boss.y)-Math.hypot(b.x-boss.x,b.y-boss.y))[0]??null;
      const burstBefore = boss.burstRemaining;
      const bossHit = updateBoss(boss, echoTarget??this.player, dt, this.currentLevel.plates.some(p => p.isPressed), this.player, bossEchoes, index => {
        const echo=bossEchoes[index]; if(echo)this.hitEcho(echo,30);
      });
      if (this.boss.phase > this.lastBossPhase) voice.say('guardian', 'event', { id: `phase${this.boss.phase}` });
      this.lastBossPhase = this.boss.phase;
      // Slam wind-up: the shout is timed to end exactly as the blow lands.
      if (this.boss.mode === 'warning' && this.lastBossMode !== 'warning')
        voice.say('guardian', 'attack', { chance: 0.45, cooldown: 5, priority: 3, alignEnd: Math.max(0.3, this.boss.timer) });
      this.lastBossMode = this.boss.mode;
      if (burstBefore <= 0 && this.boss.burstRemaining > 0) voice.say('guardian', 'skill', { chance: 0.6, cooldown: 9 });
      if (!this.bossLowVoiced && this.boss.hp > 0 && this.boss.hp < this.boss.maxHp * 0.15) { this.bossLowVoiced = true; voice.say('guardian', 'lowHealth'); }
      if (bossHit) {
        // A decoy redirects attacks; it never makes the player immune to stray projectiles.
        this.takeDamage();
      }
      if(this.boss.phase!==previousPhase)this.echoCharges=Math.max(1,this.echoCharges);
    } else if ((this.devUnlocked || isPuzzleExitOpen(this.currentLevel,this.checkpointIndex)) &&
      checkExitReached(this.player.x, this.player.y, this.currentLevel.exit)) {
      this.exitTravelRemaining = .7;
    }
  }

  private handleVictory() {
    if(this.screen!=='playing')return;
    this.lastRating = this.campaign.completeLevel(this.currentLevel.id, this.elapsedLevelTime);
    this.lastRuneReward=this.campaign.lastRuneDrop;
    this.lastReward = this.campaign.award(this.currentLevel.id) ? this.currentLevel.id : null;
    this.screen = 'victory';
    document.body.dataset.state = 'gameover';
    sounds.playVictory();
    voice.say(this.voiceRole, 'victory', { delay: 0.3 });
    this.renderer.particles.emit(
      this.currentLevel.exit.x + this.currentLevel.exit.width / 2,
      this.currentLevel.exit.y + this.currentLevel.exit.height / 2,
      40,
      '#10b981',
      100,
      4,
      1.0
    );
    this.notifyHUD();
  }

  private render() {
    if (!this.ctx || !this.canvas) return;

    this.renderer.stage.levelTime = this.elapsedLevelTime;
    this.renderer.stage.reducedMotion = this.reducedMotion;
    this.renderer.stage.exitOpen = !this.boss && (this.devUnlocked || isPuzzleExitOpen(this.currentLevel,this.checkpointIndex));
    this.renderer.render(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      this.boss ? { ...this.currentLevel, exit: { ...this.currentLevel.exit, x: -300, y: -300 } } : this.currentLevel,
      this.characterClass !== 'mage' || comboPose(this) || (this.exitTravelRemaining>0 && this.exitTravelRemaining<.35) ? {...this.player,x:-1000,y:-1000} : {...this.player,y:this.player.y-(this.exitTravelRemaining>0?(.7-this.exitTravelRemaining)*65:0)},
      null,
      this.recorder.getStatus() === 'recording',
      this.recorder.getDuration(),
      this.recorder.getSamples(),
      this.gameTime
    );
    renderAdventure(this.ctx, this, this.elapsedLevelTime);
    const t = this.elapsedLevelTime;
    if(t<1.3) drawPortalEnergy(this.ctx,this.currentLevel.playerSpawn.x,this.currentLevel.playerSpawn.y,t,Math.max(0,1-t/1.3),this.reducedMotion);
    for(const effect of this.summonEffects) drawPortalEnergy(this.ctx,effect.x,effect.y,1-effect.life,effect.life,this.reducedMotion);
    const exit = this.currentLevel.exit, open = this.renderer.stage.exitOpen && !this.boss;
    if(open && this.exitOpenedAt===null) this.exitOpenedAt=t;
    if(!open) this.exitOpenedAt=null;
    if(open) drawPortalEnergy(this.ctx,exit.x+exit.width/2,exit.y+exit.height/2,t-this.exitOpenedAt!,this.exitTravelRemaining>0?1:.6,this.reducedMotion,true);
    finishPixelFrame(this.ctx,this.canvas);
  }

  private notifyHUD() {
    if (this.onHUDChange) {
      const echoState: EchoStatus = this.echo?.status??'none';

      this.onHUDChange({
        guideTopic:this.tutorialEnabled?this.guides.active:null,
        guideLibrary:this.tutorialEnabled&&this.guides.libraryOpen,
        screen: this.screen,
        levelName: this.currentLevel.name,
        levelSubtitle: this.currentLevel.subtitle,
        recordingStatus: this.recorder.getStatus(),
        recordingTimeRemaining: this.recorder.getRemainingTimeMs(),
        echoStatus: echoState,
        echoCount: this.echoes.length,
        echoCharges: this.echoCharges + (this.echoFreeSummon?1:0),
        echoStability: this.echo?.stability??0,
        echoHitsRemaining: this.echo ? Math.max(0, ECHO_MAX_HITS - (this.echo.hitsTaken ?? 0)) : 0,
        echoElapsedMs: this.echo?.elapsedMs??0,
        echoDurationMs: this.echo?.samples.at(-1)?.time??this.recorder.getDuration(),
        echoEvents: this.echo?.events??this.recorder.getEvents(),
        dissonanceSeconds: this.dissonanceSeconds,
        isMuted: sounds.getMuted(),
        bannerMessage: this.bannerMessage,
        elapsedLevelTime: this.elapsedLevelTime,
        completed: [...this.campaign.completed],
        forged: this.campaign.forged,
        lastReward: this.lastReward,
        lastRuneReward:this.lastRuneReward,echoRunes:{...this.campaign.echoRunes},activeEchoRunes:[...this.activeEchoRunes],pendingRuneChoices:[...this.campaign.pendingRuneChoices],enemiesRemaining:this.enemies.filter(e=>e.hp>0).length,
        health: this.health,
        bossHp: this.boss?.hp ?? 0,
        bossPhase: this.boss?.phase ?? 0,
        attackCooldown: this.attackCooldown,
        dodgeCooldown: this.dodgeCooldown,
        legTimeRemaining: this.legTimeRemaining,
        checkpointIndex: this.checkpointIndex,
        checkpointCount: this.currentLevel.plates.length,
        legTimeBudget: puzzleBalance(this.currentLevel.id).legSeconds,
        runesHeld: this.currentLevel.plates.filter(p=>p.isPressed&&this.currentLevel.exitRequiredPlates?.includes(p.id)).length,
        runesRequired: this.currentLevel.exitRequiredPlates?.length??0,
        slowed: this.slowed,
        defeatReason: this.defeatReason,
        volume: sounds.getVolume(),
        reducedMotion: this.reducedMotion,
        voiceVolume: sounds.getVoiceVolume(),
        showHints: this.showHints,
        devUnlocked: this.devUnlocked,
        language: this.language,
        characterClass: this.characterClass,
        weapon: this.weapon,
        coins: this.campaign.coins,
        timeItems: this.campaign.timeItems,
        limitRings: this.campaign.limitRings,
        echoLimit: this.echoLimit,
        limitRingActive: this.limitRingActive,
        bestStars: { ...this.campaign.bestStars },
        lastRating: this.lastRating,
        skillCooldown: this.skillCooldown,
        mechanicalOwned: this.campaign.mechanicalOwned,
        loadingLevel: this.pendingLevel ? LEVELS[this.pendingLevel.idx].id : null,
        loadingFromMenu: this.loadingFromMenu,
        bossArmor: this.boss?.armor??0,
        pillarsRemaining: this.boss?.pillars.filter(p=>p.hp>0).length??0,
        activeBuff: this.hasteTime>0?`${this.language==='vi'?'Tốc chém':'Haste'} ${this.hasteTime.toFixed(1)}s`:this.stoneShield>0?`${this.language==='vi'?'Khiên đá':'Stone shield'} ×${this.stoneShield}`:this.armorShield>0?`${this.language==='vi'?'Giáp':'Armor'} ×${this.armorShield}`:'',
        skillDrop: this.skillDrop?.kind??null,
      });
    }
  }
}
