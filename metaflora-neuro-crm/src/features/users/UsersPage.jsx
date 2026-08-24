import { useMemo, useState } from "react";

const STATUS_LABELS = {
  active: "активен",
  blocked: "заблокирован",
  pending: "ожидает",
  archived: "в архиве",
};

const PLAN_LABELS = {
  "новичок": "новичок",
  "любитель": "любитель",
  "автор": "автор",
  "исследователь": "исследователь",
  "эксперт": "эксперт",
};

const RECEIPT_STATUS_LABELS = {
  succeeded: "отправлен",
  pending: "формируется",
  canceled: "отменён",
  failed: "не зарегистрирован",
  unknown: "статус неизвестен",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const numberFormatter = new Intl.NumberFormat("ru-RU");

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function formatRublesFromKopecks(value) {
  return `${numberFormatter.format(Number(value || 0) / 100)} ₽`;
}

function matchesUser(user, filters) {
  const query = filters.query.trim().toLocaleLowerCase("ru");
  const identity = [
    user.id,
    user.name,
    user.email,
    user.telegramUsername,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru");

  return (
    (!query || identity.includes(query)) &&
    (!filters.status || user.status === filters.status) &&
    (!filters.plan || user.plan === filters.plan)
  );
}

export function UserFilters({ filters, onChange }) {
  return (
    <div className="crm-toolbar crm-user-filters" aria-label="фильтры пользователей">
      <label className="crm-search">
        <span className="crm-visually-hidden">поиск пользователей</span>
        <input
          aria-label="поиск пользователей"
          type="search"
          value={filters.query}
          placeholder="имя, почта, Telegram или ID"
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </label>

      <label className="crm-field">
        <span>статус</span>
        <select
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          <option value="">все статусы</option>
          <option value="active">активные</option>
          <option value="blocked">заблокированные</option>
          <option value="pending">ожидают</option>
          <option value="archived">в архиве</option>
        </select>
      </label>

      <label className="crm-field">
        <span>тариф</span>
        <select
          value={filters.plan}
          onChange={(event) => onChange({ plan: event.target.value })}
        >
          <option value="">все тарифы</option>
          <option value="новичок">новичок</option>
          <option value="любитель">любитель</option>
          <option value="автор">автор</option>
          <option value="исследователь">исследователь</option>
          <option value="эксперт">эксперт</option>
        </select>
      </label>
    </div>
  );
}

export function UsersTable({ users, selectedUserId, onSelectUser }) {
  if (users.length === 0) {
    return (
      <div className="crm-empty-state">
        <strong>здесь пока никого нет</strong>
        <span>проверьте фильтры или измените поисковый запрос</span>
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table crm-users-table">
        <thead>
          <tr>
            <th scope="col">пользователь</th>
            <th scope="col">статус</th>
            <th scope="col">тариф</th>
            <th scope="col">метакоины</th>
            <th scope="col">регистрация</th>
            <th scope="col"><span className="crm-visually-hidden">действие</span></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              className={selectedUserId === user.id ? "is-selected" : undefined}
              key={user.id}
            >
              <td>
                <div className="crm-person-cell">
                  {user.avatarUrl && (
                    <img
                      className="crm-person-cell__avatar"
                      src={user.avatarUrl}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="crm-person-cell__identity">
                    <strong>{user.name || "без имени"}</strong>
                    <span>{user.telegramUsername || user.email || user.id}</span>
                  </span>
                </div>
              </td>
              <td>
                <span className={`crm-status crm-status--${user.status || "unknown"}`}>
                  {STATUS_LABELS[user.status] || "неизвестно"}
                </span>
              </td>
              <td>{PLAN_LABELS[user.plan] || user.plan || "—"}</td>
              <td>{numberFormatter.format(user.metacoinBalance || 0)}</td>
              <td>{formatDate(user.registeredAt)}</td>
              <td>
                <button
                  className="crm-row-action"
                  type="button"
                  aria-label={`открыть ${user.name || user.id}`}
                  onClick={() => onSelectUser(user)}
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

export function UserCard({
  user,
  details,
  detailsStatus = "idle",
  onClose,
  onToggleBlocked,
  onChangePlan,
  onOpenFinance,
  onAdjustMetacoins,
}) {
  const [adjustmentDirection, setAdjustmentDirection] = useState("credit");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  if (!user) {
    return (
      <aside className="crm-detail-card crm-user-card crm-detail-card--empty">
        <span>выберите пользователя — профиль откроется здесь</span>
      </aside>
    );
  }

  const isBlocked = user.status === "blocked";
  const parsedAmount = Number(adjustmentAmount);
  const canSubmitAdjustment =
    Number.isSafeInteger(parsedAmount) &&
    parsedAmount > 0 &&
    adjustmentReason.trim().length >= 3;

  function submitAdjustment(event) {
    event.preventDefault();
    if (!onAdjustMetacoins || !canSubmitAdjustment) return;
    const delta =
      adjustmentDirection === "debit" ? -parsedAmount : parsedAmount;
    onAdjustMetacoins(user.id, delta, adjustmentReason.trim());
  }

  return (
    <aside className="crm-detail-card crm-user-card" aria-label="карточка пользователя">
      <header className="crm-detail-card__header">
        <div className="crm-user-card__identity">
          {(details?.avatarUrl || user.avatarUrl) && (
            <img
              className="crm-user-card__avatar"
              src={details?.avatarUrl || user.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
          <div>
          <span className="crm-eyebrow">{user.id}</span>
          <h2>{user.name || "без имени"}</h2>
          <p>{user.telegramUsername || user.email || "контакт не указан"}</p>
          </div>
        </div>
        {onClose && (
          <button type="button" aria-label="закрыть карточку" onClick={onClose}>
            закрыть
          </button>
        )}
      </header>

      <dl className="crm-facts">
        <div><dt>статус</dt><dd>{STATUS_LABELS[user.status] || "неизвестно"}</dd></div>
        <div><dt>тариф</dt><dd>{PLAN_LABELS[user.plan] || user.plan || "—"}</dd></div>
        <div><dt>действует до</dt><dd>{user.subscriptionExpiresAt ? formatDate(user.subscriptionExpiresAt) : user.plan === "новичок" ? "бесплатный тариф" : "—"}</dd></div>
        <div><dt>метакоины</dt><dd>{numberFormatter.format(user.metacoinBalance || 0)}</dd></div>
        <div><dt>лимит тарифа</dt><dd>{numberFormatter.format(user.subscriptionMetacoinsRemaining || 0)} из {numberFormatter.format(user.subscriptionMetacoinsTotal || 0)}</dd></div>
        <div><dt>пакетные / общие</dt><dd>{numberFormatter.format(user.packageMetacoinBalance || 0)} / {numberFormatter.format(user.generalMetacoinBalance || user.metacoinBalance || 0)}</dd></div>
        <div><dt>e-mail для чека</dt><dd>{user.receiptEmail || "не оставлен"}</dd></div>
        <div><dt>последний чек</dt><dd>{RECEIPT_STATUS_LABELS[user.lastReceiptStatus] || RECEIPT_STATUS_LABELS.unknown}</dd></div>
        <div><dt>потрачено метакоинов</dt><dd>{numberFormatter.format(user.totalMetacoinsSpent || 0)}</dd></div>
        <div><dt>оплачено</dt><dd>{numberFormatter.format(user.totalPaidRub || 0)} ₽</dd></div>
        <div><dt>регистрация</dt><dd>{formatDate(user.registeredAt)}</dd></div>
        <div><dt>последняя активность</dt><dd>{formatDate(user.lastSeenAt)}</dd></div>
      </dl>

      {detailsStatus === "loading" && (
        <p className="crm-muted">загружаем историю пользователя…</p>
      )}
      {detailsStatus === "error" && (
        <p className="crm-status crm-status--degraded">
          история пользователя временно недоступна
        </p>
      )}
      {details && (
        <section className="crm-user-history" aria-label="история пользователя">
          <h3>история пользователя</h3>
          <dl className="crm-facts">
            <div><dt>платежи</dt><dd>{details.payments?.length ?? 0}</dd></div>
            <div><dt>операции</dt><dd>{details.ledgerEntries?.length ?? 0}</dd></div>
            <div><dt>генерации</dt><dd>{details.generations?.length ?? 0}</dd></div>
            <div><dt>API-вызовы</dt><dd>{details.providerCalls?.length ?? 0}</dd></div>
            <div><dt>события</dt><dd>{details.audit?.length ?? 0}</dd></div>
          </dl>
          {(details.subscriptionUpgrades?.length ?? 0) > 0 && (
            <div className="crm-user-history__audit" aria-label="аудит апгрейдов">
              <h4>апгрейды тарифа</h4>
              {details.subscriptionUpgrades.map((upgrade) => (
                <article key={upgrade.id}>
                  <strong>{upgrade.fromPlan} → {upgrade.toPlan}</strong>
                  <span>начислено: {numberFormatter.format(upgrade.creditedDelta || 0)}</span>
                  <span>остаток: {numberFormatter.format(upgrade.beforeSubscriptionRemaining || 0)} → {numberFormatter.format(upgrade.afterSubscriptionRemaining || 0)}</span>
                </article>
              ))}
            </div>
          )}
          {(details.providerFunding?.length ?? 0) > 0 && (
            <div className="crm-user-history__audit" aria-label="финансирование провайдеров">
              <h4>лимиты провайдеров</h4>
              {details.providerFunding.map((funding) => (
                <article key={funding.allocationKey}>
                  <strong>{funding.provider}: осталось профинансировать {formatRublesFromKopecks(funding.remainingKopecks)}</strong>
                  <span>выделено {formatRublesFromKopecks(funding.allocatedKopecks)} · зачислено {formatRublesFromKopecks(funding.fundedKopecks)}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="crm-detail-card__actions">
        {onAdjustMetacoins && (
          <form className="crm-adjustment-form" onSubmit={submitAdjustment}>
            <label className="crm-field">
              <span>направление</span>
              <select
                aria-label="направление операции"
                value={adjustmentDirection}
                onChange={(event) => setAdjustmentDirection(event.target.value)}
              >
                <option value="credit">начислить</option>
                <option value="debit">списать</option>
              </select>
            </label>
            <label className="crm-field">
              <span>количество</span>
              <input
                aria-label="количество метакоинов"
                min="1"
                step="1"
                inputMode="numeric"
                type="number"
                value={adjustmentAmount}
                onChange={(event) => setAdjustmentAmount(event.target.value)}
              />
            </label>
            <label className="crm-field crm-adjustment-form__reason">
              <span>причина</span>
              <input
                aria-label="причина изменения баланса"
                maxLength="500"
                type="text"
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
              />
            </label>
            <button type="submit" disabled={!canSubmitAdjustment}>
              применить изменение
            </button>
          </form>
        )}
        {onChangePlan && (
          <button type="button" onClick={() => onChangePlan(user)}>
            сменить тариф
          </button>
        )}
        {onOpenFinance && (
          <button type="button" onClick={() => onOpenFinance(user)}>
            открыть деньги
          </button>
        )}
        {onToggleBlocked && (
          <button
            className={isBlocked ? undefined : "is-danger"}
            type="button"
            onClick={() => onToggleBlocked(user)}
          >
            {isBlocked ? "разблокировать" : "заблокировать"}
          </button>
        )}
      </div>
    </aside>
  );
}

export function UsersPage({
  users = [],
  selectedUserId,
  selectedUserDetails = null,
  selectedUserDetailsStatus = "idle",
  onSelectUser,
  onCloseUser,
  onFiltersChange,
  onToggleBlocked,
  onChangePlan,
  onOpenFinance,
  onAdjustMetacoins,
}) {
  const [filters, setFilters] = useState({ query: "", status: "", plan: "" });
  const [internalSelectedUserId, setInternalSelectedUserId] = useState(null);
  const activeUserId = selectedUserId ?? internalSelectedUserId;

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesUser(user, filters)),
    [filters, users],
  );
  const selectedUser = users.find((user) => user.id === activeUserId) || null;

  function updateFilters(patch) {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    onFiltersChange?.(nextFilters);
  }

  function selectUser(user) {
    setInternalSelectedUserId(user.id);
    onSelectUser?.(user);
  }

  function closeUser() {
    setInternalSelectedUserId(null);
    onCloseUser?.();
  }

  return (
    <section className="crm-page crm-users-page" aria-labelledby="users-title">
      <header className="crm-page__header">
        <div>
          <span className="crm-eyebrow">люди и доступ</span>
          <h1 id="users-title">пользователи</h1>
          <p>находите нужного человека и решайте вопрос без лишних переходов</p>
        </div>
        <span className="crm-page__count">{filteredUsers.length} в списке</span>
      </header>

      <UserFilters filters={filters} onChange={updateFilters} />
      <div className="crm-master-detail">
        <UsersTable
          users={filteredUsers}
          selectedUserId={activeUserId}
          onSelectUser={selectUser}
        />
        <UserCard
          user={selectedUser}
          details={selectedUserDetails}
          detailsStatus={selectedUserDetailsStatus}
          onClose={
            selectedUserId === undefined || onCloseUser ? closeUser : undefined
          }
          onToggleBlocked={onToggleBlocked}
          onChangePlan={onChangePlan}
          onOpenFinance={onOpenFinance}
          onAdjustMetacoins={onAdjustMetacoins}
        />
      </div>
    </section>
  );
}
