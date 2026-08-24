import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUDIO_WORKFLOW_CATEGORY_IDS,
  audioWorkflowCategories,
  audioWorkflowCatalog,
  getAudioWorkflowById,
  listAudioWorkflows
} from '../src/audio-workflow-catalog.js';
import {
  audioWorkflowCards,
  buildAudioWorkflowCardText,
  getAudioWorkflowCard
} from '../src/audio-workflow-cards.js';
import { providerCostUsdToMetacoins } from '../src/model-pricing.js';

const MUSIC_IDS = [
  'music_song',
  'music_instrumental',
  'music_video_score',
  'music_jingle',
  'music_loop',
  'music_hum_to_track',
  'music_extend',
  'music_rework',
  'music_remix',
  'music_mashup',
  'music_cover',
  'audio_stems',
  'audio_karaoke',
  'audio_master',
  'audio_scene_sfx'
];

const VOICE_IDS = [
  'voice_tts',
  'voice_longform',
  'voice_dialogue',
  'voice_ad',
  'voice_design',
  'voice_clone',
  'voice_change',
  'voice_dub_video',
  'voice_translate_preserve',
  'voice_replace_phrase',
  'voice_transcribe',
  'voice_meeting',
  'voice_subtitles',
  'voice_cleanup',
  'voice_shorten'
];

const FORBIDDEN_DIAMONDS = /[◆◇♦◊▫]/u;
const UPPERCASE_LETTER = /[A-ZА-ЯЁ]/u;
const ALLOWED_PROVIDERS = new Set(['elevenlabs', 'fal', 'kie', 'polza', 'replicate']);

test('каталог содержит ровно 15 музыкальных и 15 голосовых сценариев', () => {
  assert.equal(audioWorkflowCatalog.length, 30);
  assert.deepEqual(listAudioWorkflows({ kind: 'music' }).map(({ id }) => id), MUSIC_IDS);
  assert.deepEqual(listAudioWorkflows({ kind: 'voice' }).map(({ id }) => id), VOICE_IDS);
});

test('дубляж предлагает готовый или личный голос и явный режим исходного звука', () => {
  const workflow = getAudioWorkflowById('voice_dub_video');
  const voice = workflow.inputs.find(({ id }) => id === 'voice');
  const sourceAudio = workflow.parameters.find(({ id }) => id === 'source_audio');
  const mix = workflow.parameters.find(({ id }) => id === 'source_audio_mix');

  assert.equal(voice.required, false);
  assert.deepEqual(sourceAudio.options, ['сохранить', 'убрать', 'смешать']);
  assert.equal(sourceAudio.default, 'сохранить');
  assert.deepEqual({ min: mix.min, max: mix.max, default: mix.default }, { min: 0, max: 100, default: 25 });
});

test('категории описывают все шесть разделов без пустых карточек', () => {
  assert.equal(audioWorkflowCategories.length, 6);
  assert.deepEqual(
    audioWorkflowCategories.map(({ id }) => id),
    AUDIO_WORKFLOW_CATEGORY_IDS
  );

  for (const category of audioWorkflowCategories) {
    assert.ok(category.name.length >= 4, category.id);
    assert.ok(category.description.length >= 40, category.id);
    assert.ok(category.customEmojiFallback.trim(), category.id);
    assert.doesNotMatch(category.customEmojiFallback, FORBIDDEN_DIAMONDS, category.id);
    assert.doesNotMatch(category.name, UPPERCASE_LETTER, category.id);
    assert.doesNotMatch(category.description, UPPERCASE_LETTER, category.id);
    assert.ok(listAudioWorkflows({ categoryId: category.id }).length >= 4, category.id);
  }
});

test('каждый сценарий содержит полный публичный контракт карточки', () => {
  const ids = new Set();

  for (const workflow of audioWorkflowCatalog) {
    assert.ok(!ids.has(workflow.id), workflow.id);
    ids.add(workflow.id);

    assert.match(workflow.id, /^[a-z][a-z0-9_]+$/);
    assert.ok(AUDIO_WORKFLOW_CATEGORY_IDS.includes(workflow.categoryId), workflow.id);
    assert.ok(['music', 'voice'].includes(workflow.kind), workflow.id);
    assert.ok(workflow.name.length >= 4, workflow.id);
    assert.ok(workflow.description.length >= 120, workflow.id);
    assert.ok(workflow.instruction.length >= 45, workflow.id);
    assert.doesNotMatch(workflow.name, UPPERCASE_LETTER, workflow.id);
    assert.doesNotMatch(workflow.description, UPPERCASE_LETTER, workflow.id);
    assert.doesNotMatch(workflow.instruction, UPPERCASE_LETTER, workflow.id);
    assert.ok(workflow.customEmojiKey.length >= 3, workflow.id);
    assert.ok(workflow.customEmojiFallback.trim(), workflow.id);
    assert.doesNotMatch(workflow.customEmojiFallback, FORBIDDEN_DIAMONDS, workflow.id);

    assert.ok(workflow.inputs.some(({ required }) => required), workflow.id);
    for (const input of workflow.inputs) {
      assert.match(input.id, /^[a-z][a-z0-9_]+$/);
      assert.ok(['text', 'audio', 'video', 'image', 'voice'].includes(input.type), workflow.id);
      assert.equal(typeof input.required, 'boolean', workflow.id);
      assert.ok(input.label.length >= 3, workflow.id);
      assert.doesNotMatch(input.label, UPPERCASE_LETTER, workflow.id);
    }

    assert.ok(workflow.parameters.length >= 2, workflow.id);
    for (const parameter of workflow.parameters) {
      assert.match(parameter.id, /^[a-z][a-z0-9_]+$/);
      assert.ok(['enum', 'boolean', 'number', 'string'].includes(parameter.type), workflow.id);
      assert.ok(parameter.label.length >= 3, workflow.id);
      assert.doesNotMatch(parameter.label, UPPERCASE_LETTER, workflow.id);
      if (parameter.type === 'enum') {
        assert.ok(parameter.options.length >= 2, `${workflow.id}.${parameter.id}`);
        assert.ok(parameter.options.includes(parameter.default), `${workflow.id}.${parameter.id}`);
      }
    }

    assert.equal(workflow.pricing.currency, 'METACOIN', workflow.id);
    assert.ok(workflow.pricing.min >= 1, workflow.id);
    assert.ok(workflow.pricing.max >= workflow.pricing.min, workflow.id);
    assert.ok(workflow.pricing.unit.length >= 3, workflow.id);
    assert.doesNotMatch(workflow.pricing.unit, UPPERCASE_LETTER, workflow.id);

    assert.ok(workflow.routingStrategy.requiredCapabilities.length >= 1, workflow.id);
    assert.ok(workflow.routingStrategy.preferredProviders.length >= 1, workflow.id);
    for (const provider of workflow.routingStrategy.preferredProviders) {
      assert.ok(ALLOWED_PROVIDERS.has(provider), `${workflow.id}: ${provider}`);
    }
    assert.equal(workflow.routingStrategy.endpoints, undefined, workflow.id);
    assert.ok(workflow.routingStrategy.fallbackPolicy.length >= 30, workflow.id);
  }
});

test('карточки не раскрывают модель или поставщика и показывают цену в метакоинах', () => {
  assert.equal(Object.keys(audioWorkflowCards).length, 30);

  for (const workflow of audioWorkflowCatalog) {
    const card = getAudioWorkflowCard(workflow.id);
    const text = buildAudioWorkflowCardText(workflow);

    assert.equal(card.title, workflow.name, workflow.id);
    assert.equal(card.description, workflow.description, workflow.id);
    assert.equal(card.instruction, workflow.instruction, workflow.id);
    assert.ok(card.highlights.length >= 1, workflow.id);
    assert.match(text, /^<b>[^\n]+<\/b>\n\n/u, workflow.id);
    assert.doesNotMatch(text, /<b>что прислать:<\/b>/u, workflow.id);
    assert.doesNotMatch(text, /<b>настройки:<\/b>/u, workflow.id);
    assert.match(text, /<b>стоимость: .*метакоин[^<]*<\/b>/u, workflow.id);
    assert.doesNotMatch(text, /elevenlabs|fal|kie|polza|replicate|модель:/iu, workflow.id);
  }
});

test('длинный инструментал не может показывать цену ниже подтверждённой десятиминутной генерации', () => {
  const workflow = getAudioWorkflowById('music_instrumental');
  assert.equal(workflow.pricing.max, providerCostUsdToMetacoins(0.15 * 10));
});

test('поиск и фильтрация не изменяют каталог и корректно обрабатывают неизвестные значения', () => {
  assert.equal(getAudioWorkflowById('music_song')?.name, 'создать песню');
  assert.equal(getAudioWorkflowById('missing'), null);
  assert.deepEqual(listAudioWorkflows({ kind: 'missing' }), []);
  assert.deepEqual(listAudioWorkflows({ categoryId: 'missing' }), []);
  assert.ok(Object.isFrozen(audioWorkflowCatalog));
  assert.ok(Object.isFrozen(audioWorkflowCatalog[0]));
  assert.ok(Object.isFrozen(audioWorkflowCatalog[0].routingStrategy));
  assert.throws(() => getAudioWorkflowCard('missing'), /не найдена/u);
});
