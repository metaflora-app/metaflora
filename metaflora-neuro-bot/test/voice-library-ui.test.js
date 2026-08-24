import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOwnedVoiceCardMessage,
  buildVoiceCardMessage,
  buildVoiceLibraryMessage,
  VOICE_TTS_METACOINS_PER_1000
} from '../src/voice-library-ui.js';
import {
  clearCuratedVoices,
  getCuratedVoice,
  setCuratedVoices
} from '../src/voice-library.js';

function catalog() {
  return Object.freeze(Array.from({ length: 80 }, (_, index) => {
    const number = index + 1;
    const id = `elv_${String(number).padStart(24, '0')}`;
    return Object.freeze({
      id,
      name: `Голос ${number}`,
      description: `живой голос для роликов, подкастов и обучения ${number}`,
      category: number % 2 ? 'premade' : 'professional',
      labels: Object.freeze({
        language: number % 3 ? 'ru' : 'en',
        gender: number % 2 ? 'female' : 'male',
        useCase: number % 2 ? 'подкасты' : 'обучение',
        descriptive: number % 2 ? 'мягкий' : 'собранный'
      }),
      preview: Object.freeze({
        type: 'id',
        value: `voice-preview-${id}`
      })
    });
  }));
}

test.beforeEach(() => clearCuratedVoices());

test('до загрузки показывает недоступность без пустых карточек и пагинации', () => {
  const page = buildVoiceLibraryMessage();
  const buttons = page.reply_markup.inline_keyboard.flat();

  assert.match(page.text, /временно недоступ/u);
  assert.equal(buttons.some(({ callback_data }) => callback_data?.startsWith('voicecard:')), false);
  assert.equal(buttons.some(({ callback_data }) => callback_data?.startsWith('voicepreview:')), false);
  assert.equal(buttons.some(({ callback_data }) => callback_data === 'voiceclone:consent'), false);
  assert.doesNotMatch(page.text, /запис(?:ать|ь) сво(?:й|его) голос/iu);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'audiostudio:voice'));
});

test('личные голоса остаются доступны при временной ошибке общего каталога без кнопки записи', () => {
  const profile = {
    profileId: 'vp_00000000-0000-4000-8000-000000000001',
    name: 'мой голос'
  };
  const page = buildVoiceLibraryMessage({ profiles: [profile] });
  const allButtons = page.reply_markup.inline_keyboard.flat();

  assert.ok(allButtons.some(({ callback_data }) => callback_data === `ownedvoice:${profile.profileId}`));
  assert.equal(allButtons.some(({ callback_data }) => callback_data === 'voiceclone:consent'), false);
});

test('библиотека показывает 80 реальных голосов постранично', () => {
  setCuratedVoices(catalog());
  const page = buildVoiceLibraryMessage({ page: 0 });
  const buttons = page.reply_markup.inline_keyboard.flat();

  assert.match(page.text, /80 голос/u);
  assert.doesNotMatch(page.text, /личных голосов пока нет/iu);
  assert.equal(buttons.some(({ callback_data }) => callback_data === 'voiceclone:consent'), false);
  assert.equal(buttons.filter(({ callback_data }) => callback_data?.startsWith('voicecard:')).length, 8);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'voicelib:1'));
  assert.ok(buttons.some(
    ({ text, callback_data, style }) =>
      text === 'дальше ›' && callback_data === 'voicelib:1' && style === 'primary'
  ));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'audiostudio:voice'));
});

test('библиотека выводит уже созданные личные голоса без новой записи', () => {
  setCuratedVoices(catalog());
  const profiles = [{
    profileId: 'vp_00000000-0000-4000-8000-000000000001',
    name: 'мой спокойный голос',
    expiresAt: '2026-09-12T10:00:00.000Z'
  }];
  const page = buildVoiceLibraryMessage({ profiles });
  const allButtons = page.reply_markup.inline_keyboard.flat();

  assert.match(page.text, /личн/u);
  assert.ok(allButtons.some(({ callback_data }) => callback_data === `ownedvoice:${profiles[0].profileId}`));
  assert.equal(allButtons.some(({ callback_data }) => callback_data === 'voiceclone:consent'), false);
});

test('личный голос можно прослушать, использовать и удалить только через отдельное подтверждение', () => {
  const profile = {
    profileId: 'vp_00000000-0000-4000-8000-000000000001',
    name: '<мой голос>',
    expiresAt: '2026-09-12T10:00:00.000Z'
  };
  const card = buildOwnedVoiceCardMessage(profile);
  const allButtons = card.reply_markup.inline_keyboard.flat();

  assert.match(card.text, /&lt;мой голос&gt;/u);
  assert.ok(allButtons.some(({ callback_data }) => callback_data === `ownedvoicepreview:${profile.profileId}`));
  assert.ok(allButtons.some(({ callback_data }) => callback_data === `ownedvoiceuse:${profile.profileId}`));
  assert.ok(allButtons.some(({ callback_data }) => callback_data === `ownedvoicedeleteconfirm:${profile.profileId}`));
  assert.equal(allButtons.some(({ callback_data }) => callback_data === `ownedvoicedelete:${profile.profileId}`), false);
});

test('карточка объясняет голос и запускает настоящее preview', () => {
  const records = catalog();
  setCuratedVoices(records);
  const selected = records[0];
  const card = buildVoiceCardMessage(selected.id);
  const buttons = card.reply_markup.inline_keyboard.flat();

  assert.ok(card.text.includes(getCuratedVoice(selected.id).name));
  assert.match(card.text, /подходит/u);
  assert.match(
    card.text,
    new RegExp(`<b>озвучка:.*${VOICE_TTS_METACOINS_PER_1000} метакоинов за тысячу знаков<\\/b>`, 'su')
  );
  assert.doesNotMatch(card.text, /eleven|модель|провайдер/iu);
  assert.ok(buttons.some(
    ({ callback_data }) => callback_data === `voicepreview:${selected.id}`
  ));
  assert.ok(buttons.some(
    ({ callback_data }) => callback_data === `voiceuse:${selected.id}`
  ));
  assert.ok(buttons.some(({ text }) => text === '▶️ прослушать'));
  assert.ok(buttons.some(({ text }) => text === '🎙 озвучить этим голосом'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'voicelib:0'));
});
