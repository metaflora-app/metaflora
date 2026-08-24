import { useState } from "react";

export function LoginScreen({ onRequestCode, onVerifyCode }) {
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function requestCode() {
    setStatus("requesting");
    setError("");
    try {
      const result = await onRequestCode();
      setChallengeId(result.challengeId);
      setStatus("code-sent");
    } catch (requestError) {
      setError(requestError?.message || "не удалось отправить код");
      setStatus("error");
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setStatus("verifying");
    setError("");
    try {
      await onVerifyCode(challengeId, code);
    } catch (verifyError) {
      setError(verifyError?.message || "код не подошёл");
      setStatus("code-sent");
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <img src="/assets/metaflora-mark.png" alt="МЕТАФЛОРА* нейро" />
        </div>
        <p className="eyebrow">закрытый доступ</p>
        <h1 id="login-title">МЕТАФЛОРА* нейро</h1>
        <p className="login-copy">
          войди по одноразовому коду. Telegram пришлёт новый код для этой сессии.
        </p>

        {challengeId ? (
          <form className="login-form" onSubmit={verifyCode}>
            <label>
              <span>код из Telegram</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                autoFocus
                required
              />
            </label>
            <button
              type="submit"
              disabled={code.length !== 6 || status === "verifying"}
            >
              {status === "verifying" ? "проверяем" : "войти"}
            </button>
            <button
              className="login-link"
              type="button"
              onClick={requestCode}
              disabled={status === "requesting"}
            >
              отправить новый код
            </button>
          </form>
        ) : (
          <button
            className="login-primary"
            type="button"
            onClick={requestCode}
            disabled={status === "requesting"}
          >
            {status === "requesting" ? "отправляем" : "получить код в Telegram"}
          </button>
        )}

        {error ? <p className="login-error" role="alert">{error}</p> : null}
        <p className="login-note">код действует 5 минут и подходит только один раз</p>
      </section>
    </main>
  );
}
