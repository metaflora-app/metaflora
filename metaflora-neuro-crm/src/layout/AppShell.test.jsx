// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

const defaultProps = {
  activePage: "overview",
  onNavigate: vi.fn(),
  period: "week",
  onPeriodChange: vi.fn(),
  systemHealthy: true,
};

function createStorageMock() {
  const values = new Map();

  return {
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key) => values.get(key) ?? null),
    removeItem: vi.fn((key) => values.delete(key)),
    setItem: vi.fn((key, value) => values.set(key, String(value))),
  };
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the real brand and administrator identity without a global search shortcut", () => {
    const { container } = render(
      <AppShell {...defaultProps}>
        <div>контент</div>
      </AppShell>,
    );

    expect(screen.getByText("МЕТАФЛОРА* нейро")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "логотип МЕТАФЛОРА* нейро" })).toHaveAttribute(
      "src",
      "/assets/metaflora-favicon.png",
    );
    expect(screen.queryByText("crm / live control")).not.toBeInTheDocument();
    expect(container.querySelector(".sidebar-search")).not.toBeInTheDocument();
    expect(container.querySelector(".topbar-search")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /найти пользователя/i })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Иван Мищенко" })).toHaveAttribute(
      "src",
      "/assets/ivan-mishchenko.jpg",
    );
    expect(screen.getByText("Иван Мищенко")).toBeInTheDocument();
    expect(screen.getByText("главный администратор")).toBeInTheDocument();
  });

  it("keeps diagnostics and safe repairs in one ИИ-мастер section", () => {
    const onNavigate = vi.fn();
    render(
      <AppShell {...defaultProps} onNavigate={onNavigate}>
        <div>контент</div>
      </AppShell>,
    );

    expect(screen.getByTestId("nav-agent")).toHaveTextContent("ИИ-мастер");
    expect(screen.queryByTestId("nav-automation")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /открыть ИИ-мастер/i }));
    expect(onNavigate).toHaveBeenCalledWith("agent");
  });

  it("does not expose an empty routing section in navigation", () => {
    render(
      <AppShell {...defaultProps}>
        <div>контент</div>
      </AppShell>,
    );

    expect(screen.queryByTestId("nav-routing")).not.toBeInTheDocument();
    expect(screen.queryByText("маршрутизация", { exact: true })).not.toBeInTheDocument();
  });

  it("toggles and restores the visual theme without storing credentials", () => {
    const { unmount } = render(
      <AppShell {...defaultProps}>
        <div>контент</div>
      </AppShell>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "включить светлую тему" }),
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("metaflora-crm-theme")).toBe("light");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "metaflora-crm-theme",
      "light",
    );
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);

    unmount();
    render(
      <AppShell {...defaultProps}>
        <div>контент</div>
      </AppShell>,
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(
      screen.getByRole("button", { name: "включить тёмную тему" }),
    ).toBeInTheDocument();
  });
});
