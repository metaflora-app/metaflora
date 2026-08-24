import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SCENARIO_CATALOG,
  applyScenarioTelegramInput,
  buildScenarioCatalogMessage,
  buildScenarioMessage,
  getScenarioById,
  validateScenarioInputs
} from '../src/scenario-catalog.js';
import { buildModelCategoryMessage, getModelById } from '../src/model-catalog.js';

const expectedScenarios = Object.freeze([
  ['create_image', 'photo_generate'],
  ['face_swap', 'photo_edit'],
  ['try_on', 'photo_try_on'],
  ['remove_background', 'photo_remove_bg'],
  ['remove_object', 'photo_object_remove'],
  ['animate_photo', 'video_image_to_video'],
  ['edit_video', 'video_edit']
]);

function callbacks(message) {
  return message.reply_markup.inline_keyboard
    .flat()
    .map(({ callback_data: callbackData }) => callbackData);
}

test('scenario facade exposes requested jobs once without adding tool records', () => {
  assert.deepEqual(
    SCENARIO_CATALOG.map(({ id, targetId }) => [id, targetId]),
    expectedScenarios
  );
  assert.equal(new Set(SCENARIO_CATALOG.map(({ id }) => id)).size, expectedScenarios.length);
  assert.equal(new Set(SCENARIO_CATALOG.map(({ name }) => name)).size, expectedScenarios.length);

  for (const scenario of SCENARIO_CATALOG) {
    assert.ok(getModelById(scenario.targetId), `${scenario.id}: target`);
    assert.match(scenario.id, /^[a-z0-9_]{1,32}$/u);
    assert.ok(scenario.description.length >= 80, `${scenario.id}: description`);
    assert.ok(scenario.instruction.trim(), `${scenario.id}: instruction`);
  }
});

test('scenario menu and cards remain callback-safe and route to the real target', () => {
  assert.ok(callbacks(buildModelCategoryMessage('tools')).includes('scenarios:home'));
  const root = buildScenarioCatalogMessage();
  assert.deepEqual(
    callbacks(root).filter((callback) => callback?.startsWith('scenario:')),
    expectedScenarios.map(([id]) => `scenario:${id}`)
  );

  for (const scenario of SCENARIO_CATALOG) {
    const card = buildScenarioMessage(scenario);
    assert.ok(callbacks(card).includes(`scenario:use:${scenario.id}`));
    for (const callback of callbacks(card)) {
      assert.ok(Buffer.byteLength(callback, 'utf8') <= 64, callback);
    }
  }
});

test('face swap injects a bounded deterministic edit instruction without mutating input', () => {
  const input = [{ images: ['face.jpg', 'target.jpg'] }];
  const prepared = applyScenarioTelegramInput(getScenarioById('face_swap'), input);

  assert.deepEqual(input, [{ images: ['face.jpg', 'target.jpg'] }]);
  assert.deepEqual(prepared, [
    {
      text: 'Перенеси лицо с первого изображения на человека на втором изображении. Сохрани позу, выражение, освещение, ракурс, волосы и остальные детали целевого кадра.'
    },
    { images: ['face.jpg', 'target.jpg'] }
  ]);
  assert.equal(applyScenarioTelegramInput(getScenarioById('try_on'), input), input);
});

test('face swap accepts exactly one face source and one target image', () => {
  const scenario = getScenarioById('face_swap');
  assert.doesNotThrow(() => validateScenarioInputs(scenario, {
    images: ['face.jpg', 'target.jpg'],
    text: 'preset'
  }));
  assert.throws(
    () => validateScenarioInputs(scenario, { images: ['only-one.jpg'], text: 'preset' }),
    /exactly two images/i
  );
  assert.throws(
    () => validateScenarioInputs(scenario, {
      images: ['one.jpg', 'two.jpg', 'three.jpg'],
      text: 'preset'
    }),
    /exactly two images/i
  );
});
