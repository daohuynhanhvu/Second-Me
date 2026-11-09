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

// Trial 2: a U-shaped journey, from the south-west through the eastern grove
// and back into a sealed north-west sanctuary.
const second=base(2,'ROOTBOUND PASSAGE',180,560);
second.plates=[plate('plate_alpha',240,440),plate('plate_beta',900,160)];
second.walls.push({x:40,y:320,width:520,height:36},{x:680,y:320,width:560,height:36},{x:420,y:40,width:36,height:100},{x:420,y:260,width:36,height:60},{x:730,y:440,width:180,height:32});
second.doors=[{...gate('door_alpha',560,320,36,['plate_alpha']),width:120,orientation:'horizontal'},gate('door_vault',420,140,120,['plate_alpha','plate_beta'])];
second.exit={x:150,y:180,width:60,height:60,radius:36};
second.traps=[trap('vines',350,465,90,65,4.6),trap('crusher',575,370,80,60,4.5,.2),trap('rocks',770,205,78,78,4.8,1.5),trap('spikes',480,165,70,60,4.5,2.2),trap('vines',1010,110,95,65,4.6)];
second.description='Hold rune I in the southern grove, cross north and record rune II in the east. Both Echoes unlock the western sanctuary: the exit is back toward where your journey began.';

// Trial 3: clockwise traversal of four chambers rather than parallel corridors.
const third=base(3,'WHISPERING RUINS',1080,160);
third.playerSpawn.direction='left';
third.plates=[plate('whisper_a',900,180),plate('whisper_b',240,160),plate('whisper_c',260,520)];
third.walls.push({x:640,y:40,width:36,height:110},{x:640,y:260,width:36,height:220},{x:640,y:590,width:36,height:90},{x:40,y:340,width:180,height:36},{x:330,y:340,width:310,height:36},{x:676,y:340,width:564,height:36});
third.doors=[gate('whisper_join',640,150,110,['whisper_a']),{...gate('whisper_descent',220,340,36,['whisper_a','whisper_b']),width:110,orientation:'horizontal'},gate('whisper_exit',640,480,110,['whisper_a','whisper_b','whisper_c'])];
third.exit={x:1040,y:540,width:60,height:60,radius:36};
third.traps=[trap('vines',1000,230,100,65,4.3),trap('crusher',700,165,62,75,4.2,.3),trap('spikes',440,200,65,65,4.2,2.1),trap('rocks',120,220,80,80,4.6,1.4),trap('vines',390,440,100,60,4.3),trap('crusher',555,485,60,75,4.2,1.8),trap('rocks',900,460,85,85,4.6,.4)];
third.description='Start in the north-east. Echo I opens the westward crossing; Echo II unlocks the descent; Echo III keeps the southern crossing open. Circle through all four chambers to reach the south-east exit.';

// Trial 4: wind inward from the north-east, then turn north inside the final room.
const fourth=base(4,'THORNBOUND LABYRINTH',1120,150);
fourth.playerSpawn.direction='down';
fourth.plates=[plate('thorn_a',1080,480),plate('thorn_b',770,490),plate('thorn_c',440,150),plate('thorn_d',180,570)];
fourth.walls.push(...divider(950,460,110),...divider(620,150,110),...divider(320,460,110),{x:40,y:330,width:60,height:36},{x:220,y:330,width:100,height:36});
fourth.doors=[gate('thorn_first',950,460,110,['thorn_a']),gate('thorn_second',620,150,110,['thorn_a','thorn_b']),gate('thorn_third',320,460,110,['thorn_a','thorn_b','thorn_c']),{...gate('thorn_final',100,330,36,['thorn_a','thorn_b','thorn_c','thorn_d']),width:120,orientation:'horizontal'}];
fourth.exit={x:130,y:180,width:60,height:60,radius:36};
fourth.traps=[trap('vines',1050,300,95,75,4.1),trap('crusher',1010,460,65,75,4,.2),trap('rocks',800,350,78,78,4.4,1.1),trap('spikes',710,170,65,75,4,2.2),trap('vines',475,320,90,65,4.1),trap('rocks',380,235,85,75,4.4,2.6),trap('crusher',375,460,65,75,4,1.6),trap('spikes',120,410,65,75,4,3),trap('rocks',230,100,65,65,4.4,.5)];
fourth.description='Wind from the eastern grove toward the inner sanctuary. Hold I in the south-east, II beyond the first gate, III in the northern chamber, then IV in the south-west. All four Echoes open the last turn north.';

const fifth=base(5,'THE LAST EMBER',120,350);
fifth.plates=[plate('ember_a',120,515),plate('ember_b',300,115),plate('ember_c',490,525),plate('ember_d',680,115),plate('ember_e',870,525)];
fifth.walls.push(...divider(250,150,100),...divider(440,450,100),...divider(630,150,100),...divider(820,450,100),...divider(1010,150,100));
fifth.doors=[gate('ember_first',250,150,100,['ember_a']),gate('ember_second',440,450,100,['ember_a','ember_b']),gate('ember_third',630,150,100,['ember_a','ember_b','ember_c']),gate('ember_fourth',820,450,100,['ember_b','ember_c','ember_d']),gate('ember_final',1010,150,100,['ember_b','ember_c','ember_d','ember_e'])];
fifth.traps=[trap('vines',145,335,80,70,3.9),trap('crusher',175,165,60,70,3.8,.1),trap('rocks',310,260,70,80,4.2,1.1),trap('spikes',365,460,60,75,3.8,1.9),trap('vines',480,340,85,65,3.9),trap('rocks',550,250,65,75,4.2,2.5),trap('crusher',555,165,60,70,3.8,1.1),trap('spikes',745,460,60,75,3.8,2.9),trap('rocks',695,265,75,75,4.2,.2),trap('vines',865,335,75,65,3.9),trap('crusher',935,165,60,70,3.8,2.2)];
fifth.description='Five runes, only four Echoes. After the third gate, recall the first Echo: the final seals need runes 2, 3, 4 and 5 together. Preserve the other three while recording the final crossing.';

// Trial 5 reverses the relay, beginning in the south-east and ending north-west.
const mirrorRect=(r:Rect)=>{r.x=1280-r.x-r.width;};
fifth.walls.forEach(mirrorRect);fifth.plates.forEach(mirrorRect);fifth.doors.forEach(mirrorRect);fifth.traps?.forEach(mirrorRect);
fifth.playerSpawn={x:1185,y:350,direction:'left'};
fifth.exit={x:110,y:190,width:60,height:60,radius:36};

export const LEVELS:LevelData[]=[first,second,third,fourth,fifth];
for(const level of LEVELS)level.exitRequiredPlates=level.plates.map(p=>p.id);
fifth.exitRequiredPlates=['ember_b','ember_c','ember_d','ember_e'];
LEVELS.push({id:6,name:'LEVEL 06',subtitle:'FROST GUARDIAN',difficulty:6,description:'Use Echoes as decoys, replay attacks, and hold the central rune for empowered strikes. Break four pillars before attacking the Guardian.',playerSpawn:{x:640,y:580,direction:'up'},walls:perimeter.map(w=>({...w})),plates:[{...plate('boss_rune',600,340),width:64,height:64}],doors:[],exit:{x:610,y:140,width:60,height:60,radius:36}});

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
