function asDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function calculateUserMetrics(
  users,
  { now = new Date(), activeWithinDays = 30 } = {},
) {
  const currentDate = asDate(now);
  if (!currentDate) throw new TypeError("now must be a valid date");
  if (!Number.isFinite(activeWithinDays) || activeWithinDays < 0) {
    throw new TypeError("activeWithinDays must be a non-negative number");
  }

  const activeAfter = currentDate.getTime() - activeWithinDays * 86_400_000;
  const monthStart = startOfUtcMonth(currentDate).getTime();
  const nextMonthStart = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth() + 1,
    1,
  );

  return users.reduce(
    (metrics, user) => {
      const lastActiveAt = asDate(user.lastActiveAt)?.getTime();
      const registeredAt = asDate(user.registeredAt)?.getTime();
      return {
        totalUsers: metrics.totalUsers + 1,
        activeUsers:
          metrics.activeUsers +
          (user.status === "active" &&
          lastActiveAt !== undefined &&
          lastActiveAt >= activeAfter &&
          lastActiveAt <= currentDate.getTime()
            ? 1
            : 0),
        blockedUsers: metrics.blockedUsers + (user.status === "blocked" ? 1 : 0),
        newUsersThisMonth:
          metrics.newUsersThisMonth +
          (registeredAt !== undefined &&
          registeredAt >= monthStart &&
          registeredAt < nextMonthStart
            ? 1
            : 0),
      };
    },
    {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      newUsersThisMonth: 0,
    },
  );
}

export function calculateLedgerMetrics(entries) {
  const settled = entries.filter(({ status = "settled" }) => status === "settled");
  const totalCredited = settled
    .filter(({ type }) => type === "credit")
    .reduce((total, { amount }) => total + Number(amount || 0), 0);
  const totalDebited = settled
    .filter(({ type }) => type === "debit")
    .reduce((total, { amount }) => total + Number(amount || 0), 0);

  return {
    totalCredited,
    totalDebited,
    metacoinInCirculation: totalCredited - totalDebited,
  };
}

export function calculateProviderMetrics(attempts) {
  if (attempts.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      successRate: 0,
      averageLatencyMs: 0,
    };
  }

  const successfulRequests = attempts.filter(
    ({ status }) => status === "success",
  ).length;
  const latencyTotal = attempts.reduce(
    (total, { latencyMs }) => total + Number(latencyMs || 0),
    0,
  );

  return {
    totalRequests: attempts.length,
    successfulRequests,
    successRate: Math.round((successfulRequests / attempts.length) * 10_000) / 100,
    averageLatencyMs: Math.round(latencyTotal / attempts.length),
  };
}

export function calculateDashboardMetrics(
  { users = [], ledgerEntries = [], providerAttempts = [] },
  options,
) {
  return {
    ...calculateUserMetrics(users, options),
    ...calculateLedgerMetrics(ledgerEntries),
    ...calculateProviderMetrics(providerAttempts),
  };
}
