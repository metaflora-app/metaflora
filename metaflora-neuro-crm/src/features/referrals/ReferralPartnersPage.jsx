import { useState } from "react";

const money = (value, currency = "RUB") => new Intl.NumberFormat("ru-RU", {
  style: "currency", currency, minimumFractionDigits: 2,
}).format(Number(value || 0));
const date = (value) => value ? new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value)) : "—";

const taxLabels = {
  self_employed: "самозанятый",
  ip: "ИП",
  individual_entrepreneur: "ИП",
  legal_entity: "организация",
  individual: "физлицо",
  unknown: "не указан",
};

const statusLabels = {
  pending: "ожидает",
  hold: "на удержании",
  available: "доступно",
  reserved: "зарезервировано",
  submitted: "отправлено",
  processing: "обрабатывается",
  manual_review: "ручная проверка",
  paid: "выплачено",
  succeeded: "выплачено",
  failed: "ошибка",
  rejected: "отклонено",
  reversed: "отменено",
  applied: "начислено",
};

function Status({ value }) {
  return <span className={`crm-status crm-status--${value}`}>{statusLabels[value] || value || "—"}</span>;
}

function PaymentRows({ payments = [] }) {
  if (!payments.length) return <p className="crm-empty-copy">подтверждённых покупок пока нет</p>;
  return (
    <table className="crm-table" aria-label="платежи прямого реферала">
      <thead><tr><th>покупка</th><th>сумма и дата</th><th>деньгами</th><th>метакоины</th></tr></thead>
      <tbody>{payments.map((payment) => <tr key={payment.id}>
        <td><strong>{payment.product}</strong><span className="crm-cell-note">{payment.id}</span></td>
        <td>{money(payment.amount, payment.currency)}<span className="crm-cell-note">{date(payment.paidAt)}</span></td>
        <td>{payment.cashEarning
          ? <><strong>{payment.cashEarning.percent}% · {money(payment.cashEarning.amount, payment.currency)}</strong><Status value={payment.cashEarning.status} /><span className="crm-cell-note">доступно с {date(payment.cashEarning.availableAt)}</span></>
          : "—"}</td>
        <td>{(payment.bonuses || []).map((bonus, index) => <div key={`${bonus.recipient}-${index}`}>
          <strong>{bonus.metacoins} метакоинов</strong>
          <span className="crm-cell-note">{bonus.recipient} · {statusLabels[bonus.status] || bonus.status}</span>
        </div>)}</td>
      </tr>)}</tbody>
    </table>
  );
}

function PartnerDrilldown({ partner }) {
  return <section className="crm-finance-block crm-referral-drilldown" aria-label={`партнёр ${partner.userName}`}>
    <header className="crm-finance-block__header"><div><span className="crm-eyebrow">прямые приглашения и выплаты</span><h2>{partner.userName}</h2></div></header>
    {(partner.directReferrals || []).length ? partner.directReferrals.map((referral) => <article className="crm-referral-relation" key={referral.id}>
      <h3>{referral.userName}</h3>
      <p>Telegram ID {referral.telegramUserId} · привязан {date(referral.boundAt)}</p>
      <PaymentRows payments={referral.payments} />
    </article>) : <p className="crm-empty-copy">прямых приглашений пока нет</p>}
    <h3>заявки и выплаты</h3>
    {(partner.withdrawals || []).length ? <><table className="crm-table" aria-label="выводы партнёра"><thead><tr><th>заявка</th><th>сумма</th><th>маршрут</th><th>статус</th></tr></thead><tbody>
      {partner.withdrawals.map((item) => <tr key={item.id}><td>{item.id}<span className="crm-cell-note">{date(item.requestedAt)} · попыток {item.attempts ?? 0}</span></td><td>{money(item.amount, item.currency)}</td><td>{item.provider} · {item.method}<span className="crm-cell-note">{item.destinationHint || "реквизиты скрыты"}</span></td><td><Status value={item.status} />{item.errorCode && <span className="crm-cell-note">ошибка: {item.errorCode}</span>}</td></tr>)}
    </tbody></table>{partner.withdrawals.some(({ status }) => status === "manual_review") && <p className="crm-empty-copy">сверьте перевод в Т-Бизнесе по ID заявки и внешнему ID. CRM не меняет финансовый статус вручную: итог должен прийти из платёжного воркера, чтобы не пересечься с автоматической очередью.</p>}</> : <p className="crm-empty-copy">заявок на вывод пока нет</p>}
  </section>;
}

export function ReferralPartnersPage({ partners = [] }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = partners.find(({ id }) => id === selectedId);
  return <section className="crm-page crm-referrals-page" aria-labelledby="referrals-title">
    <header className="crm-page__header"><div><span className="eyebrow">деньги и юридический статус</span><h1 id="referrals-title">партнёрская программа</h1><p>начисления, оба бонуса метакоинами, оферта и безопасный маршрут выплаты</p></div></header>
    {!partners.length ? <div className="crm-empty-state"><h2>партнёров пока нет</h2></div> : <div className="crm-referral-cards crm-partner-grid" role="list" aria-label="партнёры">
      {partners.map((partner) => <article className="crm-referral-card crm-partner-card" role="listitem" aria-label={`партнёр ${partner.userName}`} key={partner.id}>
        <header className="crm-referral-card__header">
          <div className="crm-referral-card__identity"><strong>{partner.userName}</strong><small>Telegram ID {partner.telegramUserId}</small></div>
          <div className="crm-referral-card__level"><span>уровень</span><strong>{partner.level} · {partner.percent}%</strong></div>
        </header>
        <dl className="crm-referral-card__metrics">
          <div><dt>рефералы</dt><dd>{partner.paidReferralsCount ?? 0}<small>с подтверждённой оплатой</small></dd></div>
          <div><dt>оформление</dt><dd>{partner.offer?.accepted ? "оферта принята" : "оферта не принята"}<small>{taxLabels[partner.taxStatus] || taxLabels.unknown}</small></dd></div>
          <div><dt>доступно</dt><dd>{money(partner.balances?.available, partner.balances?.currency)}<small>резерв {money(partner.balances?.reserved, partner.balances?.currency)}</small></dd></div>
        </dl>
        <footer className="crm-referral-card__footer"><span>{partner.payoutReadiness?.label || "статус выплаты не указан"}</span><button className="secondary-action" type="button" aria-label={`открыть партнёра ${partner.userName}`} onClick={() => setSelectedId(partner.id)}>открыть</button></footer>
      </article>)}
    </div>}
    {selected && <PartnerDrilldown partner={selected} />}
  </section>;
}
