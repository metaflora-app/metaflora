import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGenerationHistoryDetailMessage,
  buildGenerationHistoryListMessage,
  buildGenerationHistoryUnavailableMessage
} from '../src/generation-history-ui.js';

function buttons(message) {
  return message.reply_markup.inline_keyboard.flat();
}

const generations = Object.freeze([
  Object.freeze({
    id: 'adca3a69-1fa9-47ac-92a3-b9f7b9675579',
    kind: 'image',
    subjectLabel: 'убрать фон',
    prompt: 'оставь предмет, фон сделай прозрачным',
    status: 'completed',
    metacoinsCharged: 7,
    outputType: 'image',
    createdAt: '2026-07-27T01:35:00.000Z',
    finishedAt: '2026-07-27T01:35:12.000Z'
  }),
  Object.freeze({
    id: '9bf11dbc-608f-4d71-af4a-8c31864139c7',
    kind: 'text',
    subjectLabel: 'перефразировщик',
    prompt: 'сделай текст короче',
    status: 'failed',
    metacoinsCharged: 0,
    createdAt: '2026-07-26T20:10:00.000Z'
  })
]);

test('generation history list explains the section and renders compact generation cards', () => {
  const message = buildGenerationHistoryListMessage({
    items: generations,
    page: 0,
    total: 12,
    hasMore: true
  });

  assert.match(message.text, /^🖌️ <b>история генераций<\/b>/u);
  assert.match(message.text, /здесь собраны готовые и незавершённые запуски/u);
  assert.match(message.text, /<b>1\. изображение · убрать фон<\/b>/u);
  assert.match(message.text, /27 июля, 04:35 · готово/u);
  assert.match(message.text, /списано:.*7 метакоинов/u);
  assert.match(message.text, /<b>2\. текст · перефразировщик<\/b>/u);
  assert.match(message.text, /не выполнено/u);
  assert.doesNotMatch(message.text, /provider|request_key|uuid|модель:/iu);

  const actions = buttons(message);
  assert.ok(actions.some(({ callback_data }) => callback_data === `genhist:item:${generations[0].id}:0`));
  assert.ok(actions.some(({ text, callback_data }) => text === 'дальше ›' && callback_data === 'genhist:list:1'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:menu'));
});

test('generation history list has a useful empty state and no dead pagination buttons', () => {
  const message = buildGenerationHistoryListMessage({
    items: [],
    page: 0,
    total: 0,
    hasMore: false
  });

  assert.match(message.text, /запусков пока нет/u);
  assert.match(message.text, /первая запись появится после обращения к модели, ИИ-инструменту/u);
  assert.doesNotMatch(message.text, /ИИ-агент/u);
  assert.equal(buttons(message).some(({ callback_data }) => callback_data.startsWith('genhist:item:')), false);
  assert.equal(buttons(message).some(({ callback_data }) => callback_data.startsWith('genhist:list:')), false);
});

test('generation detail card shows the request, result and charged metacoins with complete navigation', () => {
  const message = buildGenerationHistoryDetailMessage(generations[0], { page: 2 });

  assert.match(message.text, /^🖼 <b>изображение · убрать фон<\/b>/u);
  assert.match(message.text, /<b>исходный промпт:<\/b>\nоставь предмет, фон сделай прозрачным/u);
  assert.match(message.text, /<b>статус:<\/b> готово/u);
  assert.match(message.text, /<b>результат:<\/b> изображение отправлено в чат/u);
  assert.match(message.text, /<b>стоимость:.*7 метакоинов<\/b>/u);
  assert.doesNotMatch(message.text, /provider|request_key|uuid|модель:/iu);

  const actions = buttons(message);
  assert.equal(actions.filter(({ text }) => text.includes('назад')).length, 1);
  assert.ok(actions.some(({ text, callback_data }) => (
    text === '‹ назад к истории' && callback_data === 'genhist:list:2'
  )));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:menu'));
});

test('generation detail safely escapes user text and explains failed runs without charging', () => {
  const message = buildGenerationHistoryDetailMessage({
    ...generations[1],
    prompt: '<script>alert("x")</script>',
    errorMessage: 'provider timeout <raw>'
  });

  assert.doesNotMatch(message.text, /<script>|<raw>/u);
  assert.match(message.text, /&lt;script&gt;/u);
  assert.match(message.text, /запуск не завершился, метакоины не списаны/u);
  assert.match(message.text, /<b>стоимость:.*0 метакоинов<\/b>/u);
});

test('generation history unavailable state returns to profile and menu', () => {
  const message = buildGenerationHistoryUnavailableMessage();

  assert.match(message.text, /^<b>история временно не загрузилась<\/b>/u);
  assert.match(message.text, /попробуй открыть её ещё раз/u);
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'genhist:list:0'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'task:menu'));
});
