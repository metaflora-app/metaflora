import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAudioStudioCategoryMessage,
  buildAudioStudioHomeMessage,
  buildAudioWorkflowMessage,
  buildAudioWorkflowSettingsMessage
} from '../src/audio-studio-ui.js';
import {
  audioWorkflowCategories,
  audioWorkflowCatalog
} from '../src/audio-workflow-catalog.js';
import { getAudioWorkflowAvailability } from '../src/audio-workflow-routing.js';

function buttons(message) {
  return message.reply_markup.inline_keyboard.flat();
}

test('главный экран разделяет музыку и голос и сохраняет общую навигацию', () => {
  const message = buildAudioStudioHomeMessage();
  const allButtons = buttons(message);

  assert.equal(message.parse_mode, 'HTML');
  assert.match(message.text, /музык/u);
  assert.match(message.text, /голос/u);
  assert.ok(allButtons.some(({ callback_data }) => callback_data === 'audiostudio:music'));
  assert.ok(allButtons.some(({ callback_data }) => callback_data === 'audiostudio:voice'));
  assert.ok(allButtons.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(allButtons.some(({ callback_data }) => callback_data === 'task:menu'));
  assert.doesNotMatch(message.text, /elevenlabs|replicate|fal|kie|polza|модель:/iu);
});

test('экраны музыки и голоса ведут в три описанные категории каждый', () => {
  for (const kind of ['music', 'voice']) {
    const message = buildAudioStudioCategoryMessage(kind);
    const categoryButtons = buttons(message).filter(({ callback_data }) =>
      callback_data?.startsWith('audiocategory:')
    );
    const expected = audioWorkflowCategories.filter((category) => category.kind === kind);

    assert.equal(categoryButtons.length, 3);
    assert.deepEqual(
      categoryButtons.map(({ callback_data }) => callback_data.split(':')[1]),
      expected.map(({ id }) => id)
    );
    assert.ok(expected.every(({ description }) => message.text.includes(description)));
    if (kind === 'voice') {
      assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'modelcat:voice'));
      assert.equal(buttons(message).some(({ callback_data }) => callback_data === 'audiostudio:home'), false);
      assert.ok(buttons(message).some(
        ({ text, callback_data }) =>
          text === '🎙️ библиотека голосов · 80' && callback_data === 'voicelib:0'
      ));
    } else {
      assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'modelcat:audio'));
      assert.equal(buttons(message).some(({ callback_data }) => callback_data === 'audiostudio:home'), false);
    }
    assert.equal(
      buttons(message).some(({ callback_data }) =>
        callback_data?.startsWith('audiomodels:')
        || callback_data?.startsWith('toolcat:')
      ),
      false
    );
    assert.equal(
      categoryButtons.some(({ icon_custom_emoji_id }) => icon_custom_emoji_id),
      false
    );
  }
});

test('каждая категория показывает все свои сценарии и понятное описание', () => {
  for (const category of audioWorkflowCategories) {
    const message = buildAudioStudioCategoryMessage(category.id);
    const expected = audioWorkflowCatalog.filter(({ categoryId }) => categoryId === category.id);
    const workflowButtons = buttons(message).filter(({ callback_data }) =>
      callback_data?.startsWith('audioworkflow:')
    );

    assert.match(message.text, new RegExp(category.description.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.equal(workflowButtons.length, expected.length);
    assert.deepEqual(
      workflowButtons.map(({ callback_data }) => callback_data.split(':')[1]),
      expected.map(({ id }) => id)
    );
    assert.ok(workflowButtons.every(({ icon_custom_emoji_id }) => icon_custom_emoji_id));
  }
});

test('карточка сценария сразу выбирает задачу без отдельной кнопки подтверждения', () => {
  for (const workflow of audioWorkflowCatalog) {
    const message = buildAudioWorkflowMessage(workflow.id);
    const allButtons = buttons(message);

    assert.equal(message.parse_mode, 'HTML');
    assert.match(message.text, /стоимость/u);
    assert.match(message.text, /метакоин/u);
    assert.doesNotMatch(message.text, /<b>что прислать:|<b>настройки:/u);
    assert.doesNotMatch(message.text, /elevenlabs|replicate|fal|kie|polza|модель:/iu);
    assert.ok(allButtons.some(({ callback_data }) => callback_data === `audiosettings:${workflow.id}`));
    assert.equal(allButtons.some(({ callback_data = '' }) =>
      callback_data.startsWith('audiouse:') || callback_data.startsWith('audioearly:')
    ), false);
    assert.equal(allButtons.some(({ style }) => style === 'success'), false);
    assert.ok(allButtons.some(({ callback_data }) => callback_data === `audiocategory:${workflow.categoryId}`));
    assert.ok(allButtons.some(({ callback_data }) => callback_data === 'task:profile'));
    assert.ok(allButtons.some(({ callback_data }) => callback_data === 'task:menu'));
  }
});

test('настройки сценария остаются внутри аудиоблока и возвращают в его карточку', () => {
  for (const workflow of audioWorkflowCatalog) {
    const message = buildAudioWorkflowSettingsMessage(workflow.id);
    const allButtons = buttons(message);

    assert.match(message.text, new RegExp(workflow.name, 'u'));
    for (const parameter of workflow.parameters) {
      assert.match(message.text, new RegExp(parameter.label, 'u'));
    }
    assert.doesNotMatch(message.text, /elevenlabs|replicate|fal|kie|polza|модель:/iu);
    assert.ok(allButtons.some(
      ({ callback_data }) => callback_data === `audioworkflow:${workflow.id}`
    ));
    assert.equal(
      allButtons.some(({ callback_data }) =>
        callback_data?.startsWith('modelcat:')
        || callback_data?.startsWith('toolcat:')
        || callback_data?.startsWith('settings:')
      ),
      false
    );
  }
});

test('возвраты музыки, озвучки и расшифровки не выходят в общий каталог моделей', () => {
  for (const workflowId of ['music_instrumental', 'voice_tts', 'voice_transcribe']) {
    const workflow = audioWorkflowCatalog.find(({ id }) => id === workflowId);
    const card = buildAudioWorkflowMessage(workflowId);
    const settings = buildAudioWorkflowSettingsMessage(workflowId);

    assert.ok(buttons(card).some(
      ({ callback_data }) => callback_data === `audiocategory:${workflow.categoryId}`
    ));
    assert.ok(buttons(settings).some(
      ({ callback_data }) => callback_data === `audioworkflow:${workflowId}`
    ));
    for (const message of [card, settings]) {
      assert.equal(buttons(message).some(({ callback_data = '' }) =>
        /^(?:model|modelcat|toolcat|settings):/u.test(callback_data)
      ), false);
    }
  }
});

test('библиотека голосов показывает синюю кнопку «дальше» и короткое название категории', () => {
  const voice = buildAudioStudioCategoryMessage('voice');
  assert.ok(buttons(voice).some(({ text }) => text === '🗣️ изменить голос'));
  assert.equal(buttons(voice).some(({ text }) => text.includes('изменить и перевести')), false);
});
