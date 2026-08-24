import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { createCryptoUsdcPaymentService } from '../src/crypto-usdc-payment-service.js';

const NOW = new Date('2026-08-11T12:00:00.000Z');
const SECRET = 'crypto-shared-secret-with-at-least-32-bytes';

function decodeTicket(confirmationUrl) {
  const url = new URL(confirmationUrl);
  assert.equal(url.pathname, '/crypto');
  const ticket = url.searchParams.get('quote');
  const [payloadPart, signature] = ticket.split('.');
  assert.equal(
    signature,
    createHmac('sha256', SECRET).update(payloadPart).digest('base64url')
  );
  return JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
}

function repositoryMock() {
  const calls = [];
  return {
    calls,
    async recordCryptoUsdcCheckout(value) {
      calls.push(['checkout', value]);
      return value.orderId;
    },
    async recordCryptoUsdcCallback(value) {
      calls.push(['callback', value]);
      return {
        status: 'confirmed', duplicate: false, financeRequestCreated: true,
        telegramUserId: '42', telegramChatId: '43', productKind: 'package',
        productId: 'coins_150', durationMonths: 1, durationDays: 0, metacoins: 150,
        confirmedAt: NOW.toISOString()
      };
    },
    async completeCryptoUsdcFulfillment(value) {
      calls.push(['fulfillment', value]);
      return { status: 'fulfilled', duplicate: false };
    }
  };
}

function service(overrides = {}) {
  const repository = overrides.repository ?? repositoryMock();
  const referralService = overrides.referralService ?? {
    fulfillCryptoEntitlement(value) { repository.calls.push(['entitlement', value]); return { status: 'fulfilled' }; }
  };
  return {
    repository,
    paymentService: createCryptoUsdcPaymentService({
      repository,
      referralService,
      gatewayUrl: 'https://crypto-pay.example/checkout',
      quoteSecret: SECRET,
      prices: {
        'package:coins_150': { amountUsdcMicros: 12_500_000, openrouterCreditMicrousd: 5_000_000, openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000, ownerUsdcMicros: 7_000_000 },
        'plan:author:1': { amountUsdcMicros: 75_000_000, openrouterCreditMicrousd: 30_000_000, openrouterUsdcMicros: 31_500_000, gasReserveUsdcMicros: 250_000, ownerUsdcMicros: 43_250_000 }
      },
      now: () => NOW,
      ...overrides
    })
  };
}

test('USDC checkout ticket carries micros, Base and an immutable signed snapshot', async () => {
  const { paymentService, repository } = service();
  const checkout = await paymentService.createCheckout({
    kind: 'package',
    productId: 'coins_150',
    telegramUserId: '42',
    telegramChatId: '43',
    idempotencyKey: 'crypto_update_123'
  });
  const ticket = decodeTicket(checkout.confirmationUrl);

  assert.equal(checkout.amountUsdcMicros, 12_500_000);
  assert.equal(checkout.currency, 'USDC');
  assert.equal(checkout.chain, 'base');
  assert.equal(ticket.currency, 'USDC');
  assert.equal(ticket.network, 'base');
  assert.deepEqual(ticket.product, {
    kind: 'package', productId: 'coins_150', productName: '150 метакоинов',
    durationMonths: 1, metacoins: 150
  });
  assert.deepEqual(ticket.allocation, {
    amountUsdcMicros: 12_500_000, openrouterCreditMicrousd: 5_000_000,
    openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000,
    ownerUsdcMicros: 7_000_000, currency: 'USDC', network: 'base'
  });
  assert.equal(ticket.expiresAt, Math.floor(NOW.valueOf() / 1000) + 900);
  assert.equal(repository.calls[0][1].amountKopecks, undefined);
  assert.equal(repository.calls[0][1].amountXtr, undefined);
  assert.deepEqual(repository.calls[0][1].snapshot, {
    product: {
      kind: 'package', productId: 'coins_150', productName: '150 метакоинов',
      durationMonths: 1, metacoins: 150
    },
    allocation: {
      amountUsdcMicros: 12_500_000, openrouterCreditMicrousd: 5_000_000,
      openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000,
      ownerUsdcMicros: 7_000_000, currency: 'USDC', network: 'base'
    }
  });
});

test('USDC callback requires real Base confirmation evidence and records one finance request', async () => {
  const { paymentService, repository } = service();
  const result = await paymentService.processCallback({
    provider: 'base_usdc',
    eventId: 'evt_base_12345678',
    status: 'COMPLETED',
    orderId: 'mfc_0123456789abcdef0123456789abcdef',
    checkoutId: 'mfc_0123456789abcdef0123456789abcdef',
    transactionHash: `0x${'a'.repeat(64)}`,
    amountUsdcMicros: 12_500_000,
    payableAmountUsdcMicros: 12_500_731,
    overpaymentUsdcMicros: 731,
    currency: 'USDC',
    network: 'base'
  });

  assert.equal(result.financeRequestCreated, true);
  assert.equal(repository.calls[0][0], 'callback');
  assert.equal(repository.calls[0][1].amountUsdcMicros, 12_500_000);
  assert.equal(repository.calls[0][1].payableAmountUsdcMicros, 12_500_731);
  assert.equal(repository.calls[0][1].overpaymentUsdcMicros, 731);
  assert.equal(repository.calls[0][1].chain, 'base');
  assert.equal(repository.calls[0][1].amountKopecks, undefined);
  assert.equal(repository.calls[1][0], 'entitlement');
  assert.equal(repository.calls[1][1].paymentRail, 'crypto_usdc');
  assert.equal(repository.calls[1][1].fundingProvider, 'openrouter');
  assert.equal(repository.calls[2][0], 'fulfillment');
});

test('USDC callback does not complete when entitlement commit fails', async () => {
  const { paymentService, repository } = service({
    referralService: { fulfillCryptoEntitlement() { throw new Error('entitlement unavailable'); } }
  });
  await assert.rejects(() => paymentService.processCallback({
    provider: 'base_usdc', eventId: 'evt_base_12345678', status: 'COMPLETED',
    orderId: 'mfc_0123456789abcdef0123456789abcdef',
    checkoutId: 'mfc_0123456789abcdef0123456789abcdef', transactionHash: `0x${'a'.repeat(64)}`,
    amountUsdcMicros: 12_500_000, payableAmountUsdcMicros: 12_500_731,
    overpaymentUsdcMicros: 731, currency: 'USDC', network: 'base'
  }), /entitlement unavailable/);
  assert.equal(repository.calls.some(([name]) => name === 'fulfillment'), false);
});

test('USDC callback fails closed for unconfirmed, wrong-chain or incomplete events', async () => {
  const { paymentService, repository } = service();
  const valid = {
    provider: 'base_usdc', eventId: 'evt_base_12345678', status: 'COMPLETED',
    orderId: 'mfc_0123456789abcdef0123456789abcdef',
    checkoutId: 'mfc_0123456789abcdef0123456789abcdef', transactionHash: `0x${'a'.repeat(64)}`,
    amountUsdcMicros: 12_500_000, payableAmountUsdcMicros: 12_500_731,
    overpaymentUsdcMicros: 731, currency: 'USDC', network: 'base'
  };

  await assert.rejects(() => paymentService.processCallback({ ...valid, status: 'PENDING' }), /completed/i);
  await assert.rejects(() => paymentService.processCallback({ ...valid, network: 'ethereum' }), /network/i);
  await assert.rejects(() => paymentService.processCallback({ ...valid, transactionHash: '' }), /transaction/i);
  await assert.rejects(() => paymentService.processCallback({ ...valid, payableAmountUsdcMicros: 12_500_730 }), /payable/i);
  await assert.rejects(() => paymentService.processCallback({ ...valid, overpaymentUsdcMicros: 10_000 }), /overpayment/i);
  assert.equal(repository.calls.length, 0);
});

test('USDC checkout refuses products without an explicit USDC-micros price', async () => {
  const { paymentService } = service();
  assert.equal(paymentService.supportsCheckout({ kind: 'package', productId: 'coins_150' }), true);
  assert.equal(paymentService.supportsCheckout({ kind: 'package', productId: 'coins_400' }), false);
  await assert.rejects(() => paymentService.createCheckout({
    kind: 'package', productId: 'coins_400', telegramUserId: '42', telegramChatId: '43',
    idempotencyKey: 'crypto_update_456'
  }), /USDC price/i);
});
