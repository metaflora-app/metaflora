// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsPage, SubscriptionsPage } from "./SystemPages.jsx";

describe("SubscriptionsPage", () => {
  it("shows current tariffs including ultimate and hides obsolete test plans", () => {
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

    expect(container.querySelectorAll(".plan-card")).toHaveLength(6);
    expect(screen.getByRole("heading", { name: "новичок" }).closest("article"))
      .toHaveTextContent("1 пользователь");
    expect(screen.getByRole("heading", { name: "исследователь" }).closest("article"))
      .toHaveTextContent("топ");
    expect(screen.getByRole("heading", { name: "ultimate тестовый" }).closest("article"))
      .toHaveTextContent("300 ₽");

    expect(screen.queryByRole("heading", { name: "тестовый" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "новый тестовый" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "финальный новый" })).not.toBeInTheDocument();
    expect(screen.queryByText(/test_140|test_110|final_test_130/i)).not.toBeInTheDocument();
    expect(screen.queryByText("внутренний тест")).not.toBeInTheDocument();
    expect(screen.queryByText("архивный тариф")).not.toBeInTheDocument();
    expect(screen.queryByText("Архив")).not.toBeInTheDocument();
  });

  it("shows the current tariff and metacoin package catalog", () => {
    render(<SubscriptionsPage users={[]} onOpenUser={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "любитель" }).closest("article"))
      .toHaveTextContent("749 ₽");
    expect(screen.getByRole("heading", { name: "автор" }).closest("article"))
      .toHaveTextContent("1 490 ₽");
    expect(screen.getByRole("heading", { name: "исследователь" }).closest("article"))
      .toHaveTextContent("2 490 ₽");
    expect(screen.getByRole("heading", { name: "эксперт" }).closest("article"))
      .toHaveTextContent("3 990 ₽");

    const packages = screen.getByRole("region", { name: "пакеты метакоинов" });
    for (const [coins, price] of [
      ["150 метакоинов", "549 ₽"],
      ["400 метакоинов", "1 290 ₽"],
      ["1 000 метакоинов", "2 990 ₽"],
      ["2 500 метакоинов", "6 990 ₽"],
    ]) {
      expect(within(packages).getByText(coins).closest("article")).toHaveTextContent(price);
    }
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

    expect(screen.getByText("Т-Банк / СБП checkout")).toBeInTheDocument();
    expect(screen.queryByText(/ЮKassa|YooKassa/u)).not.toBeInTheDocument();
    expect(screen.getByText("Т‑Бизнес массовые выплаты")).toBeInTheDocument();
    expect(screen.getByText("готова к тестовой выплате")).toBeInTheDocument();
    expect(screen.getByText("provider top-up")).toBeInTheDocument();
    expect(screen.getByText("ручная очередь")).toBeInTheDocument();

    const worker = screen.getByText("MCP funding worker").closest("div");
    expect(within(worker).getByText(/токен настроен.*worker включён/iu)).toBeInTheDocument();
    expect(within(worker).queryByText(/готово/iu)).not.toBeInTheDocument();
  });
});
