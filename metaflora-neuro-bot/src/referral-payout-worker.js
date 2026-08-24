const HARD_CAPS = Object.freeze({
  batchSize: 25,
  leaseSeconds: 900,
  attempts: 20,
  concurrency: 8,
  intervalMs: 600_000,
  payoutKopecks: 100_000_000
});

function positiveInteger(value, label, maximum) {
  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < 1 || normalized > maximum) {
    throw new RangeError(`${label} is invalid.`);
  }
  return normalized;
}

function boundedText(value, label, maximum = 180) {
  const normalized = String(value ?? '').replace(/\u0000/gu, '').trim();
  if (!normalized || normalized.length > maximum || /[\r\n]/u.test(normalized)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return normalized;
}

function normalizeJob(value) {
  if (!value || typeof value !== 'object') throw new TypeError('Payout job is invalid.');
  const job = Object.freeze({
    id: boundedText(value.id, 'payout job id'),
    withdrawalId: boundedText(value.withdrawalId, 'withdrawal id'),
    claimToken: boundedText(value.claimToken, 'claim token'),
    amountKopecks: positiveInteger(value.amountKopecks, 'payout amount', HARD_CAPS.payoutKopecks),
    currency: boundedText(value.currency, 'currency', 3).toUpperCase(),
    method: boundedText(value.method, 'payout method', 32).toLowerCase(),
    attemptCount: Number(value.attemptCount ?? 0),
    externalPayoutId: value.externalPayoutId
      ? boundedText(value.externalPayoutId, 'external payout id', 180)
      : null
  });
  if (job.currency !== 'RUB' || job.method !== 'sbp'
    || !Number.isSafeInteger(job.attemptCount) || job.attemptCount < 0) {
    throw new TypeError('Payout job is invalid.');
  }
  return job;
}

function safeErrorCode(error) {
  if (error?.name === 'TBankPayoutTimeoutError') return 'tbank_timeout';
  if (error?.name === 'TBankPayoutNetworkError') return 'tbank_network';
  if (error?.name === 'TBankPayoutApiError') {
    const code = String(error?.code ?? '').toLowerCase();
    return /^[a-z][a-z0-9_-]{0,47}$/u.test(code) ? `tbank_${code}` : 'tbank_provider_error';
  }
  const code = String(error?.code ?? '').toLowerCase();
  return /^[a-z][a-z0-9_-]{1,63}$/u.test(code) ? code : 'payout_result_unknown';
}

function isRetryable(error) {
  return error?.retryable === true
    || ['TBankPayoutTimeoutError', 'TBankPayoutNetworkError'].includes(error?.name)
    || (error?.name === 'TBankPayoutApiError' && Number(error?.status) >= 500);
}

function normalizeProviderStatus(value) {
  const status = String(value ?? '').toLowerCase();
  if (status === 'succeeded') return 'succeeded';
  if (['canceled', 'cancelled', 'failed'].includes(status)) return 'failed';
  return 'pending';
}

function observedPayout(response, fallback) {
  if (response?.amountKopecks !== undefined) {
    return Object.freeze({
      amountKopecks: positiveInteger(response.amountKopecks, 'observed payout amount', HARD_CAPS.payoutKopecks),
      currency: String(response.currency ?? fallback.currency).toUpperCase()
    });
  }
  if (response?.amount?.value !== undefined) {
    const rubles = Number.parseFloat(String(response.amount.value).replace(',', '.'));
    if (!Number.isFinite(rubles) || rubles <= 0) throw new TypeError('Observed payout amount is invalid.');
    return Object.freeze({
      amountKopecks: Math.round(rubles * 100),
      currency: String(response.amount.currency ?? fallback.currency).toUpperCase()
    });
  }
  throw new TypeError('Observed payout amount is unavailable.');
}

function summary(status) {
  return { status, claimed: 0, submitted: 0, completed: 0, retrying: 0, manual: 0, skipped: 0 };
}

function safeLog(logger, level, event, context = {}) {
  try {
    logger?.[level]?.(event, context);
  } catch {
    // Observability must never change payout state.
  }
}

async function parallelMap(items, concurrency, callback) {
  const laneCount = Math.min(items.length, concurrency);
  const runners = Array.from({ length: laneCount }, (_, lane) => items
    .filter((_item, index) => index % laneCount === lane)
    .reduce(async (pending, item) => [...await pending, await callback(item)], Promise.resolve([])));
  return (await Promise.all(runners)).flat();
}

export class ReferralPayoutWorker {
  constructor({
    repository,
    client,
    enabled = false,
    killSwitch = false,
    workerId = `referral-payout-${process.pid}`,
    maxBatchSize = 10,
    maxConcurrency = 3,
    leaseSeconds = 180,
    maxAttempts = 5,
    retryBaseMs = 60_000,
    intervalMs = 5_000,
    now = () => new Date(),
    logger = null
  } = {}) {
    if (!repository?.claimReferralPayoutJobs) throw new TypeError('Referral payout repository is required.');
    this.repository = repository;
    this.client = client;
    this.enabled = enabled === true;
    this.killSwitch = killSwitch === true;
    this.workerId = boundedText(workerId, 'worker id', 96);
    this.maxBatchSize = positiveInteger(maxBatchSize, 'batch size', HARD_CAPS.batchSize);
    this.maxConcurrency = positiveInteger(maxConcurrency, 'concurrency', HARD_CAPS.concurrency);
    this.leaseSeconds = positiveInteger(leaseSeconds, 'lease seconds', HARD_CAPS.leaseSeconds);
    this.maxAttempts = positiveInteger(maxAttempts, 'max attempts', HARD_CAPS.attempts);
    this.retryBaseMs = positiveInteger(retryBaseMs, 'retry base', 86_400_000);
    this.intervalMs = positiveInteger(intervalMs, 'interval', HARD_CAPS.intervalMs);
    this.now = now;
    this.logger = logger;
    this.timer = null;
    this.inFlight = null;
    this.lastCycleAt = null;
    this.lastCycleStatus = 'never_run';
  }

  isActive() {
    return this.enabled && !this.killSwitch && Boolean(
      this.client?.createPayout || this.client?.getPayout
    );
  }

  health() {
    const providerReady = Boolean(this.client?.createPayout || this.client?.getPayout)
      && !this.killSwitch;
    return Object.freeze({
      ok: this.enabled && providerReady,
      enabled: this.enabled,
      killSwitch: this.killSwitch,
      running: this.inFlight !== null,
      providerReady,
      lastCycleAt: this.lastCycleAt?.toISOString?.() ?? null,
      lastCycleStatus: this.lastCycleStatus
    });
  }

  retryAt(attemptCount) {
    const exponent = Math.min(Math.max(attemptCount, 0), 10);
    const delay = Math.min(86_400_000, this.retryBaseMs * (2 ** exponent));
    return new Date(this.now().valueOf() + delay);
  }

  async markManual(job, errorCode) {
    await this.repository.markReferralPayoutManual?.({
      id: job.id,
      withdrawalId: job.withdrawalId,
      claimToken: job.claimToken,
      errorCode,
      automaticRetry: false,
      metadata: { worker: 'referral_payout', reconciliation: 'required' }
    });
    return 'manual';
  }

  async markRetry(job, error, externalEffectStarted) {
    if (externalEffectStarted && !job.externalPayoutId) {
      const providerCode = safeErrorCode(error);
      const unknownCode = `${providerCode}_unknown`.slice(0, 64);
      return this.markManual(job, unknownCode);
    }
    const retryable = isRetryable(error);
    if (!retryable || job.attemptCount >= this.maxAttempts) {
      return this.markManual(job, safeErrorCode(error));
    }
    await this.repository.markReferralPayoutRetry?.({
      id: job.id,
      withdrawalId: job.withdrawalId,
      claimToken: job.claimToken,
      errorCode: safeErrorCode(error),
      retryAt: this.retryAt(job.attemptCount),
      externalEffectStarted,
      metadata: { worker: 'referral_payout', automaticRetry: true }
    });
    return 'retrying';
  }

  async complete(job, response) {
    const observed = observedPayout(response, job);
    if (observed.amountKopecks !== job.amountKopecks || observed.currency !== job.currency) {
      return this.markManual(job, 'payout_verification_failed');
    }
    const completed = await this.repository.markReferralPayoutCompleted?.({
      id: job.id,
      withdrawalId: job.withdrawalId,
      claimToken: job.claimToken,
      externalPayoutId: boundedText(response?.id ?? job.externalPayoutId, 'external payout id'),
      observedAmountKopecks: observed.amountKopecks,
      observedCurrency: observed.currency,
      payoutFeeKopecks: Number.isSafeInteger(response?.payoutFeeKopecks)
        ? response.payoutFeeKopecks
        : null,
      metadata: { worker: 'referral_payout', verification: 'provider_status_and_amount' }
    });
    return completed ? 'completed' : 'manual';
  }

  async processJob(rawJob) {
    let job;
    try {
      job = normalizeJob(rawJob);
    } catch {
      const fallback = {
        id: String(rawJob?.id ?? ''),
        withdrawalId: String(rawJob?.withdrawalId ?? ''),
        claimToken: String(rawJob?.claimToken ?? '')
      };
      await this.repository.markReferralPayoutManual?.({
        ...fallback,
        errorCode: 'invalid_payout_claim',
        automaticRetry: false,
        metadata: { worker: 'referral_payout', reconciliation: 'required' }
      });
      safeLog(this.logger, 'warn', 'referral_payout_invalid_claim', { errorCode: 'invalid_payout_claim' });
      return 'manual';
    }
    if (job.attemptCount >= this.maxAttempts) return this.markManual(job, 'payout_attempts_exhausted');

    if (job.externalPayoutId) {
      try {
        const response = await this.client.getPayout(job.externalPayoutId);
        const status = normalizeProviderStatus(response?.status);
        if (status === 'succeeded') return this.complete(job, response);
        if (status === 'failed') return this.markManual(job, 'provider_rejected');
        return this.markRetry(job, Object.assign(new Error('Provider payout is pending.'), {
          code: 'provider_pending', retryable: true
        }), true);
      } catch (error) {
        return this.markRetry(job, error, true);
      }
    }

    let externalEffectStarted = false;
    try {
      const started = await this.repository.markReferralPayoutStarted?.({
        id: job.id,
        withdrawalId: job.withdrawalId,
        claimToken: job.claimToken,
        idempotencyKey: `payout:${job.withdrawalId}`,
        metadata: { worker: 'referral_payout', barrier: 'before_external_effect' }
      });
      if (started === false) return 'skipped';
      const destination = await this.repository.getReferralPayoutDestination?.({
        id: job.id,
        withdrawalId: job.withdrawalId,
        claimToken: job.claimToken
      });
      if (!destination) return this.markManual(job, 'payout_destination_unavailable');
      externalEffectStarted = true;
      const response = await this.client.createPayout({
        idempotenceKey: `payout:${job.withdrawalId}`,
        amountKopecks: job.amountKopecks,
        method: job.method,
        phone: destination.phone,
        bankId: destination.bankId,
        description: 'партнёрское вознаграждение',
        metadata: { withdrawalId: job.withdrawalId }
      });
      const externalPayoutId = boundedText(response?.id, 'external payout id');
      const status = normalizeProviderStatus(response?.status);
      if (status === 'succeeded') return this.complete(job, { ...response, id: externalPayoutId });
      if (status === 'failed') return this.markManual(job, 'provider_rejected');
      const submitted = await this.repository.markReferralPayoutSubmitted?.({
        id: job.id,
        withdrawalId: job.withdrawalId,
        claimToken: job.claimToken,
        externalPayoutId,
        providerStatus: 'pending',
        metadata: { worker: 'referral_payout' }
      });
      return submitted === false ? 'manual' : 'submitted';
    } catch (error) {
      return this.markRetry(job, error, externalEffectStarted);
    }
  }

  async run() {
    if (!this.enabled) return summary('disabled');
    if (this.killSwitch) return summary('kill_switch');
    if (!this.isActive()) return summary('not_ready');
    let jobs;
    try {
      jobs = await this.repository.claimReferralPayoutJobs({
        limit: this.maxBatchSize,
        leaseSeconds: this.leaseSeconds,
        maxAttempts: this.maxAttempts
      });
    } catch {
      safeLog(this.logger, 'error', 'referral_payout_claim_failed', { errorCode: 'claim_failed' });
      return summary('claim_failed');
    }
    const claims = Array.isArray(jobs) ? jobs.slice(0, this.maxBatchSize) : [];
    const states = await parallelMap(claims, this.maxConcurrency, (job) => this.processJob(job));
    return {
      status: 'processed',
      claimed: claims.length,
      submitted: states.filter((state) => state === 'submitted').length,
      completed: states.filter((state) => state === 'completed').length,
      retrying: states.filter((state) => state === 'retrying').length,
      manual: states.filter((state) => state === 'manual').length,
      skipped: states.filter((state) => state === 'skipped').length
    };
  }

  async runOnce() {
    if (this.inFlight) return summary('already_running');
    const cycle = this.run();
    this.inFlight = cycle;
    try {
      const result = await cycle;
      this.lastCycleAt = this.now();
      this.lastCycleStatus = result.status;
      return result;
    } finally {
      this.inFlight = null;
    }
  }

  start({ runImmediately = true } = {}) {
    if (this.timer) return this;
    if (runImmediately) void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), this.intervalMs);
    this.timer.unref?.();
    return this;
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.inFlight) await this.inFlight;
  }
}
