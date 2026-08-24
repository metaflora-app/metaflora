import { createHash } from 'node:crypto';

const HARD_CAPS = Object.freeze({
  hardMaxBatchRequests: 50,
  hardMaxBatchKopecks: 10_000_000,
  hardMaxRequestKopecks: 1_000_000,
  hardMaxConcurrency: 8,
  hardMaxLeaseSeconds: 3_600,
  hardMaxAttempts: 10
});

const POLZA_MINIMUM_CHARGE_KOPECKS = 10_000;
const GPTUNNEL_MINIMUM_CHARGE_KOPECKS = 5_200;
const ROUTERAI_MINIMUM_CHARGE_KOPECKS = 10_000;

function providerSupportsBatch(provider) {
  return provider !== 'routerai';
}

function providerConcurrency(provider, caps, routeraiMaxConcurrency) {
  return provider === 'routerai' ? routeraiMaxConcurrency : caps.maxConcurrency;
}

function minimumChargeKopecks(provider) {
  if (provider === 'polza') return POLZA_MINIMUM_CHARGE_KOPECKS;
  if (provider === 'gptunnel') return GPTUNNEL_MINIMUM_CHARGE_KOPECKS;
  if (provider === 'routerai') return ROUTERAI_MINIMUM_CHARGE_KOPECKS;
  return 1;
}

export const DEFAULT_FUNDING_CAPS = Object.freeze({
  maxBatchRequests: 10,
  maxBatchKopecks: 5_000_000,
  maxRequestKopecks: 1_000_000,
  maxConcurrency: 3,
  leaseSeconds: 300,
  maxAttempts: 5,
  hardMaxBatchRequests: HARD_CAPS.hardMaxBatchRequests,
  hardMaxBatchKopecks: HARD_CAPS.hardMaxBatchKopecks,
  hardMaxRequestKopecks: HARD_CAPS.hardMaxRequestKopecks,
  hardMaxLeaseSeconds: HARD_CAPS.hardMaxLeaseSeconds,
  hardMaxAttempts: HARD_CAPS.hardMaxAttempts
});

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`Invalid ${label}.`);
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new TypeError(`Invalid ${label}.`);
  return number;
}

function boundedText(value, label, maximum = 255) {
  const normalized = String(value ?? '').replace(/\u0000/g, '').trim();
  if (!normalized || normalized.length > maximum || /[\r\n]/u.test(normalized)) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return normalized;
}

function providerId(value) {
  const normalized = boundedText(value, 'provider', 64).toLowerCase();
  if (!/^[a-z][a-z0-9_-]{1,63}$/.test(normalized)) throw new TypeError('Invalid provider.');
  return normalized;
}

function currencyCode(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new TypeError('Invalid funding currency.');
  return normalized;
}

function safeErrorCode(error, fallback = 'provider_error') {
  const code = String(error?.code ?? '').trim().toLowerCase();
  if (/^[a-z][a-z0-9_-]{1,63}$/.test(code)) return code;
  if (error?.name === 'DirectChargeUnavailableError') return 'direct_charge_unavailable';
  if (error?.name === 'ProviderVerificationError') return 'verification_failed';
  return fallback;
}

function errorRetryable(error) {
  return error?.retryable === true || [
    'mcp_timeout',
    'rate_limited',
    'mcp_http_error',
    'provider_rate_limited',
    'payment_control_missing',
    'payment_method_required',
    'checkout_payment_control_missing'
  ].includes(error?.code);
}

function retryAfterSeconds(error) {
  const value = Number(error?.retryAfterSeconds);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return Math.min(value, 86_400);
}

function idempotencyKey(job) {
  const raw = `provider-topup:${job.provider}:${job.paymentId}:${job.allocationKey}`;
  if (raw.length <= 240) return raw;
  return `provider-topup:${job.provider}:${createHash('sha256').update(raw).digest('hex')}`;
}

function batchIdentity(jobs, provider) {
  const source = jobs
    .map((job) => `${job.provider}:${job.paymentId}:${job.allocationKey}:${job.amountKopecks}`)
    .sort()
    .join('|');
  const digest = createHash('sha256').update(source).digest('hex');
  return Object.freeze({
    batchId: `${provider}-batch-${digest.slice(0, 32)}`,
    idempotencyKey: `provider-topup-batch:${provider}:${digest}`
  });
}

function providerIds(value) {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0) throw new TypeError('At least one funding provider is required.');
  return Object.freeze([...new Set(values.map(providerId))]);
}

function normalizeCaps(overrides = {}) {
  const caps = { ...DEFAULT_FUNDING_CAPS, ...overrides };
  const limits = [
    ['maxBatchRequests', HARD_CAPS.hardMaxBatchRequests],
    ['maxBatchKopecks', HARD_CAPS.hardMaxBatchKopecks],
    ['maxRequestKopecks', HARD_CAPS.hardMaxRequestKopecks],
    ['maxConcurrency', HARD_CAPS.hardMaxConcurrency],
    ['leaseSeconds', HARD_CAPS.hardMaxLeaseSeconds],
    ['maxAttempts', HARD_CAPS.hardMaxAttempts]
  ];
  for (const [key, maximum] of limits) {
    const value = positiveInteger(caps[key], key);
    if (value > maximum) throw new RangeError(`${key} exceeds the safe cap.`);
    caps[key] = value;
  }
  if (caps.maxRequestKopecks > caps.maxBatchKopecks) {
    throw new RangeError('Request cap exceeds the batch cap.');
  }
  return Object.freeze(caps);
}

function normalizeJob(job) {
  if (!job || typeof job !== 'object') throw new TypeError('Provider topup claim is invalid.');
  const normalized = {
    id: boundedText(job.id, 'topup id'),
    allocationKey: boundedText(job.allocationKey, 'allocation key', 220),
    paymentId: boundedText(job.paymentId, 'payment id', 128),
    provider: providerId(job.provider),
    amountKopecks: positiveInteger(job.amountKopecks, 'topup amount'),
    currency: currencyCode(job.currency),
    claimToken: boundedText(job.claimToken, 'claim token', 128),
    attemptCount: nonNegativeInteger(job.attemptCount ?? 0, 'attempt count')
  };
  return Object.freeze(normalized);
}

function summary(status = 'processed') {
  return { status, claimed: 0, succeeded: 0, failed: 0, skipped: 0 };
}

async function processInParallel(items, concurrency, processItem) {
  if (items.length === 0) return [];
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      const results = [];
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results.push(await processItem(items[index], index));
      }
      return results;
    }
  );
  const batches = await Promise.all(workers);
  return batches.flat();
}

function safeLog(logger, level, event, context) {
  try {
    if (typeof logger?.[level] === 'function') logger[level](event, context);
  } catch {
    // Logging must never change funding state.
  }
}

function intervalMilliseconds(value) {
  const number = Number(value ?? 5_000);
  if (!Number.isSafeInteger(number) || number < 1_000 || number > 600_000) {
    throw new RangeError('Provider funding interval exceeds the safe cap.');
  }
  return number;
}

export class ProviderFundingWorker {
  constructor(options = {}) {
    const configured = options.providerFunding ?? options.config?.providerFunding ?? {};
    const repository = options.repository;
    const providers = options.providers ?? {};
    const provider = options.provider ?? configured.provider ?? 'polza';
    const enabled = options.enabled ?? configured.enabled ?? false;
    const killSwitch = options.killSwitch ?? configured.killSwitch ?? false;
    const billingDanger = options.billingDanger ?? configured.billingDanger;
    const billing = options.billing ?? (
      billingDanger === undefined ? {} : { danger: billingDanger }
    );
    const fundingReady = options.fundingReady ?? (
      billing?.danger === true || billingDanger === true
    );
    const caps = options.caps ?? configured.caps ?? {};
    const logger = options.logger ?? null;
    const intervalMs = options.intervalMs ?? configured.intervalMs ?? 5_000;
    if (!repository || typeof repository.claimProviderTopupRequests !== 'function') {
      throw new TypeError('Provider funding repository is required.');
    }
    this.repository = repository;
    this.providers = providers;
    this.providerIds = providerIds(provider);
    this.provider = this.providerIds[0];
    this.enabled = enabled === true;
    this.killSwitch = killSwitch === true;
    this.billingDanger = billing?.danger === true || billingDanger === true;
    this.fundingReady = fundingReady === true;
    this.providerReadiness = Object.freeze(Object.fromEntries(
      this.providerIds.map((id) => [id, this.fundingReady])
    ));
    this.caps = normalizeCaps(caps);
    this.routeraiMaxConcurrency = positiveInteger(
      options.routeraiMaxConcurrency
        ?? configured.routeraiMaxConcurrency
        ?? this.caps.maxConcurrency,
      'routeraiMaxConcurrency'
    );
    if (this.routeraiMaxConcurrency > HARD_CAPS.hardMaxConcurrency) {
      throw new RangeError('routeraiMaxConcurrency exceeds the safe cap.');
    }
    this.logger = logger;
    this.intervalMs = intervalMilliseconds(intervalMs);
    this.timer = null;
    this.inFlight = null;
  }

  isActive() {
    return this.enabled && !this.killSwitch
      && Object.values(this.providerReadiness).some((ready) => ready === true);
  }

  setFundingReady(value) {
    this.fundingReady = value === true;
    this.providerReadiness = Object.freeze(Object.fromEntries(
      this.providerIds.map((id) => [id, this.fundingReady])
    ));
    return this;
  }

  setProviderReady(provider, value) {
    const id = providerId(provider);
    if (!this.providerIds.includes(id)) throw new RangeError('Unknown funding provider.');
    this.providerReadiness = Object.freeze({ ...this.providerReadiness, [id]: value === true });
    this.fundingReady = Object.values(this.providerReadiness).some((ready) => ready === true);
    return this;
  }

  async markFailed(job, errorCode, retryable = false, metadata = {}) {
    if (typeof this.repository.markProviderTopupFailed !== 'function') return false;
    try {
      return Boolean(await this.repository.markProviderTopupFailed({
        id: job.id,
        claimToken: job.claimToken,
        errorCode,
        retryable,
        maxAttempts: this.caps.maxAttempts,
        metadata: { worker: 'provider_funding', ...metadata }
      }));
    } catch {
      safeLog(this.logger, 'error', 'provider_topup_state_update_failed', {
        provider: job.provider,
        allocationKey: job.allocationKey,
        paymentId: job.paymentId,
        errorCode: 'state_update_failed'
      });
      return false;
    }
  }

  async processJob(rawJob) {
    let job;
    try {
      job = normalizeJob(rawJob);
    } catch {
      return { failed: 1, skipped: 0 };
    }
    if (job.amountKopecks > this.caps.maxRequestKopecks) {
      await this.markFailed(job, 'amount_cap_exceeded', false);
      safeLog(this.logger, 'warn', 'provider_topup_rejected', {
        provider: job.provider,
        allocationKey: job.allocationKey,
        paymentId: job.paymentId,
        errorCode: 'amount_cap_exceeded'
      });
      return { failed: 1, skipped: 0 };
    }
    const provider = this.providers[job.provider];
    if (!provider || typeof provider.charge !== 'function') {
      await this.markFailed(job, 'provider_unavailable', false);
      return { failed: 1, skipped: 0 };
    }
    if (typeof this.repository.getProviderTopupRequest === 'function') {
      try {
        const existing = await this.repository.getProviderTopupRequest({
          allocationKey: job.allocationKey,
          paymentId: job.paymentId,
          provider: job.provider
        });
        if (existing?.status === 'succeeded') return { failed: 0, skipped: 1 };
        if (existing && (
          (existing.provider && existing.provider !== job.provider)
          || (existing.paymentId && existing.paymentId !== job.paymentId)
          || (existing.allocationKey && existing.allocationKey !== job.allocationKey)
          || (existing.amountKopecks !== undefined
            && Number(existing.amountKopecks) !== job.amountKopecks)
        )) {
          await this.markFailed(job, 'idempotency_conflict', false);
          return { failed: 1, skipped: 0 };
        }
      } catch {
        await this.markFailed(job, 'idempotency_lookup_failed', false);
        return { failed: 1, skipped: 0 };
      }
    }
    const key = idempotencyKey(job);
    let chargeStarted = false;
    try {
      if (typeof this.repository.markProviderTopupChargeStarted !== 'function') {
        throw Object.assign(new Error('charge start state method missing'), {
          code: 'state_update_failed',
          retryable: false
        });
      }
      const chargeStateMarked = await this.repository.markProviderTopupChargeStarted({
        id: job.id,
        claimToken: job.claimToken,
        idempotencyKey: key,
        metadata: { worker: 'provider_funding', chargeState: 'started_before_external_call' }
      });
      if (!chargeStateMarked) {
        throw Object.assign(new Error('charge start state was not recorded'), {
          code: 'state_update_failed',
          retryable: false
        });
      }
      chargeStarted = true;
      const charged = await provider.charge({
        provider: job.provider,
        allocationKey: job.allocationKey,
        paymentId: job.paymentId,
        amountKopecks: job.amountKopecks,
        currency: job.currency,
        idempotencyKey: key
      });
      const transactionId = String(charged?.transactionId ?? charged?.externalId ?? '').trim();
      if (!transactionId) throw Object.assign(new Error('transaction id missing'), {
        code: 'verification_failed',
        retryable: false
      });
      if (typeof provider.verifyTransaction !== 'function' || typeof provider.getBalance !== 'function') {
        throw Object.assign(new Error('verification methods missing'), {
          code: 'verification_failed',
          retryable: false
        });
      }
      const transaction = await provider.verifyTransaction({
        provider: job.provider,
        allocationKey: job.allocationKey,
        paymentId: job.paymentId,
        transactionId,
        expectedAmountKopecks: job.amountKopecks,
        currency: job.currency
      });
      const observedTransactionId = String(transaction?.transactionId ?? transaction?.id ?? '').trim();
      const observedAmountKopecks = Number(transaction?.amountKopecks);
      const observedCurrency = currencyCode(transaction?.currency ?? job.currency);
      if (observedTransactionId !== transactionId
        || observedCurrency !== job.currency
        || !Number.isSafeInteger(observedAmountKopecks)
        || observedAmountKopecks !== job.amountKopecks) {
        throw Object.assign(new Error('transaction verification mismatch'), {
          code: 'verification_failed',
          retryable: false
        });
      }
      const balance = await provider.getBalance({ provider: job.provider, currency: job.currency });
      const observedBalanceKopecks = Number(balance?.balanceKopecks);
      const balanceCurrency = currencyCode(balance?.currency ?? job.currency);
      if (balanceCurrency !== job.currency || !Number.isSafeInteger(observedBalanceKopecks)
        || observedBalanceKopecks < 0) {
        throw Object.assign(new Error('balance verification mismatch'), {
          code: 'verification_failed',
          retryable: false
        });
      }
      if (typeof this.repository.markProviderTopupSucceeded !== 'function') {
        throw Object.assign(new Error('completion method missing'), {
          code: 'state_update_failed',
          retryable: false
        });
      }
      const marked = await this.repository.markProviderTopupSucceeded({
        id: job.id,
        claimToken: job.claimToken,
        externalId: transactionId,
        observedTransactionId,
        observedAmountKopecks,
        observedBalanceKopecks,
        metadata: { verification: 'transaction_and_balance' }
      });
      if (!marked) throw Object.assign(new Error('claim lost'), {
        code: 'claim_lost',
        retryable: false
      });
      return { failed: 0, skipped: 0, succeeded: 1 };
    } catch (error) {
      const code = safeErrorCode(error);
      const prechargeFailure = error?.externalChargeStarted === false;
      const retryable = errorRetryable(error) && (!chargeStarted || prechargeFailure);
      const retryAfter = retryAfterSeconds(error);
      await this.markFailed(job, code, retryable, {
        ...(prechargeFailure ? { external_charge_started: false } : {}),
        ...(retryAfter ? { retry_after_seconds: retryAfter } : {})
      });
      safeLog(this.logger, 'warn', 'provider_topup_failed', {
        provider: job.provider,
        allocationKey: job.allocationKey,
        paymentId: job.paymentId,
        errorCode: code,
        ...(prechargeFailure ? { externalChargeStarted: false } : {}),
        ...(retryAfter ? { retryAfterSeconds: retryAfter } : {})
      });
      return { failed: 1, skipped: 0 };
    }
  }

  async processBatch(rawJobs, providerValue = this.provider) {
    const batchProvider = providerId(providerValue);
    let jobs;
    try {
      jobs = rawJobs.map(normalizeJob);
      if (jobs.some((job) => job.provider !== batchProvider)) {
        throw new TypeError('Provider topup batch mixes providers.');
      }
    } catch {
      return { failed: rawJobs.length, skipped: 0, succeeded: 0 };
    }
    if (!providerSupportsBatch(batchProvider)) {
      await Promise.all(jobs.map((job) => this.markFailed(job, 'provider_batch_forbidden', false, {
        external_charge_started: false
      })));
      return { failed: jobs.length, skipped: 0, succeeded: 0 };
    }
    const provider = this.providers[batchProvider];
    const amountKopecks = jobs.reduce((total, job) => total + job.amountKopecks, 0);
    if (jobs.length < 2 || amountKopecks < minimumChargeKopecks(batchProvider)
      || amountKopecks > this.caps.maxBatchKopecks || typeof provider?.chargeBatch !== 'function') {
      await Promise.all(jobs.map((job) => this.markFailed(job, 'provider_batch_unavailable', true, {
        external_charge_started: false
      })));
      return { failed: jobs.length, skipped: 0, succeeded: 0 };
    }
    const identity = batchIdentity(jobs, batchProvider);
    let externalChargeStarted = false;
    try {
      for (const job of jobs) {
        const marked = await this.repository.markProviderTopupChargeStarted({
          id: job.id,
          claimToken: job.claimToken,
          idempotencyKey: identity.idempotencyKey,
          metadata: {
            worker: 'provider_funding',
            chargeState: 'started_before_external_call',
            batchId: identity.batchId,
            batchAmountKopecks: amountKopecks,
            batchSize: jobs.length
          }
        });
        if (!marked) throw Object.assign(new Error('batch charge start state was not recorded'), {
          code: 'state_update_failed',
          retryable: false
        });
      }
      externalChargeStarted = true;
      const charged = await provider.chargeBatch({
        provider: batchProvider,
        batchId: identity.batchId,
        amountKopecks,
        currency: jobs[0].currency,
        idempotencyKey: identity.idempotencyKey,
        requests: jobs.map((job) => ({ ...job, idempotencyKey: idempotencyKey(job) }))
      });
      const transactionId = boundedText(charged?.transactionId ?? charged?.externalId, 'transaction id');
      const transaction = await provider.verifyTransaction({
        provider: batchProvider,
        transactionId,
        expectedAmountKopecks: amountKopecks,
        currency: jobs[0].currency
      });
      if (String(transaction?.transactionId ?? '') !== transactionId
        || Number(transaction?.amountKopecks) !== amountKopecks
        || currencyCode(transaction?.currency ?? jobs[0].currency) !== jobs[0].currency) {
        throw Object.assign(new Error('batch transaction verification mismatch'), {
          code: 'verification_failed',
          retryable: false
        });
      }
      const balance = await provider.getBalance({ provider: batchProvider, currency: jobs[0].currency });
      const observedBalanceKopecks = nonNegativeInteger(balance?.balanceKopecks, 'provider balance');
      const results = await Promise.all(jobs.map((job) => this.repository.markProviderTopupSucceeded({
        id: job.id,
        claimToken: job.claimToken,
        externalId: transactionId,
        observedTransactionId: transactionId,
        observedAmountKopecks: job.amountKopecks,
        observedBalanceKopecks,
        metadata: {
          verification: 'batched_transaction_and_balance',
          batchId: identity.batchId,
          batchAmountKopecks: amountKopecks,
          batchSize: jobs.length
        }
      })));
      if (results.some((result) => !result)) throw Object.assign(new Error('batch claim lost'), {
        code: 'claim_lost', retryable: false
      });
      return { failed: 0, skipped: 0, succeeded: jobs.length };
    } catch (error) {
      const code = safeErrorCode(error);
      const prechargeFailure = error?.externalChargeStarted === false || !externalChargeStarted;
      await Promise.all(jobs.map((job) => this.markFailed(
        job,
        code,
        errorRetryable(error) && prechargeFailure,
        { ...(prechargeFailure ? { external_charge_started: false } : {}), batchId: identity.batchId }
      )));
      return { failed: jobs.length, skipped: 0, succeeded: 0 };
    }
  }

  async runProvider(provider) {
    const claimed = await this.repository.claimProviderTopupRequests({
      provider,
      limit: this.caps.maxBatchRequests,
      leaseSeconds: this.caps.leaseSeconds,
      maxAttempts: this.caps.maxAttempts
    });
    const jobs = Array.isArray(claimed) ? claimed.slice(0, this.caps.maxBatchRequests) : [];
    let batchAmount = 0;
    const processableJobs = [];
    let batchRejected = 0;
    for (const rawJob of jobs) {
      let amount;
      try {
        amount = positiveInteger(rawJob?.amountKopecks, 'topup amount');
      } catch {
        batchRejected += 1;
        continue;
      }
      if (batchAmount + amount > this.caps.maxBatchKopecks) {
        try {
          const job = normalizeJob(rawJob);
          await this.markFailed(job, 'batch_cap_exceeded', false);
        } catch {
          safeLog(this.logger, 'warn', 'provider_topup_rejected', {
            provider,
            errorCode: 'batch_cap_exceeded'
          });
        }
        batchRejected += 1;
        continue;
      }
      batchAmount += amount;
      processableJobs.push(rawJob);
    }
    const minimumCharge = minimumChargeKopecks(provider);
    const smallJobs = processableJobs.filter((job) => Number(job?.amountKopecks) < minimumCharge);
    const individualJobs = processableJobs.filter((job) => Number(job?.amountKopecks) >= minimumCharge);
    const processed = await processInParallel(
      individualJobs,
      providerConcurrency(provider, this.caps, this.routeraiMaxConcurrency),
      (job) => this.processJob(job)
    );
    if (smallJobs.length > 0 && !providerSupportsBatch(provider)) {
      const rejected = await Promise.all(smallJobs.map(async (rawJob) => {
        try {
          const job = normalizeJob(rawJob);
          await this.markFailed(job, 'provider_minimum_not_met', false, {
            external_charge_started: false,
            minimum_amount_kopecks: minimumCharge
          });
        } catch {
          // Invalid claims are already accounted for as failed and never reach a provider.
        }
        return { failed: 1, skipped: 0, succeeded: 0 };
      }));
      processed.push(...rejected);
    } else if (smallJobs.length > 0) {
      processed.push(await this.processBatch(smallJobs, provider));
    }
    return {
      status: 'processed',
      claimed: jobs.length,
      succeeded: processed.reduce((total, item) => total + (item.succeeded ?? 0), 0),
      failed: batchRejected + processed.reduce((total, item) => total + (item.failed ?? 0), 0),
      skipped: processed.reduce((total, item) => total + (item.skipped ?? 0), 0)
    };
  }

  async run() {
    if (!this.isActive()) return summary('disabled');
    const readyProviders = this.providerIds.filter(
      (provider) => this.providerReadiness[provider] === true
    );
    const results = await Promise.all(readyProviders.map(async (provider) => {
      try {
        return await this.runProvider(provider);
      } catch {
        safeLog(this.logger, 'error', 'provider_funding_claim_failed', {
          provider,
          errorCode: 'claim_failed'
        });
        return summary('claim_failed');
      }
    }));
    return {
      status: 'processed',
      claimed: results.reduce((total, item) => total + item.claimed, 0),
      succeeded: results.reduce((total, item) => total + item.succeeded, 0),
      failed: results.reduce((total, item) => total + item.failed, 0),
      skipped: results.reduce((total, item) => total + item.skipped, 0)
    };
  }

  isRunning() {
    return this.timer !== null || this.inFlight !== null;
  }

  runOnce() {
    return this.run();
  }

  start({ intervalMs = this.intervalMs, runImmediately = true } = {}) {
    if (this.isRunning()) return this;
    this.intervalMs = intervalMilliseconds(intervalMs);
    if (runImmediately) this.scheduleRun();
    this.timer = setInterval(() => this.scheduleRun(), this.intervalMs);
    return this;
  }

  scheduleRun() {
    if (this.inFlight) return this.inFlight;
    const cycle = Promise.resolve().then(() => this.run());
    this.inFlight = cycle;
    cycle.catch(() => {
      safeLog(this.logger, 'error', 'provider_funding_cycle_failed', {
        provider: this.provider,
        errorCode: 'cycle_failed'
      });
    }).finally(() => {
      if (this.inFlight === cycle) this.inFlight = null;
    });
    return cycle;
  }

  async stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.inFlight) await this.inFlight;
    return this;
  }
}

export async function processProviderFunding(options) {
  return new ProviderFundingWorker(options).run();
}

export function createProviderFundingWorker(options) {
  return new ProviderFundingWorker(options);
}
