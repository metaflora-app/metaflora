import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { StateStore } from "../src/state-store.js";

test("operation state survives a new store instance", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "funding-state-"));
  try {
    const first = new StateStore(directory);
    await first.load();
    await first.set("payment:one", { status: "succeeded", transactionId: "tx-one" });
    const second = new StateStore(directory);
    await second.load();
    assert.deepEqual(second.get("payment:one"), { status: "succeeded", transactionId: "tx-one" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("parallel payment updates are all persisted", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "funding-state-parallel-"));
  try {
    const store = new StateStore(directory);
    await store.load();
    await Promise.all([
      store.set("payment:one", { status: "prepared" }),
      store.set("payment:two", { status: "prepared" }),
      store.set("payment:three", { status: "prepared" })
    ]);
    const recovered = new StateStore(directory);
    await recovered.load();
    assert.equal(recovered.get("payment:one").status, "prepared");
    assert.equal(recovered.get("payment:two").status, "prepared");
    assert.equal(recovered.get("payment:three").status, "prepared");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
