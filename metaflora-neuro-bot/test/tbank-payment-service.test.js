import assert from 'node:assert/strict';
import { createDecipheriv, createHash } from 'node:crypto';
import test from 'node:test';

import { createTBankPaymentService } from '../src/tbank-payment-service.js';

const NOW = new Date('2026-08-09T12:00:00.000Z');
const CHECKOUT_SECRET = 'checkout-secret-with-at-least-32-bytes';

function decodeTicket(url) {
  const ticket = new URL(url).searchParams.get('ticket');
  const [version, ivPart, ciphertextPart, tagPart] = ticket.split('.');
  assert.equal(version, 'v1');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    createHash('sha256').update(CHECKOUT_SECRET).digest(),
    Buffer.from(ivPart, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final()
  ]).toString('utf8'));
}

function referralMock() {
  const payments = new Set();
  const calls = [];
  return {
    calls,
    reservePlanUpgrade(value) {
      calls.push(['upgrade-reserved', value]);
      return { status: 'reserved' };
    },
    releasePlanUpgrade(value) {
      calls.push(['upgrade-released', value]);
      return { status: 'released' };
    },
    account() {
      return { metacoinBalance: 1_000, subscriptionPlanId: 'newcomer' };
    },
    recordPayment(value) {
      calls.push(['package', value]);
      const duplicate = payments.has(value.paymentId);
      payments.add(value.paymentId);
      return { status: duplicate ? 'duplicate' : 'recorded', bonusMetacoins: 0 };
    },
    activateSubscription(value) {
      calls.push(['plan', value]);
      const duplicate = payments.has(value.paymentId);
      payments.add(value.paymentId);
      return {
        status: duplicate ? 'duplicate' : 'activated',
        startsAt: NOW,
        expiresAt: new Date('2026-09-09T12:00:00.000Z')
      };
    }
  };
}

function auditMock() {
  const checkouts = new Map();
  const webhooks = new Map();
  const calls = [];
  return {
    calls,
    async recordPaymentCreated(value) {
      calls.push(['created', value]);
      checkouts.set(value.paymentId, {
        paymentId: value.paymentId,
        telegramUserId: value.telegramUserId,
        productType: value.productType,
        productId: value.productId,
        amountKopecks: value.amountKopecks,
        baseMetacoins: value.baseMetacoins,
        status: 'pending',
        provider: value.provider,
        receiptEmail: value.receiptEmail,
        receiptPhone: value.receiptPhone,
        providerPayload: value.providerPayload
      });
      return value.paymentId;
    },
    async getPaymentCheckoutRecord(paymentId) {
      return checkouts.get(paymentId) ?? null;
    },
    async claimPaymentWebhook(value) {
      calls.push(['webhook-claim', value]);
      const key = `${value.provider}:${value.providerEventId}`;
      const status = webhooks.get(key);
      if (status === 'processing' || status === 'processed' || status === 'ignored') {
        return { claimed: false, status };
      }
      webhooks.set(key, 'processing');
      return { claimed: true, status: 'processing' };
    },
    async updatePaymentWebhookStatus(value) {
      calls.push(['webhook-status', value]);
      webhooks.set(`${value.provider}:${value.providerEventId}`, value.status);
    },
    async updatePaymentStatus(value) {
      calls.push(['payment-status', value]);
      const current = checkouts.get(value.paymentId);
      checkouts.set(value.paymentId, { ...current, status: value.status, providerPayload: value.providerPayload });
    },
    async recordPaymentFulfilled(value) {
      calls.push(['fulfilled', value]);
    },
    async recordSubscriptionActivated(value) {
      calls.push(['subscription', value]);
    },
    async recordFinanceAllocations(value) {
      calls.push(['finance-allocations', value]);
    },
    async recordWalletEntries(value) {
      calls.push(['wallet-entries', value]);
    },
    async recordTBankPaymentConfirmation(value) {
      calls.push(['tbank-confirmation', value]);
    }
  };
}

function service(overrides = {}) {
  const referralService = overrides.referralService ?? referralMock();
  const auditRepository = overrides.auditRepository ?? auditMock();
  return {
    referralService,
    auditRepository,
    paymentService: createTBankPaymentService({
      referralService,
      auditRepository,
      gatewayUrl: 'https://pay.example/checkout',
      checkoutSecret: CHECKOUT_SECRET,
      now: () => NOW,
      ...overrides
    })
  };
}

test('issues an opaque checkout URL with trusted e-mail receipt data', async () => {
  const { paymentService, auditRepository } = service();
  const input = {
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_123', receiptEmail: ' Buyer@Example.com '
  };

  const first = await paymentService.createCheckout(input);
  const second = await paymentService.createCheckout(input);
  const ticket = decodeTicket(first.confirmationUrl);

  assert.notEqual(first.confirmationUrl, second.confirmationUrl);
  assert.equal(first.paymentId, second.paymentId);
  assert.equal(first.confirmationUrl.includes('buyer'), false);
  assert.equal(ticket.paymentId, ticket.orderId);
  assert.equal(ticket.telegramUserId, '42');
  assert.equal(ticket.telegramChatId, '43');
  assert.equal(ticket.productKind, 'package');
  assert.equal(ticket.productCode, 'coins_150');
  assert.equal(ticket.receiptEmail, 'buyer@example.com');
  assert.equal(ticket.expiresAt, Math.floor(NOW.valueOf() / 1000) + 15 * 60);
  assert.equal(auditRepository.calls[0][1].provider, 'tbank');
  assert.equal(auditRepository.calls[0][1].providerPayload.ticket, undefined);
});

test('T-Bank persists the upgrade marker inside the trusted local checkout', async () => {
  const referralService = referralMock();
  referralService.account = () => ({
    metacoinBalance: 1_000,
    subscriptionPlanId: 'amateur',
    subscriptionMetacoinsRemaining: 130,
    subscriptionMetacoinsTotal: 130,
    subscriptionPriceKopecks: 74_900,
    subscriptionDurationMonths: 1,
    subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
  });
  const { paymentService, auditRepository } = service({ referralService });
  const checkout = await paymentService.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'upgrade_123',
    receiptEmail: 'buyer@example.com'
  });

  assert.equal(checkout.amountKopecks, 74_100);
  assert.equal(auditRepository.calls[0][1].providerPayload.checkout.isUpgrade, true);
  assert.equal(auditRepository.calls[0][1].providerPayload.checkout.metacoinsGranted, 170);
});

test('a disabled legacy test subscription cannot break a normal T-Bank checkout', async () => {
  const referralService = referralMock();
  referralService.account = () => ({
    metacoinBalance: 300,
    subscriptionPlanId: 'final_test_130',
    subscriptionMetacoinsRemaining: 100,
    subscriptionMetacoinsTotal: 100,
    subscriptionPriceKopecks: 13_000,
    subscriptionDurationMonths: 1,
    subscriptionExpiresAt: '2026-09-08T02:20:09.412Z'
  });
  const { paymentService, auditRepository } = service({
    referralService,
    testTariffs: [{
      enabled: false,
      id: 'final_test_130',
      priceKopecks: 13_000,
      metacoins: 100,
      provider: 'polza',
      topupKopecks: 11_000,
      ownerShareTargetKopecks: 2_000
    }]
  });

  const checkout = await paymentService.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'legacy_test_to_author',
    receiptEmail: 'buyer@example.com'
  });

  assert.equal(checkout.amountKopecks, 149_000);
  assert.equal(auditRepository.calls[0][1].providerPayload.checkout.isUpgrade, false);
  assert.equal(referralService.calls.some(([kind]) => kind === 'upgrade-reserved'), false);
});

test('a metacoin package never reserves a disabled legacy test subscription', async () => {
  const referralService = referralMock();
  referralService.account = () => ({
    metacoinBalance: 300,
    subscriptionPlanId: 'final_test_130',
    subscriptionMetacoinsRemaining: 100,
    subscriptionMetacoinsTotal: 100,
    subscriptionPriceKopecks: 13_000,
    subscriptionDurationMonths: 1,
    subscriptionExpiresAt: '2026-09-08T02:20:09.412Z'
  });
  const { paymentService } = service({ referralService });

  const checkout = await paymentService.createCheckout({
    kind: 'package', productId: 'coins_150',
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'legacy_test_package',
    receiptEmail: 'buyer@example.com'
  });

  assert.equal(checkout.amountKopecks, 54_900);
  assert.equal(referralService.calls.some(([kind]) => kind === 'upgrade-reserved'), false);
});

test('T-Bank releases an upgrade reservation when durable checkout persistence fails', async () => {
  const referralService = referralMock();
  referralService.account = () => ({
    metacoinBalance: 130,
    subscriptionPlanId: 'amateur',
    subscriptionMetacoinsRemaining: 130,
    subscriptionMetacoinsTotal: 130,
    subscriptionPriceKopecks: 74_900,
    subscriptionDurationMonths: 1,
    subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
  });
  const auditRepository = auditMock();
  auditRepository.recordPaymentCreated = async () => { throw new Error('audit unavailable'); };
  const { paymentService } = service({ referralService, auditRepository });

  await assert.rejects(() => paymentService.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'upgrade_audit_failure',
    receiptEmail: 'buyer@example.com'
  }), /audit unavailable/);
  assert.deepEqual(referralService.calls.map(([kind]) => kind), ['upgrade-reserved', 'upgrade-released']);
});

test('T-Bank retry never releases an upgrade reservation owned by the first checkout attempt', async () => {
  const referralService = referralMock();
  referralService.account = () => ({
    metacoinBalance: 130, subscriptionPlanId: 'amateur',
    subscriptionMetacoinsRemaining: 130, subscriptionMetacoinsTotal: 130,
    subscriptionPriceKopecks: 44_900, subscriptionDurationMonths: 1,
    subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
  });
  referralService.reservePlanUpgrade = () => ({ status: 'duplicate' });
  const auditRepository = auditMock();
  auditRepository.recordPaymentCreated = async () => { throw new Error('audit unavailable'); };
  const { paymentService } = service({ referralService, auditRepository });
  await assert.rejects(() => paymentService.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'upgrade_retry',
    receiptEmail: 'buyer@example.com'
  }), /audit unavailable/);
  assert.equal(referralService.calls.some(([kind]) => kind === 'upgrade-released'), false);
});

test('accepts a normalized Russian phone instead of e-mail for the fiscal receipt', async () => {
  const { paymentService } = service();
  const checkout = await paymentService.createCheckout({
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_124', receiptPhone: '+7 (999) 123-45-67'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);
  assert.equal(ticket.receiptPhone, '+79991234567');
  assert.equal(ticket.receiptEmail, undefined);
});

test('refuses to issue a T-Bank checkout without a receipt contact', async () => {
  const { paymentService } = service();
  await assert.rejects(() => paymentService.createCheckout({
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_125'
  }), /receipt contact/i);
});

test('validates receipt contacts and fail-closed service configuration', async () => {
  const { paymentService } = service();
  const base = {
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43'
  };
  await assert.rejects(() => paymentService.createCheckout({
    ...base, idempotencyKey: 'bad_email', receiptEmail: 'buyer@invalid'
  }), /e-mail/i);
  await assert.rejects(() => paymentService.createCheckout({
    ...base, idempotencyKey: 'bad_phone', receiptPhone: '123'
  }), /phone/i);
  assert.throws(() => createTBankPaymentService({
    referralService: referralMock(), auditRepository: auditMock(),
    gatewayUrl: 'http://pay.example', checkoutSecret: CHECKOUT_SECRET
  }), /HTTPS/i);
  assert.throws(() => createTBankPaymentService({
    referralService: referralMock(), auditRepository: auditMock(),
    gatewayUrl: 'not-a-url', checkoutSecret: CHECKOUT_SECRET
  }), /URL is invalid/i);
  assert.throws(() => createTBankPaymentService({
    referralService: referralMock(), auditRepository: auditMock(),
    gatewayUrl: 'https://pay.example', checkoutSecret: 'short'
  }), /32 bytes/i);
  assert.throws(() => createTBankPaymentService({
    referralService: referralMock(), auditRepository: auditMock(),
    gatewayUrl: 'https://pay.example', checkoutSecret: CHECKOUT_SECRET, ticketTtlSeconds: 901
  }), /TTL/i);
  assert.throws(() => createTBankPaymentService({
    referralService: referralMock(), auditRepository: {},
    gatewayUrl: 'https://pay.example', checkoutSecret: CHECKOUT_SECRET
  }), /persistent/i);
});

test('credits metacoins once and only after a locally matched CONFIRMED callback', async () => {
  const { paymentService, referralService, auditRepository } = service();
  const checkout = await paymentService.createCheckout({
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_126', receiptEmail: 'buyer@example.com'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);

  assert.equal((await paymentService.processCallback({
    provider: 'tbank', status: 'PENDING', paymentId: '9001', orderId: ticket.orderId,
    amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  })).status, 'ignored');
  assert.equal(referralService.calls.length, 0);

  const callback = {
    provider: 'tbank', status: 'CONFIRMED', paymentId: '9001', orderId: ticket.orderId,
    amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  };
  assert.equal((await paymentService.processCallback(callback)).status, 'processed');
  assert.equal((await paymentService.processCallback(callback)).status, 'duplicate');
  assert.equal(referralService.calls.length, 1);
  assert.equal(referralService.calls[0][1].paymentId, ticket.orderId);
  assert.equal(auditRepository.calls.filter(([name]) => name === 'fulfilled').length, 1);
  assert.equal(auditRepository.calls.filter(([name]) => name === 'finance-allocations').length, 1);
  assert.equal(auditRepository.calls.filter(([name]) => name === 'wallet-entries').length, 1);
  assert.equal(auditRepository.calls.filter(([name]) => name === 'tbank-confirmation').length, 1);
  const finance = auditRepository.calls.find(([name]) => name === 'finance-allocations')[1];
  assert.equal(finance.externalPaymentId, ticket.orderId);
  assert.equal(finance.metadata.confirmationSource, 'tbank');
  assert.deepEqual(
    finance.allocations.filter(({ category }) => category === 'api_reserve')
      .map(({ provider }) => provider),
    ['polza', 'routerai']
  );
});

test('atomically accepts only one of two concurrent CONFIRMED callbacks for the same order', async () => {
  const { paymentService, referralService, auditRepository } = service();
  const checkout = await paymentService.createCheckout({
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_concurrent', receiptEmail: 'buyer@example.com'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);
  const callback = {
    provider: 'tbank', status: 'CONFIRMED', paymentId: '9004', orderId: ticket.orderId,
    amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  };

  const results = await Promise.all([
    paymentService.processCallback(callback),
    paymentService.processCallback(callback)
  ]);

  assert.deepEqual(results.map(({ status }) => status).sort(), ['duplicate', 'processed']);
  assert.equal(referralService.calls.length, 1);
  assert.equal(auditRepository.calls.filter(([name]) => name === 'tbank-confirmation').length, 1);
});

test('rejects amount mismatch and an unknown local order without crediting', async () => {
  const { paymentService, referralService } = service();
  const checkout = await paymentService.createCheckout({
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_127', receiptEmail: 'buyer@example.com'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);
  await assert.rejects(() => paymentService.processCallback({
    provider: 'tbank', status: 'CONFIRMED', paymentId: '9002', orderId: ticket.orderId,
    amountKopecks: ticket.amountKopecks + 1, terminalKey: 'terminal'
  }), /amount mismatch/i);
  await assert.rejects(() => paymentService.processCallback({
    provider: 'tbank', status: 'CONFIRMED', paymentId: '9003', orderId: `mf_${'0'.repeat(32)}`,
    amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  }), /local payment/i);
  assert.equal(referralService.calls.length, 0);
});

test('activates a plan once and rejects a conflicting external T-Bank payment id', async () => {
  const { paymentService, referralService, auditRepository } = service();
  const checkout = await paymentService.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'update_128',
    receiptEmail: 'buyer@example.com'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);
  const callback = {
    provider: 'tbank', status: 'CONFIRMED', paymentId: '9100', orderId: ticket.orderId,
    amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  };

  assert.equal((await paymentService.processCallback(callback)).status, 'processed');
  assert.equal(referralService.calls.find(([kind]) => kind === 'plan')[0], 'plan');
  assert.equal(auditRepository.calls.filter(([name]) => name === 'subscription').length, 1);
  await assert.rejects(() => paymentService.processCallback({
    ...callback, paymentId: '9101'
  }), /provider payment id conflicts/i);
});

test('confirmed credited upgrade funds both provider minimums by reducing only owner share', async () => {
  const referralService = referralMock();
  referralService.account = () => ({
    metacoinBalance: 1_000,
    subscriptionPlanId: 'amateur',
    subscriptionMetacoinsRemaining: 130,
    subscriptionMetacoinsTotal: 130,
    subscriptionPriceKopecks: 74_900,
    subscriptionDurationMonths: 1,
    subscriptionExpiresAt: '2099-01-01T00:00:00.000Z'
  });
  const { paymentService, auditRepository } = service({
    referralService,
    financePolicy: {
      paymentFeePercent: 3.5,
      apiReservePercent: 56.5,
      targetGrossMarginPercent: 40,
      enforceExactGrossMargin: true,
      providerWeights: { polza: 60, routerai: 505 },
      providerMinimumsKopecks: { routerai: 10_000 }
    }
  });
  const checkout = await paymentService.createCheckout({
    kind: 'plan', productId: 'author', durationMonths: 1,
    telegramUserId: '42', telegramChatId: '43', idempotencyKey: 'upgrade_confirmed',
    receiptEmail: 'buyer@example.com'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);
  await paymentService.processCallback({
    provider: 'tbank', status: 'CONFIRMED', paymentId: 'upgrade-provider-payment',
    orderId: ticket.orderId, amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  });

  const finance = auditRepository.calls.find(([name]) => name === 'finance-allocations')[1];
  const amount = (category, provider = null) => finance.allocations.find((row) =>
    row.category === category && (provider === null || row.provider === provider))?.amountKopecks ?? 0;
  assert.equal(amount('api_reserve', 'polza'), 4_446);
  assert.equal(amount('api_reserve', 'routerai'), 37_421);
  assert.equal(amount('owner_share'), 29_639);
  assert.equal(finance.metadata.upgrade, true);
  assert.equal(referralService.calls.find(([kind]) => kind === 'plan')[1].creditedMetacoins, 170);
});

test('rejects malformed confirmed callback and non-fulfillable local checkout state', async () => {
  const auditRepository = auditMock();
  const { paymentService } = service({ auditRepository });
  await assert.rejects(() => paymentService.processCallback({
    provider: 'other', status: 'CONFIRMED', paymentId: '9200',
    orderId: `mf_${'0'.repeat(32)}`, amountKopecks: 100, terminalKey: 'terminal'
  }), /provider is invalid/i);

  const checkout = await paymentService.createCheckout({
    kind: 'package', productId: 'coins_150', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'update_129', receiptEmail: 'buyer@example.com'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);
  const record = await auditRepository.getPaymentCheckoutRecord(ticket.orderId);
  await auditRepository.updatePaymentStatus({
    paymentId: ticket.orderId, status: 'cancelled', providerPayload: record.providerPayload
  });
  await assert.rejects(() => paymentService.processCallback({
    provider: 'tbank', status: 'CONFIRMED', paymentId: '9201', orderId: ticket.orderId,
    amountKopecks: ticket.amountKopecks, terminalKey: 'terminal'
  }), /not fulfillable/i);
});
