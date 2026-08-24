// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsPage, SubscriptionsPage } from "./SystemPages.jsx";

describe("SubscriptionsPage", () => {
  it("shows only current customer tariffs and hides obsolete test plans", () => {
    const { container } = render(
      <SubscriptionsPage
        users={[
          { id: "u1", name: "Иван", plan: "новичок", initials: "И" },
          { id: "u2", name: "Тест", plan: "тестовый", initials: "Т" },
          { id: "u3", name: "Новый тест", plan: "новый тестовый", initials: "НТ" },
          { id: "u4", name: "Финальный тест", plan: "финальный новый", initials: "ФТ" },
          { id: "u5", name: "Архив", plan: "архивный тариф", initials: "А" },
        ]}
        onOpenUser={vi.fn()}
      />,
    );

    expect(container.querySelectorAll(".plan-card")).toHaveLength(5);
    expect(screen.getByRole("heading", { name: "новичок" }).closest("article"))
      .toHaveTextContent("1 пользователь");
    expect(screen.getByRole("heading", { name: "исследователь" }).closest("article"))
      .toHaveTextContent("топ");

    expect(screen.queryByRole("heading", { name: "тестовый" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "новый тестовый" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "финальный новый" })).not.toBeInTheDocument();
    expect(screen.queryByText(/test_140|test_110|final_test_130/i)).not.toBeInTheDocument();
    expect(screen.queryByText("внутренний тест")).not.toBeInTheDocument();
    expect(screen.queryByText("архивный тариф")).not.toBeInTheDocument();
    expect(screen.queryByText("Архив")).not.toBeInTheDocument();
  });
});

describe("SettingsPage", () => {
  it("shows separate checkout, payout and provider top-up statuses", () => {
    render(
      <SettingsPage
        settings={{
          mfa: true,
          readAudit: true,
          redaction: true,
          repairApproval: true,
          finance: {
            payout: { label: "Т‑Бизнес массовые выплаты", ready: true, status: "готова к тестовой выплате" },
            providerTopups: { status: "ручная очередь" },
            mcpFundingWorker: {
              tokenConfigured: true,
              workerEnabled: true,
              billingDanger: true,
              status: "токен настроен; worker включён; billing danger включён; ожидается результат queue/worker",
            },
          },
        }}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText("ЮKassa checkout")).toBeInTheDocument();
    expect(screen.getByText("Т‑Бизнес массовые выплаты")).toBeInTheDocument();
    expect(screen.getByText("готова к тестовой выплате")).toBeInTheDocument();
    expect(screen.getByText("provider top-up")).toBeInTheDocument();
    expect(screen.getByText("ручная очередь")).toBeInTheDocument();

    const worker = screen.getByText("MCP funding worker").closest("div");
    expect(within(worker).getByText(/токен настроен.*worker включён/iu)).toBeInTheDocument();
    expect(within(worker).queryByText(/готово/iu)).not.toBeInTheDocument();
  });
});
