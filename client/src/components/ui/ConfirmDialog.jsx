import { useEffect, useRef } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Continue",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog__actions">
          <button ref={cancelRef} className="button button--ghost" onClick={onCancel}>
            Keep current
          </button>
          <button
            className={`button ${destructive ? "button--danger" : "button--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

