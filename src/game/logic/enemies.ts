import { enemyWaypoint } from './enemyNavigation.ts';
import { getActiveObstacles, resolveMovement } from './collision.ts';
import { segmentWall } from './combatGeometry.ts';
import type { LevelData } from './types.ts';
export type EnemyKind='goblin'|'bear'|'skull'|'shaman'|'minotaur';
export interface Enemy {id:string;kind:EnemyKind;x:number;y:number;homeX:number;homeY:number;hp:number;maxHp:number;mode:'idle'|'chase'|'warning'|'recover';timer:number;targetX:number;targetY:number;facingLeft:boolean;hitFlash:number;deathAge:number;targetId:number|null;targetEcho?:{x:number;y:number;aggroTime?:number}}
export const ENEMY_STATS={goblin:{hp:30,speed:68,reach:42,notice:180},bear:{hp:48,speed:60,reach:47,notice:175},skull:{hp:30,speed:82,reach:39,notice:190},shaman:{hp:36,speed:52,reach:155,notice:200},minotaur:{hp:75,speed:58,reach:58,notice:195}};
const encounters:Record<number,[EnemyKind,number,number][]>= {
 2:[['goblin',440,110],['goblin',700,580]],
 3:[['goblin',430,130],['bear',700,110],['skull',870,560]],
 4:[['goblin',230,100],['bear',500,110],['shaman',860,425],['skull',1130,570]],
 5:[['goblin',150,95],['skull',345,580],['bear',520,440],['shaman',730,95],['minotaur',925,435]],
};
export function createEnemies(level:LevelData):Enemy[]{
 const obstacles=getActiveObstacles(level.walls,level.doors);
 return (encounters[level.id]??[]).map(([kind,x,y],i)=>{
  const safe=resolveMovement(x,y,x,y,30,30,obstacles);
  return {id:`enemy-${level.id}-${i}`,kind,x:safe.x,y:safe.y,homeX:safe.x,homeY:safe.y,hp:ENEMY_STATS[kind].hp,maxHp:ENEMY_STATS[kind].hp,mode:'idle',timer:1+i*.25,targetX:x,targetY:y,facingLeft:false,hitFlash:0,deathAge:0,targetId:null};
 });
}
export interface EnemyTarget{x:number;y:number;echoIndex:number|null}
/** Leashed, wall-aware enemies telegraph a locked impact point before attacking. */
export function updateEnemies(enemies:Enemy[],level:LevelData,player:{x:number;y:number},echoes:{x:number;y:number;aggroTime?:number}[],dt:number,onHit:(target:EnemyTarget)=>void){
 const obstacles=getActiveObstacles(level.walls,level.doors);
 const sight=(a:{x:number;y:number},b:{x:number;y:number})=>!obstacles.some(w=>segmentWall(a,b,w,0)!==null);
 for(const e of enemies){
  e.hitFlash=Math.max(0,e.hitFlash-dt);if(e.hp<=0){e.deathAge+=dt;continue;}
  const stat=ENEMY_STATS[e.kind];e.timer-=dt;
  if(e.mode==='warning'){
   if(e.timer<=0){
    const index=e.targetEcho?echoes.indexOf(e.targetEcho):-1;
    const target=e.targetId===null?player:index>=0?echoes[index]:undefined;
    if(target&&Math.hypot(target.x-e.targetX,target.y-e.targetY)<(e.kind==='shaman'?34:44)&&sight(e,target))onHit({...target,echoIndex:e.targetId===null?null:index});
    e.mode='recover';e.timer=e.kind==='minotaur'?1.3:1.05;
   }continue;
  }
  if(e.mode==='recover'){if(e.timer<=0)e.mode='idle';continue;}
  // Any active Echo draws every living enemy; choose the nearest one deterministically.
  const decoy=echoes.map((echo,i)=>({...echo,echoIndex:i})).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  const target:EnemyTarget=decoy??{...player,echoIndex:null};const distance=Math.hypot(target.x-e.x,target.y-e.y);
  const engaged=!!decoy||(distance<stat.notice&&Math.hypot(e.x-e.homeX,e.y-e.homeY)<235&&sight(e,target));
  // Even ranged enemies close in on an Echo, allowing it to defend itself inside 3m.
  const attackReach=decoy?Math.min(stat.reach,90):stat.reach;
  if(engaged&&distance<attackReach&&e.timer<=0&&sight(e,target)){e.mode='warning';e.timer=e.kind==='minotaur'?.9:.7;e.targetX=target.x;e.targetY=target.y;e.targetId=target.echoIndex;e.targetEcho=target.echoIndex===null?undefined:echoes[target.echoIndex];continue;}
  const destination=engaged?(decoy?enemyWaypoint(e,target,obstacles,dt):target):{x:e.homeX,y:e.homeY},dx=destination.x-e.x,dy=destination.y-e.y,length=Math.hypot(dx,dy);
  e.mode=length>5?'chase':'idle';e.facingLeft=dx<0;
  if(length>5){const amount=Math.min(length,stat.speed*dt);const pos=resolveMovement(e.x,e.y,e.x+dx/length*amount,e.y+dy/length*amount,30,30,obstacles);e.x=pos.x;e.y=pos.y;}
 }
}
