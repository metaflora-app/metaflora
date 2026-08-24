import { useMemo, useState } from "react";

import {
  TARGET_GROSS_MARGIN_PERCENT,
} from "./finance-policy.js";
import { PolzaAuthorizationPanel } from "./PolzaAuthorizationPanel.jsx";

const paymentStatusLabels = {
  succeeded: "прошёл",
  pending: "в обработке",
  canceled: "отменён",
  failed: "ошибка",
  refunded: "возврат",
};

const receiptStatusLabels = {
  succeeded: "чек отправлен",
  pending: "чек формируется",
  canceled: "чек отменён",
  failed: "чек не зарегистрирован",
  unknown: "статус чека неизвестен",
};

const ledgerTypeLabels = {
  credit: "пополнение",
  debit: "списание",
};

const reasonLabels = {
  payment: "оплата",
  generation: "генерация",
  refund: "возврат",
  admin_adjustment: "ручная корректировка",
  promo: "промокод",
  plan_purchase: "покупка тарифа",
  ai_usage: "использование ИИ",
  welcome_bonus: "приветственный бонус",
};

const paymentMethodLabels = {
  card: "карта РФ",
  sbp: "СБП",
  telegram_stars: "⭐ Telegram Stars",
  unknown: "способ не определён",
};

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function formatMoney(amount, currency = "RUB") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatPaymentAmount(payment) {
  if (payment.paymentMethod === "telegram_stars" || payment.currency === "XTR") {
    return `${new Intl.NumberFormat("ru-RU").format(Number(payment.amount) || 0)} ⭐`;
  }
  return formatMoney(payment.amount, payment.currency);
}

function formatFinanceAmount(amount, currency = "RUB") {
  if (String(currency).toUpperCase() === "XTR") {
    return `${new Intl.NumberFormat("ru-RU").format(Number(amount) || 0)} ⭐`;
  }
  return formatMoney(amount, currency);
}

const financeCategoryLabels = {
  gross: "оплата",
  payment_fee: "комиссия шлюза",
  api_reserve: "резерв API",
  referral_liability: "партнёрские начисления",
  owner_share: "моя доля",
  refund: "возврат",
};

export function PaymentsPanel({ payments, onSelectPayment }) {
  if (payments.length === 0) {
    return <div className="crm-empty-state"><strong>платежей пока нет</strong></div>;
  }

  return (
    <div className="crm-table-wrap crm-table-viewport">
      <table className="crm-table crm-payments-table" aria-label="платежи">
        <thead>
          <tr>
            <th scope="col">пользователь</th>
            <th scope="col">сумма</th>
            <th scope="col">способ оплаты</th>
            <th scope="col">статус</th>
            <th scope="col">чек</th>
            <th scope="col">провайдер</th>
            <th scope="col">в API</th>
            <th scope="col">моя доля</th>
            <th scope="col">дата</th>
            <th scope="col"><span className="crm-visually-hidden">действие</span></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <strong>{payment.userName || payment.userId}</strong>
                <span className="crm-cell-note">{payment.id}</span>
              </td>
              <td>{formatPaymentAmount(payment)}</td>
              <td>{paymentMethodLabels[payment.paymentMethod] || paymentMethodLabels.unknown}</td>
              <td>
                <span className={`crm-status crm-status--${payment.status || "unknown"}`}>
                  {paymentStatusLabels[payment.status] || "неизвестно"}
                </span>
              </td>
              <td>
                <span className={`crm-status crm-status--receipt-${payment.receiptStatus || "unknown"}`}>
                  {receiptStatusLabels[payment.receiptStatus] || receiptStatusLabels.unknown}
                </span>
                {payment.receiptEmail && (
                  <span className="crm-cell-note">{payment.receiptEmail}</span>
                )}
                {payment.receiptSentAt && (
                  <span className="crm-cell-note">отправлен {formatDateTime(payment.receiptSentAt)}</span>
                )}
              </td>
              <td>{payment.provider || "—"}</td>
              <td>{payment.finance ? `API: ${formatFinanceAmount(payment.finance.apiReserve, payment.finance.currency || payment.currency)}` : "нет данных"}</td>
              <td>{payment.finance ? `моя доля: ${formatFinanceAmount(payment.finance.ownerShare, payment.finance.currency || payment.currency)}` : "нет данных"}</td>
              <td>{formatDateTime(payment.createdAt)}</td>
              <td>
                <button
                  type="button"
                  className="crm-row-action"
                  aria-label={`открыть платёж ${payment.id}`}
                  onClick={() => onSelectPayment?.(payment)}
                >
                  открыть
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LedgerPanel({ entries, onSelectLedgerEntry }) {
  if (entries.length === 0) {
    return <div className="crm-empty-state"><strong>движений пока нет</strong></div>;
  }

  return (
    <div className="crm-table-wrap crm-table-viewport">
      <table className="crm-table crm-ledger-table">
        <thead>
          <tr>
            <th scope="col">пользователь</th>
            <th scope="col">операция</th>
            <th scope="col">метакоины</th>
            <th scope="col">причина</th>
            <th scope="col">дата</th>
            <th scope="col"><span className="crm-visually-hidden">действие</span></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <strong>{entry.userName || entry.userId}</strong>
                <span className="crm-cell-note">{entry.id}</span>
              </td>
              <td>{ledgerTypeLabels[entry.type] || "операция"}</td>
              <td className={`crm-amount crm-amount--${entry.type || "neutral"}`}>
                {entry.type === "debit" ? "−" : "+"}
                {new Intl.NumberFormat("ru-RU").format(entry.amount || 0)}
              </td>
              <td>{reasonLabels[entry.reason] || entry.reason || "—"}</td>
              <td>{formatDateTime(entry.createdAt)}</td>
              <td>
                <button
                  type="button"
                  className="crm-row-action"
                  aria-label={`открыть запись ${entry.id}`}
                  onClick={() => onSelectLedgerEntry?.(entry)}
                >
                  открыть
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinanceAllocationsPanel({ allocations }) {
  if (allocations.length === 0) {
    return <div className="crm-empty-state"><strong>проводок пока нет</strong><span>они появятся после подтверждения платежа</span></div>;
  }
  return (
    <div className="crm-table-wrap crm-table-viewport">
      <table className="crm-table crm-finance-allocations-table" aria-label="проводки по деньгам">
        <thead>
          <tr>
            <th scope="col">платёж</th>
            <th scope="col">назначение</th>
            <th scope="col">провайдер</th>
            <th scope="col">сумма</th>
            <th scope="col">статус</th>
            <th scope="col">дата</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((allocation) => (
            <tr key={allocation.id}>
              <td><strong>{allocation.externalPaymentId}</strong><span className="crm-cell-note">{allocation.userName}</span></td>
              <td>{financeCategoryLabels[allocation.category] || allocation.category}</td>
              <td>{allocation.provider || "общая проводка"}</td>
              <td>{formatFinanceAmount(allocation.amount, allocation.currency)}</td>
              <td><span className={`crm-status crm-status--${allocation.status}`}>{allocation.status}</span></td>
              <td>{formatDateTime(allocation.occurredAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const statusLabels = {
    pending: "в очереди",
    submitted: "отправлено",
    succeeded: "выплачено",
    canceled: "отменено",
    failed: "ошибка",
};

export function PayoutsPanel({ payouts }) {
  if (payouts.length === 0) {
    return <div className="crm-empty-state"><strong>выплат пока нет</strong><span>заявки появятся после первого вывода партнёра</span></div>;
  }
  return (
    <div className="crm-table-wrap crm-table-viewport">
      <table className="crm-table crm-payouts-table" aria-label="выплаты">
        <thead>
          <tr>
            <th scope="col">заявка</th>
            <th scope="col">партнёр</th>
            <th scope="col">сумма</th>
            <th scope="col">маршрут</th>
            <th scope="col">реквизиты</th>
            <th scope="col">статус</th>
            <th scope="col">дата</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout) => (
            <tr key={payout.id}>
              <td><strong>{payout.withdrawalId}</strong><span className="crm-cell-note">{payout.provider}</span></td>
              <td>{payout.userName || payout.telegramUserId || "—"}</td>
              <td>{formatFinanceAmount(payout.amount, payout.currency)}</td>
              <td>{payout.method}</td>
              <td>{payout.destinationHint || "скрыто"}</td>
              <td><span className={`crm-status crm-status--${payout.status}`}>{statusLabels[payout.status] || payout.status}</span></td>
              <td>{formatDateTime(payout.processedAt || payout.requestedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProviderTopupsPanel({ providerTopups = [], settings = {} }) {
  const configuredProviders = settings?.finance?.providerTopups?.providers ?? [];
  if (configuredProviders.length === 0 && providerTopups.length === 0) {
    return <div className="crm-empty-state"><strong>пополнений API пока нет</strong><span>резерв появится после подтверждения оплаты</span></div>;
  }
  return (
    <div className="crm-provider-topups">
      <div className="crm-provider-topups__cards">
        {configuredProviders.map((provider) => {
          const rows = providerTopups.filter(({ provider: providerName }) =>
            String(providerName ?? "").toLowerCase().includes(String(provider.id).toLowerCase()),
          );
          return (
            <article className="crm-payout-detail" key={provider.id}>
              <span>{provider.label}</span>
              <strong>{provider.status}</strong>
              <p>{provider.note}</p>
              {provider.executionOwner === "external_funding_agent" && (
                <p>исполнение: отдельный funding-agent · CRM: только наблюдение</p>
              )}
              <p>{rows.length ? `проводок в очереди: ${rows.length}` : "проводок пока нет"}</p>
              {provider.topUpUrl && (
                <a href={provider.topUpUrl} target="_blank" rel="noreferrer">
                  открыть кабинет {provider.label}
                </a>
              )}
            </article>
          );
        })}
      </div>
      {providerTopups.length > 0 && (
        <div className="crm-table-wrap crm-table-viewport">
          <table className="crm-table" aria-label="очередь пополнений API">
            <thead>
              <tr><th scope="col">провайдер</th><th scope="col">сумма</th><th scope="col">статус</th><th scope="col">сверка</th><th scope="col">дата</th></tr>
            </thead>
            <tbody>
              {providerTopups.map((topup) => (
                <tr key={topup.id}>
                  <td>{topup.provider}</td>
                  <td>{formatFinanceAmount(topup.amount, topup.currency)}</td>
                  <td>
                    <span className={`crm-status crm-status--${topup.status === "succeeded" ? "succeeded" : "pending"}`}>
                      {topup.status === "succeeded"
                        ? "баланс провайдера подтверждён"
                        : topup.confirmationStatus === "posted"
                          ? "банк подтвердил; ждёт funding-шлюза"
                          : "ждёт подтверждения банка"}
                    </span>
                  </td>
                  <td>
                    {topup.observedTransactionId
                      ? <><strong>{topup.observedTransactionId}</strong>{topup.observedBalance === null || topup.observedBalance === undefined ? null : <span className="crm-cell-note">баланс: {formatFinanceAmount(topup.observedBalance, topup.currency)}</span>}</>
                      : topup.externalId || "—"}
                  </td>
                  <td>{formatDateTime(topup.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ACTIVE_RESERVE_PROVIDERS = Object.freeze({ polza: "Polza", routerai: "RouterAI" });

function reserveProviderId(value) {
  const normalized = String(value ?? "").toLowerCase().replace(/[^a-z0-9]/gu, "");
  if (normalized.includes("polza")) return "polza";
  if (normalized.includes("routerai")) return "routerai";
  return null;
}

function fundingAuditStatus(allocation, funding, topup) {
  const rawStatus = topup?.status ?? funding?.fundingStatus ?? allocation.status ?? "reserved";
  const normalized = String(rawStatus).toLowerCase();
  if (["succeeded", "funded"].includes(normalized)) return "funded";
  if (["queued", "processing", "failed", "reserved"].includes(normalized)) return normalized;
  return "reserved";
}

export function ProviderReservesPanel({ allocations = [], providerFunding = [], providerTopups = [] }) {
  const grossByPayment = new Map(
    allocations
      .filter(({ category }) => category === "gross")
      .map((allocation) => [allocation.externalPaymentId, Number(allocation.amount || 0)]),
  );
  const fundingByAllocation = new Map(providerFunding.map((item) => [item.allocationKey, item]));
  const topupsByAllocation = new Map(providerTopups.map((item) => [item.allocationKey, item]));
  const rows = allocations
    .filter(({ category, provider }) => category === "api_reserve" && reserveProviderId(provider))
    .map((allocation) => {
      const providerId = reserveProviderId(allocation.provider);
      const gross = grossByPayment.get(allocation.externalPaymentId) || 0;
      const funding = fundingByAllocation.get(allocation.allocationKey);
      const topup = topupsByAllocation.get(allocation.allocationKey);
      return Object.freeze({
        ...allocation,
        provider: ACTIVE_RESERVE_PROVIDERS[providerId],
        grossPercent: gross > 0 ? (Number(allocation.amount || 0) / gross) * 100 : null,
        auditStatus: fundingAuditStatus(allocation, funding, topup),
        transactionId: topup?.observedTransactionId ?? topup?.externalId ?? null,
        errorCode: topup?.errorCode ?? null,
        auditAt: topup?.processedAt ?? topup?.observedAt ?? topup?.updatedAt
          ?? funding?.updatedAt ?? allocation.occurredAt,
      });
    });

  return (
    <section className="crm-finance-block" aria-label="резервы провайдеров">
      <header className="crm-finance-block__header">
        <div>
          <span className="crm-eyebrow">деньги на генерации</span>
          <h2>резервы провайдеров</h2>
          <p>зарезервированные суммы показаны отдельно от подтверждённых пополнений кабинетов.</p>
        </div>
      </header>
      {rows.length ? (
        <div className="crm-payout-details">
          {rows.map((row) => (
            <div className="crm-payout-detail" key={row.allocationKey || row.id}>
              <span>{row.provider} · платёж {row.externalPaymentId || "—"}</span>
              <strong>{formatFinanceAmount(row.amount, row.currency)}{row.grossPercent === null ? "" : ` · ${row.grossPercent.toFixed(2).replace(".", ",")}% gross`}</strong>
              <p>funding: {row.auditStatus} · транзакция: {row.transactionId || "—"}</p>
              {row.errorCode && <p>ошибка: {row.errorCode}</p>}
              <p>обновлено: {formatDateTime(row.auditAt)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="crm-empty-state"><strong>резервов пока нет</strong><span>они появятся после подтверждения платежа</span></div>
      )}
    </section>
  );
}

export function ProviderFundingLimitsPanel({ funding = [] }) {
  return (
    <section className="crm-finance-block" aria-label="лимиты финансирования провайдеров">
      <header className="crm-finance-block__header">
        <div>
          <span className="crm-eyebrow">фактическое финансирование</span>
          <h2>лимиты провайдеров</h2>
          <p>для каждой доли видно, сколько выделено, уже зачислено и ещё должно быть отправлено воркером.</p>
        </div>
      </header>
      {funding.length ? (
        <div className="crm-payout-details">
          {funding.map((item) => (
            <div className="crm-payout-detail" key={item.allocationKey}>
              <span>{item.provider}</span>
              <strong>осталось {formatFinanceAmount(item.remaining, item.currency)}</strong>
              <p>выделено {formatFinanceAmount(item.allocated, item.currency)} · зачислено {formatFinanceAmount(item.funded, item.currency)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="crm-empty-state"><strong>лимитов пока нет</strong><span>они появятся после распределения подтверждённого платежа</span></div>
      )}
    </section>
  );
}

export function YooKassaConfirmationsPanel({ confirmations = [] }) {
  return (
    <section className="crm-finance-block" aria-labelledby="yookassa-confirmations-title">
      <header className="crm-finance-block__header">
        <div>
          <span className="crm-eyebrow">источник пополнения провайдеров</span>
          <h2 id="yookassa-confirmations-title">подтверждения ЮKassa</h2>
          <p>payment.succeeded запускает funding-задачу по этому payment_id; это ещё не подтверждение зачисления у Polza/RouterAI. PAN и CVV CRM не хранит.</p>
        </div>
        <span className={`crm-status crm-status--${confirmations.length ? "succeeded" : "pending"}`}>
          {confirmations.length ? `${confirmations.length} подтверждено` : "нет подтверждений"}
        </span>
      </header>
      {confirmations.length === 0 ? (
        <div className="crm-empty-state"><strong>подтверждений пока нет</strong><span>один платёж — одно событие — два provider top-up</span></div>
      ) : (
        <div className="crm-table-wrap crm-table-viewport">
          <table className="crm-table" aria-label="подтверждения YooKassa">
            <thead><tr><th>payment_id</th><th>сумма</th><th>событие</th><th>статус</th><th>дата</th></tr></thead>
            <tbody>
              {confirmations.map((confirmation) => (
                <tr key={confirmation.id}>
                  <td><strong>{confirmation.paymentId}</strong><span className="crm-cell-note">{confirmation.eventId}</span></td>
                  <td>{formatFinanceAmount(confirmation.amount, confirmation.currency)}</td>
                  <td>{confirmation.event}</td>
                  <td><span className="crm-status crm-status--succeeded">подтверждено</span></td>
                  <td>{formatDateTime(confirmation.confirmedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function WalletSummaryPanel({ wallet = {}, walletLedger = [] }) {
  const currencies = Object.values(wallet.currencies ?? {}).length
    ? Object.values(wallet.currencies)
    : [{ ...wallet, currency: wallet.currency || "RUB" }];
  return (
    <section className="crm-finance-block" aria-labelledby="wallet-title">
      <header className="crm-finance-block__header">
        <div>
          <span className="crm-eyebrow">единый контур денег</span>
          <h2 id="wallet-title">общий кошелёк</h2>
          <p>каждый подтверждённый платёж раскладывается на API, комиссию, валовую маржу и отдельные партнёрские обязательства.</p>
        </div>
        <span className={`crm-status crm-status--${wallet.reconciled === false ? "failed" : "succeeded"}`}>
          {wallet.reconciled === false ? "нужна сверка" : "сверено"}
        </span>
      </header>
      {currencies.map((summary) => {
        const rows = [
          ["всего принято", summary.gross],
          ["комиссия шлюза", summary.paymentFee],
          ["зарезервировано под API", summary.apiReserve],
          ["фактические траты API", summary.providerSpend],
          ["партнёрские начисления", summary.referralLiability],
          ["валовая маржа до рефералов", summary.grossMargin],
          ["моя доля после рефералов", summary.ownerShare],
          ["доступно на API", summary.availableApiReserve],
          ["доступно мне после выплат", summary.availableOwnerShare],
        ];
        return (
          <div className="crm-payout-details" key={summary.currency}>
            <div className="crm-eyebrow">валюта: {summary.currency}</div>
            {rows.map(([label, amount]) => (
              <div className="crm-payout-detail" key={label}>
                <span>{label}</span>
                <strong>{formatFinanceAmount(amount || 0, summary.currency)}</strong>
              </div>
            ))}
            <div className="crm-payout-detail">
              <span>маржа в процентах</span>
              <strong>{Number(summary.grossMarginPercent ?? 0).toFixed(2)}%</strong>
            </div>
          </div>
        );
      })}
      <div className="crm-payout-details">
        <div className="crm-payout-detail">
          <span>проводок кошелька</span>
          <strong>{walletLedger.length}</strong>
          <p>доступны с ключом платежа, провайдером и статусом для сверки.</p>
        </div>
      </div>
    </section>
  );
}

function paymentTrend(payments, days = 7) {
  const successful = payments.filter(({ status, createdAt, currency }) => (
    status === "succeeded"
    && String(currency || "RUB").toUpperCase() === "RUB"
    && !Number.isNaN(Date.parse(createdAt))
  ));
  const latest = successful.reduce((value, payment) => Math.max(value, Date.parse(payment.createdAt)), 0);
  if (!latest) return Array.from({ length: days }, () => 0);
  const day = 86_400_000;
  const end = new Date(latest);
  end.setUTCHours(0, 0, 0, 0);
  const start = end.getTime() - ((days - 1) * day);
  return Array.from({ length: days }, (_, index) => successful
    .filter((payment) => {
      const timestamp = Date.parse(payment.createdAt);
      return timestamp >= start + (index * day) && timestamp < start + ((index + 1) * day);
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
}

function FinanceTrendChart({ values }) {
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : 4 + ((index / (values.length - 1)) * 92);
    const y = 92 - ((value / maximum) * 76);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="crm-money-chart crm-money-chart--neutral" role="img" aria-label="динамика платежей">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="crm-money-chart__grid" d="M4 16H96M4 54H96M4 92H96" />
        <polygon className="crm-money-chart__area" points={`4,92 ${points} 96,92`} />
        <polyline className="crm-money-chart__line" points={points} />
      </svg>
      <div className="crm-money-chart__axis"><span>7 дней назад</span><span>сегодня</span></div>
    </div>
  );
}

function MoneyStructureChart({ wallet = {}, allocations = [] }) {
  const summary = wallet?.currencies?.RUB ?? wallet;
  const allocated = allocations
    .filter(({ currency }) => String(currency || "RUB").toUpperCase() === "RUB")
    .reduce((totals, item) => ({
      ...totals,
      [item.category]: (totals[item.category] || 0) + Number(item.amount || 0),
    }), {});
  const parts = [
    ["API", Number(summary.apiReserve || allocated.api_reserve || 0), "api"],
    ["комиссия", Number(summary.paymentFee || allocated.payment_fee || 0), "fee"],
    ["партнёры", Number(summary.referralLiability || allocated.referral_liability || 0), "referral"],
    ["моя доля", Number(summary.ownerShare || allocated.owner_share || 0), "owner"],
  ];
  const total = parts.reduce((sum, [, value]) => sum + Math.max(0, value), 0) || 1;
  return (
    <div className="crm-money-structure crm-money-structure--neutral">
      <div className="crm-money-structure__bar" role="img" aria-label="структура денег">
        {parts.map(([label, value, tone]) => (
          <span key={label} className={`crm-money-structure__part crm-money-structure__part--${tone}`} style={{ width: `${(Math.max(0, value) / total) * 100}%` }} />
        ))}
      </div>
      <div className="crm-money-structure__legend">
        {parts.map(([label, value, tone]) => (
          <div key={label}><i className={`crm-money-structure__dot crm-money-structure__dot--${tone}`} /><span>{label}</span><strong>{formatMoney(value)}</strong></div>
        ))}
      </div>
    </div>
  );
}

export function FinancePage({
  payments = [],
  ledgerEntries = [],
  financeAllocations = [],
  providerTopups = [],
  providerFunding = [],
  yookassaConfirmations = [],
  wallet = {},
  walletLedger = [],
  payouts = [],
  settings = {},
  onSelectPayment,
  onSelectLedgerEntry,
}) {
  const [activeTab, setActiveTab] = useState("payments");
  const settledTotals = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "succeeded")
        .reduce((totals, payment) => {
          const amount = Number(payment.amount);
          if (!Number.isFinite(amount)) return totals;
          const currency = payment.currency || "RUB";
          return {
            ...totals,
            [currency]: (totals[currency] || 0) + amount,
          };
        }, {}),
    [payments],
  );
  const formattedSettledTotals = Object.entries(settledTotals)
    .sort(([leftCurrency], [rightCurrency]) =>
      leftCurrency.localeCompare(rightCurrency),
    )
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" · ");
  const metacoinDelta = useMemo(
    () =>
      ledgerEntries.reduce(
        (total, entry) => {
          const amount = Number(entry.amount);
          if (entry.status !== "settled" || !Number.isFinite(amount)) return total;
          return total + (entry.type === "debit" ? -amount : amount);
        },
        0,
      ),
    [ledgerEntries],
  );
  const projectedStarsReceivable = useMemo(
    () => payments
      .filter((payment) => (
        payment.status === "succeeded"
        && (payment.paymentMethod === "telegram_stars" || String(payment.currency).toUpperCase() === "XTR")
      ))
      .reduce((total, payment) => total + Number(payment.amount || 0), 0),
    [payments],
  );
  const walletStarsReceivable = Number(wallet?.currencies?.XTR?.starsReceivable);
  const starsReceivable = Number.isFinite(walletStarsReceivable)
    ? walletStarsReceivable
    : projectedStarsReceivable;
  const trend = useMemo(() => paymentTrend(payments), [payments]);
  const rubWallet = wallet?.currencies?.RUB ?? wallet;
  const pendingTopups = providerTopups.filter(({ status }) => ["queued", "processing", "reserved"].includes(status)).length;

  return (
    <section className="crm-page crm-finance-page crm-overview-dashboard" aria-labelledby="finance-title">
      <header className="crm-page__header">
        <div>
          <span className="crm-eyebrow">деньги без магии</span>
          <h1 id="finance-title">деньги</h1>
          <p>сверяйте реальные платежи и каждое движение метакоинов</p>
        </div>
      </header>

      <div className="crm-kpi-grid" aria-label="сводка по деньгам">
        <article className="crm-kpi-card">
          <span>успешные платежи</span>
          <strong>{formattedSettledTotals || formatMoney(0)}</strong>
        </article>
        <article className="crm-kpi-card">
          <span>операций с метакоинами</span>
          <strong>{ledgerEntries.length}</strong>
        </article>
        <article className="crm-kpi-card">
          <span>баланс движений</span>
          <strong>{new Intl.NumberFormat("ru-RU").format(metacoinDelta)} метакоинов</strong>
        </article>
        <article className="crm-kpi-card">
          <span>целевая валовая маржа</span>
          <strong>{TARGET_GROSS_MARGIN_PERCENT}%</strong>
        </article>
        <article className="crm-kpi-card">
          <span>Stars receivable</span>
          <strong>{new Intl.NumberFormat("ru-RU").format(starsReceivable)} ⭐ к получению</strong>
        </article>
      </div>

      <div className="crm-money-visuals">
        <section className="crm-money-visual" aria-labelledby="finance-trend-title">
          <header><div><span className="crm-eyebrow">динамика</span><h2 id="finance-trend-title">выручка по дням</h2></div><strong>{formattedSettledTotals || formatMoney(0)}</strong></header>
          <FinanceTrendChart values={trend} />
        </section>
        <section className="crm-money-visual" aria-labelledby="finance-structure-title">
          <header><div><span className="crm-eyebrow">распределение</span><h2 id="finance-structure-title">куда уходят деньги</h2></div><strong>{Number(rubWallet.grossMarginPercent || 0).toFixed(1)}% маржа</strong></header>
          <MoneyStructureChart wallet={wallet} allocations={financeAllocations} />
        </section>
      </div>

      <section className="crm-money-signals" aria-label="состояние денег">
        <div><span>доступно на API</span><strong>{formatMoney(rubWallet.availableApiReserve || 0)}</strong></div>
        <div><span>доступно к выплате</span><strong>{formatMoney(rubWallet.availableOwnerShare || 0)}</strong></div>
        <div><span>пополнения в работе</span><strong>{pendingTopups}</strong></div>
        <div><span>сверка</span><strong className={wallet.reconciled === false ? "is-danger" : "is-success"}>{wallet.reconciled === false ? "нужна" : "готово"}</strong></div>
      </section>

      <div className="crm-tabs" role="tablist" aria-label="раздел денег">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "payments"}
          onClick={() => setActiveTab("payments")}
        >
          платежи
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ledger"}
          onClick={() => setActiveTab("ledger")}
        >
          операции с метакоинами
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "finance"}
          onClick={() => setActiveTab("finance")}
        >
          проводки по деньгам
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "payouts"}
          onClick={() => setActiveTab("payouts")}
        >
          выплаты
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "topups"}
          onClick={() => setActiveTab("topups")}
        >
          пополнения API
        </button>
      </div>

      <div role="tabpanel">
        {activeTab === "payments" && (
          <PaymentsPanel payments={payments} onSelectPayment={onSelectPayment} />
        )}
        {activeTab === "ledger" && (
          <LedgerPanel
            entries={ledgerEntries}
            onSelectLedgerEntry={onSelectLedgerEntry}
          />
        )}
        {activeTab === "finance" && <FinanceAllocationsPanel allocations={financeAllocations} />}
        {activeTab === "payouts" && <PayoutsPanel payouts={payouts} />}
        {activeTab === "topups" && <ProviderTopupsPanel providerTopups={providerTopups} settings={settings} />}
      </div>
    </section>
  );
}
