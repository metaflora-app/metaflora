import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENT_MODEL_SLUG,
  AgentApprovalRequiredError,
  AgentConfigurationError,
  buildAgentDiagnostics,
  createCrmAgentService,
  getAgentConfiguration,
} from "./agent-service.js";

const DASHBOARD = Object.freeze({
  providers: Object.freeze([
    Object.freeze({
      id: "openrouter",
      name: "OpenRouter",
      configured: true,
      enabled: true,
      health: "degraded",
      successRate: 91.2,
      failedCalls: 3,
      errorBreakdown: Object.freeze([
        Object.freeze({ id: "provider_timeout", label: "provider_timeout", count: 2 }),
      ]),
      incidents: Object.freeze([
        Object.freeze({
          id: "call-1",
          code: "provider_timeout",
          httpStatus: 504,
          startedAt: "2026-07-30T08:00:00.000Z",
          provider: "polza",
          providerModelId: "openai/gpt-5.4-image-2",
          model: "GPT-5.4 Image 2",
          generationId: "gen-1",
          operation: "generation.media",
          providerRequestId: "polza-job-1",
          retryable: true,
        }),
      ]),
    }),
  ]),
  incidents: Object.freeze([
    Object.freeze({
      id: "incident-1",
      title: "OpenRouter degraded",
      severity: "warning",
      status: "open",
      service: "openrouter",
      provider: "polza",
      providerModelId: "openai/gpt-5.4-image-2",
      model: "GPT-5.4 Image 2",
      generationId: "gen-1",
      errorCode: "provider_timeout",
      httpStatus: 504,
      providerRequestId: "polza-job-1",
      operation: "generation.media",
      retryable: true,
    }),
  ]),
  audit: Object.freeze([
    Object.freeze({
      id: "audit-1",
      time: "2026-07-30T08:01:00.000Z",
      actor: "admin",
      action: "provider.toggle",
      target: "openrouter",
      reason: "request_payload must not leak",
      status: "success",
    }),
  ]),
  settings: Object.freeze({ readOnly: true, schema: "neuro" }),
});

const CONNECTED_ENV = Object.freeze({
  OPENROUTER_API_KEY: "server-only-secret",
  CRM_AGENT_MODEL: AGENT_MODEL_SLUG,
  NODE_ENV: "production",
  RAILWAY_ENVIRONMENT_NAME: "production",
  RAILWAY_GIT_COMMIT_SHA: "abc123",
});

test("agent configuration fails closed unless key and pinned free Nemotron model env are present", () => {
  assert.deepEqual(getAgentConfiguration({}), {
    connected: false,
    provider: "openrouter",
    model: null,
    missingEnv: ["OPENROUTER_API_KEY", "CRM_AGENT_MODEL"],
    invalidEnv: [],
    mode: "read-only",
  });

  assert.deepEqual(
    getAgentConfiguration({
      OPENROUTER_API_KEY: "configured",
      CRM_AGENT_MODEL: "openai/not-the-found-model",
    }),
    {
      connected: false,
      provider: "openrouter",
      model: "openai/not-the-found-model",
      missingEnv: [],
      invalidEnv: ["CRM_AGENT_MODEL"],
      mode: "read-only",
    },
  );

  assert.equal(getAgentConfiguration(CONNECTED_ENV).connected, true);
});

test("agent configuration supports the Polza GPT Terra backend", () => {
  const config = getAgentConfiguration({
    CRM_AGENT_PROVIDER: "polza",
    CRM_AGENT_MODEL: "openai/gpt-5.6-terra",
    POLZA_API_KEY: "polza-server-secret",
  });

  assert.deepEqual(config, {
    connected: true,
    provider: "polza",
    model: "openai/gpt-5.6-terra",
    missingEnv: [],
    invalidEnv: [],
    mode: "read-only",
  });
});

test("Terra agent calls Polza OpenAI-compatible chat endpoint", async () => {
  const requests = [];
  const service = createCrmAgentService({
    env: {
      CRM_AGENT_PROVIDER: "polza",
      CRM_AGENT_MODEL: "openai/gpt-5.6-terra",
      POLZA_API_KEY: "polza-server-secret",
    },
    getDashboardData: async () => DASHBOARD,
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), body: JSON.parse(options.body), headers: options.headers });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ answer: "готово", repairPlan: [], toolActions: [] }) } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  await service.chat({ messages: [{ role: "user", content: "проверь систему" }] });

  assert.equal(requests[0].url, "https://polza.ai/api/v1/chat/completions");
  assert.equal(requests[0].body.model, "openai/gpt-5.6-terra");
  assert.equal(requests[0].headers.authorization, "Bearer polza-server-secret");
});

test("diagnostics summarize health, provider errors, audit and deployment metadata without payload leaks", () => {
  const diagnostics = buildAgentDiagnostics(DASHBOARD, {
    health: { status: "ok", checkedAt: "2026-07-30T08:02:00.000Z" },
    readiness: { status: "ready", checkedAt: "2026-07-30T08:02:01.000Z" },
    env: CONNECTED_ENV,
    now: () => new Date("2026-07-30T08:03:00.000Z"),
  });

  const serialized = JSON.stringify(diagnostics);
  assert.equal(diagnostics.providers[0].errorBreakdown[0].id, "provider_timeout");
  assert.deepEqual(diagnostics.providers[0].incidents[0], {
    code: "provider_timeout",
    httpStatus: 504,
    startedAt: "2026-07-30T08:00:00.000Z",
    provider: "polza",
    providerModelId: "openai/gpt-5.4-image-2",
    model: "GPT-5.4 Image 2",
    generationId: "gen-1",
    operation: "generation.media",
    providerRequestId: "polza-job-1",
    retryable: true,
  });
  assert.deepEqual(diagnostics.incidents[0], {
    id: "incident-1",
    title: "OpenRouter degraded",
    severity: "warning",
    status: "open",
    service: "openrouter",
    provider: "polza",
    providerModelId: "openai/gpt-5.4-image-2",
    model: "GPT-5.4 Image 2",
    generationId: "gen-1",
    errorCode: "provider_timeout",
    httpStatus: 504,
    providerRequestId: "polza-job-1",
    operation: "generation.media",
    retryable: true,
  });
  assert.equal(diagnostics.deployment.nodeEnv, "production");
  assert.equal(serialized.includes(CONNECTED_ENV.OPENROUTER_API_KEY), false);
  assert.equal(/request_payload|response_payload|provider_payload|prompt|output_text/i.test(serialized), false);
});

test("chat uses the pinned OpenRouter Nemotron model and filters actions to read-only", async () => {
  const requests = [];
  const service = createCrmAgentService({
    env: CONNECTED_ENV,
    getDashboardData: async () => DASHBOARD,
    getDiagnosticSnapshot: async () => ({
      status: "degraded",
      checks: [
        {
          id: "synthetic_controlled_canary",
          status: "failed",
          proposedRepair: {
            actionId: "repair_synthetic_canary",
            approvalRequired: true,
          },
        },
      ],
    }),
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), body: JSON.parse(options.body), headers: options.headers });
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  answer: "Проверил контур. Начать стоит с OpenRouter timeouts.",
                  repairPlan: ["Проверить readiness", "Сверить provider_timeout по последним вызовам"],
                  toolActions: [
                    { id: "inspect_provider_errors", label: "Ошибки провайдеров" },
                    { id: "repair_synthetic_canary", label: "Восстановить контрольную проверку" },
                    { id: "run_shell", label: "npm run deploy" },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
    now: () => new Date("2026-07-30T08:03:00.000Z"),
  });

  const result = await service.chat({
    messages: [{ role: "user", content: "что чинить первым?" }],
  });

  assert.equal(requests[0].url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(requests[0].body.model, AGENT_MODEL_SLUG);
  assert.equal(requests[0].headers.authorization.includes(CONNECTED_ENV.OPENROUTER_API_KEY), true);
  assert.equal(JSON.stringify(requests[0].body).includes(CONNECTED_ENV.OPENROUTER_API_KEY), false);
  assert.deepEqual(result.repairPlan, [
    "Проверить readiness",
    "Сверить provider_timeout по последним вызовам",
  ]);
  assert.deepEqual(result.toolActions, [
    { id: "inspect_provider_errors", label: "Ошибки провайдеров", mode: "read-only" },
    {
      id: "repair_synthetic_canary",
      label: "Восстановить контрольную проверку",
      mode: "approval-required",
    },
  ]);
  assert.match(JSON.stringify(requests[0].body), /synthetic_controlled_canary/);
});

test("write or shell-like actions require server-side approval and never call the model", async () => {
  let called = false;
  const service = createCrmAgentService({
    env: CONNECTED_ENV,
    getDashboardData: async () => DASHBOARD,
    fetchImpl: async () => {
      called = true;
      return new Response("{}", { status: 200 });
    },
  });

  await assert.rejects(
    () =>
      service.chat({
        messages: [{ role: "user", content: "почини деплой" }],
        requestedAction: { id: "railway_deploy", mode: "write" },
      }),
    AgentApprovalRequiredError,
  );
  assert.equal(called, false);
});

test("missing key or model reports disconnected instead of falling back silently", async () => {
  const service = createCrmAgentService({
    env: { OPENROUTER_API_KEY: "configured" },
    getDashboardData: async () => DASHBOARD,
    fetchImpl: async () => {
      throw new Error("must not be called");
    },
  });

  assert.equal((await service.getStatus()).connected, false);
  assert.equal(Object.hasOwn(await service.getStatus(), "model"), false);
  assert.equal(Object.hasOwn(await service.getStatus(), "provider"), false);
  await assert.rejects(
    () => service.chat({ messages: [{ role: "user", content: "помоги" }] }),
    AgentConfigurationError,
  );
});

test("public agent status exposes capabilities without leaking implementation details", async () => {
  const service = createCrmAgentService({
    env: CONNECTED_ENV,
    getDashboardData: async () => DASHBOARD,
    fetchImpl: async () => new Response("{}", { status: 200 }),
  });

  assert.deepEqual(await service.getStatus(), {
    connected: true,
    status: "ready",
    mode: "supervised",
    capabilities: ["diagnostics", "incident_analysis", "repair_planning"],
  });
});

test("diagnostics expose the same production incidents that the agent must inspect", async () => {
  const service = createCrmAgentService({
    env: CONNECTED_ENV,
    getDashboardData: async () => DASHBOARD,
    getDiagnosticSnapshot: async () => ({
      status: "healthy",
      checks: [{ id: "synthetic_controlled_canary", status: "healthy" }],
    }),
    now: () => new Date("2026-07-30T08:04:00.000Z"),
  });

  const diagnostics = await service.getDiagnostics();

  assert.equal(diagnostics.incidents[0].generationId, "gen-1");
  assert.equal(diagnostics.incidents[0].providerRequestId, "polza-job-1");
  assert.equal(diagnostics.incidents[0].errorCode, "provider_timeout");
  assert.equal(diagnostics.managedDiagnostics.status, "healthy");
});

test("agent cannot propose a repair when the managed check is healthy", async () => {
  const service = createCrmAgentService({
    env: CONNECTED_ENV,
    getDashboardData: async () => DASHBOARD,
    getDiagnosticSnapshot: async () => ({
      status: "healthy",
      checks: [{ id: "synthetic_controlled_canary", status: "healthy" }],
    }),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  answer: "проверка здорова",
                  repairPlan: [],
                  toolActions: [{ id: "repair_synthetic_canary" }],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const result = await service.chat({
    messages: [{ role: "user", content: "нужно ли чинить?" }],
  });
  assert.deepEqual(result.toolActions, []);
});
