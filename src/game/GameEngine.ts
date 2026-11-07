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
import { translate, setCurrentLanguage, type Language } from '../i18n.ts';

export type CombatSkill = 'fire' | 'lightning' | 'stone' | 'haste' | 'armor' | 'wave';
const CLASS_SKILLS: Record<CharacterClass, CombatSkill[]> = { mage: ['fire','lightning','stone'], swordsman: ['haste','armor','wave'], mechanical: ['fire','armor','haste'] };

export interface HUDState {
  screen: GameScreen;
  levelName: string;
  levelSubtitle: string;
  recordingStatus: RecordingStatus;
  recordingTimeRemaining: number;
  echoStatus: EchoStatus;
  echoCount: number; // 0 or 1
  echoCharges: number;
  echoStability: number;
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
  health: number;
  bossHp: number;
  bossPhase: number;
  attackCooldown: number;
  dodgeCooldown: number;
  legTimeRemaining: number | null;
  checkpointIndex: number;
  checkpointCount: number;
  slowed: boolean;
  defeatReason: 'timeout' | 'damage';
  volume: number;
  reducedMotion: boolean;
  showHints: boolean;
  devUnlocked: boolean;
  language: Language;
  characterClass: CharacterClass;
  weapon: 'staff' | 'sword';
  coins: number;
  timeItems: number;
  bestStars: Record<number, number>;
  lastRating: { stars: number; coins: number } | null;
  skillCooldown: number;
  bossArmor: number;
  pillarsRemaining: number;
  activeBuff: string;
  skillDrop: CombatSkill | null;
  mechanicalOwned: boolean;
}

export class GameEngine {
  // Screen state
  public screen: GameScreen = 'intro';
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
  public echo: {
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
    characterClass?: CharacterClass;
  } | null = null;

  // Recording
  public recorder = new RecordingManager();
  public echoCharges = 1;
  private echoFreeSummon = true;
  public dissonanceSeconds = 0;
  private swapCooldown = 0;
  private echoGrace = 0;
  private pingTarget: {x:number;y:number;life:number}|null = null;
  public campaign = new Campaign();
  public boss: BossState | null = null;
  public bossDeathElapsed = 0;
  private bossDeathPending = false;
  public health = 5;
  public invulnerability = 0;
  public attackCooldown = 0;
  public attackFlash = 0;
  public dodgeCooldown = 0;
  public dodgeTime = 0;
  public lastReward: number | null = null;
  public legTimeRemaining: number | null = null;
  public timePickup: { x: number; y: number } | null = null;
  public pickupSpawnTimer = 3;
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

  public magicShots: { x: number; y: number; targetX: number; targetY: number; age: number; skill: boolean }[] = [];
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
      this.reducedMotion = value.reducedMotion === true;
      this.showHints = value.showHints !== false;
      this.language = value.language === 'vi' ? 'vi' : 'en';
      this.characterClass = MECHANICAL_ENABLED && value.characterClass === 'mechanical' && this.campaign.mechanicalOwned ? 'mechanical' : value.characterClass === 'swordsman' ? 'swordsman' : 'mage';
      setCurrentLanguage(this.language);
      if (typeof document !== 'undefined') document.body.classList.toggle('reduced-motion', this.reducedMotion);
    } catch { /* Defaults keep the game playable. */ }
  }

  private saveSettings() {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('second-me-settings-v1', JSON.stringify({
      muted: sounds.getMuted(), volume: sounds.getVolume(), reducedMotion: this.reducedMotion, showHints: this.showHints, language: this.language, characterClass: this.characterClass,
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
    this.screen = 'loading';
    this.heldKeys.clear();
    document.body.dataset.state = 'loading';
    this.notifyHUD();
  }

  public finishLoading() {
    if (this.screen !== 'loading') return;
    this.goToLobby();
  }

  public goToLobby() {
    this.screen = 'lobby';
    this.heldKeys.clear();
    document.body.dataset.state = 'lobby';
    this.notifyHUD();
  }
  public openShop() { if (this.screen !== 'lobby') return; this.screen = 'shop'; document.body.dataset.state = 'shop'; this.notifyHUD(); }
  public openCharacters() { if (this.screen !== 'lobby') return; this.screen = 'characters'; document.body.dataset.state = 'characters'; this.notifyHUD(); }
  public buyTimeItem() { if (this.screen !== 'shop') return; if (this.campaign.buyTimeItem()) this.showBanner('Time potion purchased'); else this.showBanner('Not enough coins'); this.notifyHUD(); }
  public selectClass(value: CharacterClass) { if (this.screen !== 'lobby' && this.screen !== 'characters') return; if(value === 'mechanical' && (!MECHANICAL_ENABLED || !this.campaign.mechanicalOwned)) return; this.characterClass = value; this.saveSettings(); this.notifyHUD(); }
  public get weapon(): 'staff' | 'sword' { return this.characterClass === 'mage' ? 'staff' : 'sword'; }
  public useTimeItem() { if (this.screen !== 'playing' || this.legTimeRemaining === null || !this.campaign.useTimeItem()) return false; this.legTimeRemaining += 2; this.showBanner('+2s · Time potion used'); this.notifyHUD(); return true; }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.unbindInputs();
  }

  public startGame() {
    this.campaign.reset();
    this.currentLevelIdx = 0;
    this.screen = 'playing';
    document.body.dataset.state = 'playing';
    this.restartLevel();
    this.showBanner('WASD di chuyển · E ghi đường đi · Q gọi Echo · Chuột phải dùng kỹ năng.');
  }

  public continueGame() {
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

  public restartLevel() {
    this.heldKeys.clear();
    this.renderer.reset();
    this.currentLevel = this.cloneLevel(LEVELS[this.currentLevelIdx]);
    this.initPlayer();
    this.echo = null;
    this.echoCharges = 1;
    this.echoFreeSummon = true;
    this.dissonanceSeconds = 0;
    this.swapCooldown = 0;
    this.echoGrace = 0;
    this.pingTarget = null;
    this.recorder.clear();
    this.elapsedLevelTime = 0;
    this.legTimeRemaining = this.currentLevel.id <= 5 ? 10 : null;
    this.timePickup = null;
    this.pickupSpawnTimer = 3;
    this.trappedTime = 0;
    this.checkpointIndex = 0;
    this.slowed = false;
    this.defeatReason = 'damage';
    this.health = 5;
    this.invulnerability = this.attackCooldown = this.attackFlash = this.dodgeCooldown = this.dodgeTime = 0;
    this.boss = this.currentLevel.id === 6 ? createBoss() : null;
    this.magicShots = [];
    this.orbitOrbs = []; this.lightCircle = null; this.overdrive = 0;
    this.skillDrop = null; this.skillDropTimer = 5;
    this.stoneShield = this.armorShield = this.hasteTime = this.fireBurnTime = this.fireBurnTick = 0;
    this.combatFlash = null;
    this.skillCooldown = 0;
    this.lastRating = null;
    this.bossDeathElapsed = 0;
    this.bossDeathPending = false;
    this.lastReward = null;
    this.screen = 'playing';
    document.body.dataset.state = 'playing';
    this.showBanner(`Bắt đầu lại ${this.currentLevel.name}`);
    this.notifyHUD();
  }

  public nextLevel() {
    if (this.currentLevel.id === 5) {
      this.screen = 'forge';
      this.heldKeys.clear();
      document.body.dataset.state = 'forge';
      this.notifyHUD();
      return;
    }
    if (this.currentLevelIdx + 1 < LEVELS.length) {
      this.currentLevelIdx++;
      this.restartLevel();
      this.showBanner(`${this.currentLevel.name}: ${this.currentLevel.subtitle}`);
      this.notifyHUD();
    } else {
      // The final completion action starts a fresh run immediately.
      this.currentLevelIdx = 0;
      this.campaign.reset();
      this.restartLevel();
    }
  }

  public selectLevel(idx: number) {
    const campaignComplete = this.campaign.bossDefeated;
    if (!this.devUnlocked && !campaignComplete && (idx > this.campaign.unlockedLevel || (idx === 5 && !this.campaign.forged))) return;
    if (idx >= 0 && idx < LEVELS.length) {
      this.currentLevelIdx = idx;
      this.restartLevel();
      this.screen = 'playing';
      document.body.dataset.state = 'playing';
      this.notifyHUD();
    }
  }

  public goToTitle() { this.goToLobby(); }

  public toggleAudio() { sounds.toggleMute(); this.saveSettings(); this.notifyHUD(); }
  public setVolume(value: number) { sounds.setVolume(value); this.saveSettings(); this.notifyHUD(); }
  public setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    if (typeof document !== 'undefined') document.body.classList.toggle('reduced-motion', value);
    this.saveSettings(); this.notifyHUD();
  }
  public setShowHints(value: boolean) { this.showHints = value; this.saveSettings(); this.notifyHUD(); }
  public setLanguage(value: Language) { this.language = value; setCurrentLanguage(value); if (typeof document !== 'undefined') document.title = value === 'vi' ? 'SECOND ME — Lò rèn lửa' : 'SECOND ME — The Emberforge'; this.saveSettings(); this.notifyHUD(); }

  public unlockDevMode() {
    this.devUnlocked = true;
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
    this.currentLevelIdx = 5;
    this.restartLevel();
    this.showBanner('Chuột trái: tấn công · Chuột phải: kỹ năng · Shift: lướt né.', 6);
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
    }
    this.notifyHUD();
  }

  private combatAim() {
    const pillar = this.boss?.pillars.filter(p=>p.hp>0).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];
    return pillar ? {x:pillar.x,y:pillar.y} : this.boss ? {x:this.boss.x,y:this.boss.y} : null;
  }

  private damageCombatTarget(x:number,y:number,amount:number,radius=65) {
    if (!this.boss || this.bossDeathPending || this.boss.hp<=0) return false;
    if(this.insideLightCircle) amount *= 1.2;
    const pillar=this.boss.pillars.find(p=>p.hp>0 && Math.hypot(p.x-x,p.y-y)<=radius);
    if(pillar) {
      pillar.hp=Math.max(0,pillar.hp-amount);
      this.boss.armor=this.boss.pillars.filter(p=>p.hp>0).length*25;
      this.renderer.emitMagic('sparkle',pillar.x,pillar.y,65);
      if(pillar.hp===0) this.echoCharges=Math.min(2,this.echoCharges+1);
      if(pillar.hp===0)this.showBanner(this.boss.armor===0
        ? (this.language==='vi'?'Bốn trụ đã bị phá · Boss mất giáp!':'All four pillars destroyed · Boss armor broken!')
        : (this.language==='vi'?`Đã phá trụ · Còn ${this.boss.armor/25} trụ`:`Pillar destroyed · ${this.boss.armor/25} remaining`));
      this.notifyHUD(); return true;
    }
    if(Math.hypot(this.boss.x-x,this.boss.y-y)>radius) return false;
    if(this.boss.pillars.some(p=>p.hp>0)) { this.renderer.emitMagic('sparkle',this.boss.x,this.boss.y,35); return false; }
    this.boss.hp=Math.max(0,this.boss.hp-amount);
    this.boss.hitFlash=.18;
    this.finishBossHit(); return true;
  }

  private spawnCombatSkill() {
    if(!this.boss)return;
    const skills=CLASS_SKILLS[this.characterClass];
    const kind=skills[Math.floor(Math.random()*skills.length)];
    const angle=Math.random()*Math.PI*2;
    const x=Math.max(80,Math.min(1200,this.player.x+Math.cos(angle)*105));
    const y=Math.max(85,Math.min(630,this.player.y+Math.sin(angle)*105));
    this.skillDrop={kind,x,y,fall:0};
    this.showBanner(this.language==='vi'?'Ô kỹ năng đã rơi xuống!':'A skill pickup has landed!');
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
      const damage=kind==='fire'?35:kind==='lightning'?50:55;
      if(this.damageCombatTarget(aim.x,aim.y,damage,65) && kind==='fire' && this.boss?.armor===0) { this.fireBurnTime=3; this.fireBurnTick=1; }
      this.combatFlash={x:aim.x,y:aim.y,kind,time:.65};
    }
    this.notifyHUD();
  }

  public attack(target?: { x: number; y: number }) {
    if (this.screen !== 'playing' || this.bossDeathPending || this.attackCooldown > 0) return;
    this.attackCooldown = this.hasteTime>0 || this.overdrive>0 ? .27 : .55;
    const recordedAim = target ?? this.combatAim() ?? { x: this.player.x + (this.player.direction === 'left' ? -180 : this.player.direction === 'right' ? 180 : 0), y: this.player.y + (this.player.direction === 'up' ? -180 : this.player.direction === 'down' ? 180 : 0) };
    this.recorder.recordEvent({kind:'attack',x:this.player.x,y:this.player.y,targetX:recordedAim.x,targetY:recordedAim.y});
    if (this.characterClass === 'mage') {
      const fallback = this.combatAim() ?? { x: this.player.x + (this.player.direction === 'left' ? -180 : this.player.direction === 'right' ? 180 : 0), y: this.player.y + (this.player.direction === 'up' ? -180 : this.player.direction === 'down' ? 180 : 0) };
      const aim = target ?? fallback;
      const reach = Math.hypot(aim.x - this.player.x, aim.y - this.player.y);
      const scale = Math.min(1, 450 / Math.max(1, reach));
      this.magicShots.push({ x: this.player.x, y: this.player.y - 12, targetX: this.player.x + (aim.x - this.player.x) * scale, targetY: this.player.y + (aim.y - this.player.y) * scale, age: 0, skill: false });
      this.renderer.emitMagic('summon', this.player.x, this.player.y - 10, 38);
    } else {
      this.attackFlash = 0.22;
      const aim=target ?? this.combatAim();
      if(aim && Math.hypot(aim.x-this.player.x,aim.y-this.player.y)<=112)
        this.damageCombatTarget(aim.x,aim.y,this.currentLevel.plates.some(p=>p.isPressed)?24:15,55);
    }
    this.notifyHUD();
  }

  public useSkill(_target?: { x: number; y: number }) {
    if (this.screen !== 'playing' || this.bossDeathPending || this.skillCooldown > 0) return;
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
    if (this.screen !== 'playing' || !this.boss || this.dodgeCooldown > 0) return;
    this.dodgeTime = 0.16;
    this.dodgeCooldown = 1.2;
    this.invulnerability = Math.max(this.invulnerability, 0.4);
  }

  private takeDamage() {
    if (this.invulnerability > 0) return;
    if(this.stoneShield>0) { this.stoneShield--; this.invulnerability=.3; this.notifyHUD(); return; }
    if(this.armorShield>0) { this.armorShield--; this.invulnerability=.3; this.notifyHUD(); return; }
    this.health = Math.max(0, this.health - 1);
    this.invulnerability = 1.3;
    this.renderer.particles.emit(this.player.x, this.player.y, 18, '#fb7185', 75, 4, 0.6);
    if (this.health === 0) {
      this.defeatReason = 'damage';
      this.screen = 'defeat'; this.heldKeys.clear(); document.body.dataset.state = 'gameover';
    }
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
    if (this.echo?.status === 'replaying') { this.echo.status='paused'; this.notifyHUD(); return; }
    if (this.echo?.status === 'paused') { this.echo.status='replaying'; this.notifyHUD(); return; }

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

    this.echo = {
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
      aggroTime: this.boss ? 3 : undefined,
      attackTimer: 0,
      characterClass: this.characterClass,
    };

    sounds.playEchoSpawn();
    this.renderer.particles.emit(first.x, first.y, 25, '#22d3ee', 80, 4, 0.7);
    this.showBanner('Echo đã xuất hiện và đang phát lại đường đi.');
    this.notifyHUD();
  }

  public dismissEcho() {
    if (this.screen !== 'playing') return;

    if (this.echo) {
      this.renderer.particles.emit(
        this.echo.x,
        this.echo.y,
        20,
        '#a855f7',
        60,
        3,
        0.5
      );
      sounds.playEchoDismiss();
      this.echo = null;
      this.showBanner('Đã xóa Echo.');
      this.notifyHUD();
    }
  }

  private replayEchoEvent(event: EchoEvent) {
    if (!this.echo || !this.boss) return;
    const originX=this.echo.x, originY=this.echo.y;
    const angle=Math.atan2(event.targetY-event.y,event.targetX-event.x);
    const targets=[...this.boss.pillars.filter(p=>p.hp>0),...(this.boss.armor===0?[this.boss]:[])];
    const target=targets.filter(p=>Math.hypot(p.x-originX,p.y-originY)<(event.kind==='skill'?180:150))
      .map(p=>({p,offset:Math.abs(Math.atan2(Math.sin(Math.atan2(p.y-originY,p.x-originX)-angle),Math.cos(Math.atan2(p.y-originY,p.x-originX)-angle)))}))
      .filter(item=>item.offset<=(this.pingTarget&&Math.hypot(item.p.x-this.pingTarget.x,item.p.y-this.pingTarget.y)<45?Math.PI/6:Math.PI/9))
      .sort((a,b)=>(this.pingTarget?Math.hypot(a.p.x-this.pingTarget.x,a.p.y-this.pingTarget.y)-Math.hypot(b.p.x-this.pingTarget.x,b.p.y-this.pingTarget.y):a.offset-b.offset))[0]?.p;
    const x=target?.x??originX+Math.cos(angle)*120, y=target?.y??originY+Math.sin(angle)*120;
    this.damageCombatTarget(x,y,event.kind==='skill'?15:10, event.kind==='skill'?75:65);
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

  // --- Game Loop ---

  private loop = (timestamp: number) => {
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Clamp dt to max 0.05s as required by game guidelines
    const dt = Math.max(0, Math.min(rawDt, 0.05));

    if (this.screen === 'playing') {
      this.update(dt);
    }

    this.render();

    // Check throttled HUD update
    if (timestamp - this.lastHUDNotify >= 80) {
      this.lastHUDNotify = timestamp;
      this.notifyHUD();
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.screen !== 'playing') return;
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
    if(this.pingTarget) {this.pingTarget.life-=dt;if(this.pingTarget.life<=0)this.pingTarget=null;}
    const altar=this.currentLevel.playerSpawn;
    const outsideAltar=Math.hypot(this.player.x-altar.x,this.player.y-altar.y)>85;
    this.echoGrace=Math.max(0,this.echoGrace-dt);
    if(!outsideAltar || this.echo) this.dissonanceSeconds=0;
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
      if (this.pickupSpawnTimer <= 0) {
        this.pickupSpawnTimer += 3;
        this.spawnTimePickup();
      }
      if (this.timePickup && Math.hypot(this.player.x - this.timePickup.x, this.player.y - this.timePickup.y) < 30) {
        this.legTimeRemaining += 4;
        this.timePickup = null;
        this.showBanner('+4s · Time shard collected');
      }
    }
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.updatePersonalSkill(dt);
    this.hasteTime=Math.max(0,this.hasteTime-dt);
    if(this.combatFlash) { this.combatFlash.time-=dt; if(this.combatFlash.time<=0)this.combatFlash=null; }
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
    for (const shot of this.magicShots) {
      shot.age += dt;
      if (shot.age >= 0.3) this.damageCombatTarget(shot.targetX,shot.targetY,shot.skill?40:15,shot.skill?110:55);
    }
    this.magicShots = this.magicShots.filter(shot => shot.age < 0.3);
    this.attackFlash = Math.max(0, this.attackFlash - dt);
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
    if(this.boss?.hp && this.screen==='playing') {
      const dx=this.boss.x-this.player.x,dy=this.boss.y-this.player.y;
      this.player.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
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
    if (this.echo && this.echo.status === 'replaying') {
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
    if(this.boss && this.echo) {
      this.echo.aggroTime=Math.max(0,(this.echo.aggroTime??0)-dt);
    }
    if(this.echo?.status==='paused' || this.echo?.status==='finished') {
      this.echo.stability=(this.echo.stability??100)-dt*(this.echo.status==='paused'?8:3);
      if(this.echo.stability<=0){this.echo=null;this.echoGrace=2;}
    }

    // 4. Update Renderer animations & particles
    this.renderer.update(dt, this.player.isMoving);

    // 5. Update Pressure Plates
    const targetPlate = this.currentLevel.plates[this.checkpointIndex];
    if (this.legTimeRemaining !== null && targetPlate &&
        rectIntersects(getCharacterBoundingBox(this.player.x, this.player.y, 24, 24), targetPlate)) {
      this.checkpointIndex++;
      this.echoCharges=Math.min(2,this.echoCharges+1);
      this.legTimeRemaining = 10;
      this.showBanner(this.checkpointIndex < this.currentLevel.plates.length
        ? `+10s · Reach rune ${this.checkpointIndex + 1}!`
        : '+10s · Reach the exit!');
    }
    const plateUpdates = updatePressurePlates(
      this.currentLevel.plates,
      this.player,
      this.echo,
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
      this.echo,
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
      const echoTarget=this.echo && (this.echo.aggroTime??0)>0 ? this.echo : null;
      if (updateBoss(this.boss, echoTarget??this.player, dt, this.currentLevel.plates.some(p => p.isPressed))) {
        if(echoTarget) { echoTarget.stability=(echoTarget.stability??100)-30; if(echoTarget.stability<=0){this.echo=null;this.echoGrace=2;}this.showBanner(this.language==='vi'?'Echo đã chặn đòn.':'Echo absorbed the hit.'); }
        else this.takeDamage();
      }
      if(this.boss.phase!==previousPhase)this.echoCharges=Math.max(1,this.echoCharges);
    } else if ((this.legTimeRemaining === null || this.checkpointIndex === this.currentLevel.plates.length) &&
      checkExitReached(this.player.x, this.player.y, this.currentLevel.exit)) {
      this.handleVictory();
    }
  }

  private handleVictory() {
    this.lastRating = this.campaign.completeLevel(this.currentLevel.id, this.elapsedLevelTime);
    this.lastReward = this.campaign.award(this.currentLevel.id) ? this.currentLevel.id : null;
    this.screen = 'victory';
    document.body.dataset.state = 'gameover';
    sounds.playVictory();
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

    this.renderer.render(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      this.boss ? { ...this.currentLevel, exit: { ...this.currentLevel.exit, x: -300, y: -300 } } : this.currentLevel,
      this.characterClass !== 'mage' ? {...this.player,x:-1000,y:-1000} : this.player,
      this.echo && this.echo.characterClass && this.echo.characterClass !== 'mage' ? {...this.echo,x:-1000,y:-1000} : this.echo,
      this.recorder.getStatus() === 'recording',
      this.recorder.getDuration(),
      this.recorder.getSamples(),
      this.gameTime
    );
    renderAdventure(this.ctx, this, this.elapsedLevelTime);
  }

  private notifyHUD() {
    if (this.onHUDChange) {
      const echoState: EchoStatus = this.echo?.status??'none';

      this.onHUDChange({
        screen: this.screen,
        levelName: this.currentLevel.name,
        levelSubtitle: this.currentLevel.subtitle,
        recordingStatus: this.recorder.getStatus(),
        recordingTimeRemaining: this.recorder.getRemainingTimeMs(),
        echoStatus: echoState,
        echoCount: this.echo ? 1 : 0,
        echoCharges: this.echoCharges + (this.echoFreeSummon?1:0),
        echoStability: this.echo?.stability??0,
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
        health: this.health,
        bossHp: this.boss?.hp ?? 0,
        bossPhase: this.boss?.phase ?? 0,
        attackCooldown: this.attackCooldown,
        dodgeCooldown: this.dodgeCooldown,
        legTimeRemaining: this.legTimeRemaining,
        checkpointIndex: this.checkpointIndex,
        checkpointCount: this.currentLevel.plates.length,
        slowed: this.slowed,
        defeatReason: this.defeatReason,
        volume: sounds.getVolume(),
        reducedMotion: this.reducedMotion,
        showHints: this.showHints,
        devUnlocked: this.devUnlocked,
        language: this.language,
        characterClass: this.characterClass,
        weapon: this.weapon,
        coins: this.campaign.coins,
        timeItems: this.campaign.timeItems,
        bestStars: { ...this.campaign.bestStars },
        lastRating: this.lastRating,
        skillCooldown: this.skillCooldown,
        mechanicalOwned: this.campaign.mechanicalOwned,
        bossArmor: this.boss?.armor??0,
        pillarsRemaining: this.boss?.pillars.filter(p=>p.hp>0).length??0,
        activeBuff: this.hasteTime>0?`${this.language==='vi'?'Tốc chém':'Haste'} ${this.hasteTime.toFixed(1)}s`:this.stoneShield>0?`${this.language==='vi'?'Khiên đá':'Stone shield'} ×${this.stoneShield}`:this.armorShield>0?`${this.language==='vi'?'Giáp':'Armor'} ×${this.armorShield}`:'',
        skillDrop: this.skillDrop?.kind??null,
      });
    }
  }
}
