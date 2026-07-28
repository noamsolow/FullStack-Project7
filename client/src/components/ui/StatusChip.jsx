import { orderStatusLabel } from "../../utils/format.js";

const positive = new Set(["active", "open", "ready", "completed", "resolved", "paid", "success"]);
const warning = new Set([
  "pending_payment",
  "payment_processing",
  "quoted",
  "submitted",
  "cancellation_requested",
  "waiting_for_user",
  "urgent",
]);
const negative = new Set(["cancelled", "rejected", "suspended", "blocked", "needs_attention", "failure"]);

export function StatusChip({ status }) {
  const tone = positive.has(status)
    ? "positive"
    : warning.has(status)
      ? "warning"
      : negative.has(status)
        ? "negative"
        : "neutral";
  return <span className={`status-chip status-chip--${tone}`}>{orderStatusLabel(status)}</span>;
}
