import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { loadConfig } from '../src/config.js';
import { createHistoryRepository } from '../src/history-factory.js';
import { createHistoryService } from '../src/history-service.js';
import { createReferralService } from '../src/referral-service.js';

const config = loadConfig();
assert.equal(config.historyStorage.enabled, true, 'Supabase history must be enabled.');

const suffix = Date.now().toString().slice(-12);
const telegramUserId = `900${suffix}`;
const telegramUpdateId = Number(suffix);
const requestKey = `smoke:${telegramUserId}:generation`;
const creditKey = `smoke:${telegramUserId}:credit`;
const debitAmount = 7;

const repository = createHistoryRepository(config.historyStorage);
const history = createHistoryService({
  repository,
  retentionDays: 30,
  onError(error, context) {
    throw new Error(`History smoke failed at ${context?.action}: ${error.message}`);
  }
});
const referralDatabasePath = existsSync(config.referralDatabasePath.split('/').slice(0, -1).join('/') || '.')
  ? config.referralDatabasePath
  : join(mkdtempSync(join(tmpdir(), 'metaflora-smoke-')), 'referral.sqlite');

const referrals = createReferralService({
  databasePath: referralDatabasePath,
  botUsername: config.botUsername,
  holdDays: config.referralHoldDays
});

try {
  referrals.registerUser({
    id: telegramUserId,
    username: `smoke_${suffix}`,
    first_name: 'smoke'
  });
  referrals.markStarted(telegramUserId);

  await history.captureUpdate({
    update_id: telegramUpdateId,
    message: {
      message_id: telegramUpdateId,
      chat: { id: telegramUserId, type: 'private' },
      from: {
        id: telegramUserId,
        username: `smoke_${suffix}`,
        first_name: 'smoke',
        language_code: 'ru'
      },
      text: '/profile'
    }
  });
  await history.recordEvent({
    eventName: 'profile.opened',
    category: 'navigation',
    telegramUserId,
    telegramChatId: telegramUserId,
    telegramUpdateId,
    metadata: { smoke: true }
  });
  await history.recordEvent({
    eventName: 'balance.viewed',
    category: 'billing',
    telegramUserId,
    telegramChatId: telegramUserId,
    telegramUpdateId,
    metadata: { balance: referrals.account(telegramUserId).metacoinBalance, smoke: true }
  });

  const credited = referrals.grantPromoMetacoins({
    telegramId: telegramUserId,
    promoCode: `SMOKE_${suffix}`,
    amount: 100
  });
  assert.equal(credited, true);
  assert.equal(referrals.account(telegramUserId).metacoinBalance, 100);
  const creditLedgerId = await history.recordMetacoinTransaction({
    telegramUserId,
    idempotencyKey: creditKey,
    delta: 100,
    balanceAfter: 100,
    source: 'promo',
    referenceType: 'smoke_credit',
    referenceId: creditKey,
    description: 'smoke-начисление',
    metadata: { smoke: true }
  });

  const run = await history.startGeneration({
    telegramUserId,
    telegramChatId: telegramUserId,
    telegramMessageId: telegramUpdateId + 1,
    requestKey,
    kind: 'text',
    subjectType: 'model',
    subjectId: 'smoke-no-provider',
    title: 'smoke без провайдера',
    prompt: 'проверка записи без внешней генерации',
    parameters: { providerDispatched: false, smoke: true },
    metacoinsQuoted: debitAmount
  });
  assert.ok(run?.generationId);

  const debit = referrals.debitMetacoins({
    telegramId: telegramUserId,
    amount: debitAmount,
    requestKey
  });
  assert.equal(debit.status, 'debited');
  assert.equal(debit.balance, 93);
  const debitLedgerId = await history.recordMetacoinTransaction({
    telegramUserId,
    idempotencyKey: requestKey,
    delta: -debitAmount,
    balanceAfter: debit.balance,
    source: 'generation',
    referenceType: 'generation_request',
    referenceId: requestKey,
    description: 'smoke-списание за генерацию',
    metadata: { debitStatus: debit.status, smoke: true }
  });

  const duplicateDebit = referrals.debitMetacoins({
    telegramId: telegramUserId,
    amount: debitAmount,
    requestKey
  });
  assert.equal(duplicateDebit.status, 'duplicate');
  assert.equal(duplicateDebit.balance, 93);
  const duplicateLedgerId = await history.recordMetacoinTransaction({
    telegramUserId,
    idempotencyKey: requestKey,
    delta: -debitAmount,
    balanceAfter: duplicateDebit.balance,
    source: 'generation',
    referenceType: 'generation_request',
    referenceId: requestKey,
    description: 'smoke-списание за генерацию',
    metadata: { debitStatus: duplicateDebit.status, smoke: true }
  });
  assert.equal(duplicateLedgerId, debitLedgerId);

  await history.recordEvent({
    eventName: 'generation.provider.skipped',
    category: 'generation',
    telegramUserId,
    requestKey,
    subjectType: 'model',
    subjectId: 'smoke-no-provider',
    metadata: { reason: 'provider_not_funded', smoke: true }
  });
  await history.completeGeneration(run, {
    outputText: '[smoke: внешний провайдер не вызывался]',
    outputType: 'text',
    metacoinsCharged: debitAmount,
    metadata: { providerDispatched: false, smoke: true }
  });

  const generationHistory = await history.listGenerations({
    telegramUserId,
    limit: 10,
    offset: 0
  });
  const generationCard = await history.getGeneration({
    telegramUserId,
    generationId: run.generationId
  });
  const dialogHistory = await history.listDialogs({
    telegramUserId,
    limit: 10,
    status: 'active',
    kind: 'model'
  });
  const dialogThread = await history.getDialog({
    telegramUserId,
    conversationId: run.conversationId,
    limit: 10
  });

  assert.ok(generationHistory?.items.some(({ id }) => id === run.generationId));
  assert.equal(generationCard?.id, run.generationId);
  assert.equal(generationCard?.metacoinsCharged, debitAmount);
  assert.ok(dialogHistory?.items.some(({ id }) => id === run.conversationId));
  assert.equal(dialogThread?.conversation.id, run.conversationId);
  assert.deepEqual(dialogThread?.messages.map(({ role }) => role), ['user', 'assistant']);

  const quotaKey = `smoke:${telegramUserId}:free`;
  const firstQuotaClaim = await history.claimFreeWeeklyRequest({
    telegramUserId,
    requestKey: quotaKey
  });
  const duplicateQuotaClaim = await history.claimFreeWeeklyRequest({
    telegramUserId,
    requestKey: quotaKey
  });
  assert.equal(firstQuotaClaim?.allowed, true);
  assert.equal(firstQuotaClaim?.duplicate, false);
  assert.equal(duplicateQuotaClaim?.allowed, true);
  assert.equal(duplicateQuotaClaim?.duplicate, true);
  assert.equal(duplicateQuotaClaim?.used, firstQuotaClaim?.used);
  assert.equal(await history.releaseFreeWeeklyRequest({
    telegramUserId,
    requestKey: quotaKey
  }), true);

  const database = repository.client;
  const user = result(await database.from('users')
    .select('id,telegram_user_id')
    .eq('telegram_user_id', telegramUserId)
    .single());
  const ledger = result(await database.from('metacoin_ledger')
    .select('id,idempotency_key,delta,balance_after,source')
    .eq('user_id', user.id)
    .order('created_at'));
  const generation = result(await database.from('generations')
    .select('status,metacoins_quoted,metacoins_charged,parameters,metadata')
    .eq('request_key', requestKey)
    .single());
  const updates = result(await database.from('telegram_updates')
    .select('id')
    .eq('telegram_update_id', telegramUpdateId));
  const events = result(await database.from('product_events')
    .select('event_name')
    .eq('telegram_user_id', telegramUserId));
  const conversations = result(await database.from('conversations')
    .select('id')
    .eq('user_id', user.id));
  const messages = result(await database.from('messages')
    .select('role')
    .eq('user_id', user.id));
  const providerCalls = result(await database.from('provider_api_calls')
    .select('id')
    .eq('telegram_user_id', telegramUserId));

  assert.equal(creditLedgerId, ledger.find(({ delta }) => delta === 100)?.id);
  assert.equal(ledger.length, 2);
  assert.equal(ledger.reduce((sum, entry) => sum + entry.delta, 0), 93);
  assert.deepEqual(ledger.map(({ balance_after: balance }) => balance), [100, 93]);
  assert.equal(generation.status, 'completed');
  assert.equal(generation.metacoins_quoted, debitAmount);
  assert.equal(generation.metacoins_charged, debitAmount);
  assert.equal(generation.parameters.providerDispatched, false);
  assert.equal(updates.length, 1);
  assert.ok(events.some(({ event_name: name }) => name === 'profile.opened'));
  assert.ok(events.some(({ event_name: name }) => name === 'balance.viewed'));
  assert.ok(events.some(({ event_name: name }) => name === 'generation.started'));
  assert.ok(events.some(({ event_name: name }) => name === 'generation.completed'));
  assert.ok(events.some(({ event_name: name }) => name === 'generation.provider.skipped'));
  assert.ok(events.some(({ event_name: name }) => name === 'metacoins.credited'));
  assert.ok(events.some(({ event_name: name }) => name === 'metacoins.debited'));
  assert.equal(conversations.length, 1);
  assert.deepEqual(messages.map(({ role }) => role).sort(), ['assistant', 'user']);
  assert.equal(providerCalls.length, 0);
  assert.equal(referrals.account(telegramUserId).metacoinBalance, 93);

  console.log(JSON.stringify({
    ok: true,
    telegramUserId,
    canonicalBalance: 93,
    ledgerEntries: ledger.length,
    ledgerDelta: 93,
    duplicateDebitPrevented: true,
    generationStatus: generation.status,
    generationCharged: generation.metacoins_charged,
    telegramUpdates: updates.length,
    productEvents: events.length,
    conversations: conversations.length,
    messages: messages.length,
    generationHistoryReadable: true,
    dialogHistoryReadable: true,
    weeklyQuotaIdempotent: true,
    providerCalls: providerCalls.length
  }));
} finally {
  referrals.close();
  await history.close();
}

function result(response) {
  if (response.error) throw response.error;
  return response.data;
}
