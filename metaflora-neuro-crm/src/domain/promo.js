function invalid(reason) {
  return { valid: false, reason };
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toValidTime(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function validatePromo(
  promo,
  {
    code,
    userRedemptionCount = 0,
    purchaseAmount,
    plan,
    now = new Date(),
  },
) {
  const normalizedCode = String(code ?? "").trim().toUpperCase();
  if (!Number.isFinite(purchaseAmount) || purchaseAmount < 0) {
    return invalid("invalid_purchase");
  }
  if (
    !["percent", "fixed"].includes(promo.discountType) ||
    !Number.isFinite(promo.discountValue) ||
    promo.discountValue < 0 ||
    (promo.discountType === "percent" && promo.discountValue > 100)
  ) {
    return invalid("invalid_configuration");
  }
  const nowTime = toValidTime(now);
  if (nowTime === null) return invalid("invalid_date");
  const startsAt = promo.startsAt ? toValidTime(promo.startsAt) : null;
  const expiresAt = promo.expiresAt ? toValidTime(promo.expiresAt) : null;
  if (
    (promo.startsAt && startsAt === null) ||
    (promo.expiresAt && expiresAt === null) ||
    (startsAt !== null && expiresAt !== null && startsAt >= expiresAt)
  ) {
    return invalid("invalid_configuration");
  }
  if (normalizedCode !== String(promo.code ?? "").trim().toUpperCase()) {
    return invalid("code_mismatch");
  }
  if (!promo.active) return invalid("inactive");

  if (startsAt !== null && nowTime < startsAt) {
    return invalid("not_started");
  }
  if (expiresAt !== null && nowTime >= expiresAt) {
    return invalid("expired");
  }
  if (
    Number.isFinite(promo.maxRedemptions) &&
    promo.redemptionCount >= promo.maxRedemptions
  ) {
    return invalid("exhausted");
  }
  if (
    Number.isFinite(promo.perUserLimit) &&
    userRedemptionCount >= promo.perUserLimit
  ) {
    return invalid("user_limit");
  }
  if (purchaseAmount < (promo.minimumPurchase ?? 0)) {
    return invalid("minimum_purchase");
  }
  if (promo.allowedPlans?.length && !promo.allowedPlans.includes(plan)) {
    return invalid("plan_not_allowed");
  }

  const rawDiscount =
    promo.discountType === "percent"
      ? purchaseAmount * (promo.discountValue / 100)
      : promo.discountValue;
  const discountAmount = roundCurrency(
    Math.max(0, Math.min(purchaseAmount, rawDiscount)),
  );

  return {
    valid: true,
    normalizedCode,
    discountAmount,
    finalAmount: roundCurrency(purchaseAmount - discountAmount),
  };
}
