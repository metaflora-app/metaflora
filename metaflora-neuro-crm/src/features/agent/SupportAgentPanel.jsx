import { useEffect, useState } from "react";
import {
  executeDiagnosticRepair,
  loadAgentDiagnostics,
  loadAgentStatus,
  sendAgentMessage,
} from "../../data/agent-client";

function activeProductionIncidents(snapshot) {
  const candidates = [
    ...(Array.isArray(snapshot?.incidents) ? snapshot.incidents : []),
    ...(Array.isArray(snapshot?.providers)
      ? snapshot.providers.flatMap((provider) => (
          Array.isArray(provider?.incidents)
            ? provider.incidents.map((incident) => ({
                provider: incident.provider ?? provider.id,
                ...incident,
              }))
            : []
        ))
      : []),
  ];
  const seen = new Set();
  return candidates.filter((incident) => {
    const status = String(incident?.status ?? "open").toLowerCase();
    if (["closed", "resolved", "ignored"].includes(status)) return false;
    const key = String(
      incident?.id
        ?? [
          incident?.generationId,
          incident?.providerRequestId,
          incident?.errorCode ?? incident?.code,
          incident?.model ?? incident?.providerModelId,
        ].join("|"),
    );
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function incidentSummary(incident) {
  const provider = incident?.provider ?? "провайдер не определён";
  const model = incident?.model ?? incident?.providerModelId ?? "модель не определена";
  const code = incident?.errorCode ?? incident?.code ?? "код не определён";
  const httpStatus = incident?.httpStatus ? ` HTTP ${incident.httpStatus}.` : "";
  const generation = incident?.generationId ? ` generation ${incident.generationId}.` : "";
  return `${provider} / ${model}: ${code}.${httpStatus}${generation}`;
}

export function SupportAgentPanel({
  loadStatus = loadAgentStatus,
  sendMessage = (messages) => sendAgentMessage(messages),
  loadDiagnostics = loadAgentDiagnostics,
  executeRepair = executeDiagnosticRepair,
}) {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function appendAssistant(content, extra = {}) {
    setMessages((current) => [
      ...current,
      { role: "assistant", content, ...extra },
    ]);
  }

  useEffect(() => {
    let mounted = true;
    loadStatus()
      .then((nextStatus) => {
        if (mounted) setStatus(nextStatus);
      })
      .catch((caughtError) => {
        if (mounted) setStatusError(caughtError?.message || "статус агента недоступен");
      });
    return () => {
      mounted = false;
    };
  }, [loadStatus]);

  async function submit(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || !status?.connected || pending) return;
    const nextMessages = [...messages, { role: "user", content }];
    setInput("");
    setMessages(nextMessages);
    setPending(true);
    setError("");
    try {
      const reply = await sendMessage(nextMessages);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: reply.answer,
          repairPlan: reply.repairPlan ?? [],
          toolActions: reply.toolActions ?? [],
        },
      ]);
    } catch (caughtError) {
      setError(caughtError?.message || "агент не ответил");
    } finally {
      setPending(false);
    }
  }

  async function checkSystem() {
    if (pending || !status?.connected) return;
    setPending(true);
    setError("");
    try {
      const snapshot = await loadDiagnostics();
      const productionIncidents = activeProductionIncidents(snapshot);
      const failedCheck = snapshot?.checks?.find((check) => check.status === "failed");
      const managedFailedCheck = snapshot?.managedDiagnostics?.checks?.find(
        (check) => check.status === "failed",
      );
      if (productionIncidents.length > 0) {
        const details = productionIncidents
          .slice(0, 5)
          .map((incident) => `• ${incidentSummary(incident)}`)
          .join("\n");
        appendAssistant(
          `обнаружено открытых production-инцидентов: ${productionIncidents.length}.\n${details}\nпроверка canary сама по себе не означает, что генерации работают.`,
        );
      } else if (failedCheck || managedFailedCheck) {
        const check = failedCheck ?? managedFailedCheck;
        appendAssistant(`найдена проблема: ${check.label ?? "контрольная диагностика"}. трафик пользователей не затронут.`, {
          toolActions: check.proposedRepair?.actionId
            ? [{
                id: check.proposedRepair.actionId,
                label: "применить исправление",
              }]
            : [],
        });
      } else {
        appendAssistant("проверка завершена. контролируемые узлы работают штатно.");
      }
    } catch (caughtError) {
      setError(caughtError?.message || "диагностика не ответила");
    } finally {
      setPending(false);
    }
  }

  async function runRepair(actionId) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await executeRepair(actionId);
      const snapshot = await loadDiagnostics();
      const status = snapshot?.status ?? snapshot?.managedDiagnostics?.status;
      const verified = result?.verified && status === "healthy";
      appendAssistant(
        verified
          ? "исправление применено и проверено. контрольная диагностика снова работает штатно."
          : "исправление выполнено, но повторная проверка не подтвердила восстановление.",
      );
    } catch (caughtError) {
      setError(caughtError?.message || "исправление не выполнено");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="agent-panel" aria-labelledby="agent-title">
      <header className="feature-heading">
        <div>
          <p className="eyebrow">техническая поддержка</p>
          <h2 id="agent-title">ИИ-мастер</h2>
          <p>проверяет состояние CRM, находит причину сбоя и готовит безопасное исправление</p>
        </div>
        <span className={`status-badge status-badge--${status?.connected ? "healthy" : "down"}`}>
          {status?.connected ? "агент подключён" : "агент не подключён"}
        </span>
      </header>

      {statusError ? <p className="agent-alert">{statusError}</p> : null}
      {status && !status.connected ? (
        <div className="agent-disconnected">
          <strong>агент не подключён</strong>
          <span>подключение ещё не настроено. до этого момента диагностика недоступна.</span>
        </div>
      ) : null}

      <div className="agent-chat">
        <div className="agent-chat__controls">
          <button
            type="button"
            onClick={checkSystem}
            disabled={!status?.connected || pending}
          >
            проверить систему
          </button>
        </div>
        <div className="agent-chat__log" aria-live="polite">
          {messages.length === 0 ? (
            <p className="agent-empty">спроси, что чинить первым, или попроси план диагностики</p>
          ) : (
            messages.map((message, index) => (
              <article className={`agent-message agent-message--${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === "user" ? "вы" : "агент"}</span>
                <p>{message.content}</p>
                {message.repairPlan?.length ? (
                  <ol className="agent-message__steps">
                    {message.repairPlan.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                ) : null}
                {message.toolActions?.length ? (
                  <div className="agent-message__actions" aria-label="доступные проверки">
                    {message.toolActions.map((action) => (
                      action.id === "repair_synthetic_canary" ? (
                        <button
                          type="button"
                          key={action.id}
                          onClick={() => runRepair(action.id)}
                          disabled={pending}
                        >
                          {action.label ?? "применить исправление"}
                        </button>
                      ) : (
                        <span key={action.id}>{action.label ?? action.id}</span>
                      )
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>

        <form className="agent-input" onSubmit={submit}>
          <label>
            <span>сообщение агенту</span>
            <textarea
              aria-label="сообщение агенту"
              value={input}
              maxLength={2_000}
              onChange={(event) => setInput(event.target.value)}
              placeholder="что сломано и что проверить первым?"
            />
          </label>
          <button type="submit" disabled={!status?.connected || pending || !input.trim()}>
            отправить
          </button>
        </form>
      </div>

      {error ? <p className="agent-alert">{error}</p> : null}

    </section>
  );
}
