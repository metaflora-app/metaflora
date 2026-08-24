function result(response) {
  if (response?.error) throw new Error('Referral payout database operation failed.');
  return response?.data;
}

function boundedText(value, label, maximum = 180) {
  const normalized = String(value ?? '').replace(/\u0000/gu, '').trim();
  if (!normalized || normalized.length > maximum || /[\r\n]/u.test(normalized)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return normalized;
}

function positiveInteger(value, label, maximum = Number.MAX_SAFE_INTEGER) {
  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < 1 || normalized > maximum) {
    throw new TypeError(`${label} is invalid.`);
  }
  return normalized;
}

function claimDto(row) {
  return Object.freeze({
    id: boundedText(row?.withdrawal_id, 'payout id'),
    withdrawalId: boundedText(row?.withdrawal_id, 'withdrawal id'),
    claimToken: boundedText(row?.claim_token, 'claim token'),
    userId: boundedText(row?.user_id, 'payout user id'),
    amountKopecks: positiveInteger(row?.amount_kopecks, 'payout amount', 100_000_000),
    currency: 'RUB',
    method: boundedText(row?.payout_method, 'payout method', 32).toLowerCase(),
    destinationHint: String(row?.destination_hint ?? '').slice(0, 120),
    attemptCount: Number(row?.attempt_count ?? 0),
    externalPayoutId: row?.external_payout_id
      ? boundedText(row.external_payout_id, 'external payout id')
      : null,
    leaseUntil: boundedText(row?.lease_until, 'lease expiry', 40)
  });
}

function identity(value) {
  return Object.freeze({
    withdrawalId: boundedText(value?.withdrawalId, 'withdrawal id'),
    claimToken: boundedText(value?.claimToken, 'claim token')
  });
}

export class SupabaseReferralPayoutQueue {
  constructor({ client, workerId, decodeDestination } = {}) {
    if (!client?.rpc) throw new TypeError('Supabase client is required.');
    if (typeof decodeDestination !== 'function') throw new TypeError('Payout destination decoder is required.');
    this.client = client;
    this.workerId = boundedText(workerId, 'worker id', 96);
    this.decodeDestination = decodeDestination;
    this.claimedDestinations = new Map();
  }

  destinationKey({ withdrawalId, claimToken }) {
    return `${withdrawalId}:${claimToken}`;
  }

  forgetDestination(value) {
    const key = this.destinationKey(value);
    this.claimedDestinations = new Map(
      [...this.claimedDestinations].filter(([candidate]) => candidate !== key)
    );
  }

  async claimReferralPayoutJobs({ limit = 10, leaseSeconds = 180 } = {}) {
    const payoutLimit = positiveInteger(limit, 'payout claim limit', 25);
    const lease = positiveInteger(leaseSeconds, 'payout lease', 3_600);
    const rows = result(await this.client.rpc('claim_referral_payouts_v2', {
      p_worker_id: this.workerId,
      p_limit: payoutLimit,
      p_lease_seconds: lease
    }));
    const claims = Array.isArray(rows) ? rows : [];
    const nextDestinations = new Map();
    const jobs = claims.map((row) => {
      const job = claimDto(row);
      nextDestinations.set(this.destinationKey(job), row.destination_encrypted);
      return job;
    });
    this.claimedDestinations = nextDestinations;
    return Object.freeze(jobs);
  }

  async getReferralPayoutDestination(value) {
    const key = identity(value);
    const encrypted = this.claimedDestinations.get(this.destinationKey(key));
    if (!encrypted) return null;
    const destination = await this.decodeDestination(encrypted);
    if (!destination || typeof destination !== 'object') return null;
    return Object.freeze({
      phone: boundedText(destination.phone, 'payout phone', 24),
      bankId: boundedText(destination.bankId, 'payout bank id', 64)
    });
  }

  async markReferralPayoutStarted() {
    // claim_referral_payouts_v2 atomically moves the row into processing and
    // establishes the claim-token/lease barrier before any external effect.
    return true;
  }

  async markReferralPayoutSubmitted(value) {
    const key = identity(value);
    return Boolean(result(await this.client.rpc('record_referral_payout_submission_v2', {
      p_withdrawal_id: key.withdrawalId,
      p_claim_token: key.claimToken,
      p_external_payout_id: boundedText(value.externalPayoutId, 'external payout id'),
      p_provider_status: boundedText(value.providerStatus, 'provider status', 32)
    })));
  }

  async markReferralPayoutCompleted(value) {
    const key = identity(value);
    const fee = value.payoutFeeKopecks === null || value.payoutFeeKopecks === undefined
      ? null
      : Number(value.payoutFeeKopecks);
    if (fee !== null && (!Number.isSafeInteger(fee) || fee < 0)) {
      throw new TypeError('Payout fee is invalid.');
    }
    const completed = Boolean(result(await this.client.rpc('complete_referral_payout_v2', {
      p_withdrawal_id: key.withdrawalId,
      p_claim_token: key.claimToken,
      p_external_payout_id: boundedText(value.externalPayoutId, 'external payout id'),
      p_payout_fee_kopecks: fee
    })));
    if (completed) this.forgetDestination(key);
    return completed;
  }

  async reconcileTBankNotification(payload, tbankClient) {
    if (typeof tbankClient?.verifyNotification !== 'function') {
      throw new TypeError('T-Business notification verifier is required.');
    }
    const notification = tbankClient.verifyNotification(payload);
    const reconciled = Boolean(result(await this.client.rpc('reconcile_referral_payout_notification_v2', {
      p_withdrawal_id: boundedText(notification.withdrawalId, 'withdrawal id'),
      p_external_payout_id: boundedText(notification.id, 'external payout id'),
      p_amount_kopecks: positiveInteger(notification.amountKopecks, 'payout amount', 100_000_000),
      p_provider_status: boundedText(notification.status, 'provider status', 32),
      p_error_code: notification.errorCode
        ? boundedText(notification.errorCode, 'payout error code', 64)
        : null
    })));
    if (!reconciled) throw new Error('T-Business payout notification was not reconciled.');
    return notification;
  }

  async fail(value, retryable) {
    const key = identity(value);
    const failed = Boolean(result(await this.client.rpc('fail_referral_payout_v2', {
      p_withdrawal_id: key.withdrawalId,
      p_claim_token: key.claimToken,
      p_error_code: boundedText(value.errorCode, 'payout error code', 64),
      p_retryable: retryable
    })));
    if (failed) this.forgetDestination(key);
    return failed;
  }

  markReferralPayoutRetry(value) {
    return this.fail(value, true);
  }

  markReferralPayoutManual(value) {
    const key = identity(value);
    return this.client.rpc('manual_referral_payout_v2', {
      p_withdrawal_id: key.withdrawalId,
      p_claim_token: key.claimToken,
      p_error_code: boundedText(value.errorCode, 'payout error code', 64)
    }).then((response) => {
      const marked = Boolean(result(response));
      if (marked) this.forgetDestination(key);
      return marked;
    });
  }
}
