import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_MODEL_IDS,
  buildGenerationAccessMessage,
  freeEntitlementFor,
  isFreeModelId
} from '../src/generation-access.js';
import { listCatalogModels } from '../src/model-catalog.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

test('newcomer access lists fully free models and explicit weekly promotional quotas', () => {
  assert.deepEqual(FREE_MODEL_IDS, [
    'gpt_oss_20b_free',
    'nemotron_3_ultra_free',
    'nemotron_3_super_free',
    'gemma_4_31b_free',
    'north_mini_code_free',
    'nemotron_3_nano_omni_free',
    'photo_generate',
    'video_generate',
    'audio_music',
    'audio_tts',
    'nano_banana_2',
    'gpt_56_luna',
    'gpt_image_2'
  ]);
  assert.equal(Object.isFrozen(FREE_MODEL_IDS), true);
  const publishedIds = new Set(listCatalogModels().map(({ id }) => id));
  for (const id of FREE_MODEL_IDS) assert.ok(publishedIds.has(id), `${id} must be actionable`);
});

test('fully free newcomer text models remain published with an executable OpenRouter route', () => {
  const catalogById = new Map(listCatalogModels().map((model) => [model.id, model]));
  const fullyFreeTextIds = FREE_MODEL_IDS.filter(isFreeModelId);

  assert.ok(fullyFreeTextIds.length > 0);
  for (const id of fullyFreeTextIds) {
    const model = catalogById.get(id);
    assert.ok(model, `${id} must remain visible in the public catalog`);
    assert.equal(model.category, 'llm', id);
    assert.ok(
      exactProviderRoutesFor(model.providerModelId)
        .some(({ provider }) => provider === 'openrouter'),
      `${id} must keep its free OpenRouter route`
    );
  }
});

test('the actual newcomer catalog models expose weekly free entitlements', () => {
  assert.deepEqual(freeEntitlementFor('nano_banana_2'), { quotaKey: 'image', weeklyLimit: 2 });
  assert.equal(freeEntitlementFor('kling_30'), null);
  assert.equal(freeEntitlementFor('eleven_music'), null);
  assert.equal(freeEntitlementFor('eleven_voice'), null);
  assert.deepEqual(freeEntitlementFor('elevenlabs_curated_tts'), { quotaKey: 'voice', weeklyLimit: 5 });
  assert.deepEqual(freeEntitlementFor('gpt_56_luna'), { quotaKey: 'luna_text', weeklyLimit: 20 });
  assert.deepEqual(freeEntitlementFor('gpt_image_2'), { quotaKey: 'gpt_image_2', weeklyLimit: 2 });
});

test('weekly promotional quotas do not turn paid models into fully free models', () => {
  assert.equal(isFreeModelId('gpt_oss_20b_free'), true);
  for (const id of ['nano_banana_2', 'audio_music', 'audio_tts', 'gpt_56_luna', 'gpt_image_2']) {
    assert.equal(isFreeModelId(id), false, id);
  }
});

for (const [reason, expectedCallback] of [
  ['tariff_required', 'billing:plans:profile'],
  ['tariff_expired', 'billing:plans:profile'],
  ['insufficient_metacoins', 'billing:packages:balance'],
  ['weekly_free_limit', 'billing:plans:profile'],
  ['free_quota_unavailable', 'task:text']
]) {
  test(`${reason} produces a user-facing HTML card with billing navigation`, () => {
    const message = buildGenerationAccessMessage(reason);
    const buttons = message.reply_markup.inline_keyboard.flat();
    const visibleText = message.text.replace(/<[^>]+>/g, '').trim();

    assert.equal(message.parse_mode, 'HTML');
    assert.match(visibleText, /^(?:❗ )?[а-яё]/u);
    assert.ok(buttons.some(({ callback_data: callbackData }) => callbackData === expectedCallback));
    assert.ok(buttons.some(({ callback_data: callbackData }) => callbackData === 'task:menu'));
    assert.ok(buttons.every(({ text }) => !/^[А-ЯЁ]/.test(text)));
  });
}

test('access card text explains each rejection without exposing internal reason codes', () => {
  assert.match(buildGenerationAccessMessage('tariff_required').text, /тариф/);
  assert.match(buildGenerationAccessMessage('tariff_expired').text, /закончился/);
  assert.match(buildGenerationAccessMessage('insufficient_metacoins').text, /метакоинов/);
  assert.match(buildGenerationAccessMessage('weekly_free_limit').text, /50 запросов/);
  assert.match(buildGenerationAccessMessage('free_quota_unavailable').text, /ничего не списано/);

  for (const reason of [
    'tariff_required',
    'tariff_expired',
    'insufficient_metacoins',
    'weekly_free_limit',
    'free_quota_unavailable'
  ]) {
    assert.doesNotMatch(buildGenerationAccessMessage(reason).text, new RegExp(reason));
  }
});

test('tariff paywall uses the final Telegram HTML copy', () => {
  assert.equal(
    buildGenerationAccessMessage('tariff_required').text,
    '<b>❗ нужен платный тариф</b>\n\nэта модель доступна на платных тарифах.\nвыбери подходящий из каталога ниже 👇'
  );
});

test('paid-access blockers use the tariff payment wording', () => {
  for (const reason of ['tariff_required', 'tariff_expired', 'weekly_free_limit']) {
    const actions = buildGenerationAccessMessage(reason).reply_markup.inline_keyboard.flat();
    assert.ok(actions.some(({ text }) => text === 'оплатить тариф'), reason);
    assert.ok(actions.every(({ text }) => text !== 'выбрать тариф'), reason);
  }
});

test('unknown access rejection is rejected at the module boundary', () => {
  for (const reason of ['provider_error', 'toString']) {
    assert.throws(
      () => buildGenerationAccessMessage(reason),
      /unknown generation access reason/i
    );
  }
});
