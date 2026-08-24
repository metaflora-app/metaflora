const HASH = /^0x[a-f0-9]{64}$/u;
const ORDER = /^mfc_[a-f0-9]{32}$/u;

function integer(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new TypeError(`${label} is invalid`);
  return number;
}

function normalizedJob(value) {
  const job = Object.freeze({
    ...value,
    amountUsdcMicros: integer(value.amountUsdcMicros, 'amount'),
    openrouterCreditMicrousd: integer(value.openrouterCreditMicrousd, 'OpenRouter credit'),
    openrouterUsdcMicros: integer(value.openrouterUsdcMicros, 'OpenRouter amount'),
    gasReserveUsdcMicros: integer(value.gasReserveUsdcMicros, 'gas reserve'),
    ownerUsdcMicros: integer(value.ownerUsdcMicros, 'owner amount')
  });
  if (!ORDER.test(String(job.orderId)) || !HASH.test(String(job.sourceTransactionHash))
    || job.currency !== 'USDC' || job.chain !== 'base'
    || job.openrouterCreditMicrousd < 5_000_000 || job.openrouterUsdcMicros < 5_250_000
    || job.gasReserveUsdcMicros < 10_000
    || job.openrouterUsdcMicros + job.gasReserveUsdcMicros + job.ownerUsdcMicros !== job.amountUsdcMicros) {
    throw new TypeError('Crypto USDC funding job is invalid');
  }
  return job;
}

function errorCode(error) {
  const value = String(error?.code ?? 'settlement_result_unknown');
  return /^[a-z][a-z0-9_]{1,63}$/u.test(value) ? value : 'settlement_result_unknown';
}

export class CryptoUsdcFundingWorker {
  constructor({ repository, connector, enabled = false, killSwitch = false, maxConcurrency = 8, leaseSeconds = 300 } = {}) {
    if (!repository?.claimCryptoUsdcFundingRequests) throw new TypeError('Crypto funding repository is required');
    if (!Number.isSafeInteger(maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 32) throw new RangeError('Crypto funding concurrency is invalid');
    this.repository = repository;
    this.connector = connector;
    this.enabled = enabled === true;
    this.killSwitch = killSwitch === true;
    this.maxConcurrency = maxConcurrency;
    this.leaseSeconds = leaseSeconds;
    this.inFlight = null;
  }

  async process(raw) {
    const job = normalizedJob(raw);
    const started = await this.repository.markCryptoUsdcFundingStarted({
      id: job.id, claimToken: job.claimToken,
      metadata: { worker: 'crypto_usdc_funding', barrier: 'before_external_effect' }
    });
    if (!started) return 'manual';
    try {
      if (!this.connector?.settleCryptoSale) throw Object.assign(new Error('connector unavailable'), { code: 'connector_unavailable' });
      const result = await this.connector.settleCryptoSale(job);
      const openrouterFunded = integer(result?.openrouterFundedUsdcMicros, 'funded amount');
      const ownerPaid = integer(result?.ownerPaidUsdcMicros, 'owner paid amount');
      const ownerHash = String(result?.ownerTransactionHash ?? '').toLowerCase();
      const openrouterId = String(result?.openrouterTransactionId ?? '').trim();
      if (openrouterFunded !== job.openrouterUsdcMicros || ownerPaid !== job.ownerUsdcMicros
        || !HASH.test(ownerHash) || !openrouterId || openrouterId.length > 180) {
        throw Object.assign(new Error('settlement verification mismatch'), { code: 'verification_failed' });
      }
      const completed = await this.repository.markCryptoUsdcFundingCompleted({
        id: job.id, claimToken: job.claimToken,
        openrouterExternalId: openrouterId,
        openrouterFundedUsdcMicros: openrouterFunded,
        ownerTransactionHash: ownerHash,
        ownerPaidUsdcMicros: ownerPaid,
        metadata: { verification: 'openrouter_credit_and_owner_base_receipt' }
      });
      if (!completed) throw Object.assign(new Error('claim lost'), { code: 'claim_lost' });
      return 'completed';
    } catch (error) {
      await this.repository.markCryptoUsdcFundingManual({
        id: job.id, claimToken: job.claimToken, errorCode: errorCode(error),
        metadata: { worker: 'crypto_usdc_funding', automaticRetry: false }
      });
      return 'manual';
    }
  }

  async run() {
    if (!this.enabled || this.killSwitch) return { claimed: 0, completed: 0, manual: 0 };
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      const jobs = await this.repository.claimCryptoUsdcFundingRequests({ limit: this.maxConcurrency, leaseSeconds: this.leaseSeconds });
      const results = await Promise.all(jobs.map((job) => this.process(job)));
      return { claimed: jobs.length, completed: results.filter((value) => value === 'completed').length, manual: results.filter((value) => value === 'manual').length };
    })();
    try { return await this.inFlight; } finally { this.inFlight = null; }
  }
}
