// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProviderOperations } from "./ProviderOperations.jsx";

afterEach(cleanup);

const providers = [
  {
    id: "routerai",
    name: "RouterAI",
    configured: true,
    capabilities: ["text", "image", "video", "music", "voice"],
    enabled: true,
    priority: 1,
    status: "operational",
    successRate: 99.8,
    averageLatencyMs: 420,
    p95LatencyMs: 780,
    circuitStatus: "closed",
    totalCalls: 120,
    completedCalls: 120,
    successfulCalls: 119,
    failedCalls: 1,
    providerCostUsd: 1.82,
    inputTokens: 18400,
    outputTokens: 6300,
    fallbackReceived: 0,
    fallbackRecovered: 0,
    fallbackHandedOff: 1,
    operationBreakdown: [
      { id: "chat", label: "chat", calls: 120, successRate: 99.2 },
    ],
    modelBreakdown: [
      { id: "seedance/2", label: "seedance/2", calls: 84 },
    ],
    errorBreakdown: [
      { id: "rate_limited", label: "rate_limited", count: 1 },
    ],
    timeline: [
      {
        date: "2026-07-29",
        calls: 52,
        succeeded: 51,
        failed: 1,
        successRate: 98.1,
        costUsd: 0.73,
        averageLatencyMs: 440,
        p95LatencyMs: 780,
      },
      {
        date: "2026-07-30",
        calls: 68,
        succeeded: 68,
        failed: 0,
        successRate: 100,
        costUsd: 1.09,
        averageLatencyMs: 405,
        p95LatencyMs: 720,
      },
    ],
    incidents: [
      {
        id: "call-issue-1",
        code: "rate_limited",
        httpStatus: 429,
        startedAt: "2026-07-29T09:10:00.000Z",
      },
    ],
    balance: { available: 80, limit: null, used: null, unit: "credits" },
    lowBalance: true,
    topUpUrl: "https://routerai.ru/settings/billing",
    alerts: [
      {
        id: "routerai:low_balance",
        code: "provider_low_balance",
        severity: "warning",
        label: "низкий баланс",
      },
    ],
  },
  {
    id: "polza",
    name: "Polza",
    configured: true,
    capabilities: ["text", "image", "video"],
    enabled: true,
    priority: 2,
    health: "degraded",
    successRate: 94.1,
    latencyMs: 810,
    p95LatencyMs: 1480,
    circuitStatus: "half-open",
    totalCalls: 34,
    completedCalls: 34,
    successfulCalls: 32,
    failedCalls: 2,
    providerCostUsd: 0.46,
    inputTokens: 5200,
    outputTokens: 1900,
    fallbackReceived: 4,
    fallbackRecovered: 3,
    fallbackHandedOff: 1,
    operationBreakdown: [
      { id: "chat", label: "chat", calls: 22, successRate: 95.5 },
      { id: "image", label: "image", calls: 12, successRate: 91.7 },
    ],
    modelBreakdown: [
      { id: "anthropic/claude", label: "anthropic/claude", calls: 22 },
      { id: "flux/dev", label: "flux/dev", calls: 12 },
    ],
    errorBreakdown: [
      { id: "provider_timeout", label: "provider_timeout", count: 2 },
    ],
    timeline: [
      {
        date: "2026-07-30",
        calls: 34,
        succeeded: 32,
        failed: 2,
        successRate: 94.1,
        costUsd: 0.46,
        averageLatencyMs: 810,
        p95LatencyMs: 1480,
      },
    ],
    incidents: [],
    balance: null,
    lowBalance: false,
    topUpUrl: "https://polza.ai/balance",
    alerts: [],
  },
];

const routes = [
  {
    id: "route-chat",
    capability: "текст",
    enabled: true,
    steps: [
      { provider: "Polza", model: "Claude", status: "closed" },
      { provider: "RouterAI", model: "Seedance 2.5", status: "half-open" },
    ],
  },
  {
    id: "route-image",
    capability: "изображения",
    enabled: true,
    steps: [{ provider: "Polza", model: "FLUX", status: "closed" }],
  },
];

describe("ProviderOperations", () => {
  it("renders provider health and the ordered fallback chain", () => {
    render(<ProviderOperations providers={providers} routes={routes} />);

    expect(screen.getAllByTestId("provider-card")[0]).toHaveTextContent("Polza");
    expect(screen.getAllByText("RouterAI").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/KIE/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("99,8%").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("fallback-цепочка")).toHaveTextContent(
      "Polza",
    );
    expect(screen.getByLabelText("fallback-цепочка")).toHaveTextContent("Polza");
    const textRoute = screen.getByRole("heading", { name: "текст" }).parentElement;
    const imageRoute = screen.getByRole("heading", { name: "изображения" }).parentElement;
    expect(textRoute).toHaveTextContent("Polza");
    expect(textRoute).toHaveTextContent("RouterAI");
    expect(textRoute).toHaveTextContent("первая попытка");
    expect(textRoute).toHaveTextContent("fallback 1");
    expect(imageRoute).toHaveTextContent("Polza");
    expect(imageRoute).not.toHaveTextContent("RouterAI");
  });

  it("uses provider brand assets and shows only verified balance data", () => {
    render(<ProviderOperations providers={providers} />);

    const routerAiCard = screen
      .getAllByTestId("provider-card")
      .find((card) => card.textContent.includes("RouterAI"));

    expect(within(routerAiCard).getByRole("img", { name: "RouterAI" }))
      .toHaveAttribute("src", expect.stringMatching(/routerai|data:image/));
    expect(within(routerAiCard).getByText("80 credits")).toBeInTheDocument();
    expect(within(routerAiCard).getByText("низкий баланс")).toBeInTheDocument();
    expect(within(routerAiCard).getByRole("link", { name: "пополнить RouterAI" }))
      .toHaveAttribute("href", "https://routerai.ru/settings/billing");
  });

  it("states honestly when RouterAI does not expose balance through its API", () => {
    render(<ProviderOperations providers={[{
      ...providers[0],
      balance: null,
      balanceCapability: "unsupported",
      balanceStatus: "unsupported",
    }]} />);

    const routerAiCard = screen.getByTestId("provider-card");
    expect(within(routerAiCard).getByText("баланс API не поддерживается"))
      .toBeInTheDocument();
    expect(within(routerAiCard).queryByText("нет данных")).not.toBeInTheDocument();
    expect(within(routerAiCard).getByRole("link", { name: "открыть биллинг RouterAI" }))
      .toHaveAttribute("href", "https://routerai.ru/settings/billing");
  });

  it("renders a real operations dashboard from provider aggregates", () => {
    render(<ProviderOperations providers={providers} />);

    expect(
      screen.getByRole("heading", { name: "состояние API" }),
    ).toBeInTheDocument();
    expect(screen.getByText("154")).toBeInTheDocument();
    expect(screen.getByText("2,28 $")).toBeInTheDocument();
    expect(screen.getByText("успешность по дням")).toBeInTheDocument();
    expect(screen.getByText("стоимость и использование")).toBeInTheDocument();
    expect(screen.getByText("операции и модели")).toBeInTheDocument();
    expect(screen.getByText("ошибки и инциденты")).toBeInTheDocument();
    expect(screen.getByText("provider_timeout")).toBeInTheDocument();
    expect(screen.getByText("seedance/2")).toBeInTheDocument();
    expect(screen.getByText("3 восстановления")).toBeInTheDocument();
  });

  it("constrains long operation and model identifiers inside their columns", () => {
    const longOperation = "GET /f/218916/2026/08/t_7241a40a0a20b27e_with_an_extremely_long_filename.png";
    const longModel = "vendor/a-model-name-that-is-long-enough-to-overflow-the-dashboard-column";
    render(<ProviderOperations providers={[{
      ...providers[0],
      operationBreakdown: [{ id: "long-op", label: longOperation, calls: 85 }],
      modelBreakdown: [{ id: "long-model", label: longModel, calls: 62 }],
    }]} />);

    const constrainedLabels = Array.from(document.querySelectorAll(".provider-breakdown-item__label"));
    expect(constrainedLabels).toHaveLength(2);
    for (const label of [longOperation, longModel]) {
      const node = constrainedLabels.find((element) => element.textContent === label);
      expect(node).toBeDefined();
      expect(node).toHaveClass("provider-breakdown-item__label");
      expect(node).toHaveAttribute("title", label);
      expect(node.parentElement).toHaveClass("provider-breakdown-item");
    }
  });

  it("keeps configured providers visible and reports missing history honestly", () => {
    const configuredWithoutHistory = {
      ...providers[0],
      totalCalls: 0,
      completedCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      successRate: null,
      averageLatencyMs: null,
      p95LatencyMs: null,
      operationBreakdown: [],
      modelBreakdown: [],
      errorBreakdown: [],
      timeline: [],
      incidents: [],
    };
    render(<ProviderOperations providers={[configuredWithoutHistory]} />);

    expect(screen.getByRole("heading", { name: "RouterAI" })).toBeInTheDocument();
    expect(screen.getAllByText("нет данных").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("истории вызовов пока недостаточно").length,
    ).toBeGreaterThan(0);
  });

  it("keeps infrastructure and payments outside the model API provider dashboard", () => {
    const nonModelServices = [
      { id: "supabase", name: "Supabase", configured: true, totalCalls: 999 },
      { id: "yookassa", name: "ЮKassa", configured: true, totalCalls: 999 },
    ];

    render(
      <ProviderOperations
        providers={[...providers, ...nonModelServices]}
        routes={routes}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Supabase" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "ЮKassa" })).not.toBeInTheDocument();
    expect(screen.getAllByTestId("provider-card")).toHaveLength(2);
    expect(screen.getAllByText("154").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2/2").length).toBeGreaterThan(0);
  });

  it("hides a frozen provider card without removing active RouterAI routes", () => {
    render(
      <ProviderOperations
        providers={[{ ...providers[0], frozen: true, status: "frozen" }]}
        routes={routes}
      />,
    );

    expect(screen.queryByRole("heading", { name: "RouterAI" })).not.toBeInTheDocument();
    expect(screen.queryByText("заморожен")).not.toBeInTheDocument();
    expect(screen.getByLabelText("fallback-цепочка")).toHaveTextContent("RouterAI");
  });

  it("routes provider actions through handlers", () => {
    const onToggle = vi.fn();
    const onProbe = vi.fn();
    render(
      <ProviderOperations
        providers={providers}
        onToggle={onToggle}
        onProbe={onProbe}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "отключить RouterAI" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "проверить Polza" }));

    expect(onToggle).toHaveBeenCalledWith("routerai", false);
    expect(onProbe).toHaveBeenCalledWith("polza");
  });

  it("renders empty dashboards and fallback states without invented metrics", () => {
    render(<ProviderOperations providers={[]} className="embedded" />);

    expect(screen.getByText("0/0 подключены")).toBeInTheDocument();
    expect(screen.getByText("фактические маршруты ещё не записаны")).toBeInTheDocument();
    expect(screen.getByText("операции и модели ещё не зафиксированы")).toBeInTheDocument();
    expect(screen.getByText("ошибок в доступной истории нет")).toBeInTheDocument();
    expect(screen.getAllByText("нет данных").length).toBeGreaterThan(0);
  });

  it("handles character balances, unknown brands, critical alerts and incomplete history", () => {
    const edgeProviders = [
      {
        id: "elevenlabs",
        name: "ElevenLabs",
        configured: true,
        enabled: true,
        capabilities: ["voice"],
        status: "degraded",
        totalCalls: 1,
        completedCalls: 0,
        successfulCalls: 0,
        fallbackRecovered: 0,
        balance: {
          available: 2_000,
          limit: 10_000,
          used: 8_000,
          unit: "characters",
        },
        alerts: [
          {
            id: "elevenlabs:auth",
            code: "provider_auth_failed",
            severity: "critical",
          },
        ],
        incidents: [
          {
            id: "pending",
            code: "timeout",
            httpStatus: null,
          },
        ],
      },
      {
        id: "custom-provider",
        name: "custom provider",
        configured: false,
        enabled: false,
        status: "unavailable",
        totalCalls: 0,
        alerts: [
          {
            id: "custom:unknown",
            code: "custom_failure",
            label: "нестандартная ошибка",
          },
        ],
      },
    ];

    render(<ProviderOperations providers={edgeProviders} />);

    expect(screen.getByText("2 000 символов")).toBeInTheDocument();
    expect(screen.getAllByText("ключ API отклонён").length).toBeGreaterThan(0);
    expect(screen.getAllByText("нестандартная ошибка").length).toBeGreaterThan(0);
    expect(screen.getByText(/HTTP —/)).toBeInTheDocument();
    expect(
      screen.getAllByTestId("provider-card").find((card) =>
        card.textContent.includes("custom provider"),
      ).querySelector("img"),
    ).toBeNull();
  });
});
