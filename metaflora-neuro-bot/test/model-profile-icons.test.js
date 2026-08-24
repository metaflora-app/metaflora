import test from 'node:test';
import assert from 'node:assert/strict';

import { iconFor } from '../src/model-profiles.js';

const DIAMOND_PLACEHOLDER = /[◆◇◈◊⬥⬦♦▫�]/u;

test('named model cards never use geometric diamond placeholders', () => {
  const models = [
    { id: 'flux_2_pro', name: 'FLUX 2 Pro', category: 'image' },
    { id: 'recraft_41', name: 'Recraft 4.1', category: 'image' }
  ];

  for (const model of models) {
    assert.doesNotMatch(iconFor(model), DIAMOND_PLACEHOLDER);
  }
});
