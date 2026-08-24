import test from 'node:test';
import assert from 'node:assert/strict';

import { SupabaseHistoryRepository } from '../src/supabase-history-repository.js';

function scriptedClient(results) {
  const calls = [];
  const queue = [...results];
  const schemaClient = {
    rpc(name, args) {
      calls.push({ rpc: name, args });
      return Promise.resolve(queue.shift() ?? { data: null, error: null });
    },
    from(table) {
      const call = { table, operations: [] };
      calls.push(call);
      const builder = new Proxy({}, {
        get(_target, property) {
          if (property === 'then') {
            return (resolve, reject) => Promise.resolve(queue.shift() ?? { data: [], error: null })
              .then(resolve, reject);
          }
          if (property === 'maybeSingle') {
            return () => Promise.resolve(queue.shift() ?? { data: null, error: null });
          }
          return (...args) => {
            call.operations.push([property, ...args]);
            return builder;
          };
        }
      });
      return builder;
    }
  };
  return {
    calls,
    schema() {
      return schemaClient;
    }
  };
}

test('Supabase repository claims and releases the weekly free quota through atomic RPCs', async () => {
  const client = scriptedClient([
    {
      data: [{
        allowed: true,
        used: 1,
        request_limit: 50,
        remaining: 49,
        duplicate: false
      }],
      error: null
    },
    { data: true, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const claimed = await repository.claimFreeWeeklyRequest({
    telegramUserId: '10',
    requestKey: 'message:10:1'
  });
  const released = await repository.releaseFreeWeeklyRequest({
    telegramUserId: '10',
    requestKey: 'message:10:1'
  });

  assert.deepEqual(claimed, {
    allowed: true,
    used: 1,
    limit: 50,
    remaining: 49,
    duplicate: false
  });
  assert.equal(released, true);
  assert.deepEqual(client.calls, [
    {
      rpc: 'claim_free_weekly_entitlement',
      args: {
        p_telegram_user_id: '10',
        p_request_key: 'message:10:1',
        p_quota_key: 'text',
        p_request_limit: 50
      }
    },
    {
      rpc: 'release_free_weekly_entitlement',
      args: {
        p_telegram_user_id: '10',
        p_request_key: 'message:10:1',
        p_quota_key: 'text'
      }
    }
  ]);
});

test('Supabase repository updates avatar references without a public Telegram URL', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const updated = await repository.updateUserAvatarReference({
    telegramUserId: '10',
    fileId: 'file_id',
    fileUniqueId: 'file_unique_id',
    storagePath: '10/file_unique_id.webp'
  });

  assert.equal(updated, true);
  const call = client.calls.find(({ table }) => table === 'users');
  assert.deepEqual(call.operations[0], ['update', {
    avatar_file_id: 'file_id',
    avatar_file_unique_id: 'file_unique_id',
    avatar_storage_path: '10/file_unique_id.webp',
    avatar_updated_at: call.operations[0][1].avatar_updated_at,
    updated_at: call.operations[0][1].updated_at
  }]);
  assert.deepEqual(call.operations.slice(1), [
    ['eq', 'telegram_user_id', '10'],
    ['select', 'id']
  ]);
  assert.doesNotMatch(JSON.stringify(call), /api\.telegram\.org|\/bot[^/]+\//i);
});

test('Supabase repository manages lifecycle notifications through atomic RPCs', async () => {
  const client = scriptedClient([
    { data: null, error: null },
    { data: null, error: null },
    {
      data: [{
        id: '00000000-0000-4000-8000-000000000001',
        scenario: 'newcomer_after_24h',
        telegram_user_id: 10,
        telegram_chat_id: 10,
        payment_id: null
      }],
      error: null
    },
    { data: true, error: null },
    { data: true, error: null },
    { data: [{ eligible: false, reason: 'paid_plan' }], error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  await repository.schedulePaymentAbandonmentReminders({
    paymentId: 'payment-1',
    telegramUserId: '10',
    telegramChatId: '10',
    firstDueAt: '2026-07-27T00:20:00.000Z',
    secondDueAt: '2026-07-28T00:00:00.000Z'
  });
  await repository.scheduleNewcomerReminder({
    telegramUserId: '10',
    telegramChatId: '10',
    dueAt: '2026-07-28T00:00:00.000Z'
  });
  const claimed = await repository.claimDueLifecycleNotifications();
  assert.equal(await repository.markLifecycleNotificationSent(claimed[0].id), true);
  assert.equal(await repository.cancelLifecycleNotification(claimed[0].id, 'paid_plan'), true);
  assert.deepEqual(await repository.getNewcomerReminderEligibility({ telegramUserId: '10' }), {
    eligible: false,
    reason: 'paid_plan'
  });

  assert.deepEqual(client.calls.map(({ rpc }) => rpc).filter(Boolean), [
    'schedule_payment_abandonment_reminders',
    'schedule_newcomer_reminder',
    'claim_due_lifecycle_notifications',
    'mark_lifecycle_notification_sent',
    'cancel_lifecycle_notification',
    'get_newcomer_reminder_eligibility'
  ]);
});

test('Supabase repository records a confirmed crypto callback through the atomic USDC RPC', async () => {
  const client = scriptedClient([{
    data: [{
      status: 'confirmed', duplicate: false, finance_request_created: true,
      telegram_user_id: '10', telegram_chat_id: '10', product_kind: 'package',
      product_id: 'coins_150', duration_months: 1, duration_days: 0,
      metacoins: 150, confirmed_at: '2026-08-11T12:00:00.000Z'
    }],
    error: null
  }]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const result = await repository.recordCryptoUsdcCallback({
    callbackId: 'evt_base_12345678',
    orderId: 'mfc_0123456789abcdef0123456789abcdef',
    paymentId: '68f7a946db0529ea9b6d3a12',
    transactionHash: `0x${'a'.repeat(64)}`,
    amountUsdcMicros: 12_500_000,
    confirmedAt: '2026-08-11T12:00:00.000Z'
  });

  assert.deepEqual(result, {
    status: 'confirmed', duplicate: false, financeRequestCreated: true,
    telegramUserId: '10', telegramChatId: '10', productKind: 'package',
    productId: 'coins_150', durationMonths: 1, durationDays: 0,
    metacoins: 150, confirmedAt: '2026-08-11T12:00:00.000Z'
  });
  assert.equal(client.calls[0].rpc, 'record_crypto_usdc_callback');
  assert.equal(client.calls[0].args.p_amount_usdc_micros, 12_500_000);
  assert.equal('p_amount_kopecks' in client.calls[0].args, false);
  assert.equal(client.calls[0].args.p_chain, 'base');
});

test('Supabase repository secures upgrade reserve carry through the atomic reclassification RPC', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    { data: [], error: null },
    { data: [{ reserve_carry_in_kopecks: 12_588 }], error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const inserted = await repository.recordFinanceAllocations({
    externalPaymentId: 'upgrade-payment-1',
    telegramUserId: '10',
    metadata: { upgrade: true, reserveCarryInKopecks: 12_588 },
    allocations: [{
      allocationKey: 'upgrade-payment-1:owner_share',
      category: 'owner_share',
      provider: 'owner',
      amountKopecks: 31_828,
      currency: 'RUB',
      status: 'actual'
    }]
  });

  assert.equal(inserted, 1);
  const carryCall = client.calls.find(({ rpc }) => rpc === 'reclassify_upgrade_provider_reserve');
  assert.deepEqual(carryCall.args, {
    p_target_payment_id: 'upgrade-payment-1',
    p_amount_kopecks: 12_588
  });
});

test('Supabase payment audit preserves immutable checkout data and verifies its Telegram owner', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    { data: [{ id: 'payment-row-id' }], error: null },
    {
      data: {
        payment_id: 'payment-1',
        user_id: 'user-internal-id',
        product_type: 'metacoins',
        product_id: 'coins_50',
        amount_kopecks: 19_900,
        base_metacoins: 50,
        status: 'pending'
      },
      error: null
    },
    { data: { telegram_user_id: 10 }, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  assert.equal(await repository.recordPaymentCreated({
    telegramUserId: '10',
    paymentId: 'payment-1',
    productType: 'metacoins',
    productId: 'coins_50',
    amountKopecks: 19_900,
    baseMetacoins: 50,
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
  const paymentInsert = client.calls.find(({ table }) => table === 'payments');
  assert.equal(paymentInsert.operations.some(
    ([name, _row, options]) => name === 'upsert' && options?.ignoreDuplicates === true
  ), true);
});

test('Supabase payment audit stores Telegram Stars beside card and SBP payments', async () => {
  const client = scriptedClient([
    { data: [{ payment_id: 'stars-payment-row-id', duplicate: false }], error: null },
    { data: {
      payment_id: 'stars-charge-1',
      user_id: 'user-internal-id',
      product_type: 'subscription',
      product_id: 'author',
      amount_kopecks: null,
      amount_xtr: 749,
      currency: 'XTR',
      base_metacoins: 300,
      status: 'succeeded',
      receipt_email: null
    }, error: null },
    { data: { telegram_user_id: 10 }, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  assert.equal(await repository.recordStarsPayment({
    telegramUserId: '10',
    paymentId: 'stars-charge-1',
    productType: 'subscription',
    productId: 'author',
    amountXtr: 749,
    currency: 'XTR',
    baseMetacoins: 300,
    paidAt: '2026-08-04T03:00:00.000Z',
    providerPayload: { currency: 'XTR', total_amount: 749 }
  }), 'stars-payment-row-id');

  assert.deepEqual(await repository.getPaymentRecord('stars-charge-1'), {
    paymentId: 'stars-charge-1',
    telegramUserId: '10',
    productType: 'subscription',
    productId: 'author',
    amountXtr: 749,
    baseMetacoins: 300,
    status: 'succeeded'
  });

  assert.deepEqual(client.calls[0], {
    rpc: 'record_telegram_stars_payment',
    args: {
      p_telegram_user_id: '10',
      p_charge_id: 'stars-charge-1',
      p_product_type: 'subscription',
      p_product_id: 'author',
      p_amount_xtr: 749,
      p_base_metacoins: 300,
      p_paid_at: '2026-08-04T03:00:00.000Z',
      p_provider_payload: { currency: 'XTR', total_amount: 749 }
    }
  });
});

test('Supabase payment audit lists pending Stars fulfillments through the recovery RPC', async () => {
  const providerPayload = {
    currency: 'XTR',
    total_amount: 749,
    invoice_payload: 'mfstars:v1:plan:author:1:749:10',
    telegram_payment_charge_id: 'stars-charge-pending'
  };
  const client = scriptedClient([{ data: [{
    payment_id: 'stars-charge-pending',
    telegram_user_id: 10,
    provider_payload: providerPayload
  }], error: null }]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  assert.deepEqual(await repository.listPendingStarsPayments({ limit: 25 }), [{
    paymentId: 'stars-charge-pending',
    telegramUserId: '10',
    providerPayload
  }]);
  assert.deepEqual(client.calls[0], {
    rpc: 'list_pending_telegram_stars_fulfillments',
    args: { p_limit: 25 }
  });
});

test('Supabase webhook audit moves from received to processed without claiming a signature', async () => {
  const client = scriptedClient([
    { data: [{ id: 'webhook-row-id' }], error: null },
    { data: { processing_status: 'received' }, error: null },
    { data: [{ id: 'webhook-row-id' }], error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  await repository.recordPaymentWebhook({
    providerEventId: 'payment.succeeded:payment-1',
    eventType: 'payment.succeeded',
    payload: { type: 'notification' }
  });
  assert.equal(
    await repository.getPaymentWebhookStatus('payment.succeeded:payment-1'),
    'received'
  );
  await repository.updatePaymentWebhookStatus({
    providerEventId: 'payment.succeeded:payment-1',
    status: 'processed'
  });

  const webhookCalls = client.calls.filter(({ table }) => table === 'provider_webhooks');
  const upsert = webhookCalls[0].operations.find(([name]) => name === 'upsert');
  assert.equal(upsert[1].signature_valid, null);
  assert.equal(upsert[1].processing_status, 'received');
  const update = webhookCalls[2].operations.find(([name]) => name === 'update');
  assert.equal(update[1].processing_status, 'processed');
});

test('Supabase T-Bank audit keeps trusted checkout data and signed callback state separate', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    { data: [{ id: 'payment-row-id' }], error: null },
    { data: {
      payment_id: `mf_${'a'.repeat(32)}`,
      user_id: 'user-internal-id',
      provider: 'tbank',
      provider_payload: { checkout: { productKind: 'package', telegramChatId: '11' } },
      product_type: 'metacoins',
      product_id: 'coins_50',
      amount_kopecks: 19_900,
      base_metacoins: 50,
      status: 'pending',
      receipt_email: null,
      receipt_phone: '+79991234567'
    }, error: null },
    { data: { telegram_user_id: 10 }, error: null },
    { data: [{ id: 'webhook-row-id' }], error: null },
    { data: { processing_status: 'received' }, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });
  const orderId = `mf_${'a'.repeat(32)}`;

  await repository.recordPaymentCreated({
    provider: 'tbank', telegramUserId: '10', paymentId: orderId,
    productType: 'metacoins', productId: 'coins_50', amountKopecks: 19_900,
    baseMetacoins: 50, receiptPhone: '+79991234567',
    providerPayload: { checkout: { productKind: 'package', telegramChatId: '11' } }
  });
  assert.deepEqual(await repository.getPaymentCheckoutRecord(orderId), {
    paymentId: orderId,
    provider: 'tbank',
    providerPayload: { checkout: { productKind: 'package', telegramChatId: '11' } },
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_50',
    amountKopecks: 19_900,
    baseMetacoins: 50,
    status: 'pending',
    receiptPhone: '+79991234567'
  });
  await repository.recordPaymentWebhook({
    provider: 'tbank', providerEventId: 'CONFIRMED:123', eventType: 'CONFIRMED',
    signatureValid: true, payload: { paymentId: '123' }
  });
  assert.equal(await repository.getPaymentWebhookStatus('CONFIRMED:123', 'tbank'), 'received');

  const paymentUpsert = client.calls.find(({ table }) => table === 'payments')
    .operations.find(([name]) => name === 'upsert');
  assert.equal(paymentUpsert[1].provider, 'tbank');
  assert.equal(paymentUpsert[1].payment_method, 'sbp');
  assert.equal(paymentUpsert[1].receipt_phone, '+79991234567');
  const webhookUpsert = client.calls.filter(({ table }) => table === 'provider_webhooks')[0]
    .operations.find(([name]) => name === 'upsert');
  assert.equal(webhookUpsert[1].signature_valid, true);
});

test('Supabase repository records the exact paid subscription period through one atomic RPC', async () => {
  const client = scriptedClient([
    {
      data: [{
        subscription_id: '00000000-0000-4000-8000-000000000021',
        ledger_id: '00000000-0000-4000-8000-000000000022',
        duplicate: false,
        starts_at: '2026-08-01T00:00:00.000Z',
        expires_at: '2026-08-31T00:00:00.000Z'
      }],
      error: null
    }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const result = await repository.recordSubscriptionActivated({
    telegramUserId: '10',
    paymentId: 'payment-plan-1',
    planId: 'author',
    startsAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-08-31T00:00:00.000Z',
    priceKopecks: 74_900,
    metacoins: 300,
    balanceAfter: 460
  });

  assert.deepEqual(result, {
    subscriptionId: '00000000-0000-4000-8000-000000000021',
    ledgerId: '00000000-0000-4000-8000-000000000022',
    duplicate: false,
    startsAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-08-31T00:00:00.000Z'
  });
  assert.deepEqual(client.calls, [{
    rpc: 'record_subscription_activation',
    args: {
      p_telegram_user_id: '10',
      p_payment_id: 'payment-plan-1',
      p_plan_id: 'author',
      p_starts_at: '2026-08-01T00:00:00.000Z',
      p_expires_at: '2026-08-31T00:00:00.000Z',
      p_price_kopecks: 74_900,
      p_metacoins: 300,
      p_balance_after: 460
    }
  }]);
});

test('Supabase repository records a target-balance upgrade through its atomic RPC', async () => {
  const client = scriptedClient([
    { data: null, error: null },
    { data: { id: '00000000-0000-4000-8000-000000000020' }, error: null },
    { data: { id: '00000000-0000-4000-8000-000000000019', updated_at: '2026-07-31T00:00:00.000Z' }, error: null },
    {
    data: [{
      subscription_id: '00000000-0000-4000-8000-000000000021',
      ledger_id: '00000000-0000-4000-8000-000000000022', duplicate: false,
      starts_at: '2026-08-01T00:00:00.000Z', expires_at: '2026-08-31T00:00:00.000Z'
    }], error: null
    }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });
  await repository.recordSubscriptionActivated({
    telegramUserId: '10', paymentId: 'payment-upgrade-1', planId: 'author',
    startsAt: '2026-08-01T00:00:00.000Z', expiresAt: '2026-08-31T00:00:00.000Z',
    priceKopecks: 36_900, metacoins: 190, subscriptionMetacoinsTotal: 300,
    subscriptionMetacoinsTotalBefore: 130, fromPlanId: 'amateur', durationMonths: 1,
    remainingPlanMetacoinsBefore: 110, balanceBefore: 160, balanceAfter: 350
  });
  const rpc = client.calls.find(({ rpc }) => rpc === 'activate_subscription_upgrade');
  assert.equal(rpc.args.p_expected_subscription_id, '00000000-0000-4000-8000-000000000019');
  assert.equal(rpc.args.p_target_subscription_total, 300);
  assert.equal(rpc.args.p_credited_delta, 190);
});

test('Supabase repository lists owned conversations without raw payload fields', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    {
      data: [{
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'model',
        subject_id: 'gpt_5_mini',
        title: 'план запуска',
        status: 'active',
        latest_message_at: '2026-07-27T00:00:00.000Z',
        created_at: '2026-07-26T23:00:00.000Z'
      }],
      error: null
    },
    { data: null, count: 2, error: null },
    { data: { content: 'готово' }, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const page = await repository.listConversations({
    telegramUserId: '10',
    status: 'active',
    kind: 'model',
    limit: 10
  });

  assert.deepEqual(page.items[0], {
    id: '00000000-0000-4000-8000-000000000001',
    kind: 'model',
    subjectId: 'gpt_5_mini',
    title: 'план запуска',
    status: 'active',
    latestMessageAt: '2026-07-27T00:00:00.000Z',
    createdAt: '2026-07-26T23:00:00.000Z',
    messageCount: 2,
    lastMessagePreview: 'готово'
  });
  assert.equal(page.items[0].metadata, undefined);
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'user_id' && value === 'user-internal-id'
  ), true);
  assert.equal(client.calls[1].operations.some(
    ([name, selection]) => name === 'select' && selection.includes('generations!inner(kind)')
  ), true);
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'generations.kind' && value === 'text'
  ), true);
});

test('Supabase dialog filter excludes a legacy model conversation without a text generation', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    { data: [], error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const page = await repository.listConversations({
    telegramUserId: '10',
    status: 'active',
    kind: 'model',
    limit: 10
  });

  assert.deepEqual(page.items, []);
  const conversationsCall = client.calls.find(({ table }) => table === 'conversations');
  assert.equal(conversationsCall.operations.some(
    ([name, selection]) => name === 'select' && selection.includes('generations!inner(kind)')
  ), true);
  assert.equal(conversationsCall.operations.some(
    ([name, column, value]) => name === 'eq' && column === 'generations.kind' && value === 'text'
  ), true);
});

test('Supabase repository owner-scopes branch reads and archive updates', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    {
      data: {
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'model',
        subject_id: 'gpt_5_mini',
        title: 'план запуска',
        status: 'active',
        latest_message_at: '2026-07-27T00:00:00.000Z',
        created_at: '2026-07-26T23:00:00.000Z'
      },
      error: null
    },
    {
      data: [{
        id: '00000000-0000-4000-8000-000000000010',
        role: 'user',
        content: 'привет',
        status: 'completed',
        metacoins_charged: 0,
        created_at: '2026-07-27T00:01:00.000Z'
      }],
      error: null
    },
    { data: { id: 'user-internal-id' }, error: null },
    {
      data: {
        id: '00000000-0000-4000-8000-000000000001',
        status: 'archived',
        kind: 'model',
        subject_id: 'gpt_5_mini'
      },
      error: null
    }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const branch = await repository.getConversationThread({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000001'
  });
  const archived = await repository.archiveConversation({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.equal(branch.messages[0].content, 'привет');
  assert.equal(branch.messages[0].metadata, undefined);
  assert.deepEqual(archived, {
    conversationId: '00000000-0000-4000-8000-000000000001',
    status: 'archived',
    kind: 'model',
    subjectId: 'gpt_5_mini'
  });
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'user_id' && value === 'user-internal-id'
  ), true);
  assert.equal(client.calls[1].operations.some(
    ([name, selection]) => name === 'select' && selection.includes('generations!inner(kind)')
  ), true);
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'generations.kind' && value === 'text'
  ), true);
  assert.equal(client.calls[4].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'user_id' && value === 'user-internal-id'
  ), true);
});

test('Supabase repository owner-scopes one generation and omits internal fields', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    {
      data: {
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'voice',
        subject_id: 'narration',
        status: 'completed',
        metacoins_quoted: 4,
        metacoins_charged: 4,
        created_at: '2026-07-27T00:00:00.000Z',
        finished_at: '2026-07-27T00:01:00.000Z',
        prompt: 'озвучь текст',
        output_text: ''
      },
      error: null
    }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const generation = await repository.getGeneration({
    telegramUserId: '10',
    generationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.equal(generation.subjectLabel, 'narration');
  assert.equal(generation.prompt, 'озвучь текст');
  assert.equal(generation.provider, undefined);
  assert.equal(generation.metadata, undefined);
  assert.equal(generation.errorMessage, undefined);
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'user_id' && value === 'user-internal-id'
  ), true);
});

test('Supabase repository applies a media scope to generation history', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    { data: [], error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  await repository.listGenerations({
    telegramUserId: '10',
    scope: 'media'
  });

  const generationsCall = client.calls.find(({ table }) => table === 'generations');
  assert.equal(generationsCall.operations.some(([name, expression]) => (
    name === 'or'
    && expression.includes('subject_type.eq.tool')
    && expression.includes('subject_type.in.(entertainment,music)')
    && expression.includes('kind.in.(image,video,audio,music,voice,document,3d)')
  )), true);
  assert.equal(generationsCall.operations.some(([name, expression]) => (
    name === 'or'
    && expression.includes('kind.in.(image,video,audio,music,voice,document,3d,tool)')
  )), true);
});

test('Supabase repository resumes only an owner-scoped dialog', async () => {
  const client = scriptedClient([
    { data: { id: 'user-internal-id' }, error: null },
    {
      data: {
        id: '00000000-0000-4000-8000-000000000001',
        conversation_key: 'model:10:gpt_5_mini:branch',
        kind: 'model',
        subject_id: 'gpt_5_mini',
        title: 'план запуска',
        status: 'active'
      },
      error: null
    }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const resumed = await repository.activateConversation({
    telegramUserId: '10',
    conversationId: '00000000-0000-4000-8000-000000000001'
  });

  assert.equal(resumed.conversationKey, 'model:10:gpt_5_mini:branch');
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq' && column === 'user_id' && value === 'user-internal-id'
  ), true);
  assert.equal(client.calls[1].operations.some(
    ([name, column, value]) => name === 'eq'
      && column === 'id'
      && value === '00000000-0000-4000-8000-000000000001'
  ), true);
});
