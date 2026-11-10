import { reachableWaypoint } from './enemyNavigation.ts';
import { getActiveObstacles, resolveMovement } from './collision.ts';
import { segmentWall } from './combatGeometry.ts';
import type { LevelData } from './types.ts';
import { DUMMY_RESET } from './training.ts';
/** 'dummy': the dev training ground's target (logic/training.ts): never moves, attacks or dies. */
export type EnemyKind='goblin'|'bear'|'skull'|'shaman'|'minotaur'|'dummy';
export interface Enemy {id:string;kind:EnemyKind;x:number;y:number;homeX:number;homeY:number;hp:number;maxHp:number;mode:'idle'|'chase'|'warning'|'recover';timer:number;targetX:number;targetY:number;facingLeft:boolean;hitFlash:number;deathAge:number;targetId:number|null;attackFx?:number;/** Push-back still to slide (logic/hitFeel.ts). */push?:{x:number;y:number};targetEcho?:{x:number;y:number;aggroTime?:number};
 /** The Echo this enemy was drawn to, and how long it keeps after it once out of sight (s). */
 lureEcho?:{x:number;y:number};lureTime?:number}
/**
 * notice: how near the player has to be (in sight) to be chased. lure: how near an Echo has to
 * be, in sight (walls and closed gates block it), to draw the enemy instead: notice + 80, a
 * little further, as an Echo is a decoy.
 */
export const ENEMY_STATS={goblin:{hp:30,speed:68,reach:42,notice:180,lure:260,damage:12},bear:{hp:48,speed:60,reach:47,notice:175,lure:255,damage:20},skull:{hp:30,speed:82,reach:39,notice:190,lure:270,damage:12},shaman:{hp:36,speed:52,reach:155,notice:200,lure:280,damage:16},minotaur:{hp:75,speed:58,reach:58,notice:195,lure:275,damage:28},dummy:{hp:500,speed:0,reach:0,notice:0,lure:0,damage:0}};
/** An enemy drawn to an Echo keeps after it this long once it loses sight of it (round a corner). */
export const LURE_MEMORY = 2;
/** How far from home an Echo can lead an enemy: its lure range plus this (px). */
export const LURE_LEASH = 120;
const encounters:Record<number,[EnemyKind,number,number][]>= {
 2:[['goblin',450,580],['goblin',1040,220]],
 3:[['goblin',830,130],['bear',420,120],['skull',440,580]],
 4:[['goblin',1140,400],['bear',850,580],['shaman',510,235],['skull',230,500]],
 5:[['goblin',1130,95],['skull',935,580],['bear',760,440],['shaman',550,95],['minotaur',355,435]],
 // Training ground (TRAINING_LEVEL_ID): a group of three for sweeping hits, one far for range.
 0:[['dummy',700,290],['dummy',770,360],['dummy',700,430],['dummy',1040,360]],
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
export function updateEnemies(enemies:Enemy[],level:LevelData,player:{x:number;y:number},echoes:{x:number;y:number;aggroTime?:number}[],dt:number,onHit:(target:EnemyTarget,damage:number,source:Enemy)=>void){
 const obstacles=getActiveObstacles(level.walls,level.doors);
 const sight=(a:{x:number;y:number},b:{x:number;y:number})=>!obstacles.some(w=>segmentWall(a,b,w,0)!==null);
 for(const e of enemies){
  e.attackFx=Math.max(0,(e.attackFx??0)-dt);
  e.hitFlash=Math.max(0,e.hitFlash-dt);
  // A dummy only counts the time since its last hit (strike() zeroes it) and refills when left alone.
  if(e.kind==='dummy'){e.timer+=dt;if(e.timer>DUMMY_RESET)e.hp=e.maxHp;continue;}
  if(e.hp<=0){e.deathAge+=dt;continue;}
  const stat=ENEMY_STATS[e.kind];e.timer-=dt;
  if(e.mode==='warning'){
   if(e.timer<=0){
    e.attackFx=.32;
    const index=e.targetEcho?echoes.indexOf(e.targetEcho):-1;
    const target=e.targetId===null?player:index>=0?echoes[index]:undefined;
    if(target&&Math.hypot(target.x-e.targetX,target.y-e.targetY)<(e.kind==='shaman'?34:44)&&sight(e,target))onHit({...target,echoIndex:e.targetId===null?null:index},stat.damage,e);
    e.mode='recover';e.timer=e.kind==='minotaur'?1.3:1.05;
   }continue;
  }
  if(e.mode==='recover'){if(e.timer<=0)e.mode='idle';continue;}
  // An Echo draws an enemy that can see it within its lure range (not through walls or closed
  // gates), the nearest first, and not further than LURE_LEASH past that range from home. Once
  // drawn, the enemy keeps after that Echo for LURE_MEMORY s out of sight, routing round walls.
  const fromHome=Math.hypot(e.x-e.homeX,e.y-e.homeY),leashed=fromHome<stat.lure+LURE_LEASH;
  let decoy:EnemyTarget|undefined=leashed?echoes.map((echo,i)=>({...echo,echoIndex:i}))
   .filter(c=>Math.hypot(c.x-e.x,c.y-e.y)<=stat.lure&&sight(e,c))
   .sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]:undefined;
  if(decoy){e.lureEcho=echoes[decoy.echoIndex!];e.lureTime=LURE_MEMORY;}
  else if(leashed&&e.lureEcho&&(e.lureTime??0)>0&&echoes.includes(e.lureEcho)){
   e.lureTime=(e.lureTime??0)-dt;decoy={...e.lureEcho,echoIndex:echoes.indexOf(e.lureEcho)};
  }else{e.lureEcho=undefined;e.lureTime=0;}
  const target:EnemyTarget=decoy??{...player,echoIndex:null};const distance=Math.hypot(target.x-e.x,target.y-e.y);
  const engaged=!!decoy||(distance<stat.notice&&fromHome<235&&sight(e,target));
  // Even ranged enemies close in on an Echo, allowing it to defend itself inside 3m.
  const attackReach=decoy?Math.min(stat.reach,90):stat.reach;
  if(engaged&&distance<attackReach&&e.timer<=0&&sight(e,target)){e.mode='warning';e.timer=e.kind==='minotaur'?.9:.7;e.targetX=target.x;e.targetY=target.y;e.targetId=target.echoIndex;e.targetEcho=target.echoIndex===null?undefined:echoes[target.echoIndex];continue;}
  // No way through to the Echo (a gate closed between them): give it up instead of walking into the wall.
  let way=decoy?reachableWaypoint(e,target,obstacles,dt):target;
  if(!way){e.lureEcho=undefined;e.lureTime=0;way={x:e.homeX,y:e.homeY};}
  const destination=engaged?way:{x:e.homeX,y:e.homeY},dx=destination.x-e.x,dy=destination.y-e.y,length=Math.hypot(dx,dy);
  e.mode=length>5?'chase':'idle';e.facingLeft=dx<0;
  if(length>5){const amount=Math.min(length,stat.speed*dt);const pos=resolveMovement(e.x,e.y,e.x+dx/length*amount,e.y+dy/length*amount,30,30,obstacles);e.x=pos.x;e.y=pos.y;}
 }
}
