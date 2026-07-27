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

