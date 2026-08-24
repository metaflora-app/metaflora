import { useEffect, useRef, useState } from "react";

import { loadAdminSession } from "../../data/admin-client";

const AUTHORIZATION_TOKEN_HEADER = "x-provider-authorization-token";
const POLZA_FUNDING_BROWSER_URL = "https://metaflora-polza-funding-agent-production.up.railway.app/";

const AUTHORIZATION_ERROR_MESSAGES = Object.freeze({
  browser_executable_missing: "Браузер worker не установлен в production. Авторизация не началась, списаний не было.",
  browser_system_dependency_missing: "В production не хватает системной зависимости браузера. Авторизация не началась, списаний не было.",
  browser_launch_failed: "Браузер worker не запустился. Авторизация не началась, списаний не было.",
  browser_timeout: "Polza не ответила вовремя. Авторизация не началась, попробуй открыть окно ещё раз.",
  browser_navigation_failed: "Не удалось открыть Polza из worker. Авторизация не началась, списаний не было.",
  authorization_start_rate_limited: "Окно авторизации открывали слишком часто. Подожди несколько минут и повтори попытку.",
});

function responseError(body, fallback) {
  const code = String(body?.error ?? "").trim().toLowerCase();
  return AUTHORIZATION_ERROR_MESSAGES[code]
    || fallback
    || "Не удалось открыть окно авторизации. Причина записана в журнал CRM.";
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success !== true) {
    throw new Error(responseError(body, `CRM ответила ${response.status}`));
  }
  return body.data;
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, {
    credentials: "same-origin",
    ...options,
  });
  return readJson(response);
}

function statusLabel(status) {
  if (status?.authorization === "authorized" && status?.automation === "ready") {
    return "профиль авторизован и готов";
  }
  if (status?.authorization === "required_once") return "нужен первичный вход в Polza";
  if (status?.automation === "blocked_until_user_action") return "нужно действие в окне Polza";
  return "статус проверяется";
}

function actionButtonLabel(action) {
  return {
    "press:Enter": "↵ Enter",
    "press:Tab": "⇥ Tab",
    "press:Escape": "Esc",
    "scroll:-650": "прокрутить вверх",
    "scroll:650": "прокрутить вниз",
    reload: "обновить окно",
    back: "назад",
  }[action] || action;
}

export function PolzaAuthorizationPanel({
  enabled = false,
  fetchImpl = globalThis.fetch,
  standalone = false,
}) {
  const [status, setStatus] = useState(null);
  const [view, setView] = useState(null);
  const [token, setToken] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [typedText, setTypedText] = useState("");
  const [secretMode, setSecretMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const dragStartRef = useRef(null);
  const suppressClickRef = useRef(false);

  async function loadStatus() {
    if (!enabled || typeof fetchImpl !== "function") return;
    try {
      const nextStatus = await requestJson(fetchImpl, "/api/admin/provider-funding/browser-session");
      setStatus(nextStatus);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "статус временно недоступен");
    }
  }

  async function loadView(nextToken = token) {
    if (!nextToken || typeof fetchImpl !== "function") return;
    const nextView = await requestJson(fetchImpl, "/api/admin/provider-funding/authorization/view", {
      headers: { [AUTHORIZATION_TOKEN_HEADER]: nextToken },
    });
    setView(nextView);
    setStatus((current) => ({
      ...current,
      authorization: nextView.authorization ?? current?.authorization,
      automation: nextView.automation ?? current?.automation,
      cardEnrollment: nextView.cardEnrollment ?? current?.cardEnrollment,
    }));
  }

  useEffect(() => {
    if (!enabled || typeof fetchImpl !== "function") return undefined;
    void loadStatus();
    const interval = window.setInterval(() => void loadStatus(), 30_000);
    return () => window.clearInterval(interval);
  }, [enabled, fetchImpl]);

  useEffect(() => {
    if (!token || typeof fetchImpl !== "function") return undefined;
    const interval = window.setInterval(() => {
      loadView().catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "окно авторизации недоступно");
      });
    }, 1_500);
    return () => window.clearInterval(interval);
  }, [token, fetchImpl]);

  if (!enabled) return null;

  async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const session = await loadAdminSession(fetchImpl);
    setCsrfToken(session.csrfToken);
    return session.csrfToken;
  }

  async function write(url, body, authorizationToken = token) {
    const csrf = await ensureCsrf();
    return requestJson(fetchImpl, url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf,
        ...(authorizationToken ? { [AUTHORIZATION_TOKEN_HEADER]: authorizationToken } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  async function startAuthorization() {
    setBusy(true);
    setError("");
    try {
      const result = await write("/api/admin/provider-funding/authorization/start", {}, "");
      setToken(result.token);
      setView(result);
      setStatus(result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "не удалось открыть окно авторизации");
    } finally {
      setBusy(false);
    }
  }

  function openStandaloneAuthorizationWindow() {
    const popup = window.open(
      POLZA_FUNDING_BROWSER_URL,
      "_blank",
      "noopener,noreferrer",
    );
    if (!popup) {
      setError("Браузер заблокировал окно авторизации. Разреши всплывающие окна для CRM и повтори попытку.");
      return;
    }
    popup.opener = null;
    popup.focus?.();
  }

  async function sendAction(action) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const nextView = await write("/api/admin/provider-funding/authorization/action", action);
      setView((current) => ({ ...current, ...nextView }));
      setStatus((current) => ({ ...current, ...nextView }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "действие не выполнено");
    } finally {
      setBusy(false);
    }
  }

  async function completeAuthorization() {
    setBusy(true);
    setError("");
    try {
      const result = await write("/api/admin/provider-funding/authorization/complete", {});
      setView(result);
      setStatus((current) => ({ ...current, ...result }));
      setToken("");
      await loadStatus();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "авторизация ещё не подтверждена");
    } finally {
      setBusy(false);
    }
  }

  async function cancelAuthorization() {
    if (!token) return;
    setBusy(true);
    try {
      await write("/api/admin/provider-funding/authorization/cancel", {});
    } catch {
      // The server-side TTL still cleans up an abandoned relay.
    } finally {
      setBusy(false);
      setToken("");
      setView(null);
      await loadStatus();
    }
  }

  function screenshotPoint(event) {
    if (!view?.viewport || !token) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    return {
      x: Math.min(view.viewport.width, Math.max(0, ((event.clientX - rect.left) / rect.width) * view.viewport.width)),
      y: Math.min(view.viewport.height, Math.max(0, ((event.clientY - rect.top) / rect.height) * view.viewport.height)),
    };
  }

  function handleScreenshotClick(event) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const point = screenshotPoint(event);
    if (!point) return;
    void sendAction({ type: "click", ...point });
    inputRef.current?.focus();
  }

  function handleScreenshotPointerDown(event) {
    const point = screenshotPoint(event);
    if (!point || busy) return;
    dragStartRef.current = point;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleScreenshotPointerUp(event) {
    const start = dragStartRef.current;
    const end = screenshotPoint(event);
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!start || !end || busy) return;
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    if (distance < 8) return;
    suppressClickRef.current = true;
    void sendAction({
      type: "drag",
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
    });
  }

  function handleScreenshotPointerCancel() {
    dragStartRef.current = null;
  }

  async function sendTypedText() {
    if (!typedText) return;
    await sendAction({ type: "type", text: typedText });
    setTypedText("");
    inputRef.current?.focus();
  }

  return (
    <section className="crm-finance-block crm-polza-authorization" aria-labelledby="polza-authorization-title">
      <header className="crm-finance-block__header">
        <div>
          <span className="crm-eyebrow">постоянный профиль оплаты</span>
          <h2 id="polza-authorization-title">авторизация Polza для worker</h2>
          <p>Вход выполняется один раз в удалённом профиле CRM. Пароль и данные карты не сохраняются в CRM и не попадают в логи.</p>
        </div>
        <span className={`crm-status crm-status--${status?.automation === "ready" ? "succeeded" : "pending"}`}>
          {statusLabel(status)}
        </span>
      </header>

      {!token && status?.automation !== "ready" && (
        <div className="crm-polza-authorization__start">
          <p>{standalone
            ? "Открой удалённый профиль worker, войди в Polza и заверши вход. После этого worker будет использовать сохранённую сессию автоматически."
            : "Авторизация откроется в отдельном окне, без элементов CRM. После завершения worker будет использовать сохранённую сессию автоматически."}</p>
          <button
            type="button"
            onClick={() => {
              if (standalone) void startAuthorization();
              else openStandaloneAuthorizationWindow();
            }}
            disabled={busy}
          >
            {standalone
              ? (busy ? "открываю окно…" : "открыть окно авторизации")
              : "открыть отдельное окно авторизации"}
          </button>
        </div>
      )}

      {token && view?.image && (
        <div className="crm-polza-authorization__relay">
          <div className="crm-polza-authorization__toolbar">
            <strong>{statusLabel(view)}</strong>
            <span>сессия действует до {view.expiresAt ? new Date(view.expiresAt).toLocaleTimeString("ru-RU") : "таймаута"}</span>
          </div>
          <div className="crm-polza-authorization__input-block">
            <p>Кликни нужное поле на снимке, затем введи текст здесь. Для SmartCaptcha потяни ползунок прямо на снимке.</p>
            <div className="crm-polza-authorization__input-row">
              <input
                ref={inputRef}
                type={secretMode ? "password" : "text"}
                autoComplete="off"
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                  event.preventDefault();
                  void sendTypedText();
                }}
                disabled={busy}
                aria-label="текст для удалённого окна Polza"
                placeholder="после клика на снимке введи текст сюда"
              />
              <button type="button" onClick={() => void sendTypedText()} disabled={busy || !typedText}>ввести в выбранное поле</button>
              <button type="button" onClick={() => setSecretMode((current) => !current)} disabled={busy}>
                {secretMode ? "показать ввод" : "скрыть ввод"}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="crm-polza-authorization__screen-button"
            onClick={handleScreenshotClick}
            onPointerDown={handleScreenshotPointerDown}
            onPointerUp={handleScreenshotPointerUp}
            onPointerCancel={handleScreenshotPointerCancel}
            disabled={busy}
            aria-label="удалённое окно Polza"
          >
            <img src={view.image} alt="Удалённое окно авторизации Polza" draggable="false" />
          </button>
          <div className="crm-polza-authorization__controls" aria-label="управление удалённым окном">
            <button type="button" onClick={() => void sendAction({ type: "scroll", deltaY: -650 })} disabled={busy}>{actionButtonLabel("scroll:-650")}</button>
            <button type="button" onClick={() => void sendAction({ type: "scroll", deltaY: 650 })} disabled={busy}>{actionButtonLabel("scroll:650")}</button>
            <button type="button" onClick={() => void sendAction({ type: "press", key: "Tab" })} disabled={busy}>{actionButtonLabel("press:Tab")}</button>
            <button type="button" onClick={() => void sendAction({ type: "press", key: "Enter" })} disabled={busy}>{actionButtonLabel("press:Enter")}</button>
            <button type="button" onClick={() => void sendAction({ type: "back" })} disabled={busy}>{actionButtonLabel("back")}</button>
            <button type="button" onClick={() => void sendAction({ type: "reload" })} disabled={busy}>{actionButtonLabel("reload")}</button>
          </div>
          <div className="crm-polza-authorization__actions">
            <button type="button" onClick={() => void completeAuthorization()} disabled={busy || view.authorization !== "authorized"}>
              завершить и сохранить сессию
            </button>
            <button type="button" onClick={() => void cancelAuthorization()} disabled={busy}>закрыть окно</button>
          </div>
        </div>
      )}

      {error && <p className="crm-inline-error" role="alert">{error}</p>}
    </section>
  );
}

export function PolzaAuthorizationWindow({ redirectImpl = (url) => window.location.replace(url) }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Авторизация Polza — Метафлора нейро CRM";
    redirectImpl(POLZA_FUNDING_BROWSER_URL);
    return () => { document.title = previousTitle; };
  }, [redirectImpl]);

  return (
    <main className="crm-polza-authorization-window" aria-label="отдельное окно авторизации Polza">
      <section className="crm-finance-block crm-polza-authorization">
        <h1>Открываю отдельный браузер Polza</h1>
        <p>Если переход не начался, открой рабочее окно вручную.</p>
        <a href={POLZA_FUNDING_BROWSER_URL}>открыть рабочее окно</a>
      </section>
    </main>
  );
}
