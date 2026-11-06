/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rectIntersects,
  pointInRect,
  getCharacterBoundingBox,
  getActiveObstacles,
  resolveMovement,
  resolveSpawnPosition,
} from './collision.ts';
import { Rect, SecurityDoor } from './types.ts';

test('rectIntersects detects overlapping boxes and separates disjoint boxes', () => {
  const a: Rect = { x: 10, y: 10, width: 20, height: 20 };
  const b: Rect = { x: 25, y: 25, width: 20, height: 20 };
  const c: Rect = { x: 50, y: 50, width: 20, height: 20 };

  assert.equal(rectIntersects(a, b), true, 'a and b should intersect');
  assert.equal(rectIntersects(a, c), false, 'a and c should not intersect');
});

test('pointInRect correctly identifies points inside and outside', () => {
  const rect: Rect = { x: 100, y: 100, width: 50, height: 50 };
  assert.equal(pointInRect(120, 120, rect), true);
  assert.equal(pointInRect(50, 50, rect), false);
  assert.equal(pointInRect(100, 100, rect), true, 'boundary points count as inside');
});

test('getActiveObstacles includes walls and closed doors, excludes open doors', () => {
  const walls: Rect[] = [{ x: 0, y: 0, width: 40, height: 720 }];
  const doors: SecurityDoor[] = [
    {
      id: 'd1',
      x: 100,
      y: 100,
      width: 40,
      height: 120,
      isOpen: false,
      openProgress: 0,
      requiredPlates: ['p1'],
      orientation: 'vertical',
    },
    {
      id: 'd2',
      x: 200,
      y: 100,
      width: 40,
      height: 120,
      isOpen: true,
      openProgress: 0.95, // mostly open
      requiredPlates: ['p2'],
      orientation: 'vertical',
    },
  ];

  const obstacles = getActiveObstacles(walls, doors);
  assert.equal(obstacles.length, 2, 'Should include 1 wall and 1 closed door');
  assert.equal(obstacles[1].x, 100, 'Closed door d1 should be an obstacle');
});

test('resolveMovement blocks movement through walls while allowing slide', () => {
  const obstacles: Rect[] = [
    { x: 100, y: 0, width: 40, height: 400 }, // Vertical wall at x=100
  ];

  // Player at (80, 200) tries to move right to (110, 200) -> right edge must stop at wall x=100
  const resolvedXBlocked = resolveMovement(80, 200, 110, 200, 26, 26, obstacles);
  assert.ok(resolvedXBlocked.x + 13 <= 100, 'Right edge must not penetrate wall at 100');
  assert.ok(resolvedXBlocked.x >= 80, 'Player should advance as far as allowed without penetrating');
  assert.equal(resolvedXBlocked.y, 200);

  // Player tries to move diagonally (110, 220) -> X blocked, Y allowed to slide!
  const resolvedSlide = resolveMovement(80, 200, 110, 220, 26, 26, obstacles);
  assert.ok(resolvedSlide.x + 13 <= 100, 'X must not penetrate wall');
  assert.ok(Math.abs(resolvedSlide.y - 220) < 0.01, 'Y should slide smoothly to 220');
});

test('resolveSpawnPosition relocates trapped characters to nearest walkable point', () => {
  const obstacles: Rect[] = [
    { x: 100, y: 100, width: 60, height: 60 }, // Wall at (100, 100)
  ];

  // Character starts valid at (60, 60) (inside playfield, away from obstacles)
  const validSpawn = resolveSpawnPosition(60, 60, 24, 24, obstacles);
  assert.equal(validSpawn.x, 60);
  assert.equal(validSpawn.y, 60);

  // Character starts inside obstacle at (120, 120)
  const recoveredSpawn = resolveSpawnPosition(120, 120, 24, 24, obstacles);
  assert.notEqual(recoveredSpawn.x, 120, 'Spawn should be relocated away from obstacle center');
  // Confirm the recovered spawn is completely walkable
  const recoveredBox = getCharacterBoundingBox(recoveredSpawn.x, recoveredSpawn.y, 24, 24);
  assert.equal(rectIntersects(recoveredBox, obstacles[0]), false, 'Recovered position must not overlap obstacle');
});

