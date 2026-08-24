// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PolzaAuthorizationPanel, PolzaAuthorizationWindow } from "./PolzaAuthorizationPanel.jsx";

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return status >= 200 && status < 300
        ? { success: true, data }
        : { success: false, error: data?.error || "ошибка" };
    },
  };
}

describe("PolzaAuthorizationPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens a separate same-origin authorization window instead of embedding the relay in CRM", async () => {
    const popup = { focus: vi.fn(), opener: {} };
    const open = vi.fn(() => popup);
    vi.stubGlobal("open", open);
    const fetchImpl = async (url) => {
      if (url === "/api/admin/provider-funding/browser-session") {
        return response({ authorization: "required_once", automation: "configured_pending_authorization" });
      }
      throw new Error(`unexpected request ${url}`);
    };

    render(<PolzaAuthorizationPanel enabled fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "открыть отдельное окно авторизации" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "открыть отдельное окно авторизации" }));

    expect(open).toHaveBeenCalledWith(
      "https://metaflora-polza-funding-agent-production.up.railway.app/",
      "_blank",
      "noopener,noreferrer",
    );
    expect(popup.opener).toBeNull();
    expect(popup.focus).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "удалённое окно Polza" })).not.toBeInTheDocument();
  });

  it("shows a useful safe error when the worker browser is unavailable", async () => {
    const fetchImpl = async (url) => {
      if (url === "/api/session") return response({ csrfToken: "csrf" });
      if (url === "/api/admin/provider-funding/browser-session") {
        return response({ authorization: "required_once", automation: "configured_pending_authorization" });
      }
      if (url.endsWith("/authorization/start")) {
        return response({ error: "browser_executable_missing" }, 503);
      }
      throw new Error(`unexpected request ${url}`);
    };

    render(<PolzaAuthorizationPanel enabled standalone fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "открыть окно авторизации" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "открыть окно авторизации" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/браузер worker не установлен/iu));
    expect(screen.getByRole("alert")).not.toHaveTextContent("browser_executable_missing");
  });

  it("uses the authenticated CRM session and completes the one-time remote profile authorization", async () => {
    const calls = [];
    let authorized = false;
    const fetchImpl = async (url, options = {}) => {
      calls.push([url, options]);
      if (url === "/api/session") return response({ csrfToken: "csrf" });
      if (url === "/api/admin/provider-funding/browser-session") {
        return response({
          persistent: true,
          authorization: authorized ? "authorized" : "required_once",
          automation: authorized ? "ready" : "configured_pending_authorization",
          cardEnrollment: "unknown",
        });
      }
      if (url.endsWith("/authorization/start")) {
        return response({
          token: "a".repeat(64),
          active: true,
          authorization: "required_once",
          automation: "configured_pending_authorization",
          expiresAt: "2026-08-08T04:10:00.000Z",
          viewport: { width: 1280, height: 800 },
          image: "data:image/png;base64,cG5n",
        });
      }
      if (url.endsWith("/authorization/action")) {
        authorized = true;
        return response({ active: true, authorization: "authorized", automation: "ready" });
      }
      if (url.endsWith("/authorization/complete")) {
        authorized = true;
        return response({ active: false, authorization: "authorized", automation: "ready" });
      }
      throw new Error(`unexpected request ${url}`);
    };

    render(<PolzaAuthorizationPanel enabled standalone fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "открыть окно авторизации" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "открыть окно авторизации" }));

    await waitFor(() => expect(screen.getByRole("img", { name: "Удалённое окно авторизации Polza" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "↵ Enter" }));
    await waitFor(() => expect(screen.getAllByText("профиль авторизован и готов").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: "завершить и сохранить сессию" }));

    await waitFor(() => expect(screen.getByText("профиль авторизован и готов")).toBeInTheDocument());
    const actionCall = calls.find(([url]) => url.endsWith("/authorization/action"));
    expect(actionCall[1].headers["x-csrf-token"]).toBe("csrf");
    expect(actionCall[1].headers["x-provider-authorization-token"]).toBe("a".repeat(64));
    expect(actionCall[1].body).toBe(JSON.stringify({ type: "press", key: "Enter" }));
    expect(actionCall[1].body).not.toContain("csrf");
  });

  it("forwards a manual screenshot drag with correctly scaled remote coordinates", async () => {
    const actionBodies = [];
    const fetchImpl = async (url, options = {}) => {
      if (url === "/api/session") return response({ csrfToken: "csrf" });
      if (url === "/api/admin/provider-funding/browser-session") {
        return response({ authorization: "required_once", automation: "configured_pending_authorization" });
      }
      if (url.endsWith("/authorization/start")) {
        return response({
          token: "b".repeat(64),
          active: true,
          authorization: "required_once",
          automation: "configured_pending_authorization",
          expiresAt: "2026-08-08T04:10:00.000Z",
          viewport: { width: 1280, height: 800 },
          image: "data:image/png;base64,cG5n",
        });
      }
      if (url.endsWith("/authorization/action")) {
        actionBodies.push(JSON.parse(options.body));
        return response({ active: true, authorization: "required_once", automation: "configured_pending_authorization" });
      }
      throw new Error(`unexpected request ${url}`);
    };

    render(<PolzaAuthorizationPanel enabled standalone fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "открыть окно авторизации" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "открыть окно авторизации" }));

    const remoteScreen = await screen.findByRole("button", { name: "удалённое окно Polza" });
    Object.defineProperty(remoteScreen, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 10, top: 20, width: 640, height: 400 }),
    });
    fireEvent.pointerDown(remoteScreen, { clientX: 110, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(remoteScreen, { clientX: 510, clientY: 320, pointerId: 1 });

    await waitFor(() => expect(actionBodies).toEqual([{
      type: "drag",
      startX: 200,
      startY: 200,
      endX: 1000,
      endY: 600,
    }]));
  });

  it("forwards a click followed by protected text input to the selected remote field", async () => {
    const actionBodies = [];
    const fetchImpl = async (url, options = {}) => {
      if (url === "/api/session") return response({ csrfToken: "csrf" });
      if (url === "/api/admin/provider-funding/browser-session") {
        return response({ authorization: "required_once", automation: "configured_pending_authorization" });
      }
      if (url.endsWith("/authorization/start")) {
        return response({
          token: "c".repeat(64),
          active: true,
          authorization: "required_once",
          automation: "configured_pending_authorization",
          expiresAt: "2026-08-08T04:10:00.000Z",
          viewport: { width: 1280, height: 800 },
          image: "data:image/png;base64,cG5n",
        });
      }
      if (url.endsWith("/authorization/action")) {
        actionBodies.push(JSON.parse(options.body));
        return response({ active: true, authorization: "required_once", automation: "configured_pending_authorization" });
      }
      throw new Error(`unexpected request ${url}`);
    };

    render(<PolzaAuthorizationPanel enabled standalone fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "открыть окно авторизации" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "открыть окно авторизации" }));

    const remoteScreen = await screen.findByRole("button", { name: "удалённое окно Polza" });
    Object.defineProperty(remoteScreen, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 10, top: 20, width: 640, height: 400 }),
    });
    fireEvent.click(remoteScreen, { clientX: 330, clientY: 220 });
    await waitFor(() => expect(actionBodies).toEqual([{
      type: "click",
      x: 640,
      y: 400,
    }]));

    await waitFor(() => expect(remoteScreen).toBeEnabled());
    const input = screen.getByLabelText("текст для удалённого окна Polza");
    fireEvent.change(input, { target: { value: "polza.ai@yandex.com" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(actionBodies).toEqual([
      { type: "click", x: 640, y: 400 },
      { type: "type", text: "polza.ai@yandex.com" },
    ]));
  });

  it("redirects the legacy CRM route to the standalone funding browser", () => {
    const replace = vi.fn();
    render(<PolzaAuthorizationWindow redirectImpl={replace} />);

    expect(screen.getByRole("main", { name: "отдельное окно авторизации Polza" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "открыть рабочее окно" })).toHaveAttribute("href", "https://metaflora-polza-funding-agent-production.up.railway.app/");
    expect(replace).toHaveBeenCalledWith("https://metaflora-polza-funding-agent-production.up.railway.app/");
  });
});
