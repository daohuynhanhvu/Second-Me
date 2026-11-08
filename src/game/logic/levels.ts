import type { LevelData, Rect, Trap } from './types.ts';

const perimeter:Rect[]=[{x:0,y:0,width:1280,height:40},{x:0,y:680,width:1280,height:40},{x:0,y:40,width:40,height:640},{x:1240,y:40,width:40,height:640}];
const plate=(id:string,x:number,y:number)=>({id,x,y,width:50,height:50,isPressed:false,color:'#79d5be'});
const gate=(id:string,x:number,y:number,height:number,requiredPlates:string[])=>({id,x,y,width:36,height,isOpen:false,openProgress:0,orientation:'vertical' as const,requiredPlates});
const divider=(x:number,y:number,gap:number):Rect[]=>[{x,y:40,width:36,height:y-40},{x,y:y+gap,width:36,height:680-y-gap}];
const trap=(kind:Trap['kind'],x:number,y:number,width:number,height:number,period:number,offset=0):Trap=>({kind,x,y,width,height,period,offset});
const base=(id:number,subtitle:string,x:number,y:number):LevelData=>({id,name:`LEVEL 0${id}`,subtitle,difficulty:id,description:'',playerSpawn:{x,y,direction:'right'},walls:perimeter.map(w=>({...w})),plates:[],doors:[],exit:{x:1140,y:330,width:60,height:60,radius:36},traps:[]});

const first=base(1,'ECHO GROVE',220,360);
first.plates=[plate('plate_1',440,180)];
first.walls.push(...divider(660,300,120),{x:320,y:300,width:180,height:32},{x:140,y:560,width:80,height:40},{x:380,y:560,width:120,height:40});
first.doors=[gate('door_1',660,300,120,['plate_1'])];
first.exit={x:1040,y:360,width:60,height:60,radius:36};
first.traps=[trap('vines',530,335,90,70,4.8),trap('crusher',600,255,48,60,4.8,.3),trap('rocks',850,325,88,88,5.2,1.1)];
first.description='Leave one Echo holding the northern rune. Choose a slow safe path or time the stone jaws, then cross while the Echo keeps the gate open.';

const second=base(2,'ROOTBOUND PASSAGE',90,360);
second.plates=[plate('plate_alpha',360,180),plate('plate_beta',760,480)];
second.walls.push({x:140,y:340,width:440,height:36},...divider(580,200,120),...divider(920,300,120),{x:700,y:300,width:140,height:32});
second.doors=[gate('door_alpha',580,200,120,['plate_alpha']),gate('door_vault',920,300,120,['plate_alpha','plate_beta'])];
second.exit={x:1080,y:360,width:60,height:60,radius:36};
second.traps=[trap('vines',220,210,95,65,4.6),trap('crusher',475,220,70,80,4.5,.2),trap('rocks',650,395,78,78,4.8,1.5),trap('spikes',825,345,70,60,4.5,2.2),trap('vines',1010,445,95,65,4.6)];
second.description='Keep your first Echo on the northern rune, then leave a second at the southern rune. The last gate needs both memories at once.';

const third=base(3,'WHISPERING RUINS',130,350);
third.plates=[plate('whisper_a',285,145),plate('whisper_b',405,535),plate('whisper_c',800,150)];
third.walls.push({x:180,y:320,width:270,height:32},...divider(570,300,120),...divider(1010,440,104),{x:710,y:340,width:210,height:32});
third.doors=[gate('whisper_join',570,300,120,['whisper_a','whisper_b']),gate('whisper_exit',1010,440,104,['whisper_a','whisper_b','whisper_c'])];
third.exit={x:1140,y:500,width:60,height:60,radius:36};
third.traps=[trap('vines',210,230,105,65,4.3),trap('crusher',475,270,62,75,4.2,.3),trap('spikes',475,390,62,65,4.2,2.1),trap('rocks',670,230,80,80,4.6,1.4),trap('vines',770,400,100,60,4.3),trap('crusher',925,450,60,75,4.2,1.8),trap('rocks',1090,300,85,85,4.6,.4)];
third.description='Two remote runes open the first crossing. Record both approaches, keep two Echoes behind, then carry a third memory into the eastern grove.';

const fourth=base(4,'THORNBOUND LABYRINTH',120,350);
fourth.plates=[plate('thorn_a',165,150),plate('thorn_b',450,535),plate('thorn_c',790,145),plate('thorn_d',830,535)];
fourth.walls.push(...divider(340,440,110),...divider(650,150,110),...divider(1000,440,104),{x:730,y:330,width:180,height:32});
fourth.doors=[gate('thorn_first',340,440,110,['thorn_a']),gate('thorn_second',650,150,110,['thorn_a','thorn_b']),gate('thorn_final',1000,440,104,['thorn_a','thorn_b','thorn_c','thorn_d'])];
fourth.traps=[trap('vines',170,280,95,75,4.1),trap('crusher',265,450,65,75,4,.2),trap('rocks',400,400,78,78,4.4,1.1),trap('spikes',570,170,65,75,4,2.2),trap('vines',475,320,90,65,4.1),trap('rocks',750,235,85,75,4.4,2.6),trap('crusher',925,450,65,75,4,1.6),trap('spikes',925,200,65,75,4,3),trap('rocks',1080,430,80,80,4.4,.5)];
fourth.description='Four Echoes must form a living chain. The third chamber forks around a fallen trunk: park the northern Echo before recording the southern route.';

const fifth=base(5,'THE LAST EMBER',120,350);
fifth.plates=[plate('ember_a',120,515),plate('ember_b',300,115),plate('ember_c',490,525),plate('ember_d',680,115),plate('ember_e',870,525)];
fifth.walls.push(...divider(250,150,100),...divider(440,450,100),...divider(630,150,100),...divider(820,450,100),...divider(1010,150,100));
fifth.doors=[gate('ember_first',250,150,100,['ember_a']),gate('ember_second',440,450,100,['ember_a','ember_b']),gate('ember_third',630,150,100,['ember_a','ember_b','ember_c']),gate('ember_fourth',820,450,100,['ember_b','ember_c','ember_d']),gate('ember_final',1010,150,100,['ember_b','ember_c','ember_d','ember_e'])];
fifth.traps=[trap('vines',145,335,80,70,3.9),trap('crusher',175,165,60,70,3.8,.1),trap('rocks',310,260,70,80,4.2,1.1),trap('spikes',365,460,60,75,3.8,1.9),trap('vines',480,340,85,65,3.9),trap('rocks',550,250,65,75,4.2,2.5),trap('crusher',555,165,60,70,3.8,1.1),trap('spikes',745,460,60,75,3.8,2.9),trap('rocks',695,265,75,75,4.2,.2),trap('vines',865,335,75,65,3.9),trap('crusher',935,165,60,70,3.8,2.2)];
fifth.description='Five runes, only four Echoes. After the third gate, recall the first Echo: the final seals need runes 2, 3, 4 and 5 together. Preserve the other three while recording the final crossing.';

export const LEVELS:LevelData[]=[first,second,third,fourth,fifth];
for(const level of LEVELS)level.exitRequiredPlates=level.plates.map(p=>p.id);
fifth.exitRequiredPlates=['ember_b','ember_c','ember_d','ember_e'];
LEVELS.push({id:6,name:'LEVEL 06',subtitle:'FROST GUARDIAN',difficulty:6,description:'Use Echoes as decoys, replay attacks, and hold the central rune for empowered strikes. Break four pillars before attacking the Guardian.',playerSpawn:{x:320,y:360,direction:'right'},walls:perimeter.map(w=>({...w})),plates:[{...plate('boss_rune',600,340),width:64,height:64}],doors:[],exit:{x:1150,y:330,width:60,height:60,radius:36}});

/**
 * Dev-only training ground (logic/training.ts): an open arena of dummies, never part of LEVELS,
 * so the journey map, the campaign and its rewards never see it. Id 0 draws it as the first
 * forest; its exit returns to the camp. Entered through GameEngine.enterTraining (dev mode).
 */
export const TRAINING_LEVEL_ID = 0;
/** currentLevelIdx while in the training ground. */
export const TRAINING_IDX = -1;
export const TRAINING_LEVEL: LevelData = {
  ...base(TRAINING_LEVEL_ID, 'TRAINING DUMMY', 260, 360),
  name: 'TRAINING',
  description: 'Dev training ground: dummies never die and never fight back.',
  exit: { x: 1150, y: 600, width: 60, height: 60, radius: 36 },
  exitRequiredPlates: [],
};
/** The level at a campaign index, or the training ground at TRAINING_IDX. */
export const levelAt = (idx: number): LevelData => (idx === TRAINING_IDX ? TRAINING_LEVEL : LEVELS[idx]);
