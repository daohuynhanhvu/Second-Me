/** Shared damage units: health, shields and Echo stability use points, never hit counts. */
export const PLAYER_MAX_HP = 100;
export const DAMAGE = { trap: 20, hazard: 20, dissonance: 20, bossSlam: 30, bossArea: 24, bossProjectile: 16 } as const;
export const SHIELD = { stone: 40, armor: 20 } as const;
export function damagePoints(value:number) { return Number.isFinite(value) ? Math.max(0,Math.round(value*1e6)/1e6) : 0; }
export function applyDamage(hp:number,amount:number,shield=0){
 const incoming=damagePoints(amount),absorbed=Math.min(shield,incoming),dealt=Math.min(hp,damagePoints(incoming-absorbed));
 return {hp:damagePoints(hp-dealt),shield:damagePoints(shield-absorbed),absorbed:damagePoints(absorbed),dealt};
}
