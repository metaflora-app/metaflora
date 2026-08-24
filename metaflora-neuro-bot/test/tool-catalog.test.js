import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TOOL_CATEGORIES,
  TOOL_CATALOG,
  getActiveTools,
  getToolById,
  getToolsByCategory
} from '../src/tool-catalog.js';

const expectedSubcategories = Object.freeze({
  photo: [
    'generate',
    'edit',
    'pose_transfer',
    'colorize',
    'restore',
    'remove_bg',
    'object_remove',
    'expand',
    'face_restore',
    'try_on',
    'product_photo',
    'ocr',
    'upscale'
  ],
  video: [
    'text_to_video',
    'image_to_video',
    'extend',
    'understand',
    'edit',
    'live_photo',
    'lipsync',
    'talking_head',
    'remove_bg',
    'remove_object',
    'upscale'
  ],
  audio: [
    'stt',
    'tts',
    'voice_clone',
    'isolation',
    'stems',
    'sfx',
    'music',
    'voice_change'
  ],
  document: [
    'document_ocr',
    'table_extraction',
    'formula_ocr',
    'chart_analysis',
    'structured_extraction',
    'image_description'
  ],
  '3d': [
    'image_to_3d',
    'text_to_3d',
    'object_extraction',
    'multi_image_to_3d'
  ]
});

test('catalog contains every requested provider capability once', () => {
  assert.deepEqual(TOOL_CATEGORIES, [
    'photo',
    'video',
    'audio',
    'document',
    '3d'
  ]);
  assert.equal(TOOL_CATALOG.length, 42);

  for (const [category, subcategories] of Object.entries(expectedSubcategories)) {
    assert.deepEqual(
      getToolsByCategory(category).map(({ subcategory }) => subcategory),
      subcategories
    );
  }
});

test('tool names and card copy are specific, natural, and non-templated', () => {
  const descriptions = new Set();
  const forbiddenHeading = /^(как запустить|понадобится|настройки)\b/iu;

  for (const tool of TOOL_CATALOG) {
    assert.equal(tool.name, tool.name.toLocaleLowerCase('ru-RU'));
    assert.equal(tool.card.title, tool.name);
    assert.ok(tool.card.description.trim().length >= 120);
    assert.ok(Array.isArray(tool.card.highlights));
    assert.ok(tool.card.highlights.length >= 1);
    assert.ok(tool.card.highlights.length <= 3);
    for (const phrase of tool.card.highlights) {
      assert.ok(phrase.trim().length >= 3);
      assert.ok(tool.card.description.includes(phrase));
    }
    assert.equal(descriptions.has(tool.card.description), false);
    descriptions.add(tool.card.description);
    assert.doesNotMatch(tool.card.title, forbiddenHeading);
    assert.doesNotMatch(tool.card.description, forbiddenHeading);
    assert.doesNotMatch(tool.card.instruction, forbiddenHeading);
    assert.match(
      tool.card.instruction,
      /^(прикрепи|отправь|опиши|добавь|загрузи|вставь|выбери)(?:\s|$)/iu
    );
    assert.doesNotMatch(tool.card.instruction, /:$/u);
  }
});

test('every tool has a meaningful emoji and logo fallback without diamonds', () => {
  const forbiddenDiamonds = /[◆◇◈◊⬥⬦�]/u;

  for (const tool of TOOL_CATALOG) {
    assert.ok(tool.customEmojiFallback.trim());
    assert.ok(tool.logoFallback.trim());
    assert.doesNotMatch(tool.customEmojiFallback, forbiddenDiamonds);
    assert.doesNotMatch(tool.logoFallback, forbiddenDiamonds);
    assert.notEqual(tool.customEmojiFallback, '▫️');
  }
});

test('tool ids are unique and Telegram callback-safe', () => {
  const ids = TOOL_CATALOG.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^[a-z0-9_]{1,48}$/);
    assert.ok(Buffer.byteLength(`tool:${id}`, 'utf8') <= 64);
  }
});

test('every active tool has a complete runtime contract and card', () => {
  assert.ok(getActiveTools().length > 0);

  for (const tool of getActiveTools()) {
    assert.equal(tool.active, true);
    assert.ok(tool.name.trim());
    assert.ok(tool.card.title.trim());
    assert.ok(tool.card.description.trim().length >= 120);
    assert.ok(tool.card.instruction.trim());
    assert.ok(tool.input.required.length > 0);
    assert.ok(tool.routes.length > 0);
    assert.ok(tool.settings && typeof tool.settings === 'object');
    assert.ok(tool.pricing && typeof tool.pricing === 'object');
    assert.ok(tool.runtime.adapter.trim());
    assert.ok(tool.runtime.outputPath.trim());
    assert.deepEqual(
      Object.keys(tool.runtime.inputMap).sort(),
      [...tool.input.required, ...tool.input.optional].sort()
    );
  }
});

test('routes contain only explicit verified endpoint identifiers', () => {
  for (const tool of TOOL_CATALOG) {
    assert.equal(tool.routes.filter(({ role }) => role === 'primary').length, 1);

    for (const route of tool.routes) {
      assert.equal(route.verified, true);
      assert.ok(route.provider.trim());
      assert.ok(route.endpoint.trim());
      if (route.provider === 'polza') {
        assert.match(route.endpoint, /^https:\/\/polza\.ai\/api\/v1\//u);
      } else {
        assert.doesNotMatch(route.endpoint, /^https?:\/\//);
      }
      assert.ok(['primary', 'fallback'].includes(route.role));
    }
  }
});

test('tool fallback routes no longer use KIE', () => {
  const isolation = getToolById('audio_isolation');
  assert.deepEqual(isolation.routes.map(({ provider }) => provider), [
    'elevenlabs',
    'fal'
  ]);

  for (const tool of TOOL_CATALOG) {
    assert.equal(tool.routes.some(({ provider }) => provider === 'kie'), false, tool.id);
  }
});

test('every tool exposes an explicit RouterAI fallback compatibility status', () => {
  for (const tool of TOOL_CATALOG) {
    assert.equal(tool.fallbackStatus.provider, 'routerai', tool.id);
    assert.ok(['compatible', 'incompatible'].includes(tool.fallbackStatus.status), tool.id);
    assert.ok(tool.fallbackStatus.reason.trim(), tool.id);
  }

  assert.equal(getToolById('audio_isolation').fallbackStatus.status, 'incompatible');
  assert.equal(getToolById('audio_tts').fallbackStatus.status, 'incompatible');
  assert.equal(getToolById('audio_music').fallbackStatus.status, 'incompatible');
});

test('settings expose concrete provider fields and supported pricing contracts', () => {
  for (const tool of TOOL_CATALOG) {
    assert.doesNotMatch(tool.pricing.unit, /^(request|unit)$/);

    for (const [key, setting] of Object.entries(tool.settings)) {
      assert.ok(key.trim());
      assert.ok(setting.label.trim());
      assert.ok(['boolean', 'enum', 'number', 'string'].includes(setting.type));
      assert.notEqual(setting.default, undefined);
      if (setting.type === 'enum') {
        assert.ok(setting.values.length > 0);
        assert.ok(setting.values.includes(setting.default));
      }
    }

    assert.ok(['fixed', 'range', 'tiered'].includes(tool.pricing.type));
    assert.equal(tool.pricing.currency, 'USD');
    assert.ok(tool.pricing.unit.trim());
    if (tool.pricing.type === 'fixed') {
      assert.ok(tool.pricing.amount >= 0);
    } else if (tool.pricing.type === 'range') {
      assert.ok(tool.pricing.min >= 0);
      assert.ok(tool.pricing.max >= tool.pricing.min);
    } else {
      assert.ok(tool.settings[tool.pricing.setting]);
      assert.ok(Object.values(tool.pricing.amounts).every((amount) => amount >= 0));
    }
  }
});

test('lookup API returns stable entries without exposing mutable catalog arrays', () => {
  const first = TOOL_CATALOG[0];

  assert.equal(getToolById(first.id), first);
  assert.equal(getToolById('missing_tool'), null);
  assert.notEqual(getActiveTools(), getActiveTools());
  assert.notEqual(getToolsByCategory('photo'), getToolsByCategory('photo'));
  assert.deepEqual(getToolsByCategory('missing'), []);
  assert.ok(Object.isFrozen(TOOL_CATALOG));
  assert.ok(Object.isFrozen(first));
});
