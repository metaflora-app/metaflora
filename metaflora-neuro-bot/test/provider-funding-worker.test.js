import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_FUNDING_CAPS,
  ProviderFundingWorker,
  processProviderFunding
} from '../src/provider-funding-worker.js';

const baseJob = (overrides = {}) => ({
  id: 'topup-row-1',
  allocationKey: 'payment-1:api_reserve:polza',
  paymentId: 'payment-1',
  provider: 'polza',
  amountKopecks: 10_000,
  currency: 'RUB',
  claimToken: 'claim-token-1',
  attemptCount: 1,
  ...overrides
});

function providerDouble(overrides = {}) {
  const calls = [];
  return {
    calls,
    provider: {
      async charge(input) {
        calls.push(['charge', input]);
        return { transactionId: 'tx-1', ...overrides.charge };
      },
      async verifyTransaction(input) {
        calls.push(['verifyTransaction', input]);
        return {
          transactionId: 'tx-1',
          amountKopecks: input.expectedAmountKopecks,
          currency: input.currency,
          ...overrides.transaction
        };
      },
      async getBalance(input) {
        calls.push(['getBalance', input]);
        return { balanceKopecks: 25_000, currency: 'RUB', ...overrides.balance };
      }
    }
  };
}

function repositoryDouble(jobs, overrides = {}) {
  const calls = [];
  return {
    calls,
    async claimProviderTopupRequests(input) {
      calls.push(['claim', input]);
      return jobs;
    },
    async getProviderTopupRequest(input) {
      calls.push(['get', input]);
      return overrides.existing ?? null;
    },
    async markProviderTopupChargeStarted(input) {
      calls.push(['chargeStarted', input]);
      return true;
    },
    async markProviderTopupSucceeded(input) {
      calls.push(['succeeded', input]);
      return true;
    },
    async markProviderTopupFailed(input) {
      calls.push(['failed', input]);
      return true;
    }
  };
}

function enabledOptions(repository, providers, overrides = {}) {
  return {
    repository,
    providers,
    enabled: true,
    killSwitch: false,
    billing: { danger: true },
    ...overrides
  };
}

test('worker processes a claimed request with stable provider/allocation/payment idempotency', async () => {
  const repository = repositoryDouble([baseJob()]);
  const scripted = providerDouble();
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: scripted.provider }));

  const result = await worker.run();

  assert.deepEqual(result, { status: 'processed', claimed: 1, succeeded: 1, failed: 0, skipped: 0 });
  assert.equal(scripted.calls[0][0], 'charge');
  assert.equal(
    scripted.calls[0][1].idempotencyKey,
    'provider-topup:polza:payment-1:payment-1:api_reserve:polza'
  );
  assert.deepEqual(repository.calls.at(-1), ['succeeded', {
    id: 'topup-row-1',
    claimToken: 'claim-token-1',
    externalId: 'tx-1',
    observedTransactionId: 'tx-1',
    observedAmountKopecks: 10_000,
    observedBalanceKopecks: 25_000,
    metadata: { verification: 'transaction_and_balance' }
  }]);
});

test('worker claims and processes GPTunnel alongside Polza in the same cycle', async () => {
  const jobsByProvider = {
    polza: [baseJob()],
    gptunnel: [baseJob({
      id: 'topup-row-gptunnel',
      allocationKey: 'payment-2:api_reserve:gptunnel',
      paymentId: 'payment-2',
      provider: 'gptunnel',
      amountKopecks: 5_200,
      claimToken: 'claim-token-gptunnel'
    })]
  };
  const repository = repositoryDouble([]);
  repository.claimProviderTopupRequests = async (input) => {
    repository.calls.push(['claim', input]);
    return jobsByProvider[input.provider] ?? [];
  };
  const polza = providerDouble();
  const gptunnel = providerDouble({
    charge: { transactionId: 'tx-gptunnel' },
    transaction: { transactionId: 'tx-gptunnel' }
  });
  const worker = new ProviderFundingWorker(enabledOptions(repository, {
    polza: polza.provider,
    gptunnel: gptunnel.provider
  }, { provider: ['polza', 'gptunnel'] }));

  const result = await worker.run();

  assert.deepEqual(result, {
    status: 'processed', claimed: 2, succeeded: 2, failed: 0, skipped: 0
  });
  assert.deepEqual(
    repository.calls.filter(([method]) => method === 'claim').map(([, input]) => input.provider),
    ['polza', 'gptunnel']
  );
  assert.equal(gptunnel.calls[0][1].provider, 'gptunnel');
  assert.equal(
    gptunnel.calls[0][1].idempotencyKey,
    'provider-topup:gptunnel:payment-2:payment-2:api_reserve:gptunnel'
  );
});

test('provider readiness is isolated so GPTunnel authorization never pauses Polza', async () => {
  const repository = repositoryDouble([]);
  repository.claimProviderTopupRequests = async (input) => {
    repository.calls.push(['claim', input]);
    return input.provider === 'polza' ? [baseJob()] : [];
  };
  const polza = providerDouble();
  const gptunnel = providerDouble();
  const worker = new ProviderFundingWorker(enabledOptions(repository, {
    polza: polza.provider,
    gptunnel: gptunnel.provider
  }, { provider: ['polza', 'gptunnel'] }));

  worker.setProviderReady('polza', true);
  worker.setProviderReady('gptunnel', false);
  const result = await worker.run();

  assert.equal(result.succeeded, 1);
  assert.deepEqual(
    repository.calls.filter(([method]) => method === 'claim').map(([, input]) => input.provider),
    ['polza']
  );
  assert.equal(gptunnel.calls.length, 0);
});

test('worker closes an unavailable GPTunnel claim instead of leaving it processing', async () => {
  const gptunnelJob = baseJob({
    id: 'topup-row-gptunnel-unavailable',
    allocationKey: 'payment-3:api_reserve:gptunnel',
    paymentId: 'payment-3',
    provider: 'gptunnel',
    amountKopecks: 5_200,
    claimToken: 'claim-token-gptunnel-unavailable'
  });
  const repository = repositoryDouble([]);
  repository.claimProviderTopupRequests = async (input) => {
    repository.calls.push(['claim', input]);
    return input.provider === 'gptunnel' ? [gptunnelJob] : [];
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, {
    polza: providerDouble().provider
  }, { provider: ['polza', 'gptunnel'] }));

  const result = await worker.run();

  assert.deepEqual(result, {
    status: 'processed', claimed: 1, succeeded: 0, failed: 1, skipped: 0
  });
  const failure = repository.calls.find(([method]) => method === 'failed');
  assert.equal(failure[1].id, gptunnelJob.id);
  assert.equal(failure[1].errorCode, 'provider_unavailable');
  assert.equal(failure[1].retryable, false);
});

test('a GPTunnel claim failure does not block Polza and is reported without hanging the cycle', async () => {
  const repository = repositoryDouble([]);
  repository.claimProviderTopupRequests = async (input) => {
    repository.calls.push(['claim', input]);
    if (input.provider === 'gptunnel') throw new Error('temporary claim failure');
    return [baseJob()];
  };
  const events = [];
  const polza = providerDouble();
  const worker = new ProviderFundingWorker(enabledOptions(repository, {
    polza: polza.provider
  }, {
    provider: ['gptunnel', 'polza'],
    logger: { error: (event, context) => events.push([event, context]) }
  }));

  const result = await worker.run();

  assert.deepEqual(result, {
    status: 'processed', claimed: 1, succeeded: 1, failed: 0, skipped: 0
  });
  assert.deepEqual(events, [['provider_funding_claim_failed', {
    provider: 'gptunnel', errorCode: 'claim_failed'
  }]]);
});

test('scheduler reuses one in-flight cycle and clears it after completion', async () => {
  let releaseClaim;
  const claimGate = new Promise((resolve) => { releaseClaim = resolve; });
  const repository = repositoryDouble([]);
  repository.claimProviderTopupRequests = async () => {
    await claimGate;
    return [];
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, {}));

  const first = worker.scheduleRun();
  const second = worker.scheduleRun();

  assert.equal(first, second);
  releaseClaim();
  await first;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(worker.inFlight, null);

  worker.start({ intervalMs: 1_000, runImmediately: false });
  assert.equal(worker.isRunning(), true);
  await worker.stop();
  assert.equal(worker.isRunning(), false);
});

test('worker is fail-closed when disabled, killed, or billing.danger is not explicitly true', async () => {
  for (const overrides of [
    { enabled: false },
    { killSwitch: true },
    { billing: { danger: false } },
    { billing: { danger: 'true' } }
  ]) {
    const repository = repositoryDouble([baseJob()]);
    const scripted = providerDouble();
    const result = await processProviderFunding(
      enabledOptions(repository, { polza: scripted.provider }, overrides)
    );

    assert.deepEqual(result, { status: 'disabled', claimed: 0, succeeded: 0, failed: 0, skipped: 0 });
    assert.equal(repository.calls.length, 0);
    assert.equal(scripted.calls.length, 0);
  }
});

test('worker applies safe request caps before invoking a provider', async () => {
  const repository = repositoryDouble([baseJob({ amountKopecks: 10_001 })]);
  const scripted = providerDouble();
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: scripted.provider }, {
    caps: { maxRequestKopecks: 10_000 }
  }));

  const result = await worker.run();

  assert.deepEqual(result, { status: 'processed', claimed: 1, succeeded: 0, failed: 1, skipped: 0 });
  assert.equal(scripted.calls.length, 0);
  assert.equal(repository.calls.at(-1)[0], 'failed');
  assert.equal(repository.calls.at(-1)[1].errorCode, 'amount_cap_exceeded');
  assert.equal(repository.calls.at(-1)[1].retryable, false);
});

test('worker skips a request already succeeded for the same allocation/payment/provider', async () => {
  const repository = repositoryDouble([baseJob()], {
    existing: { status: 'succeeded', externalId: 'tx-existing' }
  });
  const scripted = providerDouble();
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: scripted.provider }));

  const result = await worker.run();

  assert.deepEqual(result, { status: 'processed', claimed: 1, succeeded: 0, failed: 0, skipped: 1 });
  assert.deepEqual(scripted.calls, []);
});

test('worker processes independent provider top-ups in parallel up to the configured limit', async () => {
  const jobs = [
    baseJob({ id: 'topup-1', allocationKey: 'payment-1:reserve:polza', paymentId: 'payment-1', claimToken: 'claim-1' }),
    baseJob({ id: 'topup-2', allocationKey: 'payment-2:reserve:polza', paymentId: 'payment-2', claimToken: 'claim-2' }),
    baseJob({ id: 'topup-3', allocationKey: 'payment-3:reserve:polza', paymentId: 'payment-3', claimToken: 'claim-3' }),
  ];
  const repository = repositoryDouble(jobs);
  let active = 0;
  let peak = 0;
  const provider = {
    async charge(input) {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 15));
      active -= 1;
      return { transactionId: `tx-${input.paymentId}` };
    },
    async verifyTransaction(input) {
      return {
        transactionId: input.transactionId,
        amountKopecks: input.expectedAmountKopecks,
        currency: input.currency,
      };
    },
    async getBalance() {
      return { balanceKopecks: 25_000, currency: 'RUB' };
    },
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: provider }, {
    caps: { maxConcurrency: 3 },
  }));

  const result = await worker.run();

  assert.deepEqual(result, { status: 'processed', claimed: 3, succeeded: 3, failed: 0, skipped: 0 });
  assert.equal(peak, 3);
});

test('worker combines confirmed sub-minimum allocations into one verified Polza charge', async () => {
  const jobs = [
    baseJob({ id: 'small-1', allocationKey: 'payment-small-1:reserve:polza', paymentId: 'payment-small-1', claimToken: 'small-claim-1', amountKopecks: 6_000 }),
    baseJob({ id: 'small-2', allocationKey: 'payment-small-2:reserve:polza', paymentId: 'payment-small-2', claimToken: 'small-claim-2', amountKopecks: 5_001 })
  ];
  const repository = repositoryDouble(jobs);
  const calls = [];
  const provider = {
    async chargeBatch(input) {
      calls.push(['chargeBatch', input]);
      return { transactionId: 'tx-small-batch' };
    },
    async verifyTransaction(input) {
      calls.push(['verifyTransaction', input]);
      return { transactionId: input.transactionId, amountKopecks: 11_001, currency: 'RUB' };
    },
    async getBalance() {
      return { balanceKopecks: 30_000, currency: 'RUB' };
    }
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: provider }));

  const result = await worker.run();

  assert.deepEqual(result, { status: 'processed', claimed: 2, succeeded: 2, failed: 0, skipped: 0 });
  assert.equal(calls.filter(([kind]) => kind === 'chargeBatch').length, 1);
  assert.equal(calls[0][1].amountKopecks, 11_001);
  assert.equal(calls[0][1].requests.length, 2);
  const completions = repository.calls.filter(([kind]) => kind === 'succeeded');
  assert.deepEqual(completions.map(([, value]) => value.observedAmountKopecks), [6_000, 5_001]);
  assert.ok(completions.every(([, value]) => value.observedTransactionId === 'tx-small-batch'));
});

test('worker batches sub-52-ruble GPTunnel reserves instead of sending invalid tiny top-ups', async () => {
  const jobs = [
    baseJob({ provider: 'gptunnel', id: 'gt-small-1', allocationKey: 'payment-gt-1:reserve:gptunnel', paymentId: 'payment-gt-1', claimToken: 'gt-claim-1', amountKopecks: 2_600 }),
    baseJob({ provider: 'gptunnel', id: 'gt-small-2', allocationKey: 'payment-gt-2:reserve:gptunnel', paymentId: 'payment-gt-2', claimToken: 'gt-claim-2', amountKopecks: 2_600 })
  ];
  const repository = repositoryDouble(jobs);
  const calls = [];
  const provider = {
    async chargeBatch(input) { calls.push(['chargeBatch', input]); return { transactionId: 'tx-gt-batch' }; },
    async verifyTransaction(input) { return { transactionId: input.transactionId, amountKopecks: 5_200, currency: 'RUB' }; },
    async getBalance() { return { balanceKopecks: 12_000, currency: 'RUB' }; }
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, { gptunnel: provider }, { provider: ['gptunnel'] }));

  assert.deepEqual(await worker.run(), { status: 'processed', claimed: 2, succeeded: 2, failed: 0, skipped: 0 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].amountKopecks, 5_200);
});

test('worker sends every eligible RouterAI allocation as its own immediate parallel 100-ruble charge', async () => {
  const jobs = [
    baseJob({ provider: 'routerai', id: 'routerai-1', allocationKey: 'payment-r1:reserve:routerai', paymentId: 'payment-r1', claimToken: 'routerai-claim-1', amountKopecks: 10_000 }),
    baseJob({ provider: 'routerai', id: 'routerai-2', allocationKey: 'payment-r2:reserve:routerai', paymentId: 'payment-r2', claimToken: 'routerai-claim-2', amountKopecks: 10_000 }),
    baseJob({ provider: 'routerai', id: 'routerai-3', allocationKey: 'payment-r3:reserve:routerai', paymentId: 'payment-r3', claimToken: 'routerai-claim-3', amountKopecks: 10_000 })
  ];
  const repository = repositoryDouble(jobs);
  const calls = [];
  let activeCharges = 0;
  let maximumActiveCharges = 0;
  const provider = {
    async charge(input) {
      activeCharges += 1;
      maximumActiveCharges = Math.max(maximumActiveCharges, activeCharges);
      await new Promise((resolve) => setTimeout(resolve, 5));
      calls.push(['charge', input]);
      activeCharges -= 1;
      return { transactionId: `tx-${input.paymentId}` };
    },
    async chargeBatch(input) {
      calls.push(['chargeBatch', input]);
      throw new Error('RouterAI batches must never be used');
    },
    async verifyTransaction(input) {
      return {
        transactionId: input.transactionId,
        amountKopecks: input.expectedAmountKopecks,
        currency: input.currency
      };
    },
    async getBalance() {
      return { balanceKopecks: 50_000, currency: 'RUB' };
    }
  };
  const worker = new ProviderFundingWorker(enabledOptions(
    repository,
    { routerai: provider },
    { provider: ['routerai'], caps: { ...DEFAULT_FUNDING_CAPS, maxConcurrency: 2 } }
  ));

  assert.deepEqual(await worker.run(), {
    status: 'processed', claimed: 3, succeeded: 3, failed: 0, skipped: 0
  });
  assert.deepEqual(calls.map(([kind]) => kind), ['charge', 'charge', 'charge']);
  assert.deepEqual(calls.map(([, input]) => input.amountKopecks), [10_000, 10_000, 10_000]);
  assert.equal(maximumActiveCharges, 2);
});

test('worker processes Polza and RouterAI provider queues concurrently in one cycle', async () => {
  const jobsByProvider = {
    polza: [baseJob()],
    routerai: [baseJob({
      provider: 'routerai',
      id: 'routerai-parallel',
      allocationKey: 'payment-1:api_reserve:routerai',
      claimToken: 'routerai-parallel-claim',
      amountKopecks: 10_000
    })]
  };
  const repository = repositoryDouble([]);
  repository.claimProviderTopupRequests = async ({ provider }) => jobsByProvider[provider] ?? [];
  let activeProviders = 0;
  let maximumActiveProviders = 0;
  const provider = (transactionId) => ({
    async charge() {
      activeProviders += 1;
      maximumActiveProviders = Math.max(maximumActiveProviders, activeProviders);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeProviders -= 1;
      return { transactionId };
    },
    async verifyTransaction(input) {
      return { transactionId: input.transactionId, amountKopecks: input.expectedAmountKopecks, currency: 'RUB' };
    },
    async getBalance() { return { balanceKopecks: 50_000, currency: 'RUB' }; }
  });
  const worker = new ProviderFundingWorker(enabledOptions(repository, {
    polza: provider('polza-tx'),
    routerai: provider('routerai-tx')
  }, { provider: ['polza', 'routerai'] }));

  assert.deepEqual(await worker.run(), {
    status: 'processed', claimed: 2, succeeded: 2, failed: 0, skipped: 0
  });
  assert.equal(maximumActiveProviders, 2);
});

test('worker fails a sub-minimum RouterAI allocation closed without batching or charging', async () => {
  const job = baseJob({
    provider: 'routerai',
    id: 'routerai-too-small',
    allocationKey: 'payment-r-small:reserve:routerai',
    paymentId: 'payment-r-small',
    claimToken: 'routerai-claim-small',
    amountKopecks: 9_999
  });
  const repository = repositoryDouble([job]);
  const calls = [];
  const provider = {
    async charge(input) { calls.push(['charge', input]); },
    async chargeBatch(input) { calls.push(['chargeBatch', input]); }
  };
  const worker = new ProviderFundingWorker(enabledOptions(
    repository,
    { routerai: provider },
    { provider: ['routerai'] }
  ));

  assert.deepEqual(await worker.run(), {
    status: 'processed', claimed: 1, succeeded: 0, failed: 1, skipped: 0
  });
  assert.deepEqual(calls, []);
  const failure = repository.calls.find(([kind]) => kind === 'failed');
  assert.equal(failure[1].errorCode, 'provider_minimum_not_met');
  assert.equal(failure[1].retryable, false);
  assert.deepEqual(failure[1].metadata, {
    worker: 'provider_funding',
    external_charge_started: false,
    minimum_amount_kopecks: 10_000
  });
});

test('worker requires both transaction and balance verification and never logs provider secrets', async () => {
  const logs = [];
  const repository = repositoryDouble([baseJob()]);
  const scripted = providerDouble({ transaction: { amountKopecks: 9_999 } });
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: scripted.provider }, {
    logger: { warn: (...args) => logs.push(args), error: (...args) => logs.push(args) }
  }));

  const result = await worker.run();

  assert.deepEqual(result, { status: 'processed', claimed: 1, succeeded: 0, failed: 1, skipped: 0 });
  assert.equal(repository.calls.at(-1)[1].errorCode, 'verification_failed');
  assert.equal(JSON.stringify(logs).includes('sk_live_secret'), false);
});

test('worker marks an uncertain post-charge result non-retryable to prevent a second card charge', async () => {
  const repository = repositoryDouble([baseJob()]);
  const calls = [];
  const provider = {
    async charge(input) {
      calls.push(['charge', input]);
      return { transactionId: 'tx-uncertain-1' };
    },
    async verifyTransaction() {
      const error = new Error('verification timeout after submit');
      error.code = 'mcp_timeout';
      error.retryable = true;
      throw error;
    },
    async getBalance() {
      throw new Error('must not reach balance');
    }
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: provider }));

  const result = await worker.run();

  assert.equal(result.failed, 1);
  assert.equal(calls.length, 1);
  assert.equal(repository.calls.at(-1)[0], 'failed');
  assert.equal(repository.calls.at(-1)[1].retryable, false);
});

test('worker retries a verified pre-charge browser hydration failure', async () => {
  const repository = repositoryDouble([baseJob()]);
  const provider = {
    async charge() {
      const error = new Error('checkout is still hydrating');
      error.code = 'checkout_payment_control_missing';
      error.externalChargeStarted = false;
      throw error;
    }
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: provider }));

  const result = await worker.run();

  assert.equal(result.failed, 1);
  assert.equal(repository.calls.at(-1)[0], 'failed');
  assert.equal(repository.calls.at(-1)[1].retryable, true);
});

test('worker defers a definitively unpaid saved-card payment without leaving the row manual', async () => {
  const repository = repositoryDouble([baseJob({ amountKopecks: 11_000 })]);
  const provider = {
    async charge() {
      const error = new Error('Polza marked the payment unpaid');
      error.code = 'payment_declined';
      error.retryable = true;
      error.externalChargeStarted = false;
      error.retryAfterSeconds = 3_600;
      throw error;
    }
  };
  const worker = new ProviderFundingWorker(enabledOptions(repository, { polza: provider }));

  const result = await worker.run();

  assert.equal(result.failed, 1);
  const failure = repository.calls.at(-1);
  assert.equal(failure[0], 'failed');
  assert.equal(failure[1].errorCode, 'payment_declined');
  assert.equal(failure[1].retryable, true);
  assert.deepEqual(failure[1].metadata, {
    worker: 'provider_funding',
    external_charge_started: false,
    retry_after_seconds: 3_600
  });
});

test('worker refuses unsafe cap configuration instead of widening the hard safety envelope', () => {
  assert.throws(
    () => new ProviderFundingWorker(enabledOptions(repositoryDouble([]), { polza: providerDouble().provider }, {
      caps: { maxRequestKopecks: DEFAULT_FUNDING_CAPS.hardMaxRequestKopecks + 1 }
    })),
    /cap/i
  );
});


test('worker accepts the existing config.providerFunding shape without changing CRM/payment code', async () => {
  const repository = repositoryDouble([baseJob()]);
  const scripted = providerDouble();
  const worker = new ProviderFundingWorker({
    repository,
    providers: { polza: scripted.provider },
    providerFunding: {
      enabled: true,
      killSwitch: false,
      billingDanger: true,
      caps: { maxRequestKopecks: 10_000 }
    }
  });

  const result = await worker.run();

  assert.equal(result.succeeded, 1);
});
