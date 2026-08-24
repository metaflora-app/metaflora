// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OverviewPage } from "./OverviewPage.jsx";

const metrics = {
  activeUsers: 0,
  revenue: 0,
  providerCostUsd: null,
  margin: null,
  successRate: 0,
  p95Ms: null,
  freeUsers: 0,
  paidUsers: 0,
  modelUsage: [],
  generationTotal: 0,
  paymentCount: 0,
  metacoinsSpent: 0,
};

describe("OverviewPage", () => {
  it("keeps an honest empty chart without rendering a status sentence inside it", () => {
    const { container } = render(
      <OverviewPage
        metrics={metrics}
        providers={[]}
        incidents={[]}
        onNavigate={vi.fn()}
      />,
    );

    expect(container.querySelector(".trend-chart__empty")).toBeInTheDocument();
    expect(screen.queryByText(/график появится после записи временных срезов/i))
      .not.toBeInTheDocument();
  });

  it("renders compact KPI cards with microtrend context", () => {
    const { container } = render(
      <OverviewPage
        metrics={{
          ...metrics,
          activeUsers: 14,
          revenue: 4360,
          kpiTrends: {
            activeUsers: { direction: "up", value: 12, label: "+12% за период" },
            revenue: { direction: "up", value: 8, label: "+8% за период" },
          },
        }}
        providers={[]}
        incidents={[]}
        onNavigate={vi.fn()}
      />,
    );

    const cards = container.querySelectorAll(".overview-kpi-card--compact");
    expect(cards).toHaveLength(4);
    expect(screen.getByText("+12% за период")).toHaveClass("overview-kpi-card__trend");
    expect(screen.getByText("+8% за период")).toHaveClass("overview-kpi-card__trend");
  });

  it("keeps KPI values on one baseline despite different label and detail lengths", () => {
    const { container } = render(
      <OverviewPage
        metrics={{
          ...metrics,
          activeUsers: 14,
          revenue: 4360,
          margin: 42,
          providerCostUsd: 18.25,
          successRate: 99.8,
          p95Ms: 12345,
        }}
        providers={[]}
        incidents={[]}
        onNavigate={vi.fn()}
      />,
    );

    const grid = container.querySelector(".overview-kpi-grid--baseline");
    expect(grid).toBeInTheDocument();
    const cards = Array.from(grid.querySelectorAll(".overview-kpi-card--compact"));
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      expect(card.querySelector(":scope > .overview-kpi-card__label-slot"))
        .toBeInTheDocument();
      expect(card.querySelector(":scope > .overview-kpi-card__value-slot"))
        .toBeInTheDocument();
      expect(card.querySelector(":scope > .overview-kpi-card__detail-slot"))
        .toBeInTheDocument();
    });
  });

  it("combines revenue and generation activity into one chart", () => {
    render(
      <OverviewPage
        metrics={{
          ...metrics,
          revenueSeries: [{ date: "2026-08-13", value: 990 }],
          generationSeries: [{ date: "2026-08-13", value: 42 }],
        }}
        providers={[]}
        incidents={[]}
        onNavigate={vi.fn()}
      />,
    );

    const chart = screen.getByRole("img", { name: /выручка и генерации по дням/u });
    expect(chart).toHaveClass("overview-activity-chart");
    expect(within(chart).getByText("выручка")).toBeInTheDocument();
    expect(within(chart).getByText("генерации")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "генерации" })).not.toBeInTheDocument();
  });

  it("ranks model usage with bars instead of a donut", () => {
    render(
      <OverviewPage
        metrics={{
          ...metrics,
          modelUsage: [
            { name: "Kling 3.0", value: 54.5 },
            { name: "Seedance 2", value: 32.4 },
          ],
        }}
        providers={[]}
        incidents={[]}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.queryByRole("img", { name: "распределение популярных моделей" }))
      .not.toBeInTheDocument();
    const ranking = screen.getByRole("list", { name: "рейтинг популярных моделей" });
    const rows = within(ranking).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("1Kling 3.054.5%");
    expect(rows[1]).toHaveTextContent("2Seedance 232.4%");
    rows.forEach((row) => expect(row).toHaveClass("model-usage-rank__item"));
  });

  it("uses a compact provider health matrix", () => {
    render(
      <OverviewPage
        metrics={metrics}
        providers={[
          { id: "polza", name: "Polza", latency: 415, success: 98.9, status: "healthy" },
          { id: "routerai", name: "RouterAI", latency: 523, success: 100, status: "degraded" },
        ]}
        incidents={[]}
        onNavigate={vi.fn()}
      />,
    );

    const matrix = screen.getByRole("grid", { name: "состояние провайдеров" });
    expect(matrix).toHaveClass("provider-health-matrix");
    expect(within(matrix).getAllByRole("row")).toHaveLength(2);
    expect(within(matrix).getByText("Polza")).toBeInTheDocument();
    expect(within(matrix).getByText("RouterAI")).toBeInTheDocument();
  });

  it("shows at most three compact actionable incidents without a giant table", () => {
    const incidents = Array.from({ length: 5 }, (_, index) => ({
      id: `incident-${index}`,
      title: `Инцидент ${index}`,
      service: "RouterAI",
      correlationId: `corr-${index}`,
      time: "сейчас",
      severity: index === 0 ? "critical" : "warning",
      status: "open",
    }));
    render(
      <OverviewPage metrics={metrics} providers={[]} incidents={incidents} onNavigate={vi.fn()} />,
    );

    const summary = screen.getByRole("list", { name: "инциденты, требующие внимания" });
    expect(summary).toHaveClass("incident-summary");
    expect(within(summary).getAllByRole("listitem")).toHaveLength(3);
    expect(within(summary).getAllByRole("button")).toHaveLength(3);
    expect(document.querySelector(".incident-table")).not.toBeInTheDocument();
  });

  it("removes standalone audience and generation panels", () => {
    render(
      <OverviewPage metrics={metrics} providers={[]} incidents={[]} onNavigate={vi.fn()} />,
    );

    expect(screen.queryByRole("heading", { name: "бесплатные и платные" }))
      .not.toBeInTheDocument();
    expect(document.querySelector(".audience-split__ring")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "генерации" })).not.toBeInTheDocument();
  });
});
