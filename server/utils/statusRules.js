export const orderTransitions = Object.freeze({
  placed: ["preparing", "needs_attention"],
  // Existing accepted orders can still join the simplified flow.
  accepted: ["preparing", "needs_attention"],
  preparing: ["ready", "out_for_delivery", "needs_attention"],
  // Delivery orders that reached ready in the previous flow can continue.
  ready: ["out_for_delivery"],
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

