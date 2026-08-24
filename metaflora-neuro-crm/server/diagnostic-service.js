const APPROVAL_PHRASE = "ПОДТВЕРЖДАЮ";
const SYNTHETIC_CHECK_ID = "synthetic_controlled_canary";
const REPAIR_ACTION_ID = "repair_synthetic_canary";
const DEFAULT_LEASE_MS = 10 * 60 * 1_000;
const DEFAULT_INTERVAL_MS = 60 * 60 * 1_000;

export class DiagnosticValidationError extends Error {
  constructor(message = "invalid diagnostic request") {
    super(message);
    this.name = "DiagnosticValidationError";
    this.statusCode = 400;
  }
}

export class DiagnosticApprovalRequiredError extends Error {
  constructor() {
    super("требуется подтверждение администратора");
    this.name = "DiagnosticApprovalRequiredError";
    this.statusCode = 403;
  }
}

export class ControlledFailureDisabledError extends Error {
  constructor() {
    super("контрольная неисправность отключена");
    this.name = "ControlledFailureDisabledError";
    this.statusCode = 403;
  }
}

export class DiagnosticConflictError extends Error {
  constructor(message = "контрольная проверка уже исправна") {
    super(message);
    this.name = "DiagnosticConflictError";
    this.statusCode = 409;
  }
}

function iso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new DiagnosticValidationError();
  return date.toISOString();
}

function validateIdempotencyKey(value) {
  const key = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(key)) {
    throw new DiagnosticValidationError("invalid idempotency key");
  }
  return key;
}

function safeActor(value) {
  const actor = String(value ?? "").trim();
  if (!/^[A-Za-z0-9А-Яа-яЁё@._:-]{2,100}$/.test(actor)) {
    throw new DiagnosticValidationError("invalid actor");
  }
  return actor;
}

function clone(value) {
  return structuredClone(value);
}

function frozen(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => frozen(item)));
  }
  if (value && typeof value === "object") {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, frozen(item)]),
      ),
    );
  }
  return value;
}

export function createInMemoryDiagnosticStore() {
  let state = Object.freeze({
    canaryStatus: "healthy",
    audit: Object.freeze([]),
    results: Object.freeze({}),
    leases: Object.freeze({}),
    completedRuns: Object.freeze({}),
  });

  return Object.freeze({
    async getCanaryStatus() {
      return state.canaryStatus;
    },
    async setCanaryStatus(status) {
      if (!["healthy", "failed"].includes(status)) {
        throw new DiagnosticValidationError("invalid canary status");
      }
      state = Object.freeze({ ...state, canaryStatus: status });
    },
    async appendAudit(entry) {
      const next = frozen(clone(entry));
      state = Object.freeze({
        ...state,
        audit: Object.freeze([...state.audit, next]),
      });
      return next;
    },
    async listAudit() {
      return frozen(clone(state.audit));
    },
    async getResult(key) {
      const result = state.results[key];
      return result ? frozen(clone(result)) : null;
    },
    async saveResult(key, result) {
      const safeResult = frozen(clone(result));
      state = Object.freeze({
        ...state,
        results: Object.freeze({ ...state.results, [key]: safeResult }),
      });
      return safeResult;
    },
    async acquireLease({ key, owner, now, expiresAt }) {
      if (state.completedRuns[key]) return false;
      const existing = state.leases[key];
      if (existing && new Date(existing.expiresAt).getTime() > new Date(now).getTime()) {
        return false;
      }
      state = Object.freeze({
        ...state,
        leases: Object.freeze({
          ...state.leases,
          [key]: Object.freeze({ owner, expiresAt }),
        }),
      });
      return true;
    },
    async completeLease(key) {
      const { [key]: _released, ...remainingLeases } = state.leases;
      state = Object.freeze({
        ...state,
        leases: Object.freeze(remainingLeases),
        completedRuns: Object.freeze({ ...state.completedRuns, [key]: true }),
      });
    },
    async releaseLease(key) {
      const { [key]: _released, ...remainingLeases } = state.leases;
      state = Object.freeze({ ...state, leases: Object.freeze(remainingLeases) });
    },
  });
}

function auditEntry({ idempotencyKey, action, actor, before, after, at, status }) {
  return frozen({
    id: `diagnostic:${idempotencyKey}`,
    idempotencyKey,
    action,
    actor,
    target: SYNTHETIC_CHECK_ID,
    before,
    after,
    status,
    occurredAt: at,
  });
}

export function createDiagnosticService({
  store = createInMemoryDiagnosticStore(),
  now = () => new Date(),
  allowControlledFailure = false,
  leaseMs = DEFAULT_LEASE_MS,
} = {}) {
  const requiredMethods = [
    "getCanaryStatus",
    "setCanaryStatus",
    "appendAudit",
    "listAudit",
    "getResult",
    "saveResult",
    "acquireLease",
    "completeLease",
    "releaseLease",
  ];
  if (requiredMethods.some((method) => typeof store?.[method] !== "function")) {
    throw new TypeError("diagnostic store is incomplete");
  }
  if (typeof now !== "function") throw new TypeError("now must be a function");
  if (!Number.isSafeInteger(leaseMs) || leaseMs < 1_000) {
    throw new TypeError("leaseMs must be at least 1000ms");
  }

  async function getSnapshot() {
    const [canaryStatus, audit] = await Promise.all([
      store.getCanaryStatus(),
      store.listAudit(),
    ]);
    const checkStatus = canaryStatus === "healthy" ? "healthy" : "failed";
    return frozen({
      status: checkStatus === "healthy" ? "healthy" : "degraded",
      checkedAt: iso(now()),
      checks: [
        {
          id: SYNTHETIC_CHECK_ID,
          label: "контрольная диагностика",
          scope: "isolated",
          status: checkStatus,
          productionTrafficAffected: false,
          proposedRepair:
            checkStatus === "failed"
              ? { actionId: REPAIR_ACTION_ID, approvalRequired: true }
              : null,
        },
      ],
      audit,
    });
  }

  async function injectControlledFailure(command = {}) {
    if (!allowControlledFailure) throw new ControlledFailureDisabledError();
    const idempotencyKey = validateIdempotencyKey(command.idempotencyKey);
    const actor = safeActor(command.actor);
    const existing = await store.getResult(idempotencyKey);
    if (existing) return frozen({ ...existing, duplicate: true });
    const beforeStatus = await store.getCanaryStatus();
    await store.setCanaryStatus("failed");
    const entry = auditEntry({
      idempotencyKey,
      action: "diagnostic.synthetic_failure_injected",
      actor,
      before: { status: beforeStatus },
      after: { status: "failed" },
      at: iso(now()),
      status: "success",
    });
    await store.appendAudit(entry);
    const result = frozen({
      applied: beforeStatus !== "failed",
      duplicate: false,
      checkId: SYNTHETIC_CHECK_ID,
      status: "failed",
      productionTrafficAffected: false,
    });
    await store.saveResult(idempotencyKey, result);
    return result;
  }

  async function executeRepair(command = {}) {
    const actionId = String(command.actionId ?? "").trim();
    if (actionId !== REPAIR_ACTION_ID) {
      throw new DiagnosticValidationError("repair action is not allowlisted");
    }
    if (command.approval !== APPROVAL_PHRASE) {
      throw new DiagnosticApprovalRequiredError();
    }
    const idempotencyKey = validateIdempotencyKey(command.idempotencyKey);
    const actor = safeActor(command.actor);
    const existing = await store.getResult(idempotencyKey);
    if (existing) return frozen({ ...existing, duplicate: true });
    const beforeStatus = await store.getCanaryStatus();
    if (beforeStatus !== "failed") throw new DiagnosticConflictError();
    await store.setCanaryStatus("healthy");
    const entry = auditEntry({
      idempotencyKey,
      action: "diagnostic.synthetic_canary_repaired",
      actor,
      before: { status: beforeStatus },
      after: { status: "healthy" },
      at: iso(now()),
      status: "success",
    });
    await store.appendAudit(entry);
    const result = frozen({
      applied: beforeStatus !== "healthy",
      duplicate: false,
      actionId,
      checkId: SYNTHETIC_CHECK_ID,
      status: "healthy",
      verified: true,
      productionTrafficAffected: false,
    });
    await store.saveResult(idempotencyKey, result);
    return result;
  }

  async function runDaily({ owner = "crm-diagnostics" } = {}) {
    const actor = safeActor(owner);
    const startedAt = iso(now());
    const runKey = `diagnostic.daily:${startedAt.slice(0, 10)}`;
    const acquired = await store.acquireLease({
      key: runKey,
      owner: actor,
      now: startedAt,
      expiresAt: iso(new Date(new Date(startedAt).getTime() + leaseMs)),
    });
    if (!acquired) return frozen({ executed: false, duplicate: true, runKey });
    try {
      const canaryStatus = await store.getCanaryStatus();
      await store.appendAudit(
        auditEntry({
          idempotencyKey: runKey,
          action: "diagnostic.daily",
          actor,
          before: { status: canaryStatus },
          after: { status: canaryStatus },
          at: startedAt,
          status: canaryStatus === "healthy" ? "success" : "failure",
        }),
      );
      await store.completeLease(runKey);
      return frozen({
        executed: true,
        duplicate: false,
        runKey,
        status: canaryStatus === "healthy" ? "healthy" : "degraded",
      });
    } catch (error) {
      await store.releaseLease(runKey);
      throw error;
    }
  }

  return Object.freeze({
    getSnapshot,
    injectControlledFailure,
    executeRepair,
    runDaily,
  });
}

export function startDailyDiagnosticScheduler({
  service,
  owner = "crm-diagnostics",
  intervalMs = DEFAULT_INTERVAL_MS,
  runImmediately = true,
  setIntervalImpl = globalThis.setInterval,
  logger = console,
} = {}) {
  if (typeof service?.runDaily !== "function") {
    throw new TypeError("diagnostic service is required");
  }
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1_000) {
    throw new TypeError("intervalMs must be at least 1000ms");
  }
  const run = () =>
    service.runDaily({ owner }).catch((error) => {
      logger.error(
        JSON.stringify({
          level: "error",
          event: "crm.diagnostic.daily_failed",
          message: error instanceof Error ? error.message : "unknown error",
        }),
      );
    });
  if (runImmediately) void run();
  const timer = setIntervalImpl(run, intervalMs);
  timer?.unref?.();
  return Object.freeze({ stop: () => clearInterval(timer), run });
}

export const DIAGNOSTIC_REPAIR_ACTIONS = Object.freeze({
  [REPAIR_ACTION_ID]: Object.freeze({
    id: REPAIR_ACTION_ID,
    approvalRequired: true,
    scope: "synthetic_controlled_canary",
  }),
});
