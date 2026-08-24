// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FinancePage } from "./FinancePage.jsx";

const payments = [
  {
    id: "pay-1",
    userId: "usr-1",
    userName: "Ирина Волкова",
    amount: 990,
    currency: "RUB",
    status: "succeeded",
    provider: "Т-Банк",
    paymentMethod: "sbp",
    receiptEmail: "receipt@example.ru",
    receiptStatus: "succeeded",
    receiptSentAt: "2026-07-30T09:00:02.000Z",
    createdAt: "2026-07-30T09:00:00.000Z",
  },
];

const ledgerEntries = [
  {
    id: "tx-1",
    userId: "usr-1",
    userName: "Ирина Волкова",
    type: "credit",
    amount: 100,
    reason: "payment",
    status: "settled",
    createdAt: "2026-07-30T09:01:00.000Z",
  },
];

afterEach(cleanup);

describe("FinancePage", () => {
  it("uses the neutral overview visual language instead of a green finance accent", () => {
    render(<FinancePage payments={payments} ledgerEntries={ledgerEntries} />);

    const dashboard = screen.getByRole("region", { name: "деньги" });
    expect(dashboard).toHaveClass("crm-overview-dashboard");
    expect(screen.getByRole("img", { name: /динамика платежей/i }))
      .toHaveClass("crm-money-chart--neutral");
    expect(screen.getByRole("img", { name: /структура денег/i }).parentElement)
      .toHaveClass("crm-money-structure--neutral");
  });

  it("uses compact charts to explain money dynamics and distribution", () => {
    render(<FinancePage payments={payments} ledgerEntries={ledgerEntries} />);

    expect(screen.getByRole("img", { name: /динамика платежей/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /структура денег/i })).toBeInTheDocument();
  });

  it("removes the verbose payout-routing explainer from the dashboard", () => {
    render(<FinancePage payments={payments} ledgerEntries={ledgerEntries} />);

    expect(screen.queryByRole("region", { name: "маршрутизация выплат" })).not.toBeInTheDocument();
    expect(screen.queryByText("как будет работать заявка")).not.toBeInTheDocument();
    expect(screen.queryByText("MCP funding worker")).not.toBeInTheDocument();
    expect(screen.queryByText("persistent browser connector")).not.toBeInTheDocument();
  });

  it("keeps the target margin while removing verbose tariff policy copy", () => {
    render(<FinancePage />);

    expect(screen.getByText("50%")) .toBeInTheDocument();
    expect(screen.queryByText(/метакоины не сгорают/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/20 запросов.*GPT-5\.6 Luna Fast/i)).not.toBeInTheDocument();
  });

  it("does not turn the CRM into a second Telegram Stars price catalogue", () => {
    render(<FinancePage />);

    expect(screen.queryByRole("table", { name: "таблица Telegram Stars" })).not.toBeInTheDocument();
    expect(screen.queryByText("таблица цен Telegram Stars")).not.toBeInTheDocument();
  });

  it("shows provider top-up controls from server settings without a routing explainer", () => {
    render(
      <FinancePage
        settings={{
          finance: {
            payout: {
              status: "готова к тестовой выплате",
              ready: true,
              activation: "проведи тестовую выплату на небольшую сумму",
            },
            apiReserve: { percent: 12 },
            providerTopups: {
              automatic: false,
              status: "ручная очередь",
              note: "резерв фиксируется в CRM; автопополнение включается только после подтверждения API провайдера",
              providers: [
                {
                  id: "polza",
                  label: "Polza",
                  mode: "provider_dashboard",
                  status: "автопополнение в кабинете",
                  note: "порог пополнения задаётся в кабинете Polza",
                  topUpUrl: "https://polza.ai/balance",
                },
                {
                  id: "routerai",
                  label: "RouterAI",
                  mode: "persistent_browser_saved_card",
                  executionOwner: "external_funding_agent",
                  crmChargeSupported: false,
                  status: "worker готов",
                  note: "минимум 100 ₽, постоянный профиль",
                  topUpUrl: "https://routerai.ru/settings/billing",
                },
              ],
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "пополнения API" }));
    expect(screen.getByText("автопополнение в кабинете")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "открыть кабинет Polza" }))
      .toHaveAttribute("href", "https://polza.ai/balance");
    expect(screen.getByText("worker готов")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "открыть кабинет RouterAI" }))
      .toHaveAttribute("href", "https://routerai.ru/settings/billing");
    expect(screen.getByText(/исполнение: отдельный funding-agent.*CRM: только наблюдение/i))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /пополнить RouterAI/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/KIE/i)).not.toBeInTheDocument();
  });

  it("does not expose removed test-only tariffs in production finance", () => {
    render(
      <FinancePage
        settings={{
          finance: {
            testOnlyTariff: {
              id: "final_test_130",
              label: "финальный новый",
              price: 130,
              currency: "RUB",
              priceKopecks: 13_000,
              metacoins: 100,
              provider: "polza",
              topupKopecks: 11_000,
              ownerShareTargetKopecks: 2_000,
              mode: "bot_test",
              publishedToBot: true,
              publicationControl: "TEST_TARIFF_ENABLED",
              financialResult: {
                gross: 130,
                paymentFee: 4.55,
                apiReserve: 110,
                grossMargin: 15.45,
                grossMarginPercent: 11.88,
                ownerShare: 15.45,
                ownerShareTarget: 20,
                ownerShareTargetPercent: 15.38,
                metacoins: 100,
                provider: "polza",
                currency: "RUB",
              },
              topup: {
                provider: "polza",
                amount: 110,
                amountKopecks: 11_000,
                currency: "RUB",
                status: "awaiting_worker_result",
                ready: false,
                statusSource: "provider_topup_requests + MCP funding worker result",
                workerResult: null,
                note: "payment.succeeded создаёт queued-заявку; готовность не подтверждается без фактического результата worker",
              },
            },
          },
        }}
        financeAllocations={[{
          allocationKey: "payment-test-1:api_reserve:polza",
          category: "api_reserve",
          provider: "polza",
          source: "test_tariff_payment_webhook",
        }]}
        providerTopups={[{
          id: "topup-test-1",
          allocationKey: "payment-test-1:api_reserve:polza",
          provider: "polza",
          amount: 110,
          amountKopecks: 11_000,
          currency: "RUB",
          status: "processing",
        }]}
      />,
    );

    expect(screen.queryByRole("region", { name: "финальный новый тариф" })).not.toBeInTheDocument();
    expect(screen.queryByText("final_test_130")).not.toBeInTheDocument();
  });

  it("switches between payments and metacoin operations without internal jargon", () => {
    render(<FinancePage payments={payments} ledgerEntries={ledgerEntries} />);

    expect(screen.getByText("Т-Банк")).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "платежи" })).getByText("СБП")).toBeInTheDocument();
    expect(screen.getByText("чек отправлен")).toBeInTheDocument();
    expect(screen.getByText(/отправлен.*30 июл/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "операции с метакоинами" }));

    expect(screen.getByText("пополнение")).toBeInTheDocument();
    expect(screen.queryByText(/ledger/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Т-Банк")).not.toBeInTheDocument();
  });

  it("keeps ledger headers aligned with every row cell", () => {
    render(<FinancePage ledgerEntries={ledgerEntries} />);

    fireEvent.click(screen.getByRole("tab", { name: "операции с метакоинами" }));

    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    const rows = within(table).getAllByRole("row").slice(1);

    expect(headers.map((header) => header.textContent.trim())).toEqual([
      "пользователь",
      "операция",
      "метакоины",
      "причина",
      "дата",
      "действие",
    ]);
    rows.forEach((row) => {
      expect(within(row).getAllByRole("cell")).toHaveLength(headers.length);
    });
  });

  it("shows Telegram Stars as the payment method in the journal", () => {
    render(
      <FinancePage
        payments={[{
          ...payments[0],
          id: "pay-stars",
          amount: 199,
          currency: "XTR",
          provider: "Telegram Stars",
          paymentMethod: "telegram_stars",
          receiptEmail: null,
          receiptStatus: "unknown",
        }]}
      />,
    );

    expect(screen.getByText("⭐ Telegram Stars")).toBeInTheDocument();
    expect(screen.getByText("199 ⭐ к получению")).toBeInTheDocument();
  });

  it("summarizes reserves and pending top-ups in the chart and status strip", () => {
    render(
      <FinancePage
        wallet={{ apiReserve: 465, paymentFee: 35, referralLiability: 15, ownerShare: 485, availableApiReserve: 150, availableOwnerShare: 485, grossMarginPercent: 48.5 }}
        providerTopups={[{
          id: "topup-routerai",
          allocationKey: "pay-1:api_reserve:routerai",
          provider: "RouterAI",
          amount: 100,
          currency: "RUB",
          status: "processing",
          externalId: "router-tx-42",
          createdAt: "2026-08-12T01:01:00Z",
        }]}
      />,
    );

    expect(screen.getByRole("img", { name: "структура денег" })).toBeInTheDocument();
    expect(screen.getByText("465,00 ₽")).toBeInTheDocument();
    const signals = screen.getByRole("region", { name: "состояние денег" });
    expect(signals).toHaveTextContent("пополнения в работе1");
    expect(signals).toHaveTextContent("доступно на API150,00");
  });

  it("shows available API funds without provider-level text walls", () => {
    render(
      <FinancePage
        wallet={{ availableApiReserve: 150 }}
      />,
    );

    const signals = screen.getByRole("region", { name: "состояние денег" });
    expect(signals).toHaveTextContent("доступно на API150,00");
    expect(screen.queryByText("Polza AI")).not.toBeInTheDocument();
  });

  it("delegates payment and ledger row selection", () => {
    const onSelectPayment = vi.fn();
    const onSelectLedgerEntry = vi.fn();
    render(
      <FinancePage
        payments={payments}
        ledgerEntries={ledgerEntries}
        onSelectPayment={onSelectPayment}
        onSelectLedgerEntry={onSelectLedgerEntry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "открыть платёж pay-1" }));
    expect(onSelectPayment).toHaveBeenCalledWith(payments[0]);

    fireEvent.click(screen.getByRole("tab", { name: "операции с метакоинами" }));
    fireEvent.click(screen.getByRole("button", { name: "открыть запись tx-1" }));
    expect(onSelectLedgerEntry).toHaveBeenCalledWith(ledgerEntries[0]);
  });

  it("shows empty states for both journals", () => {
    render(<FinancePage />);

    expect(screen.getByText("платежей пока нет")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "операции с метакоинами" }));
    expect(screen.getByText("движений пока нет")).toBeInTheDocument();
  });

  it("keeps each wide journal inside a dedicated scroll viewport", () => {
    const { container } = render(
      <FinancePage payments={payments} ledgerEntries={ledgerEntries} />,
    );

    expect(container.querySelector(".crm-finance-page")).toBeInTheDocument();
    expect(container.querySelector(".crm-table-viewport .crm-payments-table"))
      .toBeInTheDocument();
  });

  it("renders debit and fallback payment metadata safely", () => {
    render(
      <FinancePage
        payments={[
          {
            id: "pay-2",
            userId: "usr-2",
            amount: 0,
            currency: "RUB",
            status: "unknown",
            createdAt: "not-a-date",
          },
        ]}
        ledgerEntries={[
          {
            id: "tx-2",
            userId: "usr-2",
            type: "debit",
            amount: 5,
            reason: "generation",
          },
        ]}
      />,
    );

    expect(screen.getByText("неизвестно")).toBeInTheDocument();
    const paymentsTable = screen.getByRole("table", { name: "платежи" });
    expect(within(paymentsTable).getAllByText("—")).toHaveLength(2);
    fireEvent.click(screen.getByRole("tab", { name: "операции с метакоинами" }));
    expect(screen.getByText("списание")).toBeInTheDocument();
    expect(screen.getByText("−5")).toBeInTheDocument();
  });

  it("shows a pending receipt without claiming that it was sent", () => {
    render(
      <FinancePage
        payments={[{
          id: "pay-pending-receipt",
          amount: 990,
          currency: "RUB",
          status: "succeeded",
          receiptStatus: "pending",
          receiptEmail: "buyer@example.ru",
        }]}
      />,
    );

    expect(screen.getByText("чек формируется")).toBeInTheDocument();
    expect(screen.queryByText("чек отправлен")).not.toBeInTheDocument();
  });

  it("keeps currency totals separate and ignores unsettled ledger entries", () => {
    render(
      <FinancePage
        payments={[
          { id: "rub", amount: 100, currency: "RUB", status: "succeeded" },
          { id: "usd", amount: 5, currency: "USD", status: "succeeded" },
        ]}
        ledgerEntries={[
          { id: "settled", type: "credit", amount: 10, status: "settled" },
          { id: "pending", type: "credit", amount: 999, status: "pending" },
        ]}
      />,
    );

    expect(screen.getAllByText(/100,00.*₽.*5,00.*\$/).length).toBeGreaterThan(0);
    expect(screen.getByText("10 метакоинов")).toBeInTheDocument();
  });

  it("shows how each payment is split between API reserve and owner share", () => {
    render(
      <FinancePage
        payments={[{
          ...payments[0],
          finance: {
            apiReserve: 100,
            referralLiability: 250,
            paymentFee: 35,
            ownerShare: 615,
            currency: "RUB",
          },
        }]}
        financeAllocations={[{
          id: "allocation-1",
          externalPaymentId: "pay-1",
          category: "api_reserve",
          provider: "Polza AI",
          amount: 100,
          currency: "RUB",
          status: "reserved",
        }]}
      />,
    );

    const paymentTable = screen.getByRole("table", { name: "платежи" });
    expect(within(paymentTable).getByText(/API.*100,00/iu)).toBeInTheDocument();
    expect(within(paymentTable).getByText(/моя доля.*615,00/iu)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "проводки по деньгам" }));
    const allocationsTable = screen.getByRole("table", { name: "проводки по деньгам" });
    expect(within(allocationsTable).getByText("резерв API")).toBeInTheDocument();
    expect(within(allocationsTable).getByText("Polza AI")).toBeInTheDocument();
  });

  it("shows payout statuses without exposing payout destinations", () => {
    render(
      <FinancePage
        payouts={[{
          id: "payout-1",
          withdrawalId: "withdrawal-1",
          amount: 250,
          currency: "RUB",
          method: "СБП",
          provider: "ЮKassa Payouts API",
          status: "succeeded",
          payoutStatus: "succeeded",
          destinationHint: "+7••• •••-12-34",
        }]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "выплаты" }));
    expect(screen.getByText("выплачено")).toBeInTheDocument();
    expect(screen.getByText("+7••• •••-12-34")).toBeInTheDocument();
    expect(screen.queryByText("4111111111111111")).not.toBeInTheDocument();
  });
});
