const ACCOUNT_BY_CATEGORY = Object.freeze({
  gross: 'cash',
  payment_fee: 'payment_fee',
  api_reserve: 'api_reserve',
  referral_liability: 'referral_liability',
  owner_share: 'owner_share',
  refund: 'cash'
});

const ALLOWED_CATEGORIES = new Set(Object.keys(ACCOUNT_BY_CATEGORY));

function paymentId(value) {
  const normalized = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_.:-]{1,128}$/u.test(normalized)) {
    throw new TypeError('Wallet payment id is invalid.');
  }
  return normalized;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return value;
}

function currency(value) {
  const normalized = String(value ?? 'RUB').trim().toUpperCase();
  if (!/^[A-Z]{3}$/u.test(normalized)) throw new TypeError('Wallet currency is invalid.');
  return normalized;
}

function accountFor(category) {
  if (!ALLOWED_CATEGORIES.has(category)) throw new TypeError('Wallet allocation category is invalid.');
  return ACCOUNT_BY_CATEGORY[category];
}

/**
 * Turns the per-payment finance split into an idempotent wallet journal.
 * A payment is balanced: cash is credited, while fees, API reserve,
 * referral liability and the owner share are debited from the same wallet.
 */
export function walletEntriesForAllocations({
  externalPaymentId,
  telegramUserId = null,
  allocations
} = {}) {
  const paymentIdentifier = paymentId(externalPaymentId);
  if (!Array.isArray(allocations) || allocations.length === 0) {
    throw new TypeError('Wallet allocations are required.');
  }
  const entries = allocations.map((allocation) => {
    const allocationKey = String(allocation?.allocationKey ?? '').trim();
    if (!allocationKey) throw new TypeError('Wallet allocation key is required.');
    const category = String(allocation?.category ?? '').trim();
    const account = accountFor(category);
    const amountKopecks = positiveInteger(allocation?.amountKopecks, 'Wallet amount');
    const direction = category === 'gross' || category === 'refund' ? 'credit' : 'debit';
    return Object.freeze({
      entryKey: `${allocationKey}:wallet:${direction}`,
      externalPaymentId: paymentIdentifier,
      telegramUserId: telegramUserId === null || telegramUserId === undefined
        ? null
        : String(telegramUserId),
      allocationKey,
      account,
      category,
      provider: allocation?.provider ? String(allocation.provider).trim().toLowerCase() : null,
      direction,
      amountKopecks,
      currency: currency(allocation?.currency),
      source: String(allocation?.source ?? 'payment_webhook'),
      occurredAt: allocation?.occurredAt ?? null,
      metadata: Object.freeze({
        allocationKey,
        category,
        provider: allocation?.provider ? String(allocation.provider).trim().toLowerCase() : null
      })
    });
  });
  const signedTotal = entries.reduce(
    (total, entry) => total + (entry.direction === 'credit' ? entry.amountKopecks : -entry.amountKopecks),
    0
  );
  if (signedTotal !== 0) throw new Error('Wallet allocations do not reconcile.');
  return Object.freeze(entries);
}

export function summarizeWalletEntries(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Wallet entries must be an array.');
  const totals = {
    gross: 0,
    paymentFee: 0,
    apiReserve: 0,
    referralLiability: 0,
    ownerShare: 0
  };
  for (const entry of entries) {
    const amount = positiveInteger(entry?.amountKopecks, 'Wallet amount');
    const signed = entry.direction === 'credit' ? amount : -amount;
    if (entry.account === 'cash') totals.gross += signed;
    if (entry.account === 'payment_fee') totals.paymentFee += -signed;
    if (entry.account === 'api_reserve') totals.apiReserve += -signed;
    if (entry.account === 'referral_liability') totals.referralLiability += -signed;
    if (entry.account === 'owner_share') totals.ownerShare += -signed;
  }
  const allocated = totals.paymentFee + totals.apiReserve + totals.referralLiability + totals.ownerShare;
  const grossMargin = totals.gross - totals.paymentFee - totals.apiReserve;
  return Object.freeze({
    ...totals,
    grossMargin,
    grossMarginPercent: totals.gross > 0 ? (grossMargin / totals.gross) * 100 : 0,
    reconciled: totals.gross === allocated
  });
}

export const walletAccountByCategory = ACCOUNT_BY_CATEGORY;
