import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NullHistoryRepository,
  PostgresHistoryRepository
} from '../src/history-repository.js';

function fakePool(results = []) {
  const calls = [];
  return {
    calls,
    async query(text, values) {
      calls.push(Object.freeze({ text, values }));
      return results.shift() ?? { rows: [] };
    },
    async end() {}
  };
}

test('null history repository is safe when Supabase is not configured', async () => {
  const repository = new NullHistoryRepository();

  assert.equal(await repository.recordEvent({
    eventName: 'menu.opened',
    category: 'navigation',
    telegramUserId: '10'
  }), null);
  await repository.close();
});

test('Postgres history repository returns the immutable product needed for crypto fulfillment', async () => {
  const pool = fakePool([{ rows: [{
    status: 'confirmed', duplicate: false, finance_request_created: true,
    telegram_user_id: '10', telegram_chat_id: '20', product_kind: 'package',
    product_id: 'coins_150', duration_months: 1, duration_days: 0,
    metacoins: 150, confirmed_at: '2026-08-11T12:00:00.000Z'
  }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const result = await repository.recordCryptoUsdcCallback({
    callbackId: 'evt_base_12345678',
    orderId: 'mfc_0123456789abcdef0123456789abcdef',
    paymentId: '68f7a946db0529ea9b6d3a12',
    transactionHash: `0x${'a'.repeat(64)}`,
    amountUsdcMicros: 12_500_000,
    confirmedAt: '2026-08-11T12:00:00.000Z'
  });

  assert.equal(result.productKind, 'package');
  assert.equal(result.productId, 'coins_150');
  assert.equal(result.telegramUserId, '10');
  assert.match(pool.calls[0].text, /telegram_user_id, telegram_chat_id, product_kind/);
});

test('Postgres history repository writes events with parameterized SQL', async () => {
  const pool = fakePool([{ rows: [{ id: 'event-id' }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const id = await repository.recordEvent({
    eventName: 'menu.opened',
    category: 'navigation',
    telegramUserId: '10',
    metadata: { destination: 'profile' }
  });

  assert.equal(id, 'event-id');
  assert.equal(pool.calls.length, 1);
  assert.match(pool.calls[0].text, /INSERT INTO "neuro"\.product_events/);
  assert.match(pool.calls[0].text, /\$1/);
  assert.doesNotMatch(pool.calls[0].text, /menu\.opened/);
  assert.equal(pool.calls[0].values[0], 'menu.opened');
});

test('repository upserts Telegram user separately from the event journal', async () => {
  const pool = fakePool([{ rows: [{ id: 'user-id' }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const id = await repository.upsertUser({
    telegramUserId: '10',
    username: 'mishchenko_is',
    firstName: 'Иван',
    languageCode: 'ru',
    isPremium: true
  });

  assert.equal(id, 'user-id');
  assert.match(pool.calls[0].text, /INSERT INTO "neuro"\.users/);
  assert.match(pool.calls[0].text, /ON CONFLICT \(telegram_user_id\)/);
  assert.equal(pool.calls[0].values.includes('mishchenko_is'), true);
});

test('repository stores only safe Telegram avatar references and a private storage path', async () => {
  const pool = fakePool([{ rows: [{ id: 'user-id' }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const updated = await repository.updateUserAvatarReference({
    telegramUserId: '10',
    fileId: 'file_id',
    fileUniqueId: 'file_unique_id',
    storagePath: '10/file_unique_id.jpg'
  });

  assert.equal(updated, true);
  assert.match(pool.calls[0].text, /UPDATE "neuro"\.users/);
  assert.match(pool.calls[0].text, /avatar_storage_path = \$4/);
  assert.deepEqual(pool.calls[0].values, [
    '10',
    'file_id',
    'file_unique_id',
    '10/file_unique_id.jpg'
  ]);
  assert.doesNotMatch(JSON.stringify(pool.calls[0]), /api\.telegram\.org|\/bot[^/]+\//i);
});

test('Postgres history repository implements the complete YooKassa audit contract', async () => {
  const pool = fakePool([
    { rows: [{ id: 'user-id' }] },
    { rows: [{ id: 'payment-row-id' }] },
    {
      rows: [{
        payment_id: 'payment-1',
        telegram_user_id: 10,
        product_type: 'metacoins',
        product_id: 'coins_50',
        amount_kopecks: 19_900,
        base_metacoins: 50,
        status: 'pending'
      }]
    },
    { rows: [{ id: 'webhook-row-id' }] },
    { rows: [{ processing_status: 'received' }] },
    { rows: [{ id: 'payment-row-id' }] },
    { rows: [{ id: 'webhook-row-id' }] }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  assert.equal(await repository.recordPaymentCreated({
    telegramUserId: '10',
    paymentId: 'payment-1',
    productType: 'metacoins',
    productId: 'coins_50',
    amountKopecks: 19_900,
    baseMetacoins: 50,
    receiptEmail: 'buyer@example.ru',
    providerPayload: { id: 'payment-1' }
  }), 'payment-row-id');
  assert.deepEqual(await repository.getPaymentRecord('payment-1'), {
    paymentId: 'payment-1',
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_50',
    amountKopecks: 19_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  assert.equal(await repository.recordPaymentWebhook({
    providerEventId: 'payment.succeeded:payment-1',
    eventType: 'payment.succeeded',
    payload: { type: 'notification' }
  }), 'webhook-row-id');
  assert.equal(
    await repository.getPaymentWebhookStatus('payment.succeeded:payment-1'),
    'received'
  );
  assert.equal(await repository.updatePaymentStatus({
    paymentId: 'payment-1',
    status: 'succeeded',
    paidAt: '2026-07-27T00:00:00.000Z',
    providerPayload: { status: 'succeeded' }
  }), 'payment-row-id');
  assert.equal(await repository.updatePaymentWebhookStatus({
    providerEventId: 'payment.succeeded:payment-1',
    status: 'processed'
  }), 'webhook-row-id');

  assert.match(pool.calls[1].text, /ON CONFLICT \(payment_id\) DO NOTHING/);
  assert.match(pool.calls[1].text, /receipt_email/);
  assert.match(pool.calls[2].text, /JOIN "neuro"\.users AS u/);
  assert.match(pool.calls[3].text, /ON CONFLICT \(provider, provider_event_id\) DO NOTHING/);
  assert.match(pool.calls[5].text, /UPDATE "neuro"\.payments/);
  assert.match(pool.calls[5].text, /receipt_registration/);
  assert.match(pool.calls[6].text, /UPDATE "neuro"\.provider_webhooks/);
});

test('Postgres history repository records Stars through the atomic XTR ledger RPC', async () => {
  const pool = fakePool([
    { rows: [{ payment_id: 'stars-payment-row-id', duplicate: false }] },
    { rows: [{
      payment_id: 'stars-charge-1',
      telegram_user_id: 10,
      product_type: 'metacoins',
      product_id: 'coins_50',
      amount_kopecks: null,
      amount_xtr: 199,
      currency: 'XTR',
      base_metacoins: 50,
      status: 'succeeded',
      receipt_email: null
    }] }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  assert.equal(await repository.recordStarsPayment({
    telegramUserId: '10',
    paymentId: 'stars-charge-1',
    productType: 'metacoins',
    productId: 'coins_50',
    amountXtr: 199,
    baseMetacoins: 50,
    paidAt: '2026-08-09T10:00:00.000Z',
    providerPayload: { currency: 'XTR', total_amount: 199 }
  }), 'stars-payment-row-id');
  assert.deepEqual(await repository.getPaymentRecord('stars-charge-1'), {
    paymentId: 'stars-charge-1',
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_50',
    amountXtr: 199,
    baseMetacoins: 50,
    status: 'succeeded'
  });

  assert.match(pool.calls[0].text, /record_telegram_stars_payment/);
  assert.deepEqual(pool.calls[0].values.slice(0, 6), [
    '10', 'stars-charge-1', 'metacoins', 'coins_50', 199, 50
  ]);
  assert.doesNotMatch(pool.calls[0].text, /amount_kopecks|provider_topup_requests/i);
});

test('Postgres history repository lists bounded pending Stars fulfillments', async () => {
  const providerPayload = {
    currency: 'XTR',
    total_amount: 199,
    invoice_payload: 'mfstars:v1:package:coins_50:1:199:10',
    telegram_payment_charge_id: 'stars-charge-pending'
  };
  const pool = fakePool([{ rows: [{
    payment_id: 'stars-charge-pending',
    telegram_user_id: 10,
    provider_payload: providerPayload
  }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  assert.deepEqual(await repository.listPendingStarsPayments({ limit: 25 }), [{
    paymentId: 'stars-charge-pending',
    telegramUserId: '10',
    providerPayload
  }]);
  assert.match(pool.calls[0].text, /list_pending_telegram_stars_fulfillments/);
  assert.deepEqual(pool.calls[0].values, [25]);
});

test('history repository records payment allocations and safe payout status for CRM', async () => {
  const pool = fakePool([
    { rows: [{ id: 'user-id' }] },
    { rows: [] },
    { rows: [] },
    { rows: [{ id: 'user-id' }] },
    { rows: [] }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  await repository.recordFinanceAllocations({
    externalPaymentId: 'payment-1',
    telegramUserId: '10',
    allocations: [
      { allocationKey: 'payment-1:gross:all', category: 'gross', amountKopecks: 100_000, currency: 'RUB', status: 'actual', source: 'payment_webhook' },
      { allocationKey: 'payment-1:api_reserve:polza', category: 'api_reserve', provider: 'polza', amountKopecks: 10_000, currency: 'RUB', status: 'reserved', source: 'payment_webhook' }
    ]
  });
  await repository.recordFinancePayout({
    withdrawalId: 'withdrawal-1',
    telegramUserId: '10',
    amountKopecks: 25_000,
    method: 'sbp',
    provider: 'yookassa_payouts',
    status: 'submitted',
    payoutStatus: 'pending',
    destinationHint: '+7••• •••-12-34'
  });

  assert.match(pool.calls[1].text, /INSERT INTO "neuro"\.finance_allocations/);
  assert.match(pool.calls[1].text, /ON CONFLICT \(allocation_key\) DO NOTHING/);
  assert.equal(pool.calls.some(({ text }) => /provider_topup_requests/.test(text)), false);
  assert.equal(pool.calls.some(({ text }) => /INSERT INTO "neuro"\.finance_payouts/.test(text)), true);
  assert.doesNotMatch(JSON.stringify(pool.calls), /4111111111111111|synonym\.token/u);
});

test('history repository atomically secures an upgrade reserve carry with its allocations', async () => {
  const calls = [];
  const results = [
    { rows: [{ id: 'user-id' }] },
    { rows: [] }, { rows: [] }, { rows: [] },
    { rows: [{
      reclassification_id: '00000000-0000-4000-8000-000000000099',
      reserve_carry_in_kopecks: '12588'
    }] }
  ];
  const client = {
    async query(text, values) {
      calls.push({ text, values });
      if (/^(BEGIN|COMMIT|ROLLBACK)$/u.test(text)) return { rows: [] };
      return results.shift() ?? { rows: [] };
    },
    release() { calls.push({ text: 'RELEASE' }); }
  };
  const pool = { async connect() { return client; }, async end() {} };
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  await repository.recordFinanceAllocations({
    externalPaymentId: 'upgrade-payment-1', telegramUserId: '10',
    allocations: [
      { allocationKey: 'upgrade-payment-1:gross:all', category: 'gross', amountKopecks: 76_500, currency: 'RUB', status: 'actual', source: 'payment_webhook' },
      { allocationKey: 'upgrade-payment-1:api_reserve:polza', category: 'api_reserve', provider: 'polza', amountKopecks: 44_259, currency: 'RUB', status: 'reserved', source: 'payment_webhook' },
      { allocationKey: 'upgrade-payment-1:api_reserve:routerai', category: 'api_reserve', provider: 'routerai', amountKopecks: 42_151, currency: 'RUB', status: 'reserved', source: 'payment_webhook' }
    ],
    metadata: { upgrade: true, reserveCarryInKopecks: 12_588 }
  });

  assert.equal(calls[0].text, 'BEGIN');
  assert.match(calls.at(-3).text, /reclassify_upgrade_provider_reserve/u);
  assert.deepEqual(calls.at(-3).values, ['upgrade-payment-1', 12_588]);
  assert.equal(calls.at(-2).text, 'COMMIT');
  assert.equal(calls.at(-1).text, 'RELEASE');
});

test('Postgres history repository gates provider topups behind YooKassa confirmation', async () => {
  const pool = fakePool([
    { rows: [{ id: 'user-id' }] },
    { rows: [] },
    {
      rows: [{
        confirmation_id: '00000000-0000-4000-8000-000000000003',
        duplicate: false,
        payment_id: 'payment-1',
        provider_reserve_kopecks: 10_000,
        topup_count: 1,
        status: 'succeeded'
      }]
    }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  await repository.recordFinanceAllocations({
    externalPaymentId: 'payment-1',
    telegramUserId: '10',
    allocations: [{
      allocationKey: 'payment-1:api_reserve:polza',
      category: 'api_reserve',
      provider: 'polza',
      amountKopecks: 10_000,
      currency: 'RUB',
      status: 'reserved',
      source: 'payment_webhook'
    }]
  });

  const confirmation = await repository.recordYooKassaPaymentConfirmation({
    externalEventId: 'payment.succeeded:payment-1',
    paymentId: 'payment-1',
    amountKopecks: 14_000,
    currency: 'RUB',
    event: 'payment.succeeded',
    status: 'succeeded',
    metadata: { testOnly: true }
  });

  assert.equal(confirmation.topupCount, 1);
  assert.match(pool.calls[2].text, /record_yookassa_payment_confirmation/);
  assert.equal(pool.calls[2].values[0], 'payment.succeeded:payment-1');
  assert.equal(pool.calls[2].values[1], 'payment-1');
  assert.equal(pool.calls[2].values[2], 14_000);
  assert.equal(pool.calls.some(({ text }) => /INSERT INTO "neuro"\.provider_topup_requests/.test(text)), false);
});

test('repository stores conversations, messages and generation lifecycle', async () => {
  const pool = fakePool([
    { rows: [{ id: 'conversation-id' }] },
    { rows: [{ id: 'message-id' }] },
    { rows: [{ id: 'generation-id' }] },
    { rows: [{ id: 'generation-id' }] }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const conversationId = await repository.ensureConversation({
    telegramUserId: '10',
    conversationKey: 'model:10:gpt_5_mini',
    kind: 'model',
    subjectId: 'gpt_5_mini',
    title: 'новый диалог'
  });
  const messageId = await repository.appendMessage({
    telegramUserId: '10',
    conversationId,
    role: 'user',
    content: 'привет',
    telegramMessageId: '55'
  });
  const generationId = await repository.startGeneration({
    telegramUserId: '10',
    conversationId,
    requestKey: 'message:10:55',
    kind: 'text',
    subjectId: 'gpt_5_mini',
    prompt: 'привет',
    parameters: { temperature: '0.7' },
    metacoinsQuoted: 2
  });
  await repository.completeGeneration({
    generationId,
    outputText: 'привет!',
    metacoinsCharged: 2,
    provider: 'openrouter',
    providerModelId: 'openai/gpt-5-mini'
  });

  assert.equal(messageId, 'message-id');
  assert.equal(generationId, 'generation-id');
  assert.match(pool.calls[0].text, /conversations/);
  assert.match(pool.calls[1].text, /messages/);
  assert.match(pool.calls[2].text, /generations/);
  assert.match(pool.calls[3].text, /status = 'completed'/);
});

test('repository records inbound Telegram updates with sanitized JSON', async () => {
  const pool = fakePool([{ rows: [{ id: 'telegram-update-id' }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const id = await repository.recordTelegramUpdate({
    telegramUpdateId: '77',
    telegramUserId: '10',
    telegramChatId: '20',
    updateType: 'message',
    payload: {
      message: { text: 'привет' },
      authorization: 'secret'
    }
  });

  assert.equal(id, 'telegram-update-id');
  assert.match(pool.calls[0].text, /INSERT INTO "neuro"\.telegram_updates/);
  assert.equal(pool.calls[0].values[0], '77');
  assert.equal(pool.calls[0].values.at(-1).includes('secret'), false);
});

test('repository records Telegram and provider API call lifecycles', async () => {
  const pool = fakePool([
    { rows: [{ id: 'telegram-call-id' }] },
    { rows: [{ id: 'telegram-call-id' }] },
    { rows: [{ id: 'provider-call-id' }] },
    { rows: [{ id: 'provider-call-id' }] }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const telegramCallId = await repository.startTelegramApiCall({
    requestKey: 'telegram:send:1',
    method: 'sendMessage',
    telegramChatId: '20',
    requestPayload: { text: 'готово' }
  });
  await repository.completeTelegramApiCall({
    callId: telegramCallId,
    status: 'succeeded',
    httpStatus: 200,
    responsePayload: { message_id: 8 },
    durationMs: 12
  });
  const providerCallId = await repository.startProviderApiCall({
    requestKey: 'provider:1',
    provider: 'openrouter',
    operation: 'chat.completions',
    endpointHost: 'openrouter.ai',
    endpointPath: '/api/v1/chat/completions',
    requestPayload: { model: 'test', authorization: 'secret' }
  });
  await repository.completeProviderApiCall({
    callId: providerCallId,
    status: 'succeeded',
    httpStatus: 200,
    responsePayload: { choices: [{ message: { content: 'ответ' } }] },
    durationMs: 42
  });

  assert.match(pool.calls[0].text, /telegram_api_calls/);
  assert.match(pool.calls[1].text, /status = \$2/);
  assert.match(pool.calls[2].text, /provider_api_calls/);
  assert.equal(pool.calls[2].values.includes('secret'), false);
  assert.equal(pool.calls[3].values.includes(42), true);
});

test('repository mirrors a metacoin debit idempotently', async () => {
  const pool = fakePool([
    { rows: [{ id: 'ledger-id' }] }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const id = await repository.recordMetacoinTransaction({
    telegramUserId: '10',
    idempotencyKey: 'generation:10:55',
    delta: -7,
    balanceAfter: 93,
    source: 'generation',
    referenceType: 'generation_request',
    referenceId: 'generation:10:55',
    description: 'списание за тестовую генерацию',
    metadata: { debitStatus: 'debited' }
  });

  assert.equal(id, 'ledger-id');
  assert.match(pool.calls[0].text, /INSERT INTO "neuro"\.metacoin_ledger/);
  assert.match(pool.calls[0].text, /ON CONFLICT \(idempotency_key\)/);
  assert.deepEqual(pool.calls[0].values.slice(0, 4), ['10', 'generation:10:55', -7, 93]);
});

test('repository lists generation history through owner-scoped queries', async () => {
  const pool = fakePool([{
    rows: [
      {
        id: '00000000-0000-4000-8000-000000000002',
        kind: 'text',
        subject_id: 'gpt_oss_20b_free',
        status: 'completed',
        metacoins_quoted: 7,
        metacoins_charged: 7,
        created_at: new Date('2026-07-27T00:00:00.000Z'),
        finished_at: new Date('2026-07-27T00:01:00.000Z'),
        prompt_preview: 'напиши план запуска',
        output_preview: 'готово'
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'image',
        subject_id: 'nano_banana_pro',
        status: 'failed',
        metacoins_quoted: 11,
        metacoins_charged: 0,
        created_at: new Date('2026-07-26T23:00:00.000Z'),
        finished_at: null,
        prompt_preview: 'афиша',
        output_preview: ''
      }
    ]
  }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const page = await repository.listGenerations({
    telegramUserId: '10',
    limit: 1
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].subjectId, 'gpt_oss_20b_free');
  assert.equal(page.items[0].metacoinsCharged, 7);
  assert.equal(typeof page.nextCursor, 'string');
  assert.match(pool.calls[0].text, /JOIN "neuro"\.users u ON u\.id = g\.user_id/);
  assert.match(pool.calls[0].text, /u\.telegram_user_id = \$1/);
  assert.doesNotMatch(pool.calls[0].text, /metadata|provider_payload|parameters/);
});

test('repository filters generation history to media and tools at the SQL boundary', async () => {
  const pool = fakePool([{ rows: [] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  await repository.listGenerations({
    telegramUserId: '10',
    scope: 'media'
  });

  assert.match(pool.calls[0].text, /g\.subject_type = 'tool'/u);
  assert.match(pool.calls[0].text, /g\.subject_type IN \('entertainment', 'music'\)/u);
  assert.match(pool.calls[0].text, /g\.subject_type = 'model' AND g\.kind IN \('image', 'video', 'audio', 'music', 'voice', 'document', '3d'\)/u);
  assert.match(pool.calls[0].text, /g\.subject_type IS NULL AND g\.kind IN \('image', 'video', 'audio', 'music', 'voice', 'document', '3d', 'tool'\)/u);
  assert.equal(pool.calls[0].values[2], 'media');
});

test('repository persists distinct entertainment and music generation subjects', async () => {
  const pool = fakePool([{ rows: [{ id: '00000000-0000-4000-8000-000000000001' }] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });
  await repository.startGeneration({
    telegramUserId: '10', requestKey: 'entertainment:10:age', kind: 'image',
    subjectType: 'entertainment', subjectId: 'visual_age', prompt: 'private'
  });
  assert.equal(pool.calls[0].values[4], 'entertainment');
});

test('repository reads one generation only for its owner and returns a public DTO', async () => {
  const pool = fakePool([{
    rows: [{
      id: '00000000-0000-4000-8000-000000000001',
      kind: 'image',
      subject_id: 'remove_background',
      status: 'completed',
      metacoins_quoted: 7,
      metacoins_charged: 7,
      created_at: new Date('2026-07-27T00:00:00.000Z'),
      finished_at: new Date('2026-07-27T00:01:00.000Z'),
      prompt: 'убери фон',
      output_text: '',
      output_type: 'image'
    }]
  }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const generation = await repository.getGeneration({
    telegramUserId: '10',
    generationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.equal(generation.subjectLabel, 'remove_background');
  assert.equal(generation.prompt, 'убери фон');
  assert.equal(generation.outputType, 'image');
  assert.equal(generation.provider, undefined);
  assert.equal(generation.metadata, undefined);
  assert.equal(generation.errorMessage, undefined);
  assert.match(pool.calls[0].text, /JOIN "neuro"\.users u ON u\.id = g\.user_id/);
  assert.match(pool.calls[0].text, /u\.telegram_user_id = \$1/);
  assert.doesNotMatch(pool.calls[0].text, /provider_request|error_message/);
});

test('repository lists only conversations owned by the Telegram user with keyset pagination', async () => {
  const pool = fakePool([{
    rows: [
      {
        id: '00000000-0000-4000-8000-000000000002',
        kind: 'model',
        subject_id: 'gpt_5_mini',
        title: 'план запуска',
        status: 'active',
        latest_message_at: new Date('2026-07-27T00:00:00.000Z'),
        created_at: new Date('2026-07-26T23:00:00.000Z'),
        message_count: '4',
        last_message_preview: 'собери план'
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'model',
        subject_id: 'claude_sonnet',
        title: 'редактура',
        status: 'active',
        latest_message_at: new Date('2026-07-26T22:00:00.000Z'),
        created_at: new Date('2026-07-26T21:00:00.000Z'),
        message_count: '2',
        last_message_preview: 'готово'
      }
    ]
  }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const page = await repository.listConversations({
    telegramUserId: '10',
    limit: 1,
    status: 'active'
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].title, 'план запуска');
  assert.equal(page.items[0].messageCount, 4);
  assert.equal(page.items[0].provider, undefined);
  assert.equal(page.items[0].metadata, undefined);
  assert.equal(typeof page.nextCursor, 'string');
  assert.match(pool.calls[0].text, /JOIN "neuro"\.users u ON u\.id = c\.user_id/);
  assert.match(pool.calls[0].text, /u\.telegram_user_id = \$1/);
  assert.match(pool.calls[0].text, /c\.kind = 'model'/u);
  assert.match(pool.calls[0].text, /EXISTS \(\s*SELECT 1\s+FROM "neuro"\.generations/u);
  assert.match(pool.calls[0].text, /g\.kind = 'text'/u);
  assert.equal(pool.calls[0].values[0], '10');
  assert.equal(pool.calls[0].values[5], 2);
  assert.equal(pool.calls[0].values[6], 0);
});

test('repository excludes legacy model conversations that have no text generation', async () => {
  const pool = fakePool([{ rows: [] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const page = await repository.listConversations({
    telegramUserId: '10',
    status: 'active',
    kind: 'model'
  });

  assert.deepEqual(page.items, []);
  assert.match(pool.calls[0].text, /c\.kind = 'model'/u);
  assert.match(pool.calls[0].text, /EXISTS \(\s*SELECT 1\s+FROM "neuro"\.generations/u);
  assert.match(pool.calls[0].text, /g\.kind = 'text'/u);
});

test('repository reads a dialog branch only through owner-scoped queries', async () => {
  const pool = fakePool([
    {
      rows: [{
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'model',
        subject_id: 'gpt_5_mini',
        title: 'план запуска',
        status: 'active',
        latest_message_at: new Date('2026-07-27T00:00:00.000Z'),
        created_at: new Date('2026-07-26T23:00:00.000Z')
      }]
    },
    {
      rows: [{
        id: '00000000-0000-4000-8000-000000000010',
        role: 'assistant',
        content: 'готовый ответ',
        status: 'completed',
        metacoins_charged: 2,
        created_at: new Date('2026-07-27T00:01:00.000Z')
      }]
    }
  ]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const branch = await repository.getConversationThread({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.equal(branch.conversation.title, 'план запуска');
  assert.deepEqual(branch.messages[0], {
    id: '00000000-0000-4000-8000-000000000010',
    role: 'assistant',
    content: 'готовый ответ',
    status: 'completed',
    metacoinsCharged: 2,
    createdAt: '2026-07-27T00:01:00.000Z'
  });
  assert.match(pool.calls[0].text, /u\.telegram_user_id = \$1/);
  assert.match(pool.calls[0].text, /c\.kind = 'model'/u);
  assert.match(pool.calls[0].text, /EXISTS \(\s*SELECT 1\s+FROM "neuro"\.generations/u);
  assert.match(pool.calls[0].text, /g\.kind = 'text'/u);
  assert.match(pool.calls[1].text, /u\.telegram_user_id = \$1/);
  assert.match(pool.calls[1].text, /m\.conversation_id = \$2::uuid/);
  assert.doesNotMatch(pool.calls[1].text, /metadata|provider_payload|parameters/);
});

test('repository returns no branch when the conversation is not owned by the user', async () => {
  const pool = fakePool([{ rows: [] }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const branch = await repository.getConversationThread({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000099'
  });

  assert.equal(branch, null);
  assert.equal(pool.calls.length, 1);
});

test('repository archives a dialog idempotently and only for its owner', async () => {
  const pool = fakePool([{
    rows: [{
      id: '00000000-0000-4000-8000-000000000001',
      status: 'archived',
      kind: 'model',
      subject_id: 'gpt_5_mini'
    }]
  }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const archived = await repository.archiveConversation({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.deepEqual(archived, {
    conversationId: '00000000-0000-4000-8000-000000000001',
    status: 'archived',
    kind: 'model',
    subjectId: 'gpt_5_mini'
  });
  assert.match(pool.calls[0].text, /FROM "neuro"\.users u/);
  assert.match(pool.calls[0].text, /u\.telegram_user_id = \$1/);
  assert.match(pool.calls[0].text, /status = 'archived'/);
});

test('repository resumes a dialog only for its owner and returns its internal routing key', async () => {
  const pool = fakePool([{
    rows: [{
      id: '00000000-0000-4000-8000-000000000001',
      conversation_key: 'model:10:gpt_5_mini:branch',
      kind: 'model',
      subject_id: 'gpt_5_mini',
      title: 'план запуска',
      status: 'active'
    }]
  }]);
  const repository = new PostgresHistoryRepository({ pool, schema: 'neuro' });

  const resumed = await repository.activateConversation({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.equal(resumed.conversationKey, 'model:10:gpt_5_mini:branch');
  assert.equal(resumed.subjectId, 'gpt_5_mini');
  assert.match(pool.calls[0].text, /FROM "neuro"\.users u/);
  assert.match(pool.calls[0].text, /u\.telegram_user_id = \$1/);
  assert.match(pool.calls[0].text, /c\.id = \$2::uuid/);
  assert.match(pool.calls[0].text, /status = 'active'/);
});
