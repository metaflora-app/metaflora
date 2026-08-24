import assert from "node:assert/strict";
import test from "node:test";

import {
  getPersistentBrowserProfileConfig,
  preparePersistentBrowserProfile,
} from "./persistent-browser-profile.js";

test("browser profile defaults to a subdirectory of the Railway volume", () => {
  assert.deepEqual(
    getPersistentBrowserProfileConfig({
      RAILWAY_VOLUME_MOUNT_PATH: "/data",
    }),
    {
      configured: true,
      persistent: true,
      profileDir: "/data/hermes-profile",
      storage: "railway_volume",
      authorization: "required_once",
    },
  );
});

test("browser profile accepts an absolute configured path only", () => {
  assert.equal(
    getPersistentBrowserProfileConfig({
      RAILWAY_VOLUME_MOUNT_PATH: "/data",
      HERMES_BROWSER_PROFILE_DIR: "/data/custom-profile",
    }).profileDir,
    "/data/custom-profile",
  );
  assert.throws(
    () => getPersistentBrowserProfileConfig({ HERMES_BROWSER_PROFILE_DIR: "./profile" }),
    /Railway volume/i,
  );
});

test("profile preparation creates a private directory without writing credentials", async () => {
  const calls = [];
  const fsImpl = {
    async mkdir(path, options) {
      calls.push(["mkdir", path, options]);
    },
    async chmod(path, mode) {
      calls.push(["chmod", path, mode]);
    },
  };

  const result = await preparePersistentBrowserProfile({
    env: { RAILWAY_VOLUME_MOUNT_PATH: "/data" },
    fsImpl,
  });

  assert.equal(result.ready, true);
  assert.equal(result.authorization, "required_once");
  assert.deepEqual(calls, [
    ["mkdir", "/data/hermes-profile", { recursive: true, mode: 0o700 }],
    ["chmod", "/data/hermes-profile", 0o700],
  ]);
});

test("profile preparation fails closed when no persistent volume is mounted", async () => {
  const result = await preparePersistentBrowserProfile({ env: {}, fsImpl: {} });
  assert.deepEqual(result, {
    ready: false,
    configured: false,
    persistent: false,
    profileDir: null,
    storage: "ephemeral",
    authorization: "unavailable",
    error: "persistent volume is not configured",
  });
});
