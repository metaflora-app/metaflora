import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

const requiredEnvironment = Object.freeze({
  FUNDING_AGENT_TOKEN: "test-agent-token",
  FUNDING_ADMIN_USER: "test-admin",
  FUNDING_ADMIN_PASSWORD: "test-password",
  POLZA_MCP_TOKEN: "test-mcp-token",
});

async function withEnvironment(overrides, callback) {
  const names = [...Object.keys(requiredEnvironment), ...Object.keys(overrides)];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, requiredEnvironment, overrides);
  try {
    return await callback();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("uses the system Google Chrome executable by default", async () => {
  await withEnvironment({ BROWSER_EXECUTABLE_PATH: "" }, () => {
    assert.equal(loadConfig().browserExecutablePath, "/usr/bin/google-chrome");
  });
});

test("accepts an explicit browser executable path", async () => {
  await withEnvironment({ BROWSER_EXECUTABLE_PATH: "/opt/chrome/google-chrome" }, () => {
    assert.equal(loadConfig().browserExecutablePath, "/opt/chrome/google-chrome");
  });
});

test("Railway refuses an ephemeral browser profile outside its persistent volume", async () => {
  await withEnvironment({
    RAILWAY_ENVIRONMENT_ID: "production-environment",
    BROWSER_PROFILE_DIR: "/tmp/polza-profile",
  }, () => {
    assert.throws(() => loadConfig(), /persistent \/data volume/u);
  });
});

test("Railway accepts the persistent Polza profile under the mounted volume", async () => {
  await withEnvironment({
    RAILWAY_ENVIRONMENT_ID: "production-environment",
    BROWSER_PROFILE_DIR: "/data/polza-profile",
  }, () => {
    assert.equal(loadConfig().profileDir, "/data/polza-profile");
  });
});
