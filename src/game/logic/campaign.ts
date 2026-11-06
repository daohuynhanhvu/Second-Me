export const MATERIALS = [
  { id: 'iron', name: 'Mảnh sắt cổ', detail: 'Kim loại còn ấm dưới lớp rêu.', icon: '◆', color: '#bbc8cf' },
  { id: 'wood', name: 'Gỗ linh mộc', detail: 'Lõi gỗ dùng làm chuôi kiếm.', icon: '✦', color: '#b5c987' },
  { id: 'crystal', name: 'Tinh thể Echo', detail: 'Lưu giữ ký ức của khu rừng.', icon: '◈', color: '#6ce5e8' },
  { id: 'ember', name: 'Than lửa thiêng', detail: 'Ngọn lửa không bao giờ tắt.', icon: '✺', color: '#ffaf70' },
  { id: 'rune', name: 'Ấn thạch cổ', detail: 'Mảnh cuối để đánh thức thanh kiếm.', icon: '◇', color: '#dac18e' },
] as const;

export type CharacterClass = 'mage' | 'swordsman';
export function levelRating(seconds: number): { stars: number; coins: number } {
  const stars = seconds <= 15 ? 3 : seconds <= 20 ? 2 : seconds <= 25 ? 1 : 0;
  return { stars, coins: [0, 4, 8, 12][stars] };
}

export class Campaign {
  completed: number[] = [];
  forged = false;
  bossDefeated = false;
  coins = 0;
  timeItems = 0;
  bestStars: Record<number, number> = {};
  load() {
    try {
      if (typeof localStorage === 'undefined') return;
      const value = JSON.parse(localStorage.getItem('second-me-campaign-v3') ?? '{}');
      this.completed = [...new Set<number>((value.completed ?? []).filter((id: unknown) => Number.isInteger(id) && Number(id) >= 1 && Number(id) <= 5))].sort();
      // Only a continuous run unlocks later trails.
      this.completed = this.completed.filter((id, i) => id === i + 1);
      this.forged = this.canForge && value.forged === true;
      this.bossDefeated = this.forged && value.bossDefeated === true;
      this.coins = Number.isSafeInteger(value.coins) && value.coins >= 0 ? value.coins : 0;
      this.timeItems = Number.isSafeInteger(value.timeItems) && value.timeItems >= 0 ? value.timeItems : 0;
      this.bestStars = Object.fromEntries(Object.entries(value.bestStars ?? {}).filter(([id, stars]) => Number(id) >= 1 && Number(id) <= 6 && Number.isInteger(stars) && Number(stars) >= 0 && Number(stars) <= 3)) as Record<number, number>;
    } catch { this.completed = []; this.forged = false; this.bossDefeated = false; this.coins = 0; this.timeItems = 0; this.bestStars = {}; }
  }
  save() {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('second-me-campaign-v3', JSON.stringify({
      completed: this.completed, forged: this.forged, bossDefeated: this.bossDefeated,
      coins: this.coins, timeItems: this.timeItems, bestStars: this.bestStars,
    })); } catch { /* Play remains available if browser storage is disabled. */ }
  }
  award(levelId: number): boolean {
    if (levelId < 1 || levelId > 5 || this.completed.includes(levelId)) return false;
    this.completed.push(levelId);
    this.save();
    return true;
  }
  completeLevel(levelId: number, seconds: number) {
    const reward = levelRating(seconds);
    this.coins += reward.coins;
    this.bestStars[levelId] = Math.max(this.bestStars[levelId] ?? 0, reward.stars);
    this.save();
    return reward;
  }
  buyTimeItem() { if (this.coins < 5) return false; this.coins -= 5; this.timeItems++; this.save(); return true; }
  useTimeItem() { if (this.timeItems < 1) return false; this.timeItems--; this.save(); return true; }
  get canForge() { return MATERIALS.every((_, i) => this.completed.includes(i + 1)); }
  forge(): boolean {
    if (!this.canForge || this.forged) return false;
    this.forged = true;
    this.save();
    return true;
  }
  get unlockedLevel() { return Math.min(5, this.completed.length); }
  reset() { this.completed = []; this.forged = false; this.bossDefeated = false; this.coins = 0; this.timeItems = 0; this.bestStars = {}; this.save(); }
}

export interface BossState {
  x: number; y: number; hp: number; maxHp: number; phase: number;
  mode: 'stalking' | 'warning' | 'strike' | 'recover'; timer: number;
  targetX: number; targetY: number; hitFlash: number;
  projectiles: { x: number; y: number; vx: number; vy: number; life: number }[];
}
export function createBoss(): BossState {
  return { x: 890, y: 350, hp: 240, maxHp: 240, phase: 1, mode: 'stalking', timer: 2,
    targetX: 0, targetY: 0, hitFlash: 0, projectiles: [] };
}

export function swordHit(boss: BossState, x: number, y: number, empowered = false): number {
  if (boss.hp <= 0 || Math.hypot(boss.x - x, boss.y - y) > 112) return 0;
  const damage = empowered ? 24 : 15;
  boss.hp = Math.max(0, boss.hp - damage);
  boss.hitFlash = 0.18;
  return damage;
}

export function updateBoss(boss: BossState, player: { x: number; y: number }, dt: number,
  empowered: boolean): boolean {
  if (boss.hp <= 0) return false;
  boss.phase = boss.hp > 160 ? 1 : boss.hp > 80 ? 2 : 3;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.timer -= dt;
  let hit = false;
  if (boss.mode === 'stalking') {
    const dx = player.x - boss.x, dy = player.y - boss.y, distance = Math.hypot(dx, dy);
    if (distance > 85) {
      const speed = (55 + boss.phase * 14) * (empowered ? 0.55 : 1);
      boss.x += dx / distance * speed * dt;
      boss.y += dy / distance * speed * dt;
    }
    if (boss.timer <= 0) {
      boss.mode = 'warning'; boss.timer = boss.phase === 3 ? 0.8 : 1.1;
      boss.targetX = player.x; boss.targetY = player.y;
    }
  } else if (boss.mode === 'warning' && boss.timer <= 0) {
    boss.mode = 'strike'; boss.timer = 0.3;
    hit = Math.hypot(player.x - boss.targetX, player.y - boss.targetY) < 82;
    if (boss.phase >= 2) {
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        boss.projectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * 125,
          vy: Math.sin(angle) * 125, life: 3.5 });
      }
    }
  } else if (boss.mode === 'strike' && boss.timer <= 0) {
    boss.mode = 'recover'; boss.timer = 1.4;
  } else if (boss.mode === 'recover' && boss.timer <= 0) {
    boss.mode = 'stalking'; boss.timer = Math.max(1, 2.2 - boss.phase * 0.3);
  }
  for (const shot of boss.projectiles) {
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    if (Math.hypot(shot.x - player.x, shot.y - player.y) < 19) { shot.life = 0; hit = true; }
  }
  boss.projectiles = boss.projectiles.filter(s => s.life > 0 && s.x > 40 && s.x < 1240 && s.y > 40 && s.y < 680);
  return hit;
}
