function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetch implementation is required");
  }
  return fetchImpl;
}

async function readEnvelope(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success !== true) {
    throw new Error(body.error || `admin request failed: ${response.status}`);
  }
  return body.data;
}

function createIdempotencyKey(userId) {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return `crm.${userId}.${randomPart}`;
}

export async function loadAuthStatus(fetchImpl = globalThis.fetch) {
  const request = requireFetch(fetchImpl);
  const response = await request("/api/auth/status", {
    method: "GET",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  return readEnvelope(response);
}

export async function requestLoginCode(fetchImpl = globalThis.fetch) {
  const request = requireFetch(fetchImpl);
  const response = await request("/api/auth/request-code", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: "{}",
  });
  return readEnvelope(response);
}

export async function verifyLoginCode(
  challengeId,
  code,
  fetchImpl = globalThis.fetch,
) {
  const request = requireFetch(fetchImpl);
  const cleanChallengeId = String(challengeId ?? "").trim();
  const cleanCode = String(code ?? "").trim();
  if (!/^[A-Za-z0-9_-]{4,200}$/.test(cleanChallengeId)) {
    throw new TypeError("invalid challenge");
  }
  if (!/^\d{4,8}$/.test(cleanCode)) throw new TypeError("invalid code");
  const response = await request("/api/auth/verify", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ challengeId: cleanChallengeId, code: cleanCode }),
  });
  return readEnvelope(response);
}

export async function loadAdminSession(fetchImpl = globalThis.fetch) {
  const request = requireFetch(fetchImpl);
  const response = await request("/api/session", {
    method: "GET",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  const data = await readEnvelope(response);
  if (!data?.csrfToken) throw new Error("write session is unavailable");
  return Object.freeze({ csrfToken: String(data.csrfToken) });
}

export async function adjustMetacoinBalance(
  { userId, delta, reason },
  fetchImpl = globalThis.fetch,
) {
  const request = requireFetch(fetchImpl);
  const numericDelta = Number(delta);
  if (!Number.isSafeInteger(numericDelta) || numericDelta === 0) {
    throw new TypeError("delta must be a non-zero integer");
  }
  const cleanReason = String(reason ?? "").trim();
  if (cleanReason.length < 3 || cleanReason.length > 500) {
    throw new TypeError("reason must contain 3–500 characters");
  }

  const { csrfToken } = await loadAdminSession(request);
  const response = await request("/api/admin/metacoins/adjust", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      userId,
      direction: numericDelta > 0 ? "credit" : "debit",
      amount: Math.abs(numericDelta),
      reason: cleanReason,
      idempotencyKey: createIdempotencyKey(userId),
    }),
  });
  return readEnvelope(response);
}

export async function changeSubscription(
  { userId, planId, durationMonths = 1, reason },
  fetchImpl = globalThis.fetch,
) {
  const request = requireFetch(fetchImpl);
  const cleanPlanId = String(planId ?? "").trim().toLowerCase();
  if (!["newcomer", "amateur", "author", "researcher", "expert"].includes(cleanPlanId)) {
    throw new TypeError("invalid planId");
  }
  const months = Number(durationMonths);
  if (!Number.isInteger(months) || ![1, 3].includes(months)) {
    throw new TypeError("durationMonths must be 1 or 3");
  }
  const cleanReason = String(reason ?? "").trim();
  if (cleanReason.length < 3 || cleanReason.length > 500) {
    throw new TypeError("reason must contain 3–500 characters");
  }

  const { csrfToken } = await loadAdminSession(request);
  const response = await request("/api/admin/subscriptions/change", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      userId,
      planId: cleanPlanId,
      durationMonths: months,
      reason: cleanReason,
      idempotencyKey: createIdempotencyKey(userId),
    }),
  });
  return readEnvelope(response);
}

export async function loadUserDetails(userId, fetchImpl = globalThis.fetch) {
  const request = requireFetch(fetchImpl);
  const response = await request(
    `/api/users/${encodeURIComponent(userId)}/details`,
    {
      method: "GET",
      credentials: "same-origin",
      headers: { accept: "application/json" },
    },
  );
  return readEnvelope(response);
}

export async function probeProvider(
  providerId,
  fetchImpl = globalThis.fetch,
) {
  const request = requireFetch(fetchImpl);
  const cleanProviderId = String(providerId ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(cleanProviderId)) {
    throw new TypeError("invalid provider id");
  }
  const { csrfToken } = await loadAdminSession(request);
  const response = await request("/api/admin/providers/probe", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ providerId: cleanProviderId }),
  });
  return readEnvelope(response);
}

export async function createPromoCode(promo, fetchImpl = globalThis.fetch) {
  const request = requireFetch(fetchImpl);
  const { csrfToken } = await loadAdminSession(request);
  const response = await request("/api/admin/promos", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(promo),
  });
  await readEnvelope(response);
  const dashboardResponse = await request("/api/dashboard", {
    method: "GET",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  const dashboard = await readEnvelope(dashboardResponse);
  return Array.isArray(dashboard?.promos) ? dashboard.promos : [];
}

export async function deletePromoCode(promoId, fetchImpl = globalThis.fetch) {
  const request = requireFetch(fetchImpl);
  const cleanPromoId = String(promoId ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/u.test(cleanPromoId)) {
    throw new TypeError("invalid promo code");
  }
  const { csrfToken } = await loadAdminSession(request);
  const response = await request(`/api/admin/promos/${encodeURIComponent(cleanPromoId)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: "{}",
  });
  return readEnvelope(response);
}
