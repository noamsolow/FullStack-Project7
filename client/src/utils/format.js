export function formatMoney(agorot, currency = "ILS") {
  return new Intl.NumberFormat("en-IL", {
    style: "currency",
    currency,
  }).format((Number(agorot) || 0) / 100);
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IL", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}

export function titleCase(value = "") {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const orderStatusLabels = {
  placed: "Sent",
  accepted: "Sent",
  preparing: "In progress",
  ready: "Ready for pickup",
  out_for_delivery: "On the way",
  completed: "Completed",
};

export function orderStatusLabel(status = "") {
  return orderStatusLabels[status] ?? titleCase(status);
}

