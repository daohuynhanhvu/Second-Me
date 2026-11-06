/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData } from './types.ts';

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'LEVEL 01',
    subtitle: 'THE FIRST ECHO',
    description: 'Record your movement to the pressure plate, step back, and summon your Echo to open the blast door.',
    playerSpawn: {
      x: 220,
      y: 360,
      direction: 'right',
    },
    // Non-overlapping perimeter and interior bulkheads (1280x720)
    walls: [
      // Outer perimeter (40px thickness, zero corner overlap)
      { x: 0, y: 0, width: 1280, height: 40 }, // Top
      { x: 0, y: 680, width: 1280, height: 40 }, // Bottom
      { x: 0, y: 40, width: 40, height: 640 }, // Left
      { x: 1240, y: 40, width: 40, height: 640 }, // Right

      // Interior dividing wall separating Left Lab from Exit Chamber
      { x: 660, y: 40, width: 40, height: 260 }, // Top divider (y: 40..300)
      { x: 660, y: 420, width: 40, height: 260 }, // Bottom divider (y: 420..680)

      // Lab console obstacles in left room (spaced safely away from corridors)
      { x: 140, y: 120, width: 80, height: 40 }, // Top-left console
      { x: 140, y: 560, width: 80, height: 40 }, // Bottom-left console
      { x: 380, y: 560, width: 120, height: 40 }, // Storage pod
    ],
    plates: [
      {
        id: 'plate_1',
        x: 440,
        y: 180,
        width: 50,
        height: 50,
        isPressed: false,
        color: '#06b6d4',
      },
    ],
    doors: [
      {
        id: 'door_1',
        x: 660,
        y: 300,
        width: 40,
        height: 120,
        isOpen: false,
        openProgress: 0,
        requiredPlates: ['plate_1'],
        orientation: 'vertical',
      },
    ],
    exit: {
      x: 1040,
      y: 360,
      width: 60,
      height: 60,
      radius: 36,
    },
    decorations: [
      { type: 'circuit', x: 465, y: 230, width: 200, height: 4 },
      { type: 'terminal', x: 260, y: 40, width: 60, height: 30 },
      { type: 'hazard', x: 650, y: 285, width: 60, height: 15 },
      { type: 'hazard', x: 650, y: 420, width: 60, height: 15 },
    ],
  },
  {
    id: 2,
    name: 'LEVEL 02',
    subtitle: 'DUAL SYNCHRONY',
    description: 'A two-stage security protocol. Coordinate with your Echo across dual corridors to unlock the containment vault.',
    playerSpawn: {
      x: 90,
      y: 360,
      direction: 'right',
    },
    walls: [
      // Outer perimeter (zero corner overlap)
      { x: 0, y: 0, width: 1280, height: 40 },
      { x: 0, y: 680, width: 1280, height: 40 },
      { x: 0, y: 40, width: 40, height: 640 },
      { x: 1240, y: 40, width: 40, height: 640 },

      // Central horizontal divider splitting upper and lower lanes in western sector
      // Starts at x: 140, leaving a wide 100px corridor at x: 40..140
      { x: 140, y: 340, width: 440, height: 40 },

      // First security barrier dividing western and middle sectors
      { x: 580, y: 40, width: 40, height: 160 }, // Top wall (y: 40..200)
      // door_alpha is at y=200..320
      { x: 580, y: 320, width: 40, height: 360 }, // Continuous solid lower wall (y: 320..680)

      // Second security divider separating middle sector and exit chamber
      { x: 920, y: 40, width: 40, height: 260 }, // Top wall (y: 40..300)
      // door_vault is at y=300..420
      { x: 920, y: 420, width: 40, height: 260 }, // Bottom wall (y: 420..680)

      // Storage racks in middle sector (leaving wide corridors >= 100px)
      { x: 720, y: 160, width: 120, height: 40 },
    ],
    plates: [
      {
        id: 'plate_alpha',
        x: 360,
        y: 180,
        width: 50,
        height: 50,
        isPressed: false,
        color: '#38bdf8',
      },
      {
        id: 'plate_beta',
        x: 760,
        y: 480,
        width: 50,
        height: 50,
        isPressed: false,
        color: '#a855f7',
      },
    ],
    doors: [
      {
        id: 'door_alpha',
        x: 580,
        y: 200,
        width: 40,
        height: 120,
        isOpen: false,
        openProgress: 0,
        requiredPlates: ['plate_alpha'],
        orientation: 'vertical',
      },
      {
        id: 'door_vault',
        x: 920,
        y: 300,
        width: 40,
        height: 120,
        isOpen: false,
        openProgress: 0,
        requiredPlates: ['plate_beta'],
        orientation: 'vertical',
      },
    ],
    exit: {
      x: 1080,
      y: 360,
      width: 60,
      height: 60,
      radius: 36,
    },
    decorations: [
      { type: 'circuit', x: 385, y: 230, width: 195, height: 4 },
      { type: 'circuit', x: 785, y: 480, width: 135, height: 4 },
      { type: 'hazard', x: 570, y: 185, width: 60, height: 15 },
      { type: 'hazard', x: 910, y: 285, width: 60, height: 15 },
    ],
  },
  {
    id: 3,
    name: 'LEVEL 03',
    subtitle: 'TEMPORAL RELAY',
    description: 'Master temporal pathing: record a swift route to trigger remote switches while you navigate the central manifold.',
    playerSpawn: {
      x: 160,
      y: 220,
      direction: 'right',
    },
    walls: [
      // Outer perimeter (zero corner overlap)
      { x: 0, y: 0, width: 1280, height: 40 },
      { x: 0, y: 680, width: 1280, height: 40 },
      { x: 0, y: 40, width: 40, height: 640 },
      { x: 1240, y: 40, width: 40, height: 640 },

      // Column 1 structure (x: 320..360)
      { x: 320, y: 40, width: 40, height: 420 }, // Top wall (y: 40..460)
      // Passage at y: 460..560 (100px opening)
      { x: 320, y: 560, width: 40, height: 120 }, // Bottom wall (y: 560..680)

      // Column 2 structure (x: 560..600)
      // Top passage at y: 40..160 (120px opening)
      { x: 560, y: 160, width: 40, height: 520 }, // Wall (y: 160..680)

      // Column 3 structure (x: 800..840)
      // Fixed: height changed from 380 to 340 so it ends cleanly at y: 380 without overlapping door_middle
      { x: 800, y: 40, width: 40, height: 340 }, // Top wall (y: 40..380)
      // door_middle is at y=380..500
      { x: 800, y: 500, width: 40, height: 180 }, // Bottom wall (y: 500..680)

      // Column 4 structure (x: 1040..1080)
      { x: 1040, y: 40, width: 40, height: 260 }, // Top wall (y: 40..300)
      // door_final is at y=300..420
      { x: 1040, y: 420, width: 40, height: 260 }, // Bottom wall (y: 420..680)
    ],
    plates: [
      {
        id: 'plate_relay_1',
        x: 180,
        y: 540,
        width: 50,
        height: 50,
        isPressed: false,
        color: '#06b6d4',
      },
      {
        id: 'plate_relay_2',
        x: 680,
        y: 120,
        width: 50,
        height: 50,
        isPressed: false,
        color: '#10b981',
      },
    ],
    doors: [
      {
        id: 'door_middle',
        x: 800,
        y: 380,
        width: 40,
        height: 120,
        isOpen: false,
        openProgress: 0,
        requiredPlates: ['plate_relay_1'],
        orientation: 'vertical',
      },
      {
        id: 'door_final',
        x: 1040,
        y: 300,
        width: 40,
        height: 120,
        isOpen: false,
        openProgress: 0,
        requiredPlates: ['plate_relay_2'],
        orientation: 'vertical',
      },
    ],
    exit: {
      x: 1140,
      y: 360,
      width: 60,
      height: 60,
      radius: 36,
    },
    decorations: [
      { type: 'circuit', x: 230, y: 565, width: 570, height: 4 },
      { type: 'hazard', x: 790, y: 365, width: 60, height: 15 },
      { type: 'hazard', x: 1030, y: 285, width: 60, height: 15 },
    ],
  },
];

// Later trails alternate narrow gates and awakened wards. Each rune can be
// held by a stationary Echo; changing Echo never requires crossing a shut gate.
const perimeter = [
  { x: 0, y: 0, width: 1280, height: 40 }, { x: 0, y: 680, width: 1280, height: 40 },
  { x: 0, y: 40, width: 40, height: 640 }, { x: 1240, y: 40, width: 40, height: 640 },
];
function relayLevel(id: number, columns: number[], gatesY: number[], gap: number,
  runePoints: number[][], subtitle: string): LevelData {
  return {
    id, name: `LEVEL 0${id}`, subtitle, difficulty: id,
    description: id === 4
      ? 'Ba cổng nối tiếp, hành lang đảo chiều và ấn nguyền thức tỉnh. Chuyển Echo giữa các nút để đi tiếp.'
      : 'Bốn cổng hẹp và nhiều ấn nguyền hơn. Căn thời điểm vượt qua và thu hồi mảnh rèn cuối cùng.',
    playerSpawn: { x: 120, y: 350, direction: 'right' },
    walls: [...perimeter.map(w => ({ ...w })), ...columns.flatMap((x, i) => [
      { x, y: 40, width: 36, height: gatesY[i] - 40 },
      { x, y: gatesY[i] + gap, width: 36, height: 680 - gatesY[i] - gap },
    ])],
    plates: runePoints.map(([x, y], i) => ({ id: `relay_${id}_${i}`, x, y, width: 44, height: 44,
      color: i % 2 ? '#b0cb80' : '#65dcd1', isPressed: false })),
    doors: columns.map((x, i) => ({ id: `gate_${id}_${i}`, x, y: gatesY[i], width: 36, height: gap,
      isOpen: false, openProgress: 0, orientation: 'vertical', requiredPlates: [`relay_${id}_${i}`] })),
    exit: { x: 1150, y: 330, width: 60, height: 60, radius: 36 },
    hazards: (id === 4 ? [[450, 350], [820, 330]] : [[375, 350], [600, 340], [825, 360], [1120, 230]])
      .map(([x, y], i) => ({ x, y, radius: id === 4 ? 34 : 39, period: id === 4 ? 3.2 : 2.5, offset: i * 0.65 })),
  };
}
LEVELS[0].subtitle = 'ECHO GROVE';
LEVELS[1].subtitle = 'ROOTBOUND PASSAGE';
LEVELS[2].subtitle = 'WHISPERING RUINS';
LEVELS.push(relayLevel(4, [340, 660, 980], [440, 150, 440], 110,
  [[180, 180], [460, 540], [780, 150]], 'THORNBOUND LABYRINTH'));
LEVELS.push(relayLevel(5, [270, 490, 710, 930], [150, 450, 150, 450], 96,
  [[140, 520], [350, 120], [560, 530], [790, 120]], 'THE LAST EMBER'));
LEVELS.push({
  id: 6, name: 'LEVEL 06', subtitle: 'FROST GUARDIAN', difficulty: 6,
  description: 'Phá bốn trụ để gỡ giáp boss. Nhặt ô kỹ năng rơi mỗi 5 giây; Echo đánh lạc hướng và hỗ trợ tấn công.',
  playerSpawn: { x: 320, y: 360, direction: 'right' }, walls: perimeter.map(w => ({ ...w })),
  plates: [{ id: 'boss_rune', x: 600, y: 340, width: 64, height: 64, isPressed: false, color: '#e9ba75' }],
  doors: [], exit: { x: 1150, y: 330, width: 60, height: 60, radius: 36 },
});

// Shorten the third trail's unmarked detour and put each checkpoint before its
// own gate. One Echo can now hold each gate in turn within a six-second leg.
LEVELS[2].walls[4].height = 260;
LEVELS[2].walls[5].y = 420;
LEVELS[2].walls[5].height = 260;
LEVELS[2].walls[6].y = 300;
LEVELS[2].walls[6].height = 380;
Object.assign(LEVELS[2].plates[0], { x: 420, y: 180 });
Object.assign(LEVELS[2].plates[1], { x: 900, y: 180 });
LEVELS[2].decorations = LEVELS[2].decorations?.filter(d => d.type !== 'circuit');

// Each trap sits in walkable space, with room to take a longer safe line.
// Later levels combine more hazards and shorter impact cycles.
const trapLayouts: [import('./types.ts').Trap['kind'], number, number, number, number][][] = [
  [['vines',530,330,120,75], ['crusher',600,270,50,55], ['rocks',830,330,85,85]],
  [['vines',235,185,110,70], ['crusher',470,210,65,95], ['rocks',650,350,85,85], ['vines',805,405,95,70], ['rocks',1010,340,85,85]],
  [['crusher',260,315,55,80], ['vines',420,300,105,75], ['rocks',640,210,80,80], ['crusher',720,365,65,95], ['rocks',970,300,65,80], ['vines',1080,340,110,70]],
  [['vines',180,285,105,80], ['crusher',265,450,65,90], ['rocks',410,450,75,80], ['vines',475,380,115,75], ['crusher',585,165,65,80], ['rocks',755,325,80,85], ['crusher',895,450,70,90]],
  [['vines',175,330,95,80], ['crusher',200,160,60,76], ['rocks',345,280,75,80], ['crusher',420,460,60,76], ['vines',550,425,105,70], ['rocks',620,170,70,76], ['crusher',790,180,60,76], ['vines',815,290,105,80], ['crusher',860,460,60,76], ['rocks',1050,385,85,85]],
];
for (let i = 0; i < 5; i++) {
  // Replace the old generic glowing damage circles with distinct readable traps.
  LEVELS[i].hazards = [];
  LEVELS[i].traps = trapLayouts[i].map(([kind,x,y,width,height], index) => ({
    kind, x, y, width, height, period: 3.8 - i * 0.25, offset: (index % 3) * 0.35,
  }));
  LEVELS[i].description = `10 seconds per leg · ${LEVELS[i].plates.length} runes. Use Echo to hold gates; dodge crushers and falling rocks, and cross slowing vines.`;
}
