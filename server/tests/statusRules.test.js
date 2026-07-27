import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  maintenanceTransitions,
  orderTransitions,
  printTransitions,
} from "../utils/statusRules.js";

test("pickup and delivery order transitions reject skipping preparation", () => {
  assert.equal(canTransition(orderTransitions, "placed", "accepted"), true);
  assert.equal(canTransition(orderTransitions, "placed", "ready"), false);
  assert.equal(canTransition(orderTransitions, "ready", "out_for_delivery"), true);
});

test("print jobs cannot begin printing before payment", () => {
  assert.equal(canTransition(printTransitions, "submitted", "quoted"), true);
  assert.equal(canTransition(printTransitions, "submitted", "printing"), false);
  assert.equal(canTransition(printTransitions, "paid", "printing"), true);
});

test("closed maintenance tickets are terminal", () => {
  assert.equal(canTransition(maintenanceTransitions, "resolved", "closed"), true);
  assert.equal(canTransition(maintenanceTransitions, "closed", "in_progress"), false);
});

