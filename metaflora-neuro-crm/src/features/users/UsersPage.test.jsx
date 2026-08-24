// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UsersPage } from "./UsersPage.jsx";

const users = [
  {
    id: "usr-1",
    name: "Ирина Волкова",
    email: "irina@example.ru",
    telegramUsername: "@irina",
    status: "active",
    plan: "любитель",
    receiptEmail: "receipt@example.ru",
    lastReceiptStatus: "succeeded",
    registeredAt: "2026-07-20T00:00:00.000Z",
    metacoinBalance: 300,
    subscriptionMetacoinsTotal: 300,
    subscriptionMetacoinsRemaining: 180,
    generalMetacoinBalance: 300,
    packageMetacoinBalance: 120,
    lastSeenAt: "2026-07-30T09:10:00.000Z",
  },
  {
    id: "usr-2",
    name: "Алексей Смирнов",
    email: "alex@example.ru",
    telegramUsername: "@alex",
    status: "blocked",
    plan: "новичок",
    registeredAt: "2026-06-10T00:00:00.000Z",
    metacoinBalance: 10,
  },
];

afterEach(cleanup);

describe("UsersPage", () => {
  it("searches, filters and reports the active query", () => {
    const onFiltersChange = vi.fn();

    render(<UsersPage users={users} onFiltersChange={onFiltersChange} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "поиск пользователей" }), {
      target: { value: "ирина" },
    });

    expect(screen.getByText("Ирина Волкова")).toBeInTheDocument();
    expect(screen.queryByText("Алексей Смирнов")).not.toBeInTheDocument();
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: "ирина" }),
    );
  });

  it("opens a user card and delegates user actions", () => {
    const onSelectUser = vi.fn();
    const onToggleBlocked = vi.fn();

    render(
      <UsersPage
        users={users}
        onSelectUser={onSelectUser}
        onToggleBlocked={onToggleBlocked}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "открыть Ирина Волкова" }));

    expect(onSelectUser).toHaveBeenCalledWith(users[0]);
    expect(screen.getByRole("heading", { name: "Ирина Волкова" })).toBeInTheDocument();
    expect(screen.getByText("e-mail для чека")).toBeInTheDocument();
    expect(screen.getByText("receipt@example.ru")).toBeInTheDocument();
    expect(screen.getByText("последний чек")).toBeInTheDocument();
    expect(screen.getByText("отправлен")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "заблокировать" }));
    expect(onToggleBlocked).toHaveBeenCalledWith(users[0]);
  });

  it("shows subscription/package limits and the latest upgrade audit", () => {
    render(
      <UsersPage
        users={users}
        selectedUserId="usr-1"
        selectedUserDetails={{
          subscriptionUpgrades: [{
            id: "upgrade-1",
            fromPlan: "автор",
            toPlan: "исследователь",
            creditedDelta: 730,
            beforeSubscriptionRemaining: 120,
            afterSubscriptionRemaining: 850,
            occurredAt: "2026-08-11T07:00:00.000Z",
          }],
          providerFunding: [{
            allocationKey: "pay-1:api_reserve:polza",
            provider: "Polza AI",
            allocatedKopecks: 20_000,
            fundedKopecks: 10_000,
            remainingKopecks: 10_000,
            fundingStatus: "processing",
          }],
        }}
      />,
    );

    expect(screen.getByText("лимит тарифа")).toBeInTheDocument();
    expect(screen.getByText("180 из 300")).toBeInTheDocument();
    expect(screen.getByText("пакетные / общие")).toBeInTheDocument();
    expect(screen.getByText("120 / 300")).toBeInTheDocument();
    expect(screen.getByText("автор → исследователь")).toBeInTheDocument();
    expect(screen.getByText("начислено: 730")).toBeInTheDocument();
    expect(screen.getByText("Polza AI: осталось профинансировать 100 ₽")).toBeInTheDocument();
  });

  it("shows a clear empty state", () => {
    render(<UsersPage users={[]} />);

    expect(screen.getByText("здесь пока никого нет")).toBeInTheDocument();
  });

  it("combines status and plan filters", () => {
    render(<UsersPage users={users} />);

    fireEvent.change(screen.getByLabelText("статус"), {
      target: { value: "blocked" },
    });
    fireEvent.change(screen.getByLabelText("тариф"), {
      target: { value: "новичок" },
    });

    expect(screen.getByText("Алексей Смирнов")).toBeInTheDocument();
    expect(screen.queryByText("Ирина Волкова")).not.toBeInTheDocument();
  });

  it("supports every action on a blocked user card", () => {
    const onChangePlan = vi.fn();
    const onOpenFinance = vi.fn();
    const onToggleBlocked = vi.fn();
    render(
      <UsersPage
        users={users}
        onChangePlan={onChangePlan}
        onOpenFinance={onOpenFinance}
        onToggleBlocked={onToggleBlocked}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "открыть Алексей Смирнов" }));
    fireEvent.click(screen.getByRole("button", { name: "сменить тариф" }));
    fireEvent.click(screen.getByRole("button", { name: "открыть деньги" }));
    fireEvent.click(screen.getByRole("button", { name: "разблокировать" }));

    expect(onChangePlan).toHaveBeenCalledWith(users[1]);
    expect(onOpenFinance).toHaveBeenCalledWith(users[1]);
    expect(onToggleBlocked).toHaveBeenCalledWith(users[1]);
  });

  it("renders sparse user data without breaking the profile", () => {
    render(
      <UsersPage
        users={[
          {
            id: "usr-sparse",
            status: "unknown",
            plan: "legacy",
            registeredAt: "not-a-date",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "открыть usr-sparse" }));

    expect(screen.getByRole("heading", { name: "без имени" })).toBeInTheDocument();
    expect(screen.getAllByText("неизвестно")).not.toHaveLength(0);
    expect(screen.getByText("контакт не указан")).toBeInTheDocument();
  });

  it("supports expert plan and controlled close", () => {
    const businessUser = { ...users[0], plan: "эксперт" };
    const onCloseUser = vi.fn();
    render(
      <UsersPage
        users={[businessUser]}
        selectedUserId={businessUser.id}
        onCloseUser={onCloseUser}
      />,
    );

    expect(screen.getAllByText("эксперт")).not.toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "закрыть карточку" }));
    expect(onCloseUser).toHaveBeenCalledOnce();
  });

  it("submits an arbitrary signed metacoin adjustment with an audit reason", () => {
    const onAdjustMetacoins = vi.fn();
    render(
      <UsersPage users={users} onAdjustMetacoins={onAdjustMetacoins} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "открыть Ирина Волкова" }));
    fireEvent.change(screen.getByLabelText("направление операции"), {
      target: { value: "debit" },
    });
    fireEvent.change(screen.getByLabelText("количество метакоинов"), {
      target: { value: "37" },
    });
    fireEvent.change(screen.getByLabelText("причина изменения баланса"), {
      target: { value: "ручная компенсация" },
    });
    fireEvent.click(screen.getByRole("button", { name: "применить изменение" }));

    expect(onAdjustMetacoins).toHaveBeenCalledWith(
      "usr-1",
      -37,
      "ручная компенсация",
    );
  });
});
