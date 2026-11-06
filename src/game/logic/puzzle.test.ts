/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updatePressurePlates,
  updateSecurityDoors,
  checkExitReached,
} from './puzzle.ts';
import { PressurePlate, SecurityDoor, ExitPortal } from './types.ts';

test('updatePressurePlates triggers when player or echo steps on plate', () => {
  const plates: PressurePlate[] = [
    { id: 'p1', x: 100, y: 100, width: 40, height: 40, isPressed: false },
    { id: 'p2', x: 300, y: 300, width: 40, height: 40, isPressed: false },
  ];

  // Player at (120, 120) is on p1; echo is null
  const res1 = updatePressurePlates(
    plates,
    { x: 120, y: 120, width: 24, height: 24 },
    null,
    0.016
  );
  assert.equal(res1.plateChanged, true);
  assert.equal(plates[0].isPressed, true);
  assert.equal(plates[1].isPressed, false);

  // Player moves away, but Echo is on p1
  const res2 = updatePressurePlates(
    plates,
    { x: 50, y: 50, width: 24, height: 24 },
    { x: 120, y: 120, width: 24, height: 24 },
    0.016
  );
  assert.equal(plates[0].isPressed, true, 'Plate should stay pressed when occupied by Echo');

  // Both step away
  const res3 = updatePressurePlates(
    plates,
    { x: 50, y: 50, width: 24, height: 24 },
    { x: 500, y: 500, width: 24, height: 24 },
    0.016
  );
  assert.equal(plates[0].isPressed, false, 'Plate should release when empty');
});

test('updateSecurityDoors opens door when required plates are pressed', () => {
  const plates: PressurePlate[] = [
    { id: 'p1', x: 100, y: 100, width: 40, height: 40, isPressed: true },
  ];
  const doors: SecurityDoor[] = [
    {
      id: 'd1',
      x: 400,
      y: 200,
      width: 40,
      height: 120,
      isOpen: false,
      openProgress: 0,
      requiredPlates: ['p1'],
      orientation: 'vertical',
    },
  ];

  const update = updateSecurityDoors(
    doors,
    plates,
    { x: 50, y: 50 },
    null,
    0.1
  );

  assert.equal(doors[0].isOpen, true);
  assert.ok(doors[0].openProgress > 0, 'Door should start opening');
});

test('checkExitReached identifies when player reaches portal', () => {
  const portal: ExitPortal = {
    x: 500,
    y: 500,
    width: 60,
    height: 60,
    radius: 36,
  };

  // Center of portal is (530, 530)
  assert.equal(checkExitReached(530, 530, portal), true);
  assert.equal(checkExitReached(550, 530, portal), true);
  assert.equal(checkExitReached(400, 400, portal), false);
});
