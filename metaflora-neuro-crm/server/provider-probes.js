import { getProviderConfiguration } from "./provider-config.js";

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_CACHE_TTL_MS = 60_000;

const PROBE_ENDPOINTS = Object.freeze({
  polza: "https://polza.ai/api/v1/balance",
  routerai: "https://routerai.ru/api/v1/credits",
});

const AUTH_HEADERS = Object.freeze({
  polza: (env) => ({ Authorization: `Bearer ${env.POLZA_API_KEY}` }),
});

const CREDENTIAL_VERIFIED_PROVIDERS = new Set([
  "polza",
]);

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function lowBalanceThreshold(env, providerId) {
  return numeric(env[`PROVIDER_LOW_BALANCE_${providerId.toUpperCase()}`]);
}

function createAlert(providerId, code, severity = "warning") {
  return Object.freeze({
    id: `${providerId}:${code}`,
    code,
    severity,
    label: code.replace(/^provider_/, "").replaceAll("_", " "),
  });
}

function classifyFailure(providerId, error, response) {
  if (error?.name === "AbortError") {
    return createAlert(providerId, "provider_timeout");
  }
  if (response?.status === 401 || response?.status === 403) {
    return createAlert(providerId, "provider_auth_failed", "critical");
  }
  if (response?.status === 402) {
    return createAlert(providerId, "provider_insufficient_credits", "critical");
  }
  if (response?.status === 429) {
    return createAlert(providerId, "provider_rate_limited");
  }
  if (response?.status >= 500) {
    return createAlert(providerId, "provider_5xx");
  }
  return createAlert(providerId, "provider_probe_failed");
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function polzaBalance(body) {
  const available = numeric(body?.amount);
  if (available === null) return null;
  return Object.freeze({
    available,
    limit: null,
    used: null,
    unit: "RUB",
  });
}

function extractBalance(providerId, body) {
  if (providerId === "polza") return polzaBalance(body);
  if (providerId === "routerai") {
    const total = numeric(body?.data?.total_credits ?? body?.total_credits);
    const used = numeric(body?.data?.total_usage ?? body?.total_usage);
    if (total !== null && used !== null) {
      return Object.freeze({
        available: Math.max(0, total - used),
        limit: total,
        used,
        unit: "RUB",
      });
    }
    const directBalance = numeric(body?.data?.balance ?? body?.balance ?? body?.data?.credits ?? body?.credits);
    if (directBalance !== null) {
      return Object.freeze({ available: directBalance, limit: null, used: null, unit: "RUB" });
    }
    const balanceKopecks = numeric(body?.data?.balanceKopecks ?? body?.balanceKopecks);
    if (balanceKopecks === null) return null;
    return Object.freeze({
      available: balanceKopecks / 100,
      limit: null,
      used: null,
      unit: String(body?.data?.currency ?? body?.currency ?? "RUB").toUpperCase(),
    });
  }
  return null;
}

function routerAiBalanceEndpoint(env) {
  const configured = String(env.ROUTERAI_BROWSER_CONNECTOR_URL ?? env.RAILWAY_SERVICE_METAFLORA_POLZA_FUNDING_AGENT_URL ?? "").trim().replace(/\/$/u, "");
  const hostOnlyName = configured.split(":", 1)[0];
  const raw = configured && !configured.includes("://")
    ? `${hostOnlyName.endsWith(".railway.internal") ? "http" : "https"}://${configured}`
    : configured;
  if (!raw) return null;
  try {
    const url = new URL(`${raw}/api/internal/provider-funding/balance`);
    if (url.protocol !== "https:" && !url.hostname.endsWith(".railway.internal")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function classifyBodyFailure() {
  return null;
}

function withLowBalanceAlert(provider, env, alerts) {
  const threshold = lowBalanceThreshold(env, provider.id);
  const lowBalance =
    provider.balance && threshold !== null
      ? provider.balance.available <= threshold
      : false;
  if (!lowBalance) return { lowBalance, alerts };
  return {
    lowBalance,
    alerts: [...alerts, createAlert(provider.id, "provider_low_balance")],
  };
}

export function createProviderProbeService({
  env = process.env,
  fetchImpl = fetch,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetch implementation is required.");
  }
  if (typeof nowMs !== "function") throw new TypeError("nowMs must be a function.");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) {
    throw new TypeError("timeoutMs must be between 100 and 30000 milliseconds.");
  }
  if (!Number.isFinite(cacheTtlMs) || cacheTtlMs < 0) {
    throw new TypeError("cacheTtlMs must be a non-negative number.");
  }
  let cachedSnapshot = null;
  let cacheExpiresAt = 0;
  let inFlightProbe = null;

  async function probeProvider(configuration) {
    const startedAt = nowMs();
    const base = {
      ...configuration,
      name: configuration.label,
      checkedAt: typeof now === "function" ? now() : new Date().toISOString(),
      probeStatus: configuration.probeSupported ? "pending" : "unsupported",
      health: configuration.configured ? "unknown" : "down",
      balance: null,
      lowBalance: false,
      alerts: [],
      probeLatencyMs: null,
    };

    if (!configuration.probeSupported) {
      return Object.freeze({ ...base, probeStatus: "unsupported" });
    }
    if (!configuration.configured && !configuration.balanceSupported) {
      return Object.freeze({
        ...base,
        probeStatus: "skipped",
        alerts: [createAlert(configuration.id, "provider_not_configured")],
      });
    }

    let response;
    try {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeout = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;
      try {
        const usesRouterAiVisualizationKey = configuration.id === "routerai"
          && Boolean(String(env.ROUTERAI_VISUALIZATION_API_KEY ?? "").trim());
        const routerAiEndpoint = configuration.id === "routerai" && !usesRouterAiVisualizationKey
          ? routerAiBalanceEndpoint(env)
          : null;
        response = await fetchImpl(
          usesRouterAiVisualizationKey ? PROBE_ENDPOINTS.routerai : (routerAiEndpoint ?? PROBE_ENDPOINTS[configuration.id]), {
          method: routerAiEndpoint ? "POST" : "GET",
          headers: {
            Accept: "application/json",
            ...(usesRouterAiVisualizationKey
              ? { Authorization: `Bearer ${env.ROUTERAI_VISUALIZATION_API_KEY}` }
              : routerAiEndpoint
              ? {
                  Authorization: `Bearer ${env.ROUTERAI_BROWSER_CONNECTOR_TOKEN ?? env.POLZA_BROWSER_CONNECTOR_TOKEN}`,
                  "Content-Type": "application/json",
                }
              : (AUTH_HEADERS[configuration.id]?.(env) ?? {})),
          },
          ...(routerAiEndpoint ? { body: JSON.stringify({ provider: "routerai" }) } : {}),
          signal: controller?.signal,
        });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    } catch (error) {
      const alert = classifyFailure(configuration.id, error, null);
      return Object.freeze({
        ...base,
        probeStatus: "failed",
        health: "down",
        alerts: [alert],
      });
    }

    if (!response.ok) {
      const alert = classifyFailure(configuration.id, null, response);
      return Object.freeze({
        ...base,
        probeStatus: "failed",
        health: "down",
        alerts: [alert],
      });
    }

    const body = await safeJson(response);
    const bodyFailure = classifyBodyFailure(configuration.id, body);
    if (bodyFailure) {
      return Object.freeze({
        ...base,
        probeStatus: "failed",
        health: "down",
        alerts: [bodyFailure],
        probeLatencyMs: Math.max(0, nowMs() - startedAt),
      });
    }
    const balance = extractBalance(configuration.id, body);
    if (configuration.balanceSupported && !balance) {
      return Object.freeze({
        ...base,
        probeStatus: "failed",
        health: "down",
        alerts: [
          createAlert(configuration.id, "provider_invalid_response", "critical"),
        ],
        probeLatencyMs: Math.max(0, nowMs() - startedAt),
      });
    }
    const balanceState = withLowBalanceAlert(
      { id: configuration.id, balance },
      env,
      [],
    );
    const credentialVerified = CREDENTIAL_VERIFIED_PROVIDERS.has(configuration.id)
      || configuration.id === "routerai";
    const alerts = credentialVerified
      ? balanceState.alerts
      : [
          ...balanceState.alerts,
          createAlert(configuration.id, "provider_auth_unverified"),
        ];
    return Object.freeze({
      ...base,
      probeStatus: credentialVerified ? "ok" : "reachable",
      health: credentialVerified
        ? balanceState.lowBalance
          ? "degraded"
          : "healthy"
        : "unknown",
      balance,
      lowBalance: balanceState.lowBalance,
      alerts,
      probeLatencyMs: Math.max(0, nowMs() - startedAt),
    });
  }

  return Object.freeze({
    async probeAll({ force = false } = {}) {
      const timestamp = nowMs();
      if (!force && cachedSnapshot && timestamp < cacheExpiresAt) {
        return cachedSnapshot;
      }
      if (inFlightProbe) return inFlightProbe;
      inFlightProbe = Promise.all(
        getProviderConfiguration(env)
          .filter((configuration) => configuration.frozen !== true)
          .map((configuration) => probeProvider(configuration)),
      )
        .then((results) => {
          cachedSnapshot = Object.freeze([...results]);
          cacheExpiresAt = nowMs() + cacheTtlMs;
          return cachedSnapshot;
        })
        .finally(() => {
          inFlightProbe = null;
        });
      return inFlightProbe;
    },
  });
}
