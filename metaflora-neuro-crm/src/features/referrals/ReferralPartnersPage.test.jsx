import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReferralPartnersPage } from "./ReferralPartnersPage.jsx";

const partners = [{
  id: "partner-1",
  userName: "Ирина",
  telegramUserId: "10001",
  level: "серебро",
  percent: 30,
  taxStatus: "self_employed",
  payoutReadiness: { ready: true, label: "готов к выплатам через Т-Бизнес" },
  offer: { accepted: true, version: "referral-1.0", acceptedAt: "2026-08-14T08:00:00Z" },
  balances: { hold: 120, available: 340, reserved: 100, paid: 900, currency: "RUB" },
  directReferrals: [{
    id: "relation-1",
    userName: "Максим",
    telegramUserId: "10002",
    boundAt: "2026-08-01T08:00:00Z",
    payments: [{
      id: "payment-1",
      product: "пакет 400",
      amount: 899,
      currency: "RUB",
      paidAt: "2026-08-02T08:00:00Z",
      status: "confirmed",
      cashEarning: { percent: 30, amount: 269.7, status: "available", availableAt: "2026-08-16T08:00:00Z" },
      bonuses: [
        { recipient: "приглашённый", metacoins: 100, status: "applied" },
        { recipient: "партнёр", metacoins: 100, status: "pending" },
      ],
    }],
  }],
  withdrawals: [{
    id: "withdrawal-1",
    amount: 100,
    currency: "RUB",
    status: "manual_review",
    provider: "Т-Бизнес",
    method: "СБП",
    destinationHint: "+7••• •••-12-34",
    errorCode: null,
    attempts: 1,
    requestedAt: "2026-08-17T08:00:00Z",
    events: [{ status: "manual_review", createdAt: "2026-08-17T08:01:00Z" }],
  }],
}];

describe("ReferralPartnersPage", () => {
  it("renders each partner as a bounded card in a responsive grid", () => {
    render(<ReferralPartnersPage partners={partners} />);

    expect(screen.queryByRole("table", { name: "партнёры" })).not.toBeInTheDocument();
    const grid = screen.getByRole("list", { name: "партнёры" });
    expect(grid).toHaveClass("crm-partner-grid");
    const card = within(grid).getByRole("listitem", { name: "партнёр Ирина" });
    expect(card).toHaveClass("crm-partner-card");
    expect(within(card).getByText("340,00 ₽")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /открыть партнёра Ирина/i }))
      .toBeInTheDocument();
  });

  it("shows the complete safe partner drilldown", () => {
    render(<ReferralPartnersPage partners={partners} />);

    expect(screen.getByRole("heading", { name: "партнёрская программа" })).toBeInTheDocument();
    expect(screen.getByText("Ирина")).toBeInTheDocument();
    expect(screen.getByText("оферта принята")).toBeInTheDocument();
    expect(screen.getByText("самозанятый")).toBeInTheDocument();
    expect(screen.getByText("готов к выплатам через Т-Бизнес")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /открыть партнёра Ирина/i }));
    const drilldown = screen.getByRole("region", { name: "партнёр Ирина" });
    expect(within(drilldown).getByText("Максим")).toBeInTheDocument();
    expect(within(drilldown).getByText("пакет 400")).toBeInTheDocument();
    expect(within(drilldown).getByText("30% · 269,70 ₽")).toBeInTheDocument();
    expect(within(drilldown).getByText(/доступно с 16 авг\. 2026 г/i)).toBeInTheDocument();
    expect(within(drilldown).getAllByText("100 метакоинов")).toHaveLength(2);
    expect(within(drilldown).getByText("+7••• •••-12-34")).toBeInTheDocument();
    expect(within(drilldown).queryByText("4111111111111111")).not.toBeInTheDocument();
  });

  it("marks manual review without offering a competing auto action", () => {
    render(<ReferralPartnersPage partners={partners} />);
    fireEvent.click(screen.getByRole("button", { name: /открыть партнёра Ирина/i }));
    expect(screen.getByText("ручная проверка")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /выплатить автоматически/i })).not.toBeInTheDocument();
    expect(screen.getByText(/сверьте перевод в Т-Бизнесе по ID заявки/i)).toBeInTheDocument();
  });
});
// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
