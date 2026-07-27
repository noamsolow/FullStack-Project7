import { Icon } from "./Icon.jsx";

export function Toast({ message, tone = "success", onClose }) {
  if (!message) return null;
  return (
    <div className={`toast toast--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "error" ? "report" : "check"} />
      <span>{message}</span>
      <button aria-label="Dismiss" onClick={onClose}><Icon name="close" size={16} /></button>
    </div>
  );
}

