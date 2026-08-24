import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGenerationStatusMessage,
  buildGeneratedMediaCaption,
  buildGenerationResultRows
} from '../src/generation-ui.js';

test('generation status is concrete for each product category', () => {
  const image = buildGenerationStatusMessage({ category: 'image', name: 'Nano Banana 2' });
  const agent = buildGenerationStatusMessage({ category: 'agent', name: 'разработчик' });

  assert.match(image.text, /<b>модель: Nano Banana 2<\/b>/);
  assert.match(image.text, /✍️ рисую изображение \(~2 минуты\)/i);
  assert.match(agent.text, /<b>ИИ-агент: разработчик<\/b>/);
  assert.match(agent.text, /разбираю задачу/i);
  assert.match(image.text, /<\/b>\n\n/u);
  assert.doesNotMatch(image.text, /запуск/i);
});

test('generation status chooses a concrete operation for tools and specialized model groups', () => {
  const backgroundTool = buildGenerationStatusMessage({
    category: 'photo',
    name: 'удаление фона',
    subjectType: 'tool'
  });
  const videoTool = buildGenerationStatusMessage({
    category: 'video',
    name: 'Lip Sync',
    subjectType: 'tool'
  });
  const codingModel = buildGenerationStatusMessage({
    category: 'llm',
    name: 'GPT-5.5 Codex'
  });
  const agent = buildGenerationStatusMessage({
    category: 'agent',
    name: 'разработчик'
  });

  assert.match(backgroundTool.text, /<b>ИИ-инструмент: удаление фона<\/b>\n\n🛠️ убираю фон/u);
  assert.match(videoTool.text, /<b>ИИ-инструмент: Lip Sync<\/b>\n\n🎬 синхронизирую речь и видео/u);
  assert.match(codingModel.text, /<b>модель: GPT-5\.5 Codex<\/b>\n\n💻 пишу и проверяю код/u);
  assert.match(agent.text, /<b>ИИ-агент: разработчик<\/b>\n\n🧠 разбираю задачу/u);
});

test('generated media result has a modest caption and only real actions', () => {
  const caption = buildGeneratedMediaCaption({
    category: 'video',
    name: 'Seedance 2.0',
    prompt: 'сними <крупный> план на закате',
    chargedMetacoins: 18
  });
  const rows = buildGenerationResultRows({
    regenerateCallbackData: 'repeat:token',
    settingsCallbackData: 'settings:seedance_20',
    downloadUrl: 'https://cdn.example.test/result.mp4'
  });

  assert.match(caption, /<b>ролик готов<\/b>/);
  assert.match(caption, /<b>исходный промпт:<\/b>\nсними &lt;крупный&gt; план на закате/);
  assert.match(caption, /18 метакоинов/);
  assert.ok(rows.flat().some(({ text, url }) => text === '🔗 прямая ссылка' && url));
  assert.ok(rows.flat().some(({ text, callback_data }) => text === '🔁 перегенерировать' && callback_data === 'repeat:token'));
  assert.ok(rows.flat().some(({ text, callback_data }) => text === '⚙️ параметры' && callback_data === 'settings:seedance_20'));
  assert.equal(rows.flat().some(({ text }) => text === '✨ новая генерация'), false);
});

test('result controls omit a direct download for a non-https provider value', () => {
  const rows = buildGenerationResultRows({
    regenerateCallbackData: 'repeat:token',
    downloadUrl: 'javascript:alert(1)'
  });

  assert.ok(!rows.flat().some(({ text }) => text === '🔗 прямая ссылка'));
  assert.ok(rows.flat().some(({ text }) => text === '🔁 перегенерировать'));
});

test('result controls never expose the legacy long media route', () => {
  const rows = buildGenerationResultRows({
    downloadUrl: 'https://metaflora.example.test/media/AbCdEf0123456789_-AbCdEf01234567'
  });

  assert.ok(!rows.flat().some(({ text }) => text === '🔗 прямая ссылка'));
});
