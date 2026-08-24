// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App, displaySubscriptionPlan } from "./App.jsx";

const sections = [
  ["users", "пользователи"],
  ["finance", "деньги"],
  ["referrals", "партнёрская программа"],
  ["generations", "генерации"],
  ["catalog", "каталог продукта"],
  ["providers", "провайдеры"],
  ["alerts", "инциденты"],
  ["subscriptions", "подписки"],
  ["promos", "промокоды"],
  ["audit", "журнал действий"],
  ["agent", "ИИ-мастер"],
  ["settings", "настройки"],
];

function openSection(id) {
  fireEvent.click(screen.getByTestId(`nav-${id}`));
}

describe("CRM App smoke", () => {
  it("filters overview totals and series when the reporting period changes", () => {
    const { container } = render(<App />);
    const paidKpi = screen.getByText("оплачено").closest("article");
    const activityChart = screen.getByRole("img", { name: /выручка и генерации по дням/u });
    const initialRevenue = paidKpi.textContent;
    const initialSeries = activityChart.querySelector(".overview-activity-chart__line.is-revenue")?.getAttribute("points");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "day" } });

    expect(paidKpi.textContent).not.toBe(initialRevenue);
    expect(paidKpi).toHaveTextContent("749 ₽");
    expect(activityChart.querySelector(".overview-activity-chart__line.is-revenue")?.getAttribute("points"))
      .not.toBe(initialSeries);
    expect(container.querySelector('.period-select select')).toHaveValue("day");
  });

  it("normalizes removed test tariffs before they reach dashboard views", () => {
    expect(displaySubscriptionPlan("test_140")).toBe("архивный тариф");
    expect(displaySubscriptionPlan("test_110")).toBe("архивный тариф");
    expect(displaySubscriptionPlan("final_test_130")).toBe("архивный тариф");
    expect(displaySubscriptionPlan("финальный новый")).toBe("архивный тариф");
    expect(displaySubscriptionPlan("business")).toBe("исследователь");
  });

  it("opens every key section from the persistent sidebar", () => {
    render(<App />);

    expect(screen.getByTestId("nav-overview")).toHaveClass("is-active");

    for (const [id, title] of sections) {
      openSection(id);
      expect(screen.getByTestId(`nav-${id}`)).toHaveClass("is-active");
      expect(
        screen.getAllByRole("heading", { name: title }).length,
      ).toBeGreaterThan(0);
    }
  });

  it("finds a test user and opens the complete user card", () => {
    render(<App />);
    openSection("users");

    const search = screen.getByRole("searchbox", {
      name: "поиск пользователей",
    });
    fireEvent.change(search, { target: { value: "Ирина" } });

    expect(screen.getByText("Ирина Волкова")).toBeInTheDocument();
    expect(screen.queryByText("Максим Орлов")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "открыть Ирина Волкова" }),
    );

    expect(
      screen.getByRole("heading", { name: "Ирина Волкова" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("@irina_ai").length).toBeGreaterThan(0);
  });

  it("toggles a provider without losing the fallback control surface", () => {
    render(<App />);
    openSection("providers");

    fireEvent.click(
      screen.getByRole("button", { name: "отключить OpenRouter" }),
    );

    expect(
      screen.getByRole("button", { name: "включить OpenRouter" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("fallback-цепочка")).not.toHaveTextContent(
      "OpenRouter",
    );
  });

  it("resolves an incident and removes it from the active queue", async () => {
    render(<App />);
    openSection("alerts");

    const resolveButton = screen.getAllByRole("button", {
      name: /^закрыть inc-/,
    })[0];
    const incidentId = resolveButton.getAttribute("aria-label").split(" ")[1];
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: `закрыть ${incidentId}` }),
      ).not.toBeInTheDocument();
    });
  });

  it("creates a normalized promo and exposes it in the promo list", async () => {
    render(<App />);
    openSection("promos");

    fireEvent.change(screen.getByLabelText("код"), {
      target: { value: " smoke25 " },
    });
    fireEvent.change(screen.getByLabelText("метакоины"), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "создать промокод" }));

    await waitFor(() =>
      expect(screen.getAllByText("SMOKE25").length).toBeGreaterThan(0),
    );
    expect(
      screen.getByRole("button", { name: "приостановить SMOKE25" }),
    ).toBeInTheDocument();
  });

  it("never renders user prompts or generated output in the operations journal", () => {
    render(<App />);
    openSection("generations");

    const journal = screen.getByRole("region", { name: "генерации" });
    expect(journal).toHaveTextContent(
      "только технические метаданные — без запросов и результатов пользователей",
    );
    expect(
      within(journal).queryByText(/prompt|output|текст запроса|результат генерации/i),
    ).not.toBeInTheDocument();
    expect(
      within(journal).queryByRole("textbox", { name: /prompt|результат/i }),
    ).not.toBeInTheDocument();
  });

  it("runs the admin controls in a user card and opens that user's finances", () => {
    render(<App />);
    openSection("users");

    fireEvent.click(
      screen.getByRole("button", { name: "открыть Ирина Волкова" }),
    );
    const card = screen.getByLabelText("карточка пользователя");

    fireEvent.change(within(card).getByLabelText("количество метакоинов"), {
      target: { value: "100" },
    });
    fireEvent.change(within(card).getByLabelText("причина изменения баланса"), {
      target: { value: "ручная компенсация" },
    });
    fireEvent.click(
      within(card).getByRole("button", { name: "применить изменение" }),
    );
    expect(card).toHaveTextContent("840");
    expect(screen.getByText("баланс обновлён")).toBeInTheDocument();

    fireEvent.change(within(card).getByLabelText("направление операции"), {
      target: { value: "debit" },
    });
    fireEvent.click(
      within(card).getByRole("button", { name: "применить изменение" }),
    );
    expect(card).toHaveTextContent("740");

    fireEvent.click(within(card).getByRole("button", { name: "сменить тариф" }));
    expect(card).toHaveTextContent("автор");

    fireEvent.click(within(card).getByRole("button", { name: "заблокировать" }));
    expect(within(card).getByRole("button", { name: "разблокировать" })).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: "открыть деньги" }));
    expect(screen.getByTestId("nav-finance")).toHaveClass("is-active");
    expect(screen.getByText("открыты операции пользователя")).toBeInTheDocument();
  });

  it("opens payment and ledger metadata, supports refund, warning, and drawer close", () => {
    render(<App />);
    openSection("finance");

    fireEvent.click(screen.getByRole("button", { name: "открыть платёж pay-2001" }));
    let drawer = screen.getByRole("dialog", { name: "платёж pay-2001" });
    expect(drawer).toHaveTextContent("idempotencyKey");
    fireEvent.click(within(drawer).getByRole("button", { name: "оформить возврат" }));
    expect(screen.getByText("возврат зафиксирован")).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "закрыть" }));

    fireEvent.click(screen.getByRole("button", { name: "открыть платёж pay-2003" }));
    drawer = screen.getByRole("dialog", { name: "платёж pay-2003" });
    fireEvent.click(within(drawer).getByRole("button", { name: "оформить возврат" }));
    expect(screen.getByText("возврат недоступен")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "закрыть панель" }));

    fireEvent.click(screen.getByRole("tab", { name: "операции с метакоинами" }));
    const ledgerButton = screen.getAllByRole("button", { name: /^открыть запись/ })[0];
    fireEvent.click(ledgerButton);
    expect(screen.getByRole("dialog", { name: /^операция / })).toBeInTheDocument();
  });

  it("probes providers and acknowledges incidents", async () => {
    render(<App />);
    openSection("providers");

    fireEvent.click(screen.getByRole("button", { name: "проверить OpenRouter" }));
    await waitFor(() =>
      expect(screen.getByText("проверка завершена")).toBeInTheDocument(),
    );

    openSection("alerts");
    fireEvent.click(screen.getByRole("button", { name: "принять inc-6001" }));
    await waitFor(() =>
      expect(screen.getByText("инцидент принят")).toBeInTheDocument(),
    );

  });

  it("offers a provider check from an actionable incident", async () => {
    render(<App />);
    openSection("alerts");

    fireEvent.click(screen.getAllByRole("button", { name: "повторить проверку" })[0]);
    await waitFor(() =>
      expect(screen.getByText("проверка завершена")).toBeInTheDocument(),
    );
  });

  it("pauses and restores an existing promo code", () => {
    render(<App />);
    openSection("promos");

    fireEvent.click(
      screen.getByRole("button", { name: "приостановить WELCOME20" }),
    );
    expect(
      screen.getByRole("button", { name: "активировать WELCOME20" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "активировать WELCOME20" }),
    );
    expect(
      screen.getByRole("button", { name: "приостановить WELCOME20" }),
    ).toBeInTheDocument();
  });

  it("keeps the ИИ-мастер as one chat without a separate repair wizard", () => {
    render(<App />);
    openSection("agent");

    expect(screen.getByLabelText("сообщение агенту")).toBeInTheDocument();
    expect(screen.queryByText("план работ")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("контрольная фраза")).not.toBeInTheDocument();
  });

  it("updates settings and uses topbar shortcuts without losing navigation", () => {
    render(<App />);

    const period = screen.getByRole("combobox");
    fireEvent.change(period, { target: { value: "month" } });
    expect(period).toHaveValue("month");

    expect(screen.queryByRole("button", { name: /найти пользователя/i })).not.toBeInTheDocument();

    openSection("settings");
    const toggles = screen.getAllByRole("checkbox");
    expect(toggles[0]).toBeChecked();
    fireEvent.click(toggles[0]);
    expect(toggles[0]).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /открыть ИИ-мастер/i }));
    expect(screen.getAllByRole("heading", { name: "ИИ-мастер" })).toHaveLength(2);
  });

  it("opens generation metadata in the safe drawer and never shows content fields", () => {
    render(<App />);
    openSection("generations");

    const openGeneration = screen.getAllByRole("button", {
      name: /^открыть генерацию/,
    })[0];
    fireEvent.click(openGeneration);

    const drawer = screen.getByRole("dialog", { name: /^генерация / });
    expect(drawer).toHaveTextContent("безопасные метаданные");
    expect(drawer).not.toHaveTextContent(/prompt|output|content|response/i);
  });
});
