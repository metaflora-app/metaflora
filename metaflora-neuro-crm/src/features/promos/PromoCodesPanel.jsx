import { X } from "@phosphor-icons/react";
import { useState } from "react";

const STATUS_LABELS = { active: "активен", paused: "приостановлен", scheduled: "запланирован", expired: "завершён", exhausted: "исчерпан" };
const EMPTY_FORM = Object.freeze({ code: "", rewardType: "metacoins", rewardValue: "", modelIds: [], maxRedemptions: "", expiresAt: "" });
const promoStatus = (promo) => promo.status ?? (promo.active ? "active" : "paused");
const promoValue = (promo) => {
  const type = promo.rewardType ?? (promo.discountType === "percent" ? "discount_percent" : promo.discountType);
  const value = promo.rewardValue ?? promo.discountValue;
  return type === "discount_percent" ? `${value}%` : `${Number(value).toLocaleString("ru-RU")} метакоинов`;
};

function PromoCard({ promo, onStatusChange, onDelete }) {
  const status = promoStatus(promo);
  const nextStatus = status === "active" ? "paused" : ["paused", "scheduled"].includes(status) ? "active" : null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  async function deletePermanently() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDelete(promo.id);
      setConfirmingDelete(false);
    } catch {
      setDeleteError("не удалось удалить промокод");
    } finally {
      setIsDeleting(false);
    }
  }
  return <article className="promo-card" data-status={status}>
    <header>
      <code>{promo.code}</code>
      <span className={`status-badge status-badge--${status}`}>{STATUS_LABELS[status] ?? status}</span>
      {onDelete ? <button type="button" className="promo-card__delete" aria-label={`удалить промокод ${promo.code}`} onClick={() => setConfirmingDelete(true)}><X size={18} /></button> : null}
    </header>
    <strong className="promo-card__value">{promoValue(promo)}</strong>
    {promo.modelIds?.length ? <p className="promo-card__scope">{promo.modelIds.length} моделей</p> : null}
    <div className="promo-card__usage"><div><span>использования</span><span>{promo.redemptionCount ?? 0}{Number.isFinite(promo.maxRedemptions) ? ` / ${promo.maxRedemptions}` : ""}</span></div></div>
    {promo.expiresAt ? <time dateTime={promo.expiresAt}>{Number.isNaN(new Date(promo.expiresAt).getTime()) ? "дата не указана" : `до ${new Intl.DateTimeFormat("ru-RU").format(new Date(promo.expiresAt))}`}</time> : <span className="promo-card__lifetime">без срока</span>}
    {nextStatus && onStatusChange ? <button type="button" className="button-quiet" aria-label={`${nextStatus === "paused" ? "приостановить" : "активировать"} ${promo.code}`} onClick={() => onStatusChange(promo.id, nextStatus)}>{nextStatus === "paused" ? "приостановить" : "активировать"}</button> : null}
    {confirmingDelete ? <div className="promo-delete-dialog" role="dialog" aria-modal="true" aria-label={`удалить ${promo.code}`}>
      <div className="promo-delete-dialog__surface">
        <h3>удалить {promo.code}?</h3>
        <p>Промокод удалится навсегда. Это действие нельзя отменить.</p>
        {deleteError ? <p className="form-error" role="alert">{deleteError}</p> : null}
        <div>
          <button type="button" className="button-quiet" disabled={isDeleting} onClick={() => setConfirmingDelete(false)}>отмена</button>
          <button type="button" className="button-danger" disabled={isDeleting} onClick={deletePermanently}>{isDeleting ? "удаляем…" : "удалить навсегда"}</button>
        </div>
      </div>
    </div> : null}
  </article>;
}

function PromoCreateForm({ onCreate, models = [], targetMarginPercent = 50 }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [modelQuery, setModelQuery] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invalidPercent = form.rewardType === "discount_percent" && Number(form.rewardValue) > 100;
  const marginExceeded = form.rewardType === "discount_percent" && Number(form.rewardValue) > targetMarginPercent && !invalidPercent;
  const visibleModels = models.filter((model) => `${model.name} ${model.id}`.toLocaleLowerCase("ru-RU").includes(modelQuery.trim().toLocaleLowerCase("ru-RU")));
  const updateField = ({ target: { name, value } }) => { setForm((current) => ({ ...current, [name]: value, ...(name === "rewardType" ? { modelIds: [] } : {}) })); setError(""); };
  const toggleModel = ({ target: { value, checked } }) => setForm((current) => ({ ...current, modelIds: checked ? [...current.modelIds, value] : current.modelIds.filter((id) => id !== value) }));
  async function submit(event) {
    event.preventDefault();
    const code = form.code.trim().toUpperCase();
    const rewardValue = Number(form.rewardValue);
    const maxRedemptions = form.maxRedemptions ? Number(form.maxRedemptions) : null;
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return setError("код: от 3 до 32 латинских букв, цифр, _ или -");
    if (!Number.isSafeInteger(rewardValue) || rewardValue < 1 || (form.rewardType === "discount_percent" && rewardValue > 100)) return setError(form.rewardType === "discount_percent" ? "процент скидки должен быть от 1 до 100" : "укажите целое положительное число метакоинов");
    if (form.rewardType === "discount_percent" && form.modelIds.length === 0) return setError("выберите хотя бы одну модель");
    if (maxRedemptions !== null && (!Number.isSafeInteger(maxRedemptions) || maxRedemptions < 1)) return setError("лимит должен быть целым положительным числом");
    setIsSubmitting(true);
    try {
      await onCreate({ code, rewardType: form.rewardType, rewardValue, modelIds: form.rewardType === "discount_percent" ? [...form.modelIds] : [], maxRedemptions, expiresAt: form.expiresAt || null });
      setForm(EMPTY_FORM);
    } catch { setError("не удалось создать промокод"); } finally { setIsSubmitting(false); }
  }
  return <form className="promo-create" onSubmit={submit} noValidate>
    <div className="section-heading"><div><p className="eyebrow">новое правило</p><h3>создать промокод</h3></div></div>
    <label><span>код</span><input name="code" value={form.code} onChange={updateField} placeholder="WELCOME20" autoComplete="off" maxLength={32} required /></label>
    <div className="promo-create__row">
      <label><span>тип бонуса</span><select name="rewardType" value={form.rewardType} onChange={updateField}><option value="metacoins">метакоины</option><option value="discount_percent">скидка на модели</option></select></label>
      <label><span>{form.rewardType === "discount_percent" ? "процент скидки" : "метакоины"}</span><input name="rewardValue" value={form.rewardValue} onChange={updateField} type="number" inputMode="numeric" min="1" max={form.rewardType === "discount_percent" ? "100" : undefined} required /></label>
    </div>
    {form.rewardType === "discount_percent" ? <fieldset className="promo-model-picker" aria-label="модели"><legend>модели</legend><div className="promo-model-picker__toolbar"><label><span>найти модель</span><input type="search" value={modelQuery} onChange={({ target }) => setModelQuery(target.value)} placeholder="название или ID" /></label><span className="promo-model-picker__count">выбрано: {form.modelIds.length}</span></div><div className="promo-model-picker__list">{visibleModels.map((model) => <label className="promo-model-picker__item" key={model.id}><input aria-label={model.name} className="promo-model-picker__checkbox" type="checkbox" value={model.id} checked={form.modelIds.includes(model.id)} onChange={toggleModel} /><span><strong>{model.name}</strong><small>{model.id}</small></span></label>)}</div></fieldset> : null}
    <div className="promo-create__row"><label><span>общий лимит</span><input name="maxRedemptions" value={form.maxRedemptions} onChange={updateField} type="number" inputMode="numeric" min="1" placeholder="без лимита" /></label><label><span>действует до</span><input name="expiresAt" value={form.expiresAt} onChange={updateField} type="date" /></label></div>
    {invalidPercent ? <p className="form-error" role="alert">процент скидки должен быть от 1 до 100</p> : marginExceeded ? <p className="form-error" role="alert">скидка {form.rewardValue}% превышает целевую маржу {targetMarginPercent}%</p> : error ? <p className="form-error" role="alert">{error}</p> : null}
    <button type="submit" disabled={isSubmitting || invalidPercent}>{isSubmitting ? "создаём…" : "создать промокод"}</button>
  </form>;
}

export function PromoCodesPanel({ promos = [], models = [], targetMarginPercent = 50, onCreate, onStatusChange, onDelete, className = "" }) {
  return <section className={`promo-codes-panel ${className}`.trim()}><header className="feature-heading"><div><p className="eyebrow">рост</p><h2>промокоды</h2></div><span className="feature-heading__meta">{promos.filter((promo) => promoStatus(promo) === "active").length} активных</span></header>{onCreate ? <PromoCreateForm onCreate={onCreate} models={models} targetMarginPercent={targetMarginPercent} /> : null}<div className="promo-grid">{promos.length ? promos.map((promo) => <PromoCard key={promo.id} promo={promo} onStatusChange={onStatusChange} onDelete={onDelete} />) : <p className="empty-state">промокодов пока нет</p>}</div></section>;
}
export { PromoCard, PromoCreateForm };
