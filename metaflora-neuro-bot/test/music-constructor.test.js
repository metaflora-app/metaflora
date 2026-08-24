import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MUSIC_STYLE_PRESETS,
  MUSIC_PERFORMER_PRESETS,
  applyMusicSetting,
  buildMusicConfirmationMessage,
  buildMusicDurationMessage,
  buildMusicLyricsMessage,
  buildMusicPerformerMessage,
  buildMusicSettingsMessage,
  buildMusicStyleMessage,
  clearMusicPrompt,
  createMusicDraft,
  musicDraftQuote
} from '../src/music-constructor.js';
import { listAudioWorkflows } from '../src/audio-workflow-catalog.js';

const buttons = (message) => message.reply_markup.inline_keyboard.flat();

test('saved music prompt can be deleted without touching style, lyrics or reference', () => {
  let draft = createMusicDraft('music_song');
  draft = applyMusicSetting(draft, 'prompt', 'песня о летнем городе');
  draft = applyMusicSetting(draft, 'styleText', 'инди-поп');
  draft = applyMusicSetting(draft, 'lyrics', 'custom');
  draft = applyMusicSetting(draft, 'lyricsText', '[куплет]\nтекст');
  draft = applyMusicSetting(draft, 'referenceAudioUrl', 'https://files.example.test/ref.mp3');

  for (const message of [buildMusicSettingsMessage(draft), buildMusicConfirmationMessage(draft)]) {
    assert.equal(buttons(message).find(({ callback_data }) => callback_data === 'musicset:prompt:delete')?.text, '🗑 удалить промпт');
  }

  const cleared = clearMusicPrompt(draft);
  const clearedAgain = clearMusicPrompt(cleared);
  assert.equal(cleared.prompt, '');
  assert.equal(clearedAgain.prompt, '');
  assert.equal(cleared.styleText, draft.styleText);
  assert.equal(cleared.lyricsText, draft.lyricsText);
  assert.equal(cleared.referenceAudioUrl, draft.referenceAudioUrl);
  assert.equal(buttons(buildMusicSettingsMessage(cleared)).some(({ text }) => text === '🗑 удалить промпт'), false);
});

test('новая песня открывается с автоматическим текстом и точной котировкой Suno через Polza', () => {
  const draft = createMusicDraft('music_song');
  assert.equal(draft.instrumental, false);
  assert.equal(draft.lyricsMode, 'auto');
  assert.equal(draft.durationSeconds, 120);
  assert.equal(musicDraftQuote(draft).contractId, 'polza_suno_generate');
  assert.ok(Number.isSafeInteger(musicDraftQuote(draft).metacoins));
});

test('Suno не показывает запуск, если объединённый промпт превышает лимит Polza', () => {
  let draft = createMusicDraft('music_instrumental');
  draft = applyMusicSetting(draft, 'styleText', 'с'.repeat(300));
  draft = applyMusicSetting(draft, 'prompt', 'п'.repeat(201));
  const quote = musicDraftQuote(draft);
  assert.equal(quote.contractId, 'polza_suno_generate');
  assert.equal(quote.ready, false);
  assert.match(quote.missing.join(' '), /500/u);
});

test('готовый текст переключает песню на MiniMax и требует style и lyrics', () => {
  let draft = createMusicDraft('music_song');
  draft = applyMusicSetting(draft, 'lyrics', 'custom');
  assert.equal(musicDraftQuote(draft).contractId, 'fal_minimax_music_v2');
  assert.equal(musicDraftQuote(draft).ready, false);
  draft = applyMusicSetting(draft, 'styleText', 'мягкий инди-фолк, женский вокал');
  draft = applyMusicSetting(draft, 'lyricsText', '[куплет]\nлетний город');
  assert.equal(musicDraftQuote(draft).ready, true);
  assert.equal(buttons(buildMusicSettingsMessage(draft)).some(
    ({ callback_data }) => callback_data === 'musicset:duration:open'
  ), false);
});

test('аудиореференс выбирает только подтверждённый Replicate-маршрут', () => {
  let draft = applyMusicSetting(createMusicDraft('music_song'), 'lyrics', 'custom');
  draft = applyMusicSetting(draft, 'lyricsText', '[куплет]\nтест');
  draft = applyMusicSetting(draft, 'referenceAudioUrl', 'https://files.example.test/reference.mp3');
  const quote = musicDraftQuote(draft);
  assert.equal(quote.contractId, 'replicate_minimax_music_01');
  assert.equal(quote.ready, true);
  assert.match(buildMusicSettingsMessage(draft).text, /аудиореференс:<\/b> добавлен/u);
});

test('инструментальный режим убирает управление текстом песни', () => {
  const draft = applyMusicSetting(createMusicDraft('music_song'), 'instrumental', true);
  const message = buildMusicSettingsMessage(draft);
  assert.doesNotMatch(message.text, /текст песни:/u);
  assert.equal(buttons(message).some(({ callback_data = '' }) => callback_data.startsWith('musicset:lyrics:')), false);
});

test('карточка параметров имеет короткий заголовок, принимает промпт сообщением и открывает финальный экран через готово', () => {
  const message = buildMusicSettingsMessage(createMusicDraft('music_song'));
  const callbacks = buttons(message).map(({ callback_data }) => callback_data);
  assert.match(message.text, /^<b>⚙️ параметры<\/b>/u);
  assert.doesNotMatch(message.text, /<b>промпт:<\/b>/u);
  assert.ok(callbacks.includes('musicset:instrumental:cycle'));
  assert.ok(callbacks.includes('musicset:style:open'));
  assert.ok(callbacks.includes('musicset:duration:open'));
  assert.ok(callbacks.includes('musicset:confirm:open'));
  assert.equal(buttons(message).find(({ callback_data }) => callback_data === 'musicset:confirm:open')?.text, 'готово');
  assert.equal(callbacks.includes('musicset:prompt:open'), false);
  assert.ok(callbacks.includes('task:profile'));
  assert.ok(callbacks.includes('task:menu'));
  assert.equal(buttons(message).some(({ style }) => style === 'success'), false);
});

test('все текстовые музыкальные конструкторы используют короткие параметры и отдельный финальный экран', () => {
  const constructorWorkflowIds = listAudioWorkflows({ kind: 'music' })
    .filter((workflow) => workflow.categoryId === 'music_create')
    .filter((workflow) => workflow.inputs.every((input) => !input.required || input.type === 'text'))
    .map(({ id }) => id);

  assert.deepEqual(constructorWorkflowIds, [
    'music_song',
    'music_instrumental',
    'music_jingle',
    'music_loop'
  ]);

  for (const workflowId of constructorWorkflowIds) {
    const settings = buildMusicSettingsMessage(createMusicDraft(workflowId));
    const settingsButtons = buttons(settings);
    assert.match(settings.text, /^<b>⚙️ параметры<\/b>/u, workflowId);
    assert.doesNotMatch(settings.text, /<b>⚙️ параметры .+<\/b>/u, workflowId);
    assert.equal(settingsButtons.some(({ text }) => text === '✍️ промпт'), false, workflowId);
    assert.equal(settingsButtons.some(({ text }) => text === '👁 проверить и создать'), false, workflowId);
    assert.equal(settingsButtons.find(({ callback_data }) => callback_data === 'musicset:confirm:open')?.text, 'готово', workflowId);

    const readyDraft = applyMusicSetting(createMusicDraft(workflowId), 'prompt', `описание для ${workflowId}`);
    const confirmation = buildMusicConfirmationMessage(readyDraft);
    const confirmationButtons = buttons(confirmation);
    assert.match(confirmation.text, /^<b>👁‍🗨 проверь, что всё на месте<\/b>/u, workflowId);
    assert.ok(confirmationButtons.some(({ callback_data }) => callback_data === 'musicrun:confirm'), workflowId);
    assert.ok(confirmationButtons.some(({ text, callback_data }) => text === '‹ назад к параметрам' && callback_data === 'musicsettings:home'), workflowId);
    assert.ok(confirmationButtons.some(({ text, callback_data }) => text === '👤 профиль' && callback_data === 'task:profile'), workflowId);
    assert.ok(confirmationButtons.some(({ text, callback_data }) => text === '🏠 главное меню' && callback_data === 'task:menu'), workflowId);
  }
});

test('мини-меню длительности содержит только допустимые значения', () => {
  const message = buildMusicDurationMessage(createMusicDraft('music_song'));
  const values = buttons(message)
    .map(({ callback_data }) => callback_data)
    .filter((value = '') => value.startsWith('musicset:duration:'))
    .map((value) => Number(value.split(':')[2]));
  assert.deepEqual(values, [30, 60, 90, 120, 180, 240, 300, 420, 600]);
});

test('короткие музыкальные сценарии показывают свои короткие длительности', () => {
  for (const workflowId of ['music_jingle', 'music_loop']) {
    const message = buildMusicDurationMessage(createMusicDraft(workflowId));
    const values = buttons(message)
      .map(({ callback_data }) => callback_data)
      .filter((value = '') => value.startsWith('musicset:duration:'))
      .map((value) => Number(value.split(':')[2]));
    assert.ok(values.includes(createMusicDraft(workflowId).durationSeconds), workflowId);
    assert.ok(values.some((value) => value <= 20), workflowId);
  }
});

test('пресеты описывают звучание без имён артистов', () => {
  assert.ok(MUSIC_STYLE_PRESETS.length >= 20);
  const serialized = JSON.stringify(MUSIC_STYLE_PRESETS);
  assert.doesNotMatch(serialized, /drake|adele|billie|weeknd|mars|sheeran/iu);
  const message = buildMusicStyleMessage(createMusicDraft('music_song'));
  assert.match(message.text, /^<b>🎛 стиль музыки<\/b>/u);
});

test('референсы исполнителей содержат имена и видимые теги', () => {
  assert.ok(MUSIC_PERFORMER_PRESETS.length >= 30);
  assert.equal(new Set(MUSIC_PERFORMER_PRESETS.map(({ id }) => id)).size, MUSIC_PERFORMER_PRESETS.length);
  assert.ok(MUSIC_PERFORMER_PRESETS.some(({ name }) => name === 'Drake'));
  assert.ok(MUSIC_PERFORMER_PRESETS.some(({ name }) => name === 'Adele'));
  const message = buildMusicPerformerMessage(createMusicDraft('music_song'), { page: 0 });
  assert.match(message.text, /выбери исполнителя/u);
  assert.match(message.text, /hip-hop.*trap.*мужской/iu);
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'musicperformer:drake'));
  assert.ok(buttons(message).every(({ callback_data = '' }) => Buffer.byteLength(callback_data) <= 64));
});

test('выбор исполнителя заполняет редактируемое описание стиля', () => {
  const draft = applyMusicSetting(createMusicDraft('music_song'), 'performer', 'adele');
  assert.match(draft.styleText, /soul|соул/iu);
  assert.match(draft.styleText, /женск/iu);
  assert.equal(draft.performerPresetId, 'adele');
});

test('отдельный экран текста различает авто и свой текст', () => {
  const message = buildMusicLyricsMessage(createMusicDraft('music_song'));
  assert.match(message.text, /^<b>📝 текст песни<\/b>/u);
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'musicset:lyrics:auto'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'musicset:lyrics:custom'));
});

test('финальный экран не разрешает запуск без промпта', () => {
  const empty = buildMusicConfirmationMessage(createMusicDraft('music_song'));
  assert.match(empty.text, /промпт:<\/b> не добавлен/u);
  assert.equal(buttons(empty).some(({ callback_data }) => callback_data === 'musicrun:confirm'), false);

  const readyDraft = applyMusicSetting(createMusicDraft('music_song'), 'prompt', 'песня о летней Москве');
  const ready = buildMusicConfirmationMessage(readyDraft);
  assert.equal(buttons(ready).find(({ callback_data }) => callback_data === 'musicrun:confirm')?.text, '▶️ создать песню');
  assert.ok(buttons(ready).some(({ callback_data }) => callback_data === 'musicsettings:home'));
});

test('финальный экран инструментала использует название выбранного сценария', () => {
  const draft = applyMusicSetting(createMusicDraft('music_instrumental'), 'prompt', 'ночной синтвейв');
  assert.equal(
    buttons(buildMusicConfirmationMessage(draft)).find(({ callback_data }) => callback_data === 'musicrun:confirm')?.text,
    '▶️ создать инструментал'
  );
});

test('неизвестные параметры и чрезмерный пользовательский текст отклоняются', () => {
  const draft = createMusicDraft('music_song');
  assert.throws(() => applyMusicSetting(draft, 'unknown', 'x'), /параметр/u);
  assert.throws(() => applyMusicSetting(draft, 'styleText', 'x'.repeat(301)), /длин/u);
  assert.throws(() => applyMusicSetting(draft, 'lyricsText', 'x'.repeat(3001)), /длин/u);
});
