/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Direction,
  GameScreen,
  LevelData,
  MovementSample,
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
import { Campaign, createBoss, swordHit, updateBoss, type BossState, type CharacterClass } from './logic/campaign.ts';
import { renderAdventure } from './rendering/adventure.ts';
import { translate, setCurrentLanguage, type Language } from '../i18n.ts';

export interface HUDState {
  screen: GameScreen;
  levelName: string;
  levelSubtitle: string;
  recordingStatus: RecordingStatus;
  recordingTimeRemaining: number;
  echoStatus: EchoStatus;
  echoCount: number; // 0 or 1
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
    status: 'replaying' | 'finished';
    samples: MovementSample[];
  } | null = null;

  // Recording
  public recorder = new RecordingManager();
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
  public magicShots: { x: number; y: number; targetX: number; targetY: number; age: number; skill: boolean }[] = [];
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
      this.characterClass = value.characterClass === 'swordsman' ? 'swordsman' : 'mage';
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
  public buyTimeItem() { if (this.screen !== 'shop') return; if (this.campaign.buyTimeItem()) this.showBanner('Time potion purchased'); else this.showBanner('Not enough coins'); this.notifyHUD(); }
  public selectClass(value: CharacterClass) { if (this.screen !== 'lobby') return; this.characterClass = value; this.saveSettings(); this.notifyHUD(); }
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
    this.showBanner('WASD để di chuyển · R ghi đường đi · E gọi Echo giữ nút.');
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
    this.showBanner('Chuột trái: tấn công · Space: kỹ năng · Shift: lướt né.', 6);
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

  private magicDamage(amount: number) {
    if (!this.boss || this.bossDeathPending || this.boss.hp <= 0) return;
    this.boss.hp = Math.max(0, this.boss.hp - amount);
    this.boss.hitFlash = 0.18;
    this.finishBossHit();
  }

  public attack(target?: { x: number; y: number }) {
    if (this.screen !== 'playing' || this.bossDeathPending || this.attackCooldown > 0) return;
    this.attackCooldown = 0.55;
    if (this.characterClass === 'mage') {
      const fallback = this.boss ? { x: this.boss.x, y: this.boss.y } : { x: this.player.x + (this.player.direction === 'left' ? -180 : this.player.direction === 'right' ? 180 : 0), y: this.player.y + (this.player.direction === 'up' ? -180 : this.player.direction === 'down' ? 180 : 0) };
      const aim = target ?? fallback;
      const reach = Math.hypot(aim.x - this.player.x, aim.y - this.player.y);
      const scale = Math.min(1, 450 / Math.max(1, reach));
      this.magicShots.push({ x: this.player.x, y: this.player.y - 12, targetX: this.player.x + (aim.x - this.player.x) * scale, targetY: this.player.y + (aim.y - this.player.y) * scale, age: 0, skill: false });
      this.renderer.emitMagic('summon', this.player.x, this.player.y - 10, 38);
    } else {
      this.attackFlash = 0.22;
      if (this.boss && swordHit(this.boss, this.player.x, this.player.y, this.currentLevel.plates.some(p => p.isPressed))) this.finishBossHit();
    }
    this.notifyHUD();
  }

  public useSkill(target?: { x: number; y: number }) {
    if (this.screen !== 'playing' || this.bossDeathPending || this.skillCooldown > 0) return;
    this.skillCooldown = 4;
    if (this.characterClass === 'mage') {
      const aim = target ?? (this.boss ? { x: this.boss.x, y: this.boss.y } : { x: this.player.x, y: this.player.y - 180 });
      this.magicShots.push({ x: this.player.x, y: this.player.y - 12, targetX: aim.x, targetY: aim.y, age: 0, skill: true });
      this.renderer.emitMagic('rune', this.player.x, this.player.y - 10, 70);
    } else {
      this.attackFlash = 0.3;
      if (this.boss && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) <= 145) this.magicDamage(40);
    }
    this.notifyHUD();
  }

  public dodge() {
    if (this.screen !== 'playing' || !this.boss || this.dodgeCooldown > 0) return;
    this.dodgeTime = 0.16;
    this.dodgeCooldown = 1.2;
    this.invulnerability = Math.max(this.invulnerability, 0.4);
  }

  private takeDamage() {
    if (this.invulnerability > 0) return;
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
      this.showBanner('ĐANG GHI… Đi tới mục tiêu, rồi nhấn R lần nữa.');
    }
    this.notifyHUD();
  }

  public spawnEcho() {
    if (this.screen !== 'playing') return;

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
      this.showBanner('Chưa có bản ghi. Nhấn R để ghi đường đi trước.');
      return;
    }

    // Spawn or reset Echo
    const first = samples[0];
    const obstacles = getActiveObstacles(this.currentLevel.walls, this.currentLevel.doors);
    const safeEchoSpawn = resolveSpawnPosition(first.x, first.y, 24, 24, obstacles);

    this.echo = {
      x: safeEchoSpawn.x,
      y: safeEchoSpawn.y,
      direction: first.direction,
      isMoving: true,
      elapsedMs: 0,
      status: 'replaying',
      samples,
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
    if (this.screen === 'shop') { if (code === 'Escape') this.goToLobby(); return; }
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
        this.spawnEcho();
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
    if (e.button !== 0 || !this.canvas || this.screen !== 'playing') return;
    const bounds = this.canvas.getBoundingClientRect();
    this.attack({ x: (e.clientX - bounds.left) * this.canvas.width / bounds.width,
      y: (e.clientY - bounds.top) * this.canvas.height / bounds.height });
  };

  private bindInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    this.canvas?.addEventListener('mousedown', this.handleCanvasMouseDown);
  }

  private unbindInputs() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    this.canvas?.removeEventListener('mousedown', this.handleCanvasMouseDown);
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
    this.elapsedLevelTime += dt;
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
    for (const shot of this.magicShots) {
      shot.age += dt;
      if (shot.age >= 0.3 && this.boss && Math.hypot(shot.targetX - this.boss.x, shot.targetY - this.boss.y) < (shot.skill ? 110 : 55)) {
        this.magicDamage(shot.skill ? 40 : 15);
      }
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

    // 4. Update Renderer animations & particles
    this.renderer.update(dt, this.player.isMoving);

    // 5. Update Pressure Plates
    const targetPlate = this.currentLevel.plates[this.checkpointIndex];
    if (this.legTimeRemaining !== null && targetPlate &&
        rectIntersects(getCharacterBoundingBox(this.player.x, this.player.y, 24, 24), targetPlate)) {
      this.checkpointIndex++;
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
      if (updateBoss(this.boss, this.player, dt, this.currentLevel.plates.some(p => p.isPressed))) this.takeDamage();
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
      this.player,
      this.echo,
      this.recorder.getStatus() === 'recording',
      this.recorder.getDuration(),
      this.recorder.getSamples(),
      this.gameTime
    );
    renderAdventure(this.ctx, this, this.elapsedLevelTime);
  }

  private notifyHUD() {
    if (this.onHUDChange) {
      const echoState: EchoStatus = this.echo
        ? this.echo.status === 'replaying'
          ? 'replaying'
          : 'finished'
        : 'none';

      this.onHUDChange({
        screen: this.screen,
        levelName: this.currentLevel.name,
        levelSubtitle: this.currentLevel.subtitle,
        recordingStatus: this.recorder.getStatus(),
        recordingTimeRemaining: this.recorder.getRemainingTimeMs(),
        echoStatus: echoState,
        echoCount: this.echo ? 1 : 0,
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
      });
    }
  }
}
