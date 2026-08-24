import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VOICE_LIBRARY_COUNT,
  clearCuratedVoices,
  getCuratedVoice,
  isVoiceLibraryReady,
  listCuratedVoices,
  setCuratedVoices,
  validatePreviewReference
} from '../src/voice-library.js';

function voice(index, overrides = {}) {
  const id = `elv_${String(index).padStart(24, '0')}`;
  return Object.freeze({
    id,
    name: `Голос ${index}`,
    description: `спокойная подача для роликов и подкастов ${index}`,
    category: index % 2 ? 'premade' : 'professional',
    labels: Object.freeze({
      language: index % 3 ? 'ru' : 'en',
      gender: index % 2 ? 'female' : 'male',
      useCase: index % 2 ? 'подкасты' : 'обучение',
      descriptive: index % 2 ? 'мягкий' : 'собранный'
    }),
    preview: Object.freeze({
      type: 'id',
      value: `voice-preview-${id}`
    }),
    ...overrides
  });
}

const catalog = () => Object.freeze(
  Array.from({ length: 80 }, (_, index) => voice(index + 1))
);

test.beforeEach(() => clearCuratedVoices());

test('до runtime-загрузки каталог честно недоступен', () => {
  assert.equal(isVoiceLibraryReady(), false);
  assert.equal(VOICE_LIBRARY_COUNT, 0);
  assert.deepEqual(listCuratedVoices(), []);
  assert.equal(getCuratedVoice('elv_000000000000000000000001'), null);
});

test('атомарно устанавливает ровно 80 реальных immutable public records', () => {
  const records = catalog();
  const installed = setCuratedVoices(records);

  assert.equal(isVoiceLibraryReady(), true);
  assert.equal(VOICE_LIBRARY_COUNT, 80);
  assert.equal(installed.length, 80);
  assert.deepEqual(installed, records);
  assert.equal(new Set(installed.map(({ id }) => id)).size, 80);
  assert.ok(installed.every(({ name }) => /^[А-ЯЁ]/u.test(name)));
  assert.ok(installed.every(({ description }) =>
    description === description.toLocaleLowerCase('ru-RU')));
  assert.ok(installed.every(({ preview }) => validatePreviewReference(preview)));
  assert.ok(Object.isFrozen(installed));
  assert.ok(Object.isFrozen(installed[0]));
});

test('отвергает неполный, изменяемый или небезопасный набор, не повреждая текущий каталог', () => {
  const records = catalog();
  setCuratedVoices(records);

  assert.throws(() => setCuratedVoices(Object.freeze(records.slice(0, 79))), /80/iu);
  assert.throws(() => setCuratedVoices([...records]), /immutable/iu);
  const invalid = Object.freeze([
    ...records.slice(0, 79),
    voice(80, { name: '<небезопасный голос>' })
  ]);
  assert.throws(() => setCuratedVoices(invalid), /safe/iu);
  const leaking = Object.freeze([
    ...records.slice(0, 79),
    voice(80, { providerVoiceId: 'private-provider-id' })
  ]);
  assert.throws(() => setCuratedVoices(leaking), /private|unknown/iu);

  assert.equal(VOICE_LIBRARY_COUNT, 80);
  assert.deepEqual(listCuratedVoices(), records);
});

test('поиск и фильтры работают по публичным полям, пагинация ограничена каталогом', () => {
  const records = catalog();
  setCuratedVoices(records);

  assert.deepEqual(
    listCuratedVoices({ query: 'ГОЛОС 7' }),
    records.filter(({ name }) => name.includes('Голос 7'))
  );
  assert.ok(listCuratedVoices({ languages: ['ru'] }).every(
    ({ labels }) => labels.language === 'ru'
  ));
  assert.ok(listCuratedVoices({ useCases: ['подкасты'] }).every(
    ({ labels }) => labels.useCase === 'подкасты'
  ));
  assert.deepEqual(listCuratedVoices({ offset: 10, limit: 7 }), records.slice(10, 17));
  assert.equal(getCuratedVoice(records[10].id), records[10]);
  assert.equal(getCuratedVoice('missing'), null);
  assert.throws(() => listCuratedVoices({ limit: 0 }), /limit/i);
  assert.throws(() => listCuratedVoices({ offset: -1 }), /offset/i);
});

test('preview принимает только безопасный внутренний reference реального голоса', () => {
  const reference = catalog()[0].preview;
  assert.equal(validatePreviewReference(reference), true);

  for (const unsafe of [
    { type: 'url', value: 'https://storage.example/voice.mp3' },
    { type: 'id', value: '../voice-preview' },
    { type: 'id', value: 'voice-preview-private-provider-id' },
    { type: 'provider_id', value: 'unknown' }
  ]) {
    assert.equal(validatePreviewReference(unsafe), false);
  }
});
