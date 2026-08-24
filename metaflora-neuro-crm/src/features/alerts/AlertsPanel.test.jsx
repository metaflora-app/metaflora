// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AlertsPanel } from "./AlertsPanel.jsx";

afterEach(cleanup);

const incidents = [
  {
    id: "inc-1",
    title: "рост ошибок OpenRouter",
    severity: "critical",
    status: "open",
    source: "OpenRouter",
    startedAt: "2026-07-30T10:00:00.000Z",
    summary: "доля ошибок превысила порог",
  },
  {
    id: "inc-2",
    title: "задержка Polza",
    severity: "warning",
    status: "acknowledged",
    source: "Polza",
    startedAt: "2026-07-30T09:00:00.000Z",
  },
];

describe("AlertsPanel", () => {
  it("renders a safe generation failure with normalized provider, model, reason, and retry action", async () => {
    const onProbeProvider = vi.fn().mockResolvedValue({ success: true });
    render(
      <AlertsPanel
        incidents={[
          {
            id: "generation:gen-3",
            title: "provider_error",
            summary: "Bearer super-secret-token; response payload hidden",
            source: "provider_api_calls",
            severity: "critical",
            status: "open",
            service: "gptunnel",
            provider: "gptunnel",
            model: "Kling 3",
            errorCode: "provider_timeout",
            startedAt: "2026-07-30T10:00:00.000Z",
          },
        ]}
        onProbeProvider={onProbeProvider}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "провайдер не ответил вовремя" }),
    ).toBeInTheDocument();
    expect(screen.getByText("GPTunnel")).toBeInTheDocument();
    expect(screen.queryByText(/KIE/i)).not.toBeInTheDocument();
    expect(screen.getByText("Kling 3")).toBeInTheDocument();
    expect(
      screen.getByText("ответ не пришёл в допустимое время"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "повторить проверку" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/provider_error|unknown provider|Bearer|secret/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "повторить проверку" }));
    await waitFor(() => expect(onProbeProvider).toHaveBeenCalledWith("gptunnel"));
  });

  it("uses the real provider retry action for provider_error when a provider id is known", async () => {
    const onProbeProvider = vi.fn().mockResolvedValue(true);
    render(
      <AlertsPanel
        incidents={[
          {
            id: "provider:polza-call-1",
            title: "provider_error",
            source: "provider_api_calls",
            service: "Polza",
            provider: "Polza AI",
            model: "Claude Opus 5",
            errorCode: "provider_error",
            status: "open",
            severity: "warning",
          },
        ]}
        onProbeProvider={onProbeProvider}
      />,
    );

    expect(screen.getByRole("button", { name: "повторить проверку" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "проверить маршрут" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "повторить проверку" }));

    await waitFor(() => expect(onProbeProvider).toHaveBeenCalledWith("polza"));
  });

  it("does not treat a failed provider probe result as a successful retry", async () => {
    const onProbeProvider = vi.fn().mockResolvedValue(null);
    render(
      <AlertsPanel
        incidents={[
          {
            id: "provider:polza-call-2",
            provider: "polza",
            model: "Claude Opus 5",
            errorCode: "provider_timeout",
            status: "open",
          },
        ]}
        onProbeProvider={onProbeProvider}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "повторить проверку" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "не удалось повторить проверку",
      ),
    );
  });

  it("runs an explicit open_provider action only with its supported callback", async () => {
    const onOpenProvider = vi.fn().mockResolvedValue({ success: true });
    render(
      <AlertsPanel
        incidents={[
          {
            id: "provider:gptunnel-call-1",
            provider: "GPTunnel",
            model: "Seedance",
            errorCode: "provider_auth_failed",
            action: "open_provider",
            status: "open",
          },
        ]}
        onOpenProvider={onOpenProvider}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "открыть провайдера" }));
    await waitFor(() => expect(onOpenProvider).toHaveBeenCalledWith("gptunnel"));
  });

  it("does not infer an unsupported route action from a provider error", () => {
    const onProbeProvider = vi.fn().mockResolvedValue(true);
    render(
      <AlertsPanel
        incidents={[
          {
            id: "provider:polza-call-route",
            provider: "polza",
            model: "Claude Opus 5",
            errorCode: "provider_error",
            routeId: "route-text",
            status: "open",
          },
        ]}
        onProbeProvider={onProbeProvider}
      />,
    );

    expect(screen.getByRole("button", { name: "повторить проверку" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "проверить маршрут" })).not.toBeInTheDocument();
  });

  it("redacts raw provider errors and does not invent an unsupported provider action", () => {
    render(
      <AlertsPanel
        incidents={[
          {
            id: "provider:call-unknown",
            title: "unknown provider: provider_error",
            summary: "api_key=private-value response_payload=secret-body",
            source: "provider_api_calls",
            severity: "warning",
            status: "open",
            service: "unknown provider",
            provider: "unknown provider",
            model: "openai/gpt-5.6",
            errorCode: "provider_error",
            startedAt: "2026-07-30T10:00:00.000Z",
          },
        ]}
        onOpenProvider={vi.fn()}
      />,
    );

    expect(screen.getByText("провайдер не определён")).toBeInTheDocument();
    expect(screen.getByText("openai/gpt-5.6")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "не удалось выполнить генерацию" })).toBeInTheDocument();
    expect(screen.getByText("безопасная причина не определена; детали ответа скрыты")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "открыть провайдера" })).not.toBeInTheDocument();
    expect(screen.queryByText(/provider_error|unknown provider|api_key|private-value|secret-body/i)).not.toBeInTheDocument();
  });

  it("renders route check only when the supported callback is supplied", async () => {
    const onCheckRoute = vi.fn().mockResolvedValue({ success: true });
    const incident = {
      id: "route:route-text",
      title: "provider_error",
      source: "routing_engine",
      severity: "warning",
      status: "open",
      service: "requesty",
      provider: "requesty",
      model: "Gemini 3.6",
      routeId: "route-text",
      action: "check_route",
      errorCode: "provider_5xx",
      startedAt: "2026-07-30T10:00:00.000Z",
    };

    const { rerender } = render(
      <AlertsPanel incidents={[incident]} onCheckRoute={onCheckRoute} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "проверить маршрут" }));
    await waitFor(() => expect(onCheckRoute).toHaveBeenCalledWith("route-text"));

    rerender(<AlertsPanel incidents={[incident]} />);
    expect(screen.queryByRole("button", { name: "проверить маршрут" })).not.toBeInTheDocument();
  });

  it("allows open incidents to be acknowledged and acknowledged ones resolved", () => {
    const onAcknowledge = vi.fn();
    const onResolve = vi.fn();
    render(
      <AlertsPanel
        incidents={incidents}
        onAcknowledge={onAcknowledge}
        onResolve={onResolve}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "принять inc-1" }));
    fireEvent.click(screen.getByRole("button", { name: "закрыть inc-2" }));

    expect(onAcknowledge).toHaveBeenCalledWith("inc-1");
    expect(onResolve).toHaveBeenCalledWith("inc-2");
  });

  it("shows an empty state without action controls", () => {
    render(<AlertsPanel incidents={[]} />);

    expect(screen.getByText("активных инцидентов нет")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a safe error when an incident action rejects", async () => {
    render(
      <AlertsPanel
        incidents={incidents}
        onAcknowledge={() => Promise.reject(new Error("private upstream error"))}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "принять inc-1" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "не удалось принять инцидент",
      ),
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("private");
  });
});
