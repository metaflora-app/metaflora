import { CheckCircle, Info, Warning, X } from "@phosphor-icons/react";

const icons = {
  success: CheckCircle,
  warning: Warning,
  info: Info,
};

export function ToastStack({ items, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {items.map((item) => {
        const Icon = icons[item.tone] ?? Info;
        return (
          <article className={`toast toast--${item.tone ?? "info"}`} key={item.id}>
            <Icon size={18} weight="fill" />
            <div>
              <strong>{item.title}</strong>
              {item.detail ? <p>{item.detail}</p> : null}
            </div>
            <button type="button" aria-label="закрыть уведомление" onClick={() => onDismiss(item.id)}>
              <X size={14} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
