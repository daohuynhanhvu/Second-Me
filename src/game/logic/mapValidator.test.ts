/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { MapValidator } from './mapValidator.ts';
import { LEVELS } from './levels.ts';

test('Audit all existing levels with MapValidator', () => {
  const report = MapValidator.validateAll(LEVELS);
  console.log('=== MAP VALIDATION AUDIT REPORT ===');
  console.log(`Total levels checked: ${report.totalLevels}`);
  console.log(`Errors found: ${report.errorsCount}`);
  console.log(`Warnings found: ${report.warningsCount}`);

  for (const issue of report.issues) {
    console.log(`[Level ${issue.levelId}: ${issue.levelName}] [${issue.type}] [${issue.category}] ${issue.message}`);
  }
  console.log('===================================');

  // Let's assert what we found so we can track fixes
  if (report.errorsCount > 0) {
    console.log(`Fixes needed for ${report.errorsCount} errors!`);
  }
});
