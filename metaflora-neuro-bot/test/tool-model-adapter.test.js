import assert from 'node:assert/strict';
import test from 'node:test';

import { providerCostUsdToMetacoins } from '../src/model-pricing.js';
import {
  TOOL_MODELS,
  buildToolCard,
  calculateToolMetacoinPrice,
  defaultToolSettings,
  formatToolMetacoinPrice,
  getToolMetacoinPriceRange,
  getToolModelById,
  listToolModels,
  toolInputHints,
  toolSettingsProfileFor
} from '../src/tool-model-adapter.js';

test('tool catalog is exposed as immutable model-like records in media categories', () => {
  assert.ok(TOOL_MODELS.length > 0);
  assert.deepEqual(
    [...new Set(TOOL_MODELS.map(({ category }) => category))],
    ['image', 'video', 'audio', 'document', '3d']
  );

  const restore = getToolModelById('photo_restore');
  assert.deepEqual(
    {
      id: restore.id,
      name: restore.name,
      category: restore.category,
      subcategory: restore.subcategory,
      source: restore.source
    },
    {
      id: 'photo_restore',
      name: 'восстановить фото',
      category: 'image',
      subcategory: 'restore',
      source: 'tool'
    }
  );
  assert.equal(getToolModelById('missing'), null);
  assert.notEqual(listToolModels(), listToolModels());
  assert.ok(Object.isFrozen(TOOL_MODELS));
  assert.ok(Object.isFrozen(restore));
});

test('settings retain provider defaults while presenting usable controls', () => {
  const face = getToolModelById('photo_face_restore');
  assert.deepEqual(defaultToolSettings(face), {
    fidelity: 0.5,
    only_center_face: false,
    aligned: false,
    upscale_factor: 2
  });

  const profile = toolSettingsProfileFor(face);
  const fidelity = profile.find(({ key }) => key === 'fidelity');
  const onlyCenter = profile.find(({ key }) => key === 'only_center_face');
  assert.equal(fidelity.type, 'number');
  assert.equal(fidelity.step, 0.05);
  assert.deepEqual(
    fidelity.values.map(({ value }) => value),
    [0, 0.25, 0.5, 0.75, 1]
  );
  assert.equal(onlyCenter.type, 'boolean');
  assert.deepEqual(
    onlyCenter.values.map(({ value, label }) => [value, label]),
    [[false, 'нет'], [true, 'да']]
  );

  const objectRemoval = toolSettingsProfileFor(getToolModelById('photo_object_remove'));
  assert.deepEqual(
    objectRemoval.find(({ key }) => key === 'model').values.map(({ label }) => label),
    ['быстрое', 'обычное', 'высокое', 'максимальное']
  );
  assert.doesNotMatch(
    objectRemoval.flatMap(({ values }) => values.map(({ label }) => label)).join(' '),
    /low_quality|best_quality|_/i
  );
});

test('every catalog setting has a real default and user-facing options', () => {
  for (const model of TOOL_MODELS) {
    const defaults = defaultToolSettings(model);
    for (const definition of toolSettingsProfileFor(model)) {
      assert.notEqual(defaults[definition.key], undefined, `${model.id}:${definition.key}`);
      assert.equal(defaults[definition.key], definition.defaultValue);
      if (definition.type !== 'string') {
        assert.ok(definition.values.length >= 2, `${model.id}:${definition.key}`);
        assert.ok(
          definition.values.some(({ value }) => value === definition.defaultValue),
          `${model.id}:${definition.key} has no default option`
        );
      }
      if (definition.type === 'number') {
        assert.ok(definition.step > 0);
        assert.ok(definition.values.length <= 12);
      }
      assert.doesNotMatch(
        definition.values.map(({ label }) => label).join(' '),
        /[a-z]+_[a-z]+/i,
        `${model.id}:${definition.key} leaks a raw option`
      );
    }
  }
});

test('fixed and ranged USD prices convert to metacoins using units and settings', () => {
  const restore = getToolModelById('photo_restore');
  assert.equal(
    calculateToolMetacoinPrice(restore),
    providerCostUsdToMetacoins(0.04)
  );
  assert.deepEqual(getToolMetacoinPriceRange(restore), {
    min: providerCostUsdToMetacoins(0.04),
    max: providerCostUsdToMetacoins(0.04)
  });

  const objectRemoval = getToolModelById('photo_object_remove');
  assert.deepEqual(getToolMetacoinPriceRange(objectRemoval), {
    min: providerCostUsdToMetacoins(0.006),
    max: providerCostUsdToMetacoins(0.024)
  });
  assert.equal(
    calculateToolMetacoinPrice(objectRemoval, { model: 'best_quality' }),
    providerCostUsdToMetacoins(0.024)
  );
  assert.match(formatToolMetacoinPrice(objectRemoval), /–/);

  const soundEffect = getToolModelById('audio_sfx');
  assert.equal(
    calculateToolMetacoinPrice(soundEffect, { duration_seconds: 10 }),
    providerCostUsdToMetacoins(0.02)
  );

  const videoBackground = getToolModelById('video_remove_bg');
  assert.equal(
    calculateToolMetacoinPrice(videoBackground, {}, { durationSeconds: 12 }),
    providerCostUsdToMetacoins(0.0042 * 12)
  );

  const speech = getToolModelById('audio_tts');
  assert.equal(
    calculateToolMetacoinPrice(speech, {}, { characters: 2500 }),
    providerCostUsdToMetacoins(0.25)
  );
});

test('input hints and HTML cards explain the launch without leaking API fields', () => {
  const tryOn = getToolModelById('photo_try_on');
  assert.deepEqual(toolInputHints(tryOn), {
    required: ['фото человека', 'фото одежды'],
    optional: [],
    constraints: []
  });

  const card = buildToolCard(tryOn);
  assert.equal(card.parse_mode, 'HTML');
  assert.match(card.text, /^<b>примерить одежду<\/b>/);
  assert.match(card.text, /<b>[^<]+<\/b>/);
  assert.match(card.text, /\n\n[^<\n][^\n]+👇\n\n<b>стоимость:<\/b>/);
  assert.match(card.text, /<b>стоимость:<\/b>.*метакоин/);
  assert.doesNotMatch(
    card.text,
    /<b>(?:понадобится|можно добавить|ограничение|настройки|как запустить):<\/b>/i
  );
  assert.doesNotMatch(
    card.text,
    /human_image_url|garment_image_url|upper_body|fal-ai|fal\.subscribe|outputPath|_/i
  );
  assert.ok(card.text.replaceAll(/<[^>]+>/g, '').length >= 250);
});

test('constraints become concrete, friendly input guidance', () => {
  const removeObject = toolInputHints(getToolModelById('video_remove_object'));
  assert.ok(removeObject.constraints.includes('видео длительностью до 5 секунд'));

  const isolation = toolInputHints(getToolModelById('audio_isolation'));
  assert.ok(isolation.constraints.includes('один аудио- или видеофайл'));
});

test('every generated card is detailed HTML without provider implementation names', () => {
  for (const model of TOOL_MODELS) {
    const card = buildToolCard(model);
    assert.equal(card.parse_mode, 'HTML');
    assert.ok(card.text.replaceAll(/<[^>]+>/g, '').length >= 220, model.id);
    assert.equal(
      model.name[0],
      model.name[0].toLocaleLowerCase('ru-RU'),
      `${model.id} must start with lowercase`
    );
    assert.match(card.text, /\n\n[^<\n][^\n]+👇\n\n<b>стоимость:<\/b>/);
    assert.match(card.text, /<b>стоимость:<\/b> \d+(?:–\d+)? метакоинов/);
    assert.doesNotMatch(
      card.text,
      /<b>(?:понадобится|можно добавить|ограничение|настройки|как запустить):<\/b>/i,
      model.id
    );
    assert.doesNotMatch(
      card.text,
      /fal-ai|fal\.subscribe|image_url|audio_url|video_url|outputPath|[a-z]+_[a-z]+/i,
      model.id
    );
  }
});
