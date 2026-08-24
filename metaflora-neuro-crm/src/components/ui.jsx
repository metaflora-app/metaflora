import {
  ArrowDownRight,
  ArrowUpRight,
  CaretDown,
  Check,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";

export function StatusBadge({ tone = "neutral", children }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function MetricCard({ label, value, delta, trend = "up", caption, accent }) {
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <article className={`metric-card${accent ? " metric-card--accent" : ""}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__meta">
        <span>{caption}</span>
        {delta ? (
          <span className={`metric-card__delta metric-card__delta--${trend}`}>
            <TrendIcon size={12} weight="bold" />
            {delta}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function SearchField({ value, onChange, placeholder = "поиск" }) {
  return (
    <label className="search-field">
      <MagnifyingGlass size={15} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button type="button" aria-label="очистить поиск" onClick={() => onChange("")}>
          <X size={13} />
        </button>
      ) : null}
    </label>
  );
}

export function SelectField({ value, onChange, options, label }) {
  return (
    <label className="select-field">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown size={13} weight="bold" />
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`toggle${disabled ? " toggle--disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span className="toggle__track">
        <span className="toggle__thumb">{checked ? <Check size={9} weight="bold" /> : null}</span>
      </span>
      <span>{label}</span>
    </label>
  );
}

export function EmptyState({ children = "// данных пока нет" }) {
  return <div className="empty-state">{children}</div>;
}

export function Drawer({ open, title, eyebrow, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-layer__scrim" aria-label="закрыть панель" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer__header">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="закрыть" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer ? <footer className="drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function SegmentedControl({ value, onChange, options, ariaLabel }) {
  return (
    <div className="segmented-control" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
