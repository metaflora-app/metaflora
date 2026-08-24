import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const exec = promisify(execFile);
const endpoint = process.env.POLZA_MCP_ENDPOINT || "https://polza.ai/api/mcp";
const token = process.env.POLZA_MCP_TOKEN;
if (!token) throw new Error("POLZA_MCP_TOKEN is missing");

let requestId = 1;
async function mcp(method, params) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: requestId++, method, params }),
  });
  const body = await response.text();
  let message;
  for (const line of body.split(/\r?\n/u).filter(Boolean)) {
    const value = line.startsWith("data:") ? line.slice(5).trim() : line;
    try { message = JSON.parse(value); } catch { /* keep looking */ }
  }
  if (!response.ok || message?.error) throw new Error("Polza MCP request failed");
  return message?.result ?? message;
}

function findUrl(value) {
  if (typeof value === "string" && /^https:\/\//u.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findUrl(item);
      if (result) return result;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const result = findUrl(item);
      if (result) return result;
    }
  }
  return "";
}

const result = await mcp("tools/call", {
  name: "create_topup_link",
  arguments: { amount: 100, paymentMethod: "CARD" },
});
let linkPayload = result?.structuredContent ?? result?.content?.find((item) => item?.type === "text")?.text ?? result;
try { linkPayload = JSON.parse(linkPayload); } catch { /* payload can be an object */ }
const link = findUrl(linkPayload);
if (!link) throw new Error("Polza did not return a checkout link");

const profile = await mkdtemp(`${tmpdir()}/metaflora-polza-checkout-`);
const session = `readonly-${Date.now()}`;
try {
  await exec("npx", ["--yes", "agent-browser", "--profile", profile, "--session", session, "open", link], {
    maxBuffer: 2 * 1024 * 1024,
  });
  const snapshot = await exec("npx", ["--yes", "agent-browser", "--profile", profile, "--session", session, "snapshot", "-i", "-c"], {
    maxBuffer: 2 * 1024 * 1024,
  });
  const safe = snapshot.stdout
    .split("\n")
    .filter((line) => !line.includes("http") && !line.includes("Bearer") && !line.includes("token"))
    .slice(0, 160)
    .join("\n");
  console.log(JSON.stringify({ checkoutHost: new URL(link).hostname, snapshot: safe }));
} finally {
  await exec("npx", ["--yes", "agent-browser", "--profile", profile, "--session", session, "close"], { maxBuffer: 64 * 1024 }).catch(() => {});
  await rm(profile, { recursive: true, force: true });
}
