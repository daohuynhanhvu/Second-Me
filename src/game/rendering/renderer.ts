import { NatureRenderer } from './natureLegacy.js';
import type { Direction, LevelData, MovementSample } from '../logic/types.ts';

// Keep the supplied forest sprites and rendering, without the old application.
interface ForestRenderer {
  particles: { emit(...args: any[]): void };
  reset(): void;
  update(dt: number, moving: boolean): void;
  emitMagic(kind: string, x: number, y: number, size?: number): void;
  render(ctx: CanvasRenderingContext2D, width: number, height: number, level: LevelData,
    player: {x:number;y:number;direction:Direction;isMoving:boolean}, echo: any,
    recording: boolean, duration: number, samples: MovementSample[], time: number): void;
}
const Base = NatureRenderer as unknown as { new(): ForestRenderer };
export class GameRenderer extends Base {}
