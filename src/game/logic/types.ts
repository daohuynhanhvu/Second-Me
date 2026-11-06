/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MovementSample {
  time: number; // milliseconds from start of recording
  x: number;
  y: number;
  direction: Direction;
  isMoving?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PressurePlate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPressed: boolean;
  color?: string;
  pressTimer?: number;
}

export interface SecurityDoor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  openProgress: number; // 0 (closed) to 1 (fully open)
  requiredPlates: string[]; // plate IDs that must all be pressed
  orientation: 'vertical' | 'horizontal';
}

export interface ExitPortal {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  difficulty?: number;
  traps?: Trap[];
  hazards?: { x: number; y: number; radius: number; period: number; offset: number }[];
  playerSpawn: { x: number; y: number; direction: Direction };
  walls: Rect[];
  plates: PressurePlate[];
  doors: SecurityDoor[];
  exit: ExitPortal;
  decorations?: {
    type: 'terminal' | 'circuit' | 'crate' | 'hazard';
    x: number;
    y: number;
    width?: number;
    height?: number;
  }[];
}

export interface Trap extends Rect {
  kind: 'crusher' | 'vines' | 'rocks';
  period: number;
  offset: number;
}

export type GameScreen = 'intro' | 'loading' | 'lobby' | 'playing' | 'paused' | 'victory' | 'forge' | 'defeat' | 'ending';
export type RecordingStatus = 'idle' | 'recording' | 'recorded';
export type EchoStatus = 'none' | 'replaying' | 'finished';
