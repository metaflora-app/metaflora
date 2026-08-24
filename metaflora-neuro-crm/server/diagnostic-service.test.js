import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticApprovalRequiredError,
  ControlledFailureDisabledError,
  createDiagnosticService,
  createInMemoryDiagnosticStore,
} from "./diagnostic-service.js";

const FIXED_NOW = () => new Date("2026-08-02T09:00:00.000Z");

test("controlled failure is synthetic, visible in diagnostics and never touches production dependencies", async () => {
  let externalCalls = 0;
  const service = createDiagnosticService({
    now: FIXED_NOW,
    allowControlledFailure: true,
    productionMutation: async () => {
      externalCalls += 1;
    },
  });

  const result = await service.injectControlledFailure({
    actor: "admin",
    idempotencyKey: "failure-20260802-0001",
  });
  const snapshot = await service.getSnapshot();

  assert.equal(result.applied, true);
  assert.equal(snapshot.status, "degraded");
  assert.equal(snapshot.checks[0].id, "synthetic_controlled_canary");
  assert.equal(snapshot.checks[0].status, "failed");
  assert.equal(externalCalls, 0);
  assert.deepEqual(snapshot.audit[0].before, { status: "healthy" });
  assert.deepEqual(snapshot.audit[0].after, { status: "failed" });
});

test("controlled failure is disabled unless the server explicitly enables it", async () => {
  const service = createDiagnosticService({ now: FIXED_NOW });
  await assert.rejects(
    () =>
      service.injectControlledFailure({
        actor: "admin",
        idempotencyKey: "failure-20260802-0002",
      }),
    ControlledFailureDisabledError,
  );
});

test("allowlisted repair requires server-side approval and records before/after once", async () => {
  const store = createInMemoryDiagnosticStore();
  const service = createDiagnosticService({
    now: FIXED_NOW,
    allowControlledFailure: true,
    store,
  });
  await service.injectControlledFailure({
    actor: "admin",
    idempotencyKey: "failure-20260802-0003",
  });

  await assert.rejects(
    () =>
      service.executeRepair({
        actionId: "repair_synthetic_canary",
        approval: "да",
        actor: "admin",
        idempotencyKey: "repair-20260802-0001",
      }),
    DiagnosticApprovalRequiredError,
  );

  const first = await service.executeRepair({
    actionId: "repair_synthetic_canary",
    approval: "ПОДТВЕРЖДАЮ",
    actor: "admin",
    idempotencyKey: "repair-20260802-0001",
  });
  const duplicate = await service.executeRepair({
    actionId: "repair_synthetic_canary",
    approval: "ПОДТВЕРЖДАЮ",
    actor: "admin",
    idempotencyKey: "repair-20260802-0001",
  });
  const snapshot = await service.getSnapshot();

  assert.equal(first.applied, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(snapshot.status, "healthy");
  assert.equal(snapshot.audit.length, 2);
  assert.deepEqual(snapshot.audit[1].before, { status: "failed" });
  assert.deepEqual(snapshot.audit[1].after, { status: "healthy" });
});

test("allowlisted repair is rejected when the controlled check is already healthy", async () => {
  const service = createDiagnosticService({ now: FIXED_NOW });
  await assert.rejects(
    () =>
      service.executeRepair({
        actionId: "repair_synthetic_canary",
        approval: "ПОДТВЕРЖДАЮ",
        actor: "admin",
        idempotencyKey: "repair-20260802-0003",
      }),
    (error) => error?.statusCode === 409,
  );
  assert.equal((await service.getSnapshot()).audit.length, 0);
});

test("daily diagnostics use a lease and idempotency key so concurrent schedulers run once", async () => {
  const store = createInMemoryDiagnosticStore();
  const service = createDiagnosticService({ now: FIXED_NOW, store });

  const [first, second] = await Promise.all([
    service.runDaily({ owner: "replica-a" }),
    service.runDaily({ owner: "replica-b" }),
  ]);
  const snapshot = await service.getSnapshot();

  assert.equal([first, second].filter(({ executed }) => executed).length, 1);
  assert.equal([first, second].filter(({ duplicate }) => duplicate).length, 1);
  assert.equal(snapshot.audit.filter(({ action }) => action === "diagnostic.daily").length, 1);
});
