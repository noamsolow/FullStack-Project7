import assert from "node:assert/strict";
import test from "node:test";
import { createDemoDeliveryTracking } from "../integrations/deliveryTrackingProvider.js";

test("demo tracking returns the configured minimum ETA", () => {
  const now = new Date("2026-08-05T12:00:00.000Z");
  const tracking = createDemoDeliveryTracking({ now, random: () => 0 });
  assert.equal(tracking.provider, "demo");
  assert.equal(tracking.status, "in_transit");
  assert.equal(tracking.startedAt, now);
  assert.equal(tracking.etaAt.getTime() - now.getTime(), 30_000);
});

test("demo tracking includes the configured maximum ETA", () => {
  const now = new Date("2026-08-05T12:00:00.000Z");
  const tracking = createDemoDeliveryTracking({ now, random: () => 0.999999 });
  assert.equal(tracking.etaAt.getTime() - now.getTime(), 60_000);
});

test("demo tracking generates only ETAs inside the inclusive range", () => {
  const now = new Date("2026-08-05T12:00:00.000Z");
  for (let index = 0; index <= 100; index += 1) {
    const tracking = createDemoDeliveryTracking({ now, random: () => index / 101 });
    const seconds = (tracking.etaAt.getTime() - now.getTime()) / 1000;
    assert.ok(seconds >= 30 && seconds <= 60);
  }
});
