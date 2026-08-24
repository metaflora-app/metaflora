function positiveLimit(value) {
  if (value === undefined) return 20;
  if (!Number.isSafeInteger(value) || value < 1 || value > 100) throw new TypeError('payout limit is invalid.');
  return value;
}

function errorCode(error) {
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599) {
    return `yookassa_http_${error.status}`;
  }
  if (error?.name === 'YooKassaTimeoutError') return 'yookassa_timeout';
  if (error?.name === 'YooKassaNetworkError') return 'yookassa_network';
  if (error?.name === 'TBankPayoutTimeoutError') return 'tbank_timeout';
  if (error?.name === 'TBankPayoutNetworkError') return 'tbank_network';
  if (error?.name === 'TBankPayoutApiError') return `tbank_${String(error.code ?? 'provider_error').slice(0, 48)}`;
  return 'payout_provider_error';
}

function payoutStatus(value) {
  const status = String(value ?? '').toLowerCase();
  if (status === 'succeeded') return 'succeeded';
  if (['canceled', 'cancelled'].includes(status)) return 'canceled';
  if (['pending', 'waiting_for_capture', 'processing'].includes(status)) return 'pending';
  return 'failed';
}

function payoutAmountKopecks(value) {
  const amount = Number.parseFloat(String(value?.value ?? '').replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

export function createPayoutService({
  client,
  referralService,
  enabled = false,
  now = () => new Date(),
  onPayoutChanged = () => {},
  maxAttempts = 5,
  retryBaseMs = 60_000
} = {}) {
  if (!referralService?.listPendingWithdrawals) throw new TypeError('Referral service is required.');
  if (enabled && !client?.createPayout && !client?.getPayout && !client?.verifyNotification) throw new TypeError('Payout client is required.');
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) throw new TypeError('max attempts is invalid.');
  if (!Number.isSafeInteger(retryBaseMs) || retryBaseMs < 1_000 || retryBaseMs > 86_400_000) throw new TypeError('retry base is invalid.');
  const activeWithdrawals = new Set();

  function retryDue(withdrawal) {
    if (!withdrawal.lastPayoutAttemptAt || withdrawal.payoutAttempts < 1) return true;
    const attemptedAt = new Date(withdrawal.lastPayoutAttemptAt).valueOf();
    if (!Number.isFinite(attemptedAt)) return true;
    const delay = Math.min(86_400_000, retryBaseMs * (2 ** Math.min(withdrawal.payoutAttempts - 1, 10)));
    return now().valueOf() >= attemptedAt + delay;
  }

  async function markResult(withdrawal, response, status) {
    const normalizedStatus = payoutStatus(status ?? response?.status);
    const payload = {
      withdrawalId: withdrawal.withdrawalId,
      telegramUserId: withdrawal.telegramId,
      amountKopecks: withdrawal.amountKopecks,
      method: withdrawal.method,
      destinationHint: withdrawal.destinationHint,
      externalPayoutId: String(response?.id ?? withdrawal.externalPayoutId ?? ''),
      status: normalizedStatus,
      payoutStatus: normalizedStatus,
      payoutFeeKopecks: payoutAmountKopecks(response?.payout_fee ?? response?.fee),
      processedAt: now()
    };
    await referralService.markWithdrawalPayoutResult?.(payload);
    await onPayoutChanged(payload);
    return payload;
  }

  async function processPendingWithdrawals(limit) {
    const withdrawals = referralService.listPendingWithdrawals(positiveLimit(limit));
    const result = { submitted: 0, completed: 0, failed: 0, skipped: 0, manual: 0 };
    if (!enabled || !client) {
      result.skipped = withdrawals.length;
      delete result.manual;
      return Object.freeze(result);
    }
    for (const withdrawal of withdrawals) {
      if (activeWithdrawals.has(withdrawal.withdrawalId)) {
        result.skipped += 1;
        continue;
      }
      if (withdrawal.payoutAttempts >= maxAttempts) {
        const payload = {
          withdrawalId: withdrawal.withdrawalId,
          telegramUserId: withdrawal.telegramId,
          amountKopecks: withdrawal.amountKopecks,
          method: withdrawal.method,
          destinationHint: withdrawal.destinationHint,
          status: 'manual_review',
          payoutStatus: 'manual_review',
          errorCode: 'payout_attempts_exhausted',
          attemptedAt: now()
        };
        await referralService.markWithdrawalForManualReview?.(payload);
        await onPayoutChanged(payload);
        result.manual += 1;
        continue;
      }
      if (!retryDue(withdrawal)) {
        result.skipped += 1;
        continue;
      }
      activeWithdrawals.add(withdrawal.withdrawalId);
      try {
        let response;
        if (withdrawal.externalPayoutId) {
          if (!client.getPayout) {
            result.skipped += 1;
            continue;
          }
          await referralService.markWithdrawalPayoutAttempt?.({
            withdrawalId: withdrawal.withdrawalId,
            attemptedAt: now()
          });
          response = await client.getPayout(withdrawal.externalPayoutId);
          const terminal = payoutStatus(response?.status);
          if (terminal === 'pending') {
            result.skipped += 1;
            continue;
          }
          await markResult(withdrawal, response, terminal);
          if (terminal === 'succeeded') result.completed += 1;
          else result.failed += 1;
          continue;
        }

        const current = await referralService.getWithdrawal?.(withdrawal.withdrawalId);
        if (current && current.status !== 'pending') {
          result.skipped += 1;
          continue;
        }
        const destination = await referralService.getWithdrawalPayoutData?.(withdrawal.withdrawalId);
        if (!destination || !client.createPayout) {
          result.skipped += 1;
          continue;
        }
        if (referralService.claimWithdrawalForPayout) {
          const claim = await referralService.claimWithdrawalForPayout({
            withdrawalId: withdrawal.withdrawalId,
            attemptedAt: now()
          });
          if (!claim) {
            result.skipped += 1;
            continue;
          }
        } else {
          await referralService.markWithdrawalPayoutAttempt?.({
            withdrawalId: withdrawal.withdrawalId,
            attemptedAt: now()
          });
        }
        response = await client.createPayout({
          idempotenceKey: `payout:${withdrawal.withdrawalId}`,
          amountKopecks: withdrawal.amountKopecks,
          method: withdrawal.method,
          payoutToken: destination.payoutToken,
          phone: destination.phone,
          bankId: destination.bankId,
          description: 'партнёрское вознаграждение',
          metadata: { withdrawalId: withdrawal.withdrawalId }
        });
        if (!response?.id) throw new Error('Payout provider returned no id.');
        await referralService.markWithdrawalPayoutSubmitted?.({
          withdrawalId: withdrawal.withdrawalId,
          externalPayoutId: String(response.id),
          payoutStatus: payoutStatus(response.status),
          submittedAt: now()
        });
        result.submitted += 1;
        if (payoutStatus(response.status) !== 'pending') {
          await markResult(withdrawal, response);
          if (payoutStatus(response.status) === 'succeeded') result.completed += 1;
          else result.failed += 1;
        }
      } catch (error) {
        result.failed += 1;
        const payload = {
          withdrawalId: withdrawal.withdrawalId,
          telegramUserId: withdrawal.telegramId,
          amountKopecks: withdrawal.amountKopecks,
          method: withdrawal.method,
          destinationHint: withdrawal.destinationHint,
          status: 'failed',
          payoutStatus: 'failed',
          errorCode: errorCode(error),
          attemptedAt: now()
        };
        await referralService.markWithdrawalPayoutResult?.(payload);
        await onPayoutChanged(payload);
      } finally {
        activeWithdrawals.delete(withdrawal.withdrawalId);
      }
    }
    if (result.manual === 0) delete result.manual;
    return Object.freeze(result);
  }

  async function processNotification(payload) {
    if (!client?.verifyNotification) throw new TypeError('Payout notification verification is unavailable.');
    const notification = client.verifyNotification(payload);
    const withdrawal = await referralService.getWithdrawal?.(notification.withdrawalId);
    if (!withdrawal) {
      const error = new Error('Withdrawal not found.');
      error.statusCode = 404;
      throw error;
    }
    if (withdrawal.amountKopecks !== notification.amountKopecks) {
      const error = new Error('Payout amount mismatch.');
      error.statusCode = 409;
      throw error;
    }
    if (withdrawal.status !== 'pending') return Object.freeze({ status: 'ignored' });
    if (activeWithdrawals.has(withdrawal.withdrawalId)) return Object.freeze({ status: 'processing' });
    activeWithdrawals.add(withdrawal.withdrawalId);
    try {
      return await markResult(withdrawal, {
        id: notification.id,
        status: notification.status
      }, notification.status);
    } finally {
      activeWithdrawals.delete(withdrawal.withdrawalId);
    }
  }

  async function listSbpBanks() {
    if (!client?.getSbpBanks) return [];
    const response = await client.getSbpBanks();
    const rows = Array.isArray(response) ? response : response?.items;
    if (!Array.isArray(rows)) return [];
    return Object.freeze(rows.map((row) => Object.freeze({
      bankId: String(row.bank_id ?? row.bankId ?? '').slice(0, 64),
      name: String(row.name ?? row.bank_name ?? row.bankName ?? '').slice(0, 120)
    })).filter(({ bankId, name }) => bankId && name));
  }

  return Object.freeze({ processPendingWithdrawals, processNotification, listSbpBanks });
}
