import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticStoreUnavailableError,
  createSupabaseDiagnosticStore,
} from "./diagnostic-supabase-store.js";

function createSystemJobsBackend() {
  const rows = new Map();
  let sequence = 0;

  function matching(url) {
    return [...rows.values()].filter((row) => {
      for (const [key, value] of url.searchParams) {
        if (!["job_key", "job_type", "status", "updated_at"].includes(key)) continue;
        if (String(row[key]) !== value.replace(/^eq\./, "")) return false;
      }
      return true;
    });
  }

  return Object.freeze({
    rows,
    async fetch(input, init = {}) {
      const url = new URL(input);
      assert.equal(url.pathname, "/rest/v1/system_jobs");
      assert.equal(init.headers.apikey, "service-role-test");
      assert.equal(init.headers["Accept-Profile"], "neuro");
      const method = init.method ?? "GET";
      if (method === "GET") {
        const result = matching(url).sort((left, right) =>
          String(left.created_at).localeCompare(String(right.created_at)),
        );
        return Response.json(result, { status: 200 });
      }
      if (method === "POST") {
        const body = JSON.parse(init.body);
        const existing = rows.get(body.job_key);
        const merge = String(init.headers.Prefer ?? "").includes("resolution=merge-duplicates");
        const ignore = String(init.headers.Prefer ?? "").includes("resolution=ignore-duplicates");
        if (existing && !merge && !ignore) {
          return Response.json({ code: "23505" }, { status: 409 });
        }
        if (existing && ignore) return Response.json([], { status: 201 });
        sequence += 1;
        const next = {
          id: existing?.id ?? `job-${sequence}`,
          attempt_count: existing?.attempt_count ?? 0,
          created_at: existing?.created_at ?? body.created_at ?? "2026-08-02T09:00:00.000Z",
          updated_at: body.updated_at ?? "2026-08-02T09:00:00.000Z",
          ...existing,
          ...body,
        };
        rows.set(next.job_key, next);
        return Response.json([next], { status: 201 });
      }
      if (method === "PATCH") {
        const body = JSON.parse(init.body);
        const changed = matching(url).map((row) => ({ ...row, ...body }));
        changed.forEach((row) => rows.set(row.job_key, row));
        return Response.json(changed, { status: 200 });
      }
      throw new Error(`unexpected method ${method}`);
    },
  });
}

const OPTIONS = Object.freeze({
  supabaseUrl: "https://example.supabase.co",
  serviceRoleKey: "service-role-test",
  schema: "neuro",
});

test("Supabase diagnostic store persists canary, audit before/after and idempotent result", async () => {
  const backend = createSystemJobsBackend();
  const first = createSupabaseDiagnosticStore({ ...OPTIONS, fetchImpl: backend.fetch });
  await first.setCanaryStatus("failed");
  await first.appendAudit({
    id: "diagnostic:repair-20260802-1",
    idempotencyKey: "repair-20260802-1",
    action: "diagnostic.synthetic_canary_repaired",
    actor: "admin",
    target: "synthetic_controlled_canary",
    before: { status: "failed" },
    after: { status: "healthy" },
    status: "success",
    occurredAt: "2026-08-02T09:00:00.000Z",
  });
  await first.saveResult("repair-20260802-1", { applied: true, status: "healthy" });

  const afterRestart = createSupabaseDiagnosticStore({
    ...OPTIONS,
    fetchImpl: backend.fetch,
  });
  assert.equal(await afterRestart.getCanaryStatus(), "failed");
  assert.deepEqual(await afterRestart.getResult("repair-20260802-1"), {
    applied: true,
    status: "healthy",
  });
  const [audit] = await afterRestart.listAudit();
  assert.deepEqual(audit.before, { status: "failed" });
  assert.deepEqual(audit.after, { status: "healthy" });
  assert.equal(audit.actor, "admin");
});

test("daily lease is durable across store instances and completed run cannot repeat", async () => {
  const backend = createSystemJobsBackend();
  const first = createSupabaseDiagnosticStore({ ...OPTIONS, fetchImpl: backend.fetch });
  const second = createSupabaseDiagnosticStore({ ...OPTIONS, fetchImpl: backend.fetch });
  const lease = {
    key: "diagnostic.daily:2026-08-02",
    owner: "replica-a",
    now: "2026-08-02T09:00:00.000Z",
    expiresAt: "2026-08-02T09:10:00.000Z",
  };

  assert.equal(await first.acquireLease(lease), true);
  assert.equal(await second.acquireLease({ ...lease, owner: "replica-b" }), false);
  await first.completeLease(lease.key);

  const afterRestart = createSupabaseDiagnosticStore({
    ...OPTIONS,
    fetchImpl: backend.fetch,
  });
  assert.equal(await afterRestart.acquireLease(lease), false);
  assert.equal(backend.rows.get(lease.key).status, "succeeded");
});

test("only one replica can reclaim an expired lease using compare-and-swap", async () => {
  const backend = createSystemJobsBackend();
  backend.rows.set("diagnostic.daily:2026-08-02", {
    id: "job-existing",
    job_key: "diagnostic.daily:2026-08-02",
    job_type: "crm_diagnostic_daily",
    status: "running",
    payload: {},
    result: {
      leaseOwner: "dead-replica",
      leaseExpiresAt: "2026-08-02T08:00:00.000Z",
    },
    attempt_count: 1,
    created_at: "2026-08-02T07:00:00.000Z",
    updated_at: "2026-08-02T07:00:00.000Z",
  });
  const first = createSupabaseDiagnosticStore({ ...OPTIONS, fetchImpl: backend.fetch });
  const second = createSupabaseDiagnosticStore({ ...OPTIONS, fetchImpl: backend.fetch });
  const lease = {
    key: "diagnostic.daily:2026-08-02",
    now: "2026-08-02T09:00:00.000Z",
    expiresAt: "2026-08-02T09:10:00.000Z",
  };

  const results = await Promise.all([
    first.acquireLease({ ...lease, owner: "replica-a" }),
    second.acquireLease({ ...lease, owner: "replica-b" }),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
});

test("durable diagnostic store fails closed when Supabase is unavailable", async () => {
  const store = createSupabaseDiagnosticStore({
    ...OPTIONS,
    fetchImpl: async () => {
      throw new Error("network with secret service-role-test");
    },
  });

  await assert.rejects(() => store.getCanaryStatus(), DiagnosticStoreUnavailableError);
});
