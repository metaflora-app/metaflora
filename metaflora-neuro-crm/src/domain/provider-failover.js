export function createProviderCircuitState() {
  return {
    status: "closed",
    failureCount: 0,
    openedAt: null,
  };
}

export function recordProviderFailure(
  state,
  { nowMs = Date.now(), failureThreshold = 3 } = {},
) {
  if (!Number.isInteger(failureThreshold) || failureThreshold < 1) {
    throw new TypeError("failureThreshold must be a positive integer");
  }
  const failureCount = state.failureCount + 1;
  const isOpen = failureCount >= failureThreshold;
  return {
    status: isOpen ? "open" : "closed",
    failureCount,
    openedAt: isOpen ? nowMs : null,
  };
}

export function recordProviderSuccess() {
  return createProviderCircuitState();
}

export function selectAvailableProvider(
  providers,
  circuits,
  { nowMs = Date.now(), cooldownMs = 30_000 } = {},
) {
  const candidates = [...providers]
    .filter(({ enabled = true }) => enabled)
    .sort((left, right) => left.priority - right.priority);

  for (const provider of candidates) {
    const circuit = circuits[provider.id] ?? createProviderCircuitState();
    if (circuit.status === "closed") return { provider, probe: false };
    if (
      circuit.status === "open" &&
      circuit.openedAt !== null &&
      nowMs - circuit.openedAt >= cooldownMs
    ) {
      return { provider, probe: true };
    }
  }
  return null;
}
