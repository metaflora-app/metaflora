import test from 'node:test';
import assert from 'node:assert/strict';

import { cycleSettingValue } from '../src/settings-cycle.js';
import { inputProfileForModel, listCatalogModels } from '../src/model-catalog.js';

test('cycleSettingValue returns a frozen copy and wraps without mutating source', () => {
  const definition = Object.freeze({
    key: 'quality',
    defaultValue: 'balanced',
    values: Object.freeze([
      Object.freeze({ value: 'fast', label: 'быстро' }),
      Object.freeze({ value: 'balanced', label: 'баланс' }),
      Object.freeze({ value: 'quality', label: 'качество' })
    ])
  });
  const source = Object.freeze({ quality: 'quality', untouched: 'yes' });

  const next = cycleSettingValue(source, definition);

  assert.deepEqual(next, { quality: 'fast', untouched: 'yes' });
  assert.deepEqual(source, { quality: 'quality', untouched: 'yes' });
  assert.ok(Object.isFrozen(next));
});

test('every applicable model, tool and audio profile can use the same cycle primitive', () => {
  const failures = [];
  for (const model of listCatalogModels()) {
    for (const definition of inputProfileForModel(model)) {
      if (definition.type === 'string' || definition.values.length < 2) continue;
      const source = Object.freeze({ [definition.key]: definition.defaultValue });
      const next = cycleSettingValue(source, definition);
      if (next[definition.key] === source[definition.key]) failures.push(`${model.id}:${definition.key}`);
    }
  }
  assert.deepEqual(failures, []);
});
