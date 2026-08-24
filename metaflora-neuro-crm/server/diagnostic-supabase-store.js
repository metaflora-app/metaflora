const CANARY_JOB_KEY = "crm-diagnostic:synthetic-canary";
const CANARY_JOB_TYPE = "crm_diagnostic_state";
const AUDIT_JOB_TYPE = "crm_diagnostic_audit";
const DAILY_JOB_TYPE = "crm_diagnostic_daily";
const AUDIT_PREFIX = "crm-diagnostic:audit:";

export class DiagnosticStoreUnavailableError extends Error {
  constructor(message = "durable diagnostic store is unavailable") {
    super(message);
    this.name = "DiagnosticStoreUnavailableError";
    this.statusCode = 503;
  }
}

function required(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} is required`);
  }
  return value.trim();
}

function baseUrl(value) {
  let url;
  try {
    url = new URL(required(value, "supabaseUrl"));
  } catch {
    throw new TypeError("supabaseUrl must be a valid HTTPS URL");
  }
  if (url.protocol !== "https:") {
    throw new TypeError("supabaseUrl must be a valid HTTPS URL");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

function validateStatus(value) {
  if (!["healthy", "failed"].includes(value)) {
    throw new TypeError("invalid canary status");
  }
  return value;
}

function validateJobKey(value) {
  const key = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,240}$/.test(key)) {
    throw new TypeError("invalid diagnostic key");
  }
  return key;
}

function clone(value) {
  return structuredClone(value);
}

function auditJobKey(key) {
  return `${AUDIT_PREFIX}${validateJobKey(key)}`;
}

function mapAudit(row) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  return Object.freeze({
    id: String(payload.id ?? `diagnostic:${payload.idempotencyKey ?? row.job_key}`),
    idempotencyKey: String(payload.idempotencyKey ?? ""),
    action: String(payload.action ?? ""),
    actor: String(payload.actor ?? ""),
    target: String(payload.target ?? ""),
    before: clone(payload.before ?? {}),
    after: clone(payload.after ?? {}),
    status: String(payload.auditStatus ?? "failure"),
    occurredAt: String(payload.occurredAt ?? row.created_at ?? ""),
  });
}

export function createSupabaseDiagnosticStore({
  supabaseUrl,
  serviceRoleKey,
  schema = "neuro",
  fetchImpl = globalThis.fetch,
} = {}) {
  const root = baseUrl(supabaseUrl);
  const secret = required(serviceRoleKey, "serviceRoleKey");
  const profile = required(schema, "schema");
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl is required");

  const commonHeaders = Object.freeze({
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    "Accept-Profile": profile,
    "Content-Profile": profile,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  async function request({ method = "GET", filters = {}, body, prefer, allowConflict = false }) {
    const url = new URL("/rest/v1/system_jobs", root);
    url.searchParams.set(
      "select",
      "id,job_key,job_type,status,payload,result,attempt_count,error_message,scheduled_at,started_at,finished_at,created_at,updated_at",
    );
    for (const [field, value] of Object.entries(filters)) {
      url.searchParams.set(field, `eq.${value}`);
    }
    if (String(prefer ?? "").includes("resolution=")) {
      url.searchParams.set("on_conflict", "job_key");
    }
    const headers = prefer ? { ...commonHeaders, Prefer: prefer } : commonHeaders;
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new DiagnosticStoreUnavailableError();
    }
    if (allowConflict && response?.status === 409) {
      return Object.freeze({ conflict: true, rows: Object.freeze([]) });
    }
    if (!response?.ok) throw new DiagnosticStoreUnavailableError();
    let rows;
    try {
      rows = await response.json();
    } catch {
      throw new DiagnosticStoreUnavailableError();
    }
    if (!Array.isArray(rows)) throw new DiagnosticStoreUnavailableError();
    return Object.freeze({ conflict: false, rows: Object.freeze(rows.map(clone)) });
  }

  async function readOne(filters) {
    const { rows } = await request({ filters });
    return rows[0] ?? null;
  }

  async function getCanaryStatus() {
    const row = await readOne({ job_key: CANARY_JOB_KEY });
    if (row) return row.status === "failed" ? "failed" : "healthy";
    const { rows } = await request({
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=representation",
      body: {
        job_key: CANARY_JOB_KEY,
        job_type: CANARY_JOB_TYPE,
        status: "succeeded",
        payload: { checkId: "synthetic_controlled_canary" },
        result: { status: "healthy" },
      },
    });
    if (rows[0]) return "healthy";
    const concurrent = await readOne({ job_key: CANARY_JOB_KEY });
    if (!concurrent) throw new DiagnosticStoreUnavailableError();
    return concurrent.status === "failed" ? "failed" : "healthy";
  }

  async function setCanaryStatus(value) {
    const status = validateStatus(value);
    await request({
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        job_key: CANARY_JOB_KEY,
        job_type: CANARY_JOB_TYPE,
        status: status === "healthy" ? "succeeded" : "failed",
        payload: { checkId: "synthetic_controlled_canary" },
        result: { status },
        updated_at: new Date().toISOString(),
      },
    });
  }

  async function appendAudit(entry) {
    const safeEntry = clone(entry);
    const key = auditJobKey(safeEntry.idempotencyKey);
    await request({
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=representation",
      body: {
        job_key: key,
        job_type: AUDIT_JOB_TYPE,
        status: safeEntry.status === "success" ? "succeeded" : "failed",
        payload: {
          id: safeEntry.id,
          idempotencyKey: safeEntry.idempotencyKey,
          action: safeEntry.action,
          actor: safeEntry.actor,
          target: safeEntry.target,
          before: safeEntry.before,
          after: safeEntry.after,
          auditStatus: safeEntry.status,
          occurredAt: safeEntry.occurredAt,
        },
        result: {},
        finished_at: safeEntry.occurredAt,
      },
    });
    return Object.freeze(safeEntry);
  }

  async function listAudit() {
    const { rows } = await request({ filters: { job_type: AUDIT_JOB_TYPE } });
    return Object.freeze(rows.map(mapAudit));
  }

  async function getResult(key) {
    const row = await readOne({ job_key: auditJobKey(key) });
    const result = row?.result?.operationResult;
    return result && typeof result === "object" ? Object.freeze(clone(result)) : null;
  }

  async function saveResult(key, result) {
    const jobKey = auditJobKey(key);
    const row = await readOne({ job_key: jobKey });
    if (!row) throw new DiagnosticStoreUnavailableError();
    const safeResult = clone(result);
    const { rows } = await request({
      method: "PATCH",
      filters: { job_key: jobKey },
      prefer: "return=representation",
      body: {
        result: { ...(row.result ?? {}), operationResult: safeResult },
        updated_at: new Date().toISOString(),
      },
    });
    if (rows.length !== 1) throw new DiagnosticStoreUnavailableError();
    return Object.freeze(safeResult);
  }

  async function acquireLease({ key, owner, now, expiresAt }) {
    const jobKey = validateJobKey(key);
    const safeOwner = String(owner ?? "").trim();
    const acquiredAt = new Date(now).toISOString();
    const leaseExpiresAt = new Date(expiresAt).toISOString();
    const insert = await request({
      method: "POST",
      prefer: "return=representation",
      allowConflict: true,
      body: {
        job_key: jobKey,
        job_type: DAILY_JOB_TYPE,
        status: "running",
        payload: {},
        result: { leaseOwner: safeOwner, leaseExpiresAt },
        attempt_count: 1,
        scheduled_at: acquiredAt,
        started_at: acquiredAt,
        updated_at: acquiredAt,
      },
    });
    if (!insert.conflict) return insert.rows.length === 1;

    const current = await readOne({ job_key: jobKey });
    if (!current || current.status === "succeeded") return false;
    const currentExpiry = new Date(current.result?.leaseExpiresAt ?? 0).getTime();
    if (current.status === "running" && currentExpiry > new Date(acquiredAt).getTime()) {
      return false;
    }
    const { rows } = await request({
      method: "PATCH",
      filters: {
        job_key: jobKey,
        status: current.status,
        updated_at: current.updated_at,
      },
      prefer: "return=representation",
      body: {
        status: "running",
        result: { leaseOwner: safeOwner, leaseExpiresAt },
        attempt_count: Number(current.attempt_count ?? 0) + 1,
        started_at: acquiredAt,
        finished_at: null,
        error_message: null,
        updated_at: acquiredAt,
      },
    });
    return rows.length === 1;
  }

  async function finishLease(key, status) {
    const now = new Date().toISOString();
    const { rows } = await request({
      method: "PATCH",
      filters: { job_key: validateJobKey(key), status: "running" },
      prefer: "return=representation",
      body: { status, finished_at: now, updated_at: now },
    });
    if (rows.length !== 1) throw new DiagnosticStoreUnavailableError();
  }

  return Object.freeze({
    getCanaryStatus,
    setCanaryStatus,
    appendAudit,
    listAudit,
    getResult,
    saveResult,
    acquireLease,
    completeLease: (key) => finishLease(key, "succeeded"),
    releaseLease: (key) => finishLease(key, "failed"),
  });
}
