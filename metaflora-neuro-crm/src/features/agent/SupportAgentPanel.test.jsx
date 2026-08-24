// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SupportAgentPanel } from "./SupportAgentPanel.jsx";

describe("SupportAgentPanel", () => {
  it("shows a useful disconnected state without exposing internal configuration", async () => {
    render(
      <SupportAgentPanel
        loadStatus={async () => ({
          connected: false,
          missingEnv: ["OPENROUTER_API_KEY", "CRM_AGENT_MODEL"],
          invalidEnv: [],
          model: null,
          mode: "read-only",
        })}
      />,
    );

    expect(await screen.findByText("агент не подключён")).toBeInTheDocument();
    expect(screen.getByText(/подключение ещё не настроено/i)).toBeInTheDocument();
    expect(screen.queryByText(/OPENROUTER_API_KEY/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "отправить" })).toBeDisabled();
  });

  it("renders one chat workspace without exposing model or provider", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      answer: "Сначала проверяем readiness и OpenRouter errors.",
      repairPlan: ["Проверить /api/readiness", "Разобрать provider_timeout"],
      toolActions: [
        { id: "inspect_readiness", label: "Readiness", mode: "read-only" },
      ],
    });

    render(
      <SupportAgentPanel
        loadStatus={async () => ({
          connected: true,
          provider: "openrouter",
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          missingEnv: [],
          invalidEnv: [],
          mode: "read-only",
        })}
        sendMessage={sendMessage}
      />,
    );

    await screen.findByText("агент подключён");
    fireEvent.change(screen.getByLabelText("сообщение агенту"), {
      target: { value: "что чинить первым?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "отправить" }));

    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(await screen.findByText(/Сначала проверяем readiness/)).toBeInTheDocument();
    const assistantMessage = screen.getByText(/Сначала проверяем readiness/).closest("article");
    expect(assistantMessage).toHaveTextContent("Проверить /api/readiness");
    expect(assistantMessage).toHaveTextContent("Readiness");
    expect(screen.queryByRole("complementary", { name: "план исправления" })).not.toBeInTheDocument();
    expect(document.querySelector(".safe-automation")).not.toBeInTheDocument();
    expect(screen.queryByText(/nvidia\/nemotron/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/provider:/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ИИ-мастер" })).toBeInTheDocument();
  });

  it("shows diagnostics in the chat and applies an allowlisted repair", async () => {
    const loadDiagnostics = vi
      .fn()
      .mockResolvedValueOnce({
        status: "degraded",
        checkedAt: "2026-08-02T10:00:00.000Z",
        checks: [{
          id: "synthetic-canary",
          label: "контрольная диагностика",
          status: "failed",
          proposedRepair: { actionId: "repair_synthetic_canary" },
        }],
      })
      .mockResolvedValueOnce({
        status: "healthy",
        checkedAt: "2026-08-02T10:01:00.000Z",
        checks: [{ id: "synthetic-canary", label: "контрольная диагностика", status: "healthy" }],
      });
    const executeRepair = vi.fn().mockResolvedValue({ status: "healthy", verified: true });

    render(
      <SupportAgentPanel
        loadStatus={async () => ({ connected: true })}
        loadDiagnostics={loadDiagnostics}
        executeRepair={executeRepair}
      />,
    );

    await screen.findByText("агент подключён");
    fireEvent.click(screen.getByRole("button", { name: "проверить систему" }));
    expect(await screen.findByText(/найдена проблема: контрольная диагностика/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "применить исправление" }));

    await waitFor(() => expect(executeRepair).toHaveBeenCalledWith("repair_synthetic_canary"));
    expect(await screen.findByText(/исправление применено и проверено/i)).toBeInTheDocument();
    expect(loadDiagnostics).toHaveBeenCalledTimes(2);
  });

  it("does not report healthy while production incidents are open", async () => {
    const loadDiagnostics = vi.fn().mockResolvedValue({
      health: { status: "ok" },
      managedDiagnostics: {
        status: "healthy",
        checks: [{ id: "synthetic_controlled_canary", status: "healthy" }],
      },
      incidents: [{
        id: "incident-1",
        status: "open",
        provider: "polza",
        model: "openai/gpt-5.4-image-2",
        errorCode: "provider_timeout",
        httpStatus: 504,
        generationId: "gen-1",
      }],
    });

    render(
      <SupportAgentPanel
        loadStatus={async () => ({ connected: true })}
        loadDiagnostics={loadDiagnostics}
      />,
    );

    await screen.findByText("агент подключён");
    fireEvent.click(screen.getByRole("button", { name: "проверить систему" }));

    expect(await screen.findByText(/открытых production-инцидентов/i)).toBeInTheDocument();
    expect(screen.getByText(/provider_timeout/)).toBeInTheDocument();
    expect(screen.getByText(/gpt-5\.4-image-2/)).toBeInTheDocument();
    expect(screen.queryByText(/контролируемые узлы работают штатно/i)).not.toBeInTheDocument();
  });
});
