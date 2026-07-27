export const orderTransitions = Object.freeze({
  placed: ["accepted", "cancellation_requested", "needs_attention"],
  accepted: ["preparing", "needs_attention"],
  preparing: ["ready", "needs_attention"],
  ready: ["completed", "out_for_delivery", "needs_attention"],
  out_for_delivery: ["completed", "needs_attention"],
});

export const printTransitions = Object.freeze({
  submitted: ["quoted", "rejected", "cancelled"],
  quoted: ["pending_payment", "cancelled", "rejected"],
  paid: ["printing", "cancellation_requested", "needs_attention"],
  printing: ["ready", "needs_attention"],
  ready: ["completed", "needs_attention"],
});

export const maintenanceTransitions = Object.freeze({
  open: ["acknowledged", "rejected"],
  acknowledged: ["in_progress", "waiting_for_user", "rejected"],
  in_progress: ["waiting_for_user", "resolved"],
  waiting_for_user: ["in_progress", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: [],
  rejected: [],
});

export function canTransition(rules, current, next) {
  return Boolean(rules[current]?.includes(next));
}

