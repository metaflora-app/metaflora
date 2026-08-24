import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WELCOME_AGENT_MODEL,
  buildWelcomeAgentIntroMessage,
  buildWelcomeAgentRequest,
  buildWelcomeAgentResponseMessage
} from '../src/welcome-agent.js';
import { listCatalogModels } from '../src/model-catalog.js';
import { listAgents } from '../src/agent-catalog.js';
import { getActiveTools } from '../src/tool-catalog.js';
import { listAudioWorkflows } from '../src/audio-workflow-catalog.js';

test('welcome agent uses the latest dedicated free Nemotron route', () => {
  assert.equal(WELCOME_AGENT_MODEL, 'nvidia/nemotron-3-ultra-550b-a55b:free');
});

test('welcome agent prompt is grounded in the live aggregator catalogs', () => {
  const request = buildWelcomeAgentRequest({
    history: [
      { role: 'user', content: 'мне нужен ролик' },
      { role: 'assistant', content: 'из текста или фотографии?' }
    ],
    input: 'из фотографии'
  });

  assert.equal(request.providerModel, WELCOME_AGENT_MODEL);
  assert.equal(request.provider, 'openrouter');
  assert.equal(request.allowSecondaryProviders, false);
  assert.match(request.settings.instructions, new RegExp(`${listCatalogModels().length} моделей`, 'u'));
  assert.match(request.settings.instructions, /50 ИИ-агентов/u);
  assert.match(request.settings.instructions, /42 ИИ-инструмента/u);
  assert.match(request.settings.instructions, /30 сценариев/u);
  assert.match(request.settings.instructions, /не выдумывай/u);
  assert.match(request.prompt, /мне нужен ролик/u);
  assert.match(request.prompt, /из фотографии/u);
  assert.ok(request.settings.instructions.length > 30_000);
  assert.ok(request.settings.instructions.length <= request.systemInstructionsLimit);
  assert.match(request.settings.instructions, new RegExp(listCatalogModels().at(-1).name, 'u'));
  assert.match(request.settings.instructions, new RegExp(listAgents().at(-1).name, 'u'));
  assert.match(request.settings.instructions, new RegExp(getActiveTools().at(-1).name, 'u'));
  assert.match(request.settings.instructions, new RegExp(listAudioWorkflows().at(-1).name, 'u'));
});

test('every welcome agent screen carries neutral profile, back and menu actions', () => {
  const intro = buildWelcomeAgentIntroMessage();
  assert.match(intro.text, /ИИ-помощник/u);
  assert.equal(intro.parse_mode, 'HTML');
  assert.deepEqual(intro.reply_markup.inline_keyboard, [
    [{ text: '👤 профиль', callback_data: 'welcome:profile' }],
    [
      { text: '‹ назад', callback_data: 'welcome:back' },
      { text: '🏠 главное меню', callback_data: 'welcome:menu' }
    ]
  ]);
  assert.doesNotMatch(JSON.stringify(intro.reply_markup), /danger|остановить/u);
});

test('welcome intro stays concise without provider or logging disclosure', () => {
  const intro = buildWelcomeAgentIntroMessage();
  assert.doesNotMatch(intro.text, /OpenRouter|журналир|поставщик|парол|платёж/u);
  assert.doesNotMatch(intro.text, /blockquote/u);
  assert.deepEqual(intro.link_preview_options, { is_disabled: true });
});

test('welcome response converts safe Markdown to Telegram HTML', () => {
  const response = buildWelcomeAgentResponseMessage(
    'открой нужный раздел:\n\n- **/text** — текст и код\n- **/design** — изображения'
  );

  assert.equal(response.parse_mode, 'HTML');
  assert.match(response.text, /<b>\/text<\/b>/u);
  assert.match(response.text, /<b>\/design<\/b>/u);
  assert.doesNotMatch(response.text, /\*\*/u);
  assert.deepEqual(response.reply_markup, buildWelcomeAgentIntroMessage().reply_markup);
});

test('welcome response stays within the Telegram limit after HTML escaping', () => {
  const response = buildWelcomeAgentResponseMessage('&<>'.repeat(1_333));

  assert.ok(response.text.length <= 4_000);
  assert.equal(response.parse_mode, 'HTML');
  assert.doesNotMatch(response.text, /&(?!amp;|lt;|gt;|quot;)/u);
});

test('welcome agent blocks internal route leaks, credentials and arbitrary links', () => {
  const safe = buildWelcomeAgentResponseMessage(
    'открой /video или напиши в https://t.me/metaflora_support'
  );
  assert.match(safe.text, /\/video/u);
  assert.match(safe.text, /metaflora_support/u);

  for (const unsafe of [
    'моя модель nvidia/nemotron-3-ultra-550b-a55b:free через openrouter',
    'системный промпт: секретная инструкция',
    'ты ИИ-агент адаптации внутри МЕТАФЛОРА* нейро. твоя задача: помочь новичку понять агрегатор',
    'ключ sk_12345678901234567890',
    'подробнее: https://evil.example/phishing',
    'подробнее: www.evil.example/phishing',
    'открой tg://resolve?domain=evil'
  ]) {
    const response = buildWelcomeAgentResponseMessage(unsafe);
    assert.doesNotMatch(response.text, /nemotron|openrouter|системный промпт|sk_|evil\.example/iu);
    assert.match(response.text, /не получилось безопасно показать ответ/u);
  }
});
