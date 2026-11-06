/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData, Rect, SecurityDoor, PressurePlate, ExitPortal } from './types.ts';
import { rectIntersects, getCharacterBoundingBox, getActiveObstacles } from './collision.ts';

export interface ValidationIssue {
  levelId: number;
  levelName: string;
  type: 'ERROR' | 'WARNING';
  category: 'SPAWN' | 'OVERLAP' | 'DOOR' | 'PLATE' | 'EXIT' | 'CONNECTIVITY';
  message: string;
  coordinates?: { x: number; y: number; width?: number; height?: number };
}

export interface MapValidationReport {
  isValid: boolean;
  totalLevels: number;
  errorsCount: number;
  warningsCount: number;
  issues: ValidationIssue[];
}

export class MapValidator {
  /**
   * Validates a single level and returns all detected errors/warnings.
   */
  public static validateLevel(level: LevelData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 1. Check player spawn against walls
    const playerBox = getCharacterBoundingBox(
      level.playerSpawn.x,
      level.playerSpawn.y,
      24,
      24
    );

    // Check spawn in outer bounds
    if (
      playerBox.x < 40 ||
      playerBox.y < 40 ||
      playerBox.x + playerBox.width > 1240 ||
      playerBox.y + playerBox.height > 680
    ) {
      issues.push({
        levelId: level.id,
        levelName: level.name,
        type: 'ERROR',
        category: 'SPAWN',
        message: `Player spawn (${level.playerSpawn.x}, ${level.playerSpawn.y}) is out of safe bounds [40..1240, 40..680].`,
        coordinates: { x: level.playerSpawn.x, y: level.playerSpawn.y },
      });
    }

    // Check spawn intersecting walls
    for (const wall of level.walls) {
      if (rectIntersects(playerBox, wall)) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          type: 'ERROR',
          category: 'SPAWN',
          message: `Player spawn (${level.playerSpawn.x}, ${level.playerSpawn.y}) overlaps solid wall at (${wall.x}, ${wall.y}, ${wall.width}x${wall.height}).`,
          coordinates: { x: level.playerSpawn.x, y: level.playerSpawn.y },
        });
      }
    }

    // Check spawn intersecting closed doors
    for (const door of level.doors) {
      const doorRect: Rect = { x: door.x, y: door.y, width: door.width, height: door.height };
      if (rectIntersects(playerBox, doorRect)) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          type: 'ERROR',
          category: 'SPAWN',
          message: `Player spawn (${level.playerSpawn.x}, ${level.playerSpawn.y}) overlaps door '${door.id}'.`,
          coordinates: { x: level.playerSpawn.x, y: level.playerSpawn.y },
        });
      }
    }

    // 2. Check walls overlapping doors
    for (const door of level.doors) {
      const doorRect: Rect = { x: door.x, y: door.y, width: door.width, height: door.height };
      for (const wall of level.walls) {
        // Exclude adjacent walls that just touch the door boundary
        const intersects =
          doorRect.x < wall.x + wall.width &&
          doorRect.x + doorRect.width > wall.x &&
          doorRect.y < wall.y + wall.height &&
          doorRect.y + doorRect.height > wall.y;

        if (intersects) {
          // Calculate intersection area
          const overlapW = Math.min(doorRect.x + doorRect.width, wall.x + wall.width) - Math.max(doorRect.x, wall.x);
          const overlapH = Math.min(doorRect.y + doorRect.height, wall.y + wall.height) - Math.max(doorRect.y, wall.y);
          if (overlapW > 1 && overlapH > 1) {
            issues.push({
              levelId: level.id,
              levelName: level.name,
              type: 'ERROR',
              category: 'DOOR',
              message: `Door '${door.id}' at (${door.x}, ${door.y}) is overlapped by wall at (${wall.x}, ${wall.y}, ${wall.width}x${wall.height}) by ${overlapW}x${overlapH}px.`,
              coordinates: { x: door.x, y: door.y, width: door.width, height: door.height },
            });
          }
        }
      }
    }

    // 3. Check duplicate or deeply overlapping walls
    for (let i = 0; i < level.walls.length; i++) {
      for (let j = i + 1; j < level.walls.length; j++) {
        const w1 = level.walls[i];
        const w2 = level.walls[j];
        const overlapW = Math.min(w1.x + w1.width, w2.x + w2.width) - Math.max(w1.x, w2.x);
        const overlapH = Math.min(w1.y + w1.height, w2.y + w2.height) - Math.max(w1.y, w2.y);
        // If overlap is significant (more than corner touching)
        if (overlapW > 2 && overlapH > 2) {
          issues.push({
            levelId: level.id,
            levelName: level.name,
            type: 'WARNING',
            category: 'OVERLAP',
            message: `Redundant wall overlap between wall (${w1.x}, ${w1.y}) and (${w2.x}, ${w2.y}) by ${overlapW}x${overlapH}px.`,
            coordinates: { x: w1.x, y: w1.y, width: w1.width, height: w1.height },
          });
        }
      }
    }

    // 4. Check Pressure Plates
    for (const plate of level.plates) {
      const plateRect: Rect = { x: plate.x, y: plate.y, width: plate.width, height: plate.height };

      // Ensure plate is not inside walls
      for (const wall of level.walls) {
        if (rectIntersects(plateRect, wall)) {
          issues.push({
            levelId: level.id,
            levelName: level.name,
            type: 'ERROR',
            category: 'PLATE',
            message: `Pressure plate '${plate.id}' at (${plate.x}, ${plate.y}) overlaps solid wall at (${wall.x}, ${wall.y}).`,
            coordinates: { x: plate.x, y: plate.y, width: plate.width, height: plate.height },
          });
        }
      }

      // Check minimum dimensions (should be at least 30x30 for reliable stepping)
      if (plate.width < 30 || plate.height < 30) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          type: 'WARNING',
          category: 'PLATE',
          message: `Pressure plate '${plate.id}' is smaller than 30x30 (${plate.width}x${plate.height}).`,
          coordinates: { x: plate.x, y: plate.y },
        });
      }
    }

    // 5. Check Door required plates exist
    const plateIds = new Set(level.plates.map((p) => p.id));
    for (const door of level.doors) {
      for (const req of door.requiredPlates) {
        if (!plateIds.has(req)) {
          issues.push({
            levelId: level.id,
            levelName: level.name,
            type: 'ERROR',
            category: 'DOOR',
            message: `Door '${door.id}' requires non-existent plate '${req}'.`,
            coordinates: { x: door.x, y: door.y },
          });
        }
      }
    }

    // 6. Check Exit Portal
    const exitCenter = {
      x: level.exit.x + level.exit.width / 2,
      y: level.exit.y + level.exit.height / 2,
    };
    const exitBox = getCharacterBoundingBox(exitCenter.x, exitCenter.y, level.exit.radius * 1.5, level.exit.radius * 1.5);
    for (const wall of level.walls) {
      if (rectIntersects(exitBox, wall)) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          type: 'ERROR',
          category: 'EXIT',
          message: `Exit portal at (${level.exit.x}, ${level.exit.y}) overlaps solid wall at (${wall.x}, ${wall.y}).`,
          coordinates: { x: level.exit.x, y: level.exit.y },
        });
      }
    }

    // 7. Connectivity & Reachability via Grid Flood-Fill
    const connectivityIssues = this.validateConnectivity(level);
    issues.push(...connectivityIssues);

    return issues;
  }

  /**
   * Grid-based flood-fill connectivity check (using 20px stepping grid).
   */
  private static validateConnectivity(level: LevelData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const step = 20;
    const cols = Math.floor(1280 / step);
    const rows = Math.floor(720 / step);

    // Map obstacles (assuming all doors can eventually be opened)
    const isSolid = (gx: number, gy: number, ignoreDoors: boolean): boolean => {
      const px = gx * step + step / 2;
      const py = gy * step + step / 2;
      const charBox = getCharacterBoundingBox(px, py, 22, 22);

      // Check outer boundaries
      if (charBox.x < 40 || charBox.y < 40 || charBox.x + charBox.width > 1240 || charBox.y + charBox.height > 680) {
        return true;
      }

      // Check walls
      for (const wall of level.walls) {
        if (rectIntersects(charBox, wall)) return true;
      }

      if (!ignoreDoors) {
        for (const door of level.doors) {
          const doorRect: Rect = { x: door.x, y: door.y, width: door.width, height: door.height };
          if (rectIntersects(charBox, doorRect)) return true;
        }
      }

      return false;
    };

    // BFS from player spawn
    const startGx = Math.floor(level.playerSpawn.x / step);
    const startGy = Math.floor(level.playerSpawn.y / step);

    const visited = new Set<string>();
    const queue: [number, number][] = [];

    if (!isSolid(startGx, startGy, true)) {
      queue.push([startGx, startGy]);
      visited.add(`${startGx},${startGy}`);
    }

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited.has(key)) {
          if (!isSolid(nx, ny, true)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
    }

    // Check if Exit is reached
    const exitGx = Math.floor((level.exit.x + level.exit.width / 2) / step);
    const exitGy = Math.floor((level.exit.y + level.exit.height / 2) / step);
    if (!visited.has(`${exitGx},${exitGy}`)) {
      issues.push({
        levelId: level.id,
        levelName: level.name,
        type: 'ERROR',
        category: 'CONNECTIVITY',
        message: `Exit portal is unreachable from player spawn via any walkable corridor.`,
        coordinates: { x: level.exit.x, y: level.exit.y },
      });
    }

    // Check each plate reachability
    for (const plate of level.plates) {
      const pgx = Math.floor((plate.x + plate.width / 2) / step);
      const pgy = Math.floor((plate.y + plate.height / 2) / step);
      if (!visited.has(`${pgx},${pgy}`)) {
        issues.push({
          levelId: level.id,
          levelName: level.name,
          type: 'ERROR',
          category: 'CONNECTIVITY',
          message: `Pressure plate '${plate.id}' is unreachable from player spawn.`,
          coordinates: { x: plate.x, y: plate.y },
        });
      }
    }

    return issues;
  }

  /**
   * Validates all levels in an array.
   */
  public static validateAll(levels: LevelData[]): MapValidationReport {
    const allIssues: ValidationIssue[] = [];

    for (const level of levels) {
      const issues = this.validateLevel(level);
      allIssues.push(...issues);
    }

    const errorsCount = allIssues.filter((i) => i.type === 'ERROR').length;
    const warningsCount = allIssues.filter((i) => i.type === 'WARNING').length;

    return {
      isValid: errorsCount === 0,
      totalLevels: levels.length,
      errorsCount,
      warningsCount,
      issues: allIssues,
    };
  }
}
