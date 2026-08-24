import assert from 'node:assert/strict';
import test from 'node:test';

import { createPaymentService } from '../src/payment-service.js';

function payment(overrides = {}) {
  return {
    id: '2f8f0000-0000-0000-0000-000000000001',
    status: 'succeeded',
    paid: true,
    amount: { value: '549.00', currency: 'RUB' },
    metadata: {
      telegramUserId: '10',
      telegramChatId: '10',
      productKind: 'package',
      productId: 'coins_150',
      durationMonths: '1',
      metacoins: '50',
      amountKopecks: '54900'
    },
    receipt: { customer: { email: 'buyer@example.com' } },
    ...overrides
  };
}

function auditRepositoryFor(paymentRecord) {
  let webhookStatus = null;
  return {
    async recordPaymentCreated() {},
    async getPaymentRecord() {
      return paymentRecord;
    },
    async recordPaymentWebhook() {},
    async getPaymentWebhookStatus() {
      return webhookStatus;
    },
    async updatePaymentWebhookStatus({ status }) {
      webhookStatus = status;
    },
    async updatePaymentStatus() {},
    async recordSubscriptionActivated() {}
  };
}

test('checkout creates a YooKassa receipt for the real customer email', async () => {
  const createCalls = [];
  const service = createPaymentService({
    client: {
      async createPayment(value) {
        createCalls.push(value);
        return payment({
          status: 'pending',
          paid: false,
          confirmation: { confirmation_url: 'https://yookassa.ru/checkout/pay' }
        });
      }
    },
    referralService: {
      account: () => ({ subscriptionPlanId: 'newcomer' })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  const result = await service.createCheckout({
    kind: 'package',
    productId: 'coins_150',
    telegramUserId: '10',
    telegramChatId: '10',
    idempotencyKey: 'callback-1',
    receiptEmail: 'Buyer@example.com'
  });

  assert.equal(result.confirmationUrl, 'https://yookassa.ru/checkout/pay');
  assert.equal(result.amountKopecks, 54_900);
  assert.equal(createCalls[0].metadata.telegramUserId, '10');
  assert.equal(createCalls[0].receiptEmail, 'buyer@example.com');
  assert.equal('customer' in createCalls[0], false);
});

test('YooKassa checkout marks a credited plan change as an upgrade', async () => {
  const createCalls = [];
  const service = createPaymentService({
    client: {
      async createPayment(value) {
        createCalls.push(value);
        return { id: 'upgrade-payment', confirmation: { confirmation_url: 'https://yookassa.ru/upgrade' } };
      }
    },
    referralService: {
      reservePlanUpgrade: () => ({ status: 'reserved' }),
      releasePlanUpgrade: () => ({ status: 'released' }),
      account: () => ({
        subscriptionPlanId: 'amateur',
        subscriptionMetacoinsRemaining: 130,
        subscriptionMetacoinsTotal: 130,
        subscriptionPriceKopecks: 74_900,
        subscriptionDurationMonths: 1,
        subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
      })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  const result = await service.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '10', telegramChatId: '10', idempotencyKey: 'upgrade-one',
    receiptEmail: 'buyer@example.com'
  });

  assert.equal(result.amountKopecks, 74_100);
  assert.equal(createCalls[0].metadata.isUpgrade, 'true');
  assert.equal(createCalls[0].metadata.metacoinsGranted, '170');
});

test('YooKassa releases an upgrade reservation when durable checkout persistence fails', async () => {
  const calls = [];
  const auditRepository = auditRepositoryFor(null);
  auditRepository.recordPaymentCreated = async () => { throw new Error('audit unavailable'); };
  const service = createPaymentService({
    client: {
      async createPayment() {
        return { id: 'upgrade-audit-failure', confirmation: { confirmation_url: 'https://yookassa.ru/upgrade' } };
      }
    },
    auditRepository,
    referralService: {
      reservePlanUpgrade(value) { calls.push(['reserved', value]); return { status: 'reserved' }; },
      releasePlanUpgrade(value) { calls.push(['released', value]); },
      account: () => ({
        metacoinBalance: 130,
        subscriptionPlanId: 'amateur',
        subscriptionMetacoinsRemaining: 130,
        subscriptionMetacoinsTotal: 130,
        subscriptionPriceKopecks: 44_900,
        subscriptionDurationMonths: 1,
        subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
      })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(() => service.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '10', telegramChatId: '10', idempotencyKey: 'upgrade-audit-failure',
    receiptEmail: 'buyer@example.com'
  }), /audit unavailable/);
  assert.deepEqual(calls.map(([kind]) => kind), ['reserved', 'released']);
});

test('YooKassa retry never releases an upgrade reservation owned by the first checkout attempt', async () => {
  const calls = [];
  const service = createPaymentService({
    client: { async createPayment() { throw new Error('provider unavailable'); } },
    referralService: {
      reservePlanUpgrade() { return { status: 'duplicate' }; },
      releasePlanUpgrade(value) { calls.push(value); },
      account: () => ({
        metacoinBalance: 130, subscriptionPlanId: 'amateur',
        subscriptionMetacoinsRemaining: 130, subscriptionMetacoinsTotal: 130,
        subscriptionPriceKopecks: 44_900, subscriptionDurationMonths: 1,
        subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
      })
    },
    returnUrl: 'https://bot.example/payments/return'
  });
  await assert.rejects(() => service.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '10', telegramChatId: '10', idempotencyKey: 'upgrade-retry',
    receiptEmail: 'buyer@example.com'
  }), /provider unavailable/);
  assert.deepEqual(calls, []);
});

test('checkout refuses to create a payment without a real receipt email', async () => {
  const service = createPaymentService({
    client: { async createPayment() { throw new Error('must not be called'); } },
    referralService: { account: () => ({ subscriptionPlanId: 'newcomer' }) },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(
    () => service.createCheckout({
      kind: 'package',
      productId: 'coins_150',
      telegramUserId: '10',
      telegramChatId: '10',
      idempotencyKey: 'callback-1'
    }),
    /customer email/i
  );
});

test('checkout refuses to create a duplicate active plan payment', async () => {
  let providerCalls = 0;
  const service = createPaymentService({
    client: {
      async createPayment() {
        providerCalls += 1;
        throw new Error('provider must not be called');
      }
    },
    referralService: {
      account: () => ({
        subscriptionPlanId: 'amateur',
        subscriptionExpiresAt: '2026-08-24T00:00:00.000Z',
        subscriptionMetacoinsRemaining: 100,
        subscriptionMetacoinsTotal: 130,
        subscriptionPriceKopecks: 44_900
      })
    },
    returnUrl: 'https://bot.example/payments/return',
    now: () => new Date('2026-08-04T03:00:00.000Z')
  });

  await assert.rejects(
    () => service.createCheckout({
      kind: 'plan',
      productId: 'amateur',
      telegramUserId: '10',
      telegramChatId: '10',
      idempotencyKey: 'callback-active-plan',
      receiptEmail: 'buyer@example.com'
    }),
    /already active|active subscription/i
  );
  assert.equal(providerCalls, 0);
});

test('verified package webhook credits metacoins exactly once', async () => {
  const recorded = [];
  const notices = [];
  const providerPayment = payment();
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment(value) {
        recorded.push(value);
        return { status: recorded.length === 1 ? 'recorded' : 'duplicate' };
      },
      account: () => ({ metacoinBalance: 50 })
    },
    notify: async (value) => notices.push(value),
    returnUrl: 'https://bot.example/payments/return'
  });

  const event = { type: 'notification', event: 'payment.succeeded', object: { id: providerPayment.id } };
  const first = await service.processWebhook(event);
  const duplicate = await service.processWebhook(event);

  assert.equal(first.status, 'processed');
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].baseMetacoins, 50);
  assert.equal(notices.length, 1);
  assert.match(notices[0].message.text, /чек отправлен на.*buyer@example\.com/i);
  assert.doesNotMatch(notices[0].message.text, /спасибо!/i);
});

test('successful YooKassa payment writes a reconciled finance split for CRM', async () => {
  const financeAudits = [];
  const confirmations = [];
  const providerPayment = payment();
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  auditRepository.recordFinanceAllocations = async (value) => financeAudits.push(value);
  auditRepository.recordYooKassaPaymentConfirmation = async (value) => confirmations.push(value);
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment: () => ({ status: 'recorded', referralEarningKopecks: 4_975 }),
      account: () => ({ metacoinBalance: 50 })
    },
    returnUrl: 'https://bot.example/payments/return',
    now: () => new Date('2026-08-07T04:34:00.000Z')
  });

  await service.processWebhook({
    type: 'notification',
    event: 'payment.succeeded',
    object: { id: providerPayment.id }
  });

  assert.equal(financeAudits.length, 1);
  assert.equal(financeAudits[0].externalPaymentId, providerPayment.id);
  assert.equal(financeAudits[0].autoTopUp, true);
  assert.equal(financeAudits[0].metadata.confirmationSource, 'yookassa');
  assert.equal(financeAudits[0].metadata.confirmationEvent, 'payment.succeeded');
  assert.equal(financeAudits[0].allocations.find(({ category }) => category === 'referral_liability').amountKopecks, 4_975);
  assert.equal(financeAudits[0].allocations.filter(({ category }) => category === 'owner_share').length, 1);
  const apiReserve = financeAudits[0].allocations
    .filter(({ category }) => category === 'api_reserve')
    .reduce((sum, row) => sum + row.amountKopecks, 0);
  assert.ok(apiReserve >= 9_254);
  assert.deepEqual(confirmations, [{
    externalEventId: `payment.succeeded:${providerPayment.id}`,
    paymentId: providerPayment.id,
    amountKopecks: 54_900,
    currency: 'RUB',
    event: 'payment.succeeded',
    status: 'succeeded',
    confirmedAt: new Date('2026-08-07T04:34:00.000Z'),
    metadata: {
      productType: 'metacoins',
      productId: 'coins_150',
      telegramUserId: '10'
    }
  }]);
});

test('successful YooKassa payment uses the saved checkout email when the payment object has no receipt field', async () => {
  const notices = [];
  const providerPayment = payment({ receipt: undefined });
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending',
    receiptEmail: 'buyer@example.com'
  });
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment: () => ({ status: 'recorded', referralEarningKopecks: 0 }),
      account: () => ({ metacoinBalance: 50 })
    },
    notify: async (value) => notices.push(value),
    returnUrl: 'https://bot.example/payments/return'
  });

  const result = await service.processWebhook({
    type: 'notification',
    event: 'payment.succeeded',
    object: { id: providerPayment.id }
  });

  assert.equal(result.status, 'processed');
  assert.equal(notices.length, 1);
  assert.doesNotMatch(notices[0].message.text, /платёж подтверждён/i);
  assert.doesNotMatch(notices[0].message.text, /чек отправлен/i);
});

test('successful package webhook fulfills the shared Supabase entitlement ledger', async () => {
  const fulfillments = [];
  const providerPayment = payment();
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  auditRepository.recordPaymentFulfilled = async (value) => fulfillments.push(value);
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment: () => ({ status: 'recorded', friendBonusMetacoins: 5, inviterBonusMetacoins: 0, referralEarningKopecks: 0 }),
      account: () => ({ metacoinBalance: 55 })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await service.processWebhook({
    type: 'notification',
    event: 'payment.succeeded',
    object: { id: providerPayment.id }
  });

  assert.deepEqual(fulfillments, [{
    telegramUserId: '10',
    paymentId: providerPayment.id,
    metacoins: 55,
    bonusMetacoins: 5,
    balanceAfter: 55
  }]);
});

test('finance wallet failure is retriable and never acknowledges the webhook', async () => {
  const providerPayment = payment();
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  auditRepository.recordFinanceAllocations = async () => {};
  auditRepository.recordWalletEntries = async () => {
    throw new Error('wallet write failed');
  };
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment: () => ({ status: 'recorded', referralEarningKopecks: 0 }),
      account: () => ({ metacoinBalance: 50 })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(
    () => service.processWebhook({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: providerPayment.id }
    }),
    /wallet write failed/i
  );
});

test('a retried package webhook preserves referral bonuses and referral liability', async () => {
  const providerPayment = payment();
  const fulfillments = [];
  const financeAudits = [];
  let walletAttempts = 0;
  let paymentAttempts = 0;
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  auditRepository.recordPaymentFulfilled = async (value) => fulfillments.push(value);
  auditRepository.recordFinanceAllocations = async (value) => financeAudits.push(value);
  auditRepository.recordWalletEntries = async () => {
    walletAttempts += 1;
    if (walletAttempts === 1) throw new Error('wallet write failed');
  };
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment: () => {
        paymentAttempts += 1;
        return paymentAttempts === 1
          ? { status: 'recorded', friendBonusMetacoins: 5, inviterBonusMetacoins: 0, referralEarningKopecks: 4_975 }
          : { status: 'duplicate', bonusMetacoins: 5, referralEarningKopecks: 4_975 };
      },
      account: () => ({ metacoinBalance: 55 })
    },
    returnUrl: 'https://bot.example/payments/return'
  });
  const event = {
    type: 'notification',
    event: 'payment.succeeded',
    object: { id: providerPayment.id }
  };

  await assert.rejects(() => service.processWebhook(event), /wallet write failed/i);
  assert.equal((await service.processWebhook(event)).status, 'duplicate');
  assert.equal(fulfillments.length, 2);
  assert.ok(fulfillments.every(({ metacoins, bonusMetacoins }) => metacoins === 55 && bonusMetacoins === 5));
  assert.equal(financeAudits.length, 2);
  assert.ok(financeAudits.every(({ allocations }) => (
    allocations.find(({ category }) => category === 'referral_liability')?.amountKopecks === 4_975
  )));
});

test('successful YooKassa webhook refuses to credit without a verified receipt email', async () => {
  let credited = false;
  const providerPayment = payment({ receipt: undefined });
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    referralService: {
      recordPayment() {
        credited = true;
      },
      account: () => ({ metacoinBalance: 50 })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(
    () => service.processWebhook({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: providerPayment.id }
    }),
    /receipt email|receipt/i
  );
  assert.equal(credited, false);
});

test('canceled webhook notifies the user with the provider reason and never credits', async () => {
  const notices = [];
  const providerPayment = payment({
    status: 'canceled',
    paid: false,
    cancellation_details: { reason: 'insufficient_funds' }
  });
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  let credited = false;
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment() {
        credited = true;
      },
      account: () => ({ metacoinBalance: 0 })
    },
    notify: async (value) => notices.push(value),
    returnUrl: 'https://bot.example/payments/return'
  });

  const result = await service.processWebhook({
    type: 'notification',
    event: 'payment.canceled',
    object: { id: providerPayment.id }
  });

  assert.equal(result.status, 'failed');
  assert.equal(credited, false);
  assert.equal(notices.length, 1);
  assert.match(notices[0].message.text, /недостаточно средств/u);
  assert.doesNotMatch(notices[0].message.text, /баланс пополнен|начислено/u);
});

test('webhook rejects an amount mismatch and never credits the account', async () => {
  let credited = false;
  const service = createPaymentService({
    client: {
      getPayment: async () => payment({ amount: { value: '1.00', currency: 'RUB' } })
    },
    referralService: {
      recordPayment() {
        credited = true;
      }
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(
    () => service.processWebhook({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: payment().id }
    }),
    /amount/i
  );
  assert.equal(credited, false);
});

test('verified plan webhook activates the subscription once', async () => {
  const activations = [];
  const subscriptionAudits = [];
  const providerPayment = payment({
    amount: { value: '749.00', currency: 'RUB' },
    metadata: {
      telegramUserId: '10',
      telegramChatId: '10',
      productKind: 'plan',
      productId: 'author',
      durationMonths: '1',
      durationDays: '30',
      metacoins: '300',
      amountKopecks: '74900'
    }
  });
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'subscription',
    productId: 'author',
    amountKopecks: 74_900,
    baseMetacoins: 300,
    status: 'pending'
  });
  auditRepository.recordSubscriptionActivated = async (value) => {
    subscriptionAudits.push(value);
  };
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      activateSubscription(value) {
        activations.push(value);
        return {
          status: activations.length === 1 ? 'activated' : 'duplicate',
          startsAt: '2026-07-27T00:00:00.000Z',
          expiresAt: '2026-08-26T00:00:00.000Z'
        };
      },
      account: () => ({ metacoinBalance: 300 })
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  const event = { type: 'notification', event: 'payment.succeeded', object: { id: providerPayment.id } };
  assert.equal((await service.processWebhook(event)).status, 'processed');
  assert.equal((await service.processWebhook(event)).status, 'duplicate');
  assert.equal(activations[0].planId, 'author');
  assert.deepEqual(subscriptionAudits, [{
    telegramUserId: '10',
    paymentId: providerPayment.id,
    planId: 'author',
    startsAt: '2026-07-27T00:00:00.000Z',
    expiresAt: '2026-08-26T00:00:00.000Z',
    priceKopecks: 74_900,
    metacoins: 300,
    balanceAfter: 300
  }]);
});

test('webhook never credits a YooKassa payment missing from the local checkout ledger', async () => {
  let credited = false;
  const providerPayment = payment();
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository: auditRepositoryFor(null),
    referralService: {
      recordPayment() {
        credited = true;
      }
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(
    () => service.processWebhook({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: providerPayment.id }
    }),
    /local payment/i
  );
  assert.equal(credited, false);
});

test('payment service rejects an incomplete audit repository at startup', () => {
  assert.throws(
    () => createPaymentService({
      client: { getPayment: async () => payment() },
      auditRepository: {},
      referralService: {},
      returnUrl: 'https://bot.example/payments/return'
    }),
    /complete payment audit repository/i
  );
});

test('webhook retries the Telegram receipt after a transient notification failure', async () => {
  const providerPayment = payment();
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  let paymentAttempts = 0;
  let notificationAttempts = 0;
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment() {
        paymentAttempts += 1;
        return { status: paymentAttempts === 1 ? 'recorded' : 'duplicate' };
      },
      account: () => ({ metacoinBalance: 50 })
    },
    notify: async () => {
      notificationAttempts += 1;
      if (notificationAttempts === 1) throw new Error('Telegram is temporarily unavailable.');
    },
    returnUrl: 'https://bot.example/payments/return'
  });
  const event = {
    type: 'notification',
    event: 'payment.succeeded',
    object: { id: providerPayment.id }
  };

  await assert.rejects(() => service.processWebhook(event), /temporarily unavailable/i);
  assert.equal((await service.processWebhook(event)).status, 'duplicate');
  assert.equal((await service.processWebhook(event)).status, 'duplicate');
  assert.equal(paymentAttempts, 2);
  assert.equal(notificationAttempts, 2);
});

test('webhook does not acknowledge a failed final Supabase payment audit', async () => {
  const providerPayment = payment();
  const auditRepository = auditRepositoryFor({
    paymentId: providerPayment.id,
    telegramUserId: '10',
    productType: 'metacoins',
    productId: 'coins_150',
    amountKopecks: 54_900,
    baseMetacoins: 50,
    status: 'pending'
  });
  auditRepository.updatePaymentStatus = async () => {
    throw new Error('Supabase write failed.');
  };
  let notified = false;
  const service = createPaymentService({
    client: { getPayment: async () => providerPayment },
    auditRepository,
    referralService: {
      recordPayment: () => ({ status: 'recorded' }),
      account: () => ({ metacoinBalance: 50 })
    },
    notify: async () => {
      notified = true;
    },
    returnUrl: 'https://bot.example/payments/return'
  });

  await assert.rejects(
    () => service.processWebhook({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: providerPayment.id }
    }),
    /Supabase write failed/i
  );
  assert.equal(notified, false);
});
