import test from "node:test";
import assert from "node:assert/strict";
import { basicAuthorized, bearerAuthorized, browserSessionAuthorized, browserSessionToken } from "../src/auth.js";

test("bearer authentication is exact", () => {
  assert.equal(bearerAuthorized("Bearer secret", "secret"), true);
  assert.equal(bearerAuthorized("Bearer secret2", "secret"), false);
});

test("basic authentication accepts the configured credentials only", () => {
  const header = `Basic ${Buffer.from("owner:password").toString("base64")}`;
  assert.equal(basicAuthorized(header, "owner", "password"), true);
  assert.equal(basicAuthorized(header, "owner", "wrong"), false);
});

test("browser session cookie authorizes WebSocket upgrades without exposing Basic credentials", () => {
  const token = browserSessionToken("owner", "password");
  assert.equal(browserSessionAuthorized(`other=1; funding_browser_session=${token}`, "owner", "password"), true);
  assert.equal(browserSessionAuthorized(`funding_browser_session=${token}`, "owner", "wrong"), false);
});
