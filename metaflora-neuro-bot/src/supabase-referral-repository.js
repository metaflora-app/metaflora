export const SUPABASE_REFERRAL_BALANCE_CONTRACT = Object.freeze({
  authority: 'supabase',
  schema: 'neuro',
  ledgerTable: 'referral_ledger_entries',
  writeSurface: 'security_definer_rpcs',
  legacyRole: 'sqlite_backfill_only'
});

function telegramId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/u.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function boundedText(value, label, maximum = 128) {
  const normalized = String(value ?? '').replace(/\u0000/gu, '').trim();
  if (!normalized || normalized.length > maximum) throw new TypeError(`Invalid ${label}.`);
  return normalized;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`${label} must be a positive integer.`);
  return value;
}

function nonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer.`);
  return value;
}

function percentage(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 100) throw new TypeError('Invalid referral percent.');
  return value;
}

function timestamp(value, label) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new TypeError(`Invalid ${label}.`);
  return parsed.toISOString();
}

function metadata(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Invalid metadata.');
  return Object.freeze({ ...value });
}

function firstRow(result) {
  if (result?.error) throw result.error;
  const data = result?.data;
  return Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
}

export class SupabaseReferralRepository {
  constructor(client) {
    if (!client || typeof client.rpc !== 'function') throw new TypeError('A Supabase service-role client is required.');
    this.client = client;
  }

  async recordEarning({
    paymentKey,
    referrerTelegramId,
    referredTelegramId,
    grossAmountKopecks,
    paymentFeeKopecks = 0,
    apiLiabilityKopecks = 0,
    referralBonusLiabilityKopecks = 0,
    contributionAmountKopecks = grossAmountKopecks - paymentFeeKopecks - apiLiabilityKopecks,
    rewardAmountKopecks,
    ownerRemainderKopecks = contributionAmountKopecks - rewardAmountKopecks,
    inviteeBonusMetacoins = 0,
    inviterBonusMetacoins = 0,
    percent,
    availableAt,
    metadata: details = {}
  }) {
    return firstRow(await this.client.rpc('record_referral_earning_v2', {
      p_payment_key: boundedText(paymentKey, 'payment key', 160),
      p_referrer_telegram_id: telegramId(referrerTelegramId),
      p_referred_telegram_id: telegramId(referredTelegramId),
      p_gross_amount_kopecks: positiveInteger(grossAmountKopecks, 'grossAmountKopecks'),
      p_payment_fee_kopecks: nonNegativeInteger(paymentFeeKopecks, 'paymentFeeKopecks'),
      p_total_api_liability_kopecks: nonNegativeInteger(apiLiabilityKopecks, 'apiLiabilityKopecks'),
      p_referral_bonus_liability_kopecks: nonNegativeInteger(referralBonusLiabilityKopecks, 'referralBonusLiabilityKopecks'),
      p_contribution_amount_kopecks: nonNegativeInteger(contributionAmountKopecks, 'contributionAmountKopecks'),
      p_reward_amount_kopecks: nonNegativeInteger(rewardAmountKopecks, 'rewardAmountKopecks'),
      p_owner_remainder_kopecks: nonNegativeInteger(ownerRemainderKopecks, 'ownerRemainderKopecks'),
      p_invitee_bonus_metacoins: nonNegativeInteger(inviteeBonusMetacoins, 'inviteeBonusMetacoins'),
      p_inviter_bonus_metacoins: nonNegativeInteger(inviterBonusMetacoins, 'inviterBonusMetacoins'),
      p_percent: percentage(percent),
      p_available_at: timestamp(availableAt, 'availableAt'),
      p_metadata: metadata(details)
    }));
  }

  async releaseDueEarnings({ now = new Date(), limit = 500 } = {}) {
    return firstRow(await this.client.rpc('release_referral_earnings_v2', {
      p_now: timestamp(now, 'now'),
      p_limit: positiveInteger(limit, 'limit')
    }));
  }

  async bindRelation({ referredTelegramId, referrerTelegramId, referralCode, referredAt }) {
    return firstRow(await this.client.rpc('bind_referral_relation_v2', {
      p_referred_telegram_id: telegramId(referredTelegramId),
      p_referrer_telegram_id: telegramId(referrerTelegramId),
      p_referral_code: boundedText(referralCode, 'referral code', 80),
      p_referred_at: timestamp(referredAt, 'referredAt')
    }));
  }

  async reverseEarning({ paymentKey, reversalKey, reason, metadata: details = {} }) {
    return firstRow(await this.client.rpc('reverse_referral_earning_v2', {
      p_payment_key: boundedText(paymentKey, 'payment key', 160),
      p_reversal_key: boundedText(reversalKey, 'reversal key', 160),
      p_reason: boundedText(reason, 'reversal reason', 80),
      p_metadata: metadata(details)
    }));
  }

  async reserveWithdrawal({
    withdrawalId,
    telegramId: userTelegramId,
    amountKopecks,
    payoutMethod,
    destinationEncrypted,
    destinationHint,
    idempotencyKey
  }) {
    const method = boundedText(payoutMethod, 'payout method', 32);
    if (!['sbp', 'bank_card', 'bank_account'].includes(method)) throw new TypeError('Invalid payout method.');
    return firstRow(await this.client.rpc('reserve_referral_withdrawal_v2', {
      p_withdrawal_id: boundedText(withdrawalId, 'withdrawal id'),
      p_telegram_id: telegramId(userTelegramId),
      p_amount_kopecks: positiveInteger(amountKopecks, 'amountKopecks'),
      p_payout_method: method,
      p_destination_encrypted: boundedText(destinationEncrypted, 'encrypted destination', 8192),
      p_destination_hint: boundedText(destinationHint, 'destination hint', 64),
      p_idempotency_key: boundedText(idempotencyKey, 'idempotency key', 160)
    }));
  }

  async transitionWithdrawal({
    withdrawalId,
    expectedStatus,
    nextStatus,
    externalPayoutId = null,
    errorCode = null,
    payoutFeeKopecks = null
  }) {
    return firstRow(await this.client.rpc('transition_referral_withdrawal_v2', {
      p_withdrawal_id: boundedText(withdrawalId, 'withdrawal id'),
      p_expected_status: boundedText(expectedStatus, 'expected status', 32),
      p_next_status: boundedText(nextStatus, 'next status', 32),
      p_external_payout_id: externalPayoutId ? boundedText(externalPayoutId, 'external payout id', 160) : null,
      p_error_code: errorCode ? boundedText(errorCode, 'error code', 80) : null,
      p_payout_fee_kopecks: payoutFeeKopecks === null ? null : nonNegativeInteger(payoutFeeKopecks, 'payoutFeeKopecks')
    }));
  }

  async readAccount(telegramIdValue) {
    return firstRow(await this.client.rpc('get_referral_account_v2', {
      p_telegram_id: telegramId(telegramIdValue)
    }));
  }

  async listReferrals(telegramIdValue, limit = 50) {
    const normalizedLimit = Number.isSafeInteger(limit) ? limit : 50;
    if (normalizedLimit < 1 || normalizedLimit > 100) throw new TypeError('Invalid referral list limit.');
    const result = await this.client.rpc('list_referral_people_v2', {
      p_telegram_id: telegramId(telegramIdValue),
      p_limit: normalizedLimit
    });
    if (result?.error) throw result.error;
    return Object.freeze([...(result?.data ?? [])]);
  }

  async listEarnings(telegramIdValue, limit = 50) {
    const normalizedLimit = Number.isSafeInteger(limit) ? limit : 50;
    if (normalizedLimit < 1 || normalizedLimit > 100) throw new TypeError('Invalid earning list limit.');
    const result = await this.client.rpc('list_referral_earnings_v2', {
      p_telegram_id: telegramId(telegramIdValue),
      p_limit: normalizedLimit
    });
    if (result?.error) throw result.error;
    return Object.freeze([...(result?.data ?? [])]);
  }

  async getPartnerOnboarding(telegramIdValue) {
    const row = firstRow(await this.client.rpc('get_referral_partner_onboarding_v2', {
      p_telegram_id: telegramId(telegramIdValue)
    }));
    if (!row) return Object.freeze({ offerAccepted: false, profile: null, payoutEnabled: false });
    return Object.freeze({
      offerAccepted: Boolean(row.offer_version && row.offer_accepted_at),
      offerVersion: row.offer_version ?? null,
      offerAcceptedAt: row.offer_accepted_at ?? null,
      profile: row.legal_status ? Object.freeze({
        legalStatus: row.legal_status,
        innMasked: row.inn_masked ?? null,
        verificationStatus: row.verification_status
      }) : null,
      payoutEnabled: Boolean(row.payout_enabled)
    });
  }

  async acceptPartnerOffer({ telegramId: telegramIdValue, offerVersion, documentSha256, acceptedAt, telegramUpdateId = null, sourceEventId, metadata: details = {} }) {
    return firstRow(await this.client.rpc('accept_referral_offer_v2', {
      p_telegram_id: telegramId(telegramIdValue),
      p_offer_version: boundedText(offerVersion, 'offer version', 80),
      p_document_sha256: boundedText(documentSha256, 'document hash', 64),
      p_accepted_at: timestamp(acceptedAt, 'acceptedAt'),
      p_telegram_update_id: telegramUpdateId,
      p_source_event_id: boundedText(sourceEventId, 'source event id', 160),
      p_metadata: metadata(details)
    }));
  }

  async recordPartnerOfferOpen({ telegramId: telegramIdValue, offerVersion, documentSha256, openedAt, sourceEventId, metadata: details = {} }) {
    return firstRow(await this.client.rpc('record_referral_offer_open_v2', {
      p_telegram_id: telegramId(telegramIdValue),
      p_offer_version: boundedText(offerVersion, 'offer version', 80),
      p_document_sha256: boundedText(documentSha256, 'document hash', 64),
      p_opened_at: timestamp(openedAt, 'openedAt'),
      p_source_event_id: boundedText(sourceEventId, 'source event id', 160),
      p_metadata: metadata(details)
    }));
  }

  async upsertPartnerProfile({ telegramId: telegramIdValue, legalStatus, inn, fullName, metadata: details = {} }) {
    const status = boundedText(legalStatus, 'legal status', 32);
    if (!['self_employed', 'ip', 'legal_entity'].includes(status)) throw new TypeError('Invalid legal status.');
    const normalizedInn = boundedText(inn, 'INN', 12);
    if (!/^(?:\d{10}|\d{12})$/u.test(normalizedInn)) throw new TypeError('Invalid INN.');
    return firstRow(await this.client.rpc('upsert_referral_partner_profile_v2', {
      p_telegram_id: telegramId(telegramIdValue),
      p_legal_status: status,
      p_inn: normalizedInn,
      p_full_name: boundedText(fullName, 'full name', 200),
      p_metadata: metadata(details)
    }));
  }
}
