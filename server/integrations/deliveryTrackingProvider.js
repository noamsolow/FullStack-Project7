import { config } from "../config/index.js";

export function createDemoDeliveryTracking({
  now = new Date(),
  random = Math.random,
} = {}) {
  const minimum = config.deliveryTracking.demoMinSeconds;
  const maximum = config.deliveryTracking.demoMaxSeconds;
  if (maximum < minimum) {
    throw new Error("DEMO_DELIVERY_MAX_SECONDS must be greater than or equal to the minimum");
  }
  const durationSeconds = minimum + Math.floor(random() * (maximum - minimum + 1));
  return {
    provider: "demo",
    providerReference: null,
    status: "in_transit",
    startedAt: now,
    etaAt: new Date(now.getTime() + durationSeconds * 1000),
  };
}

const providers = Object.freeze({
  demo: createDemoDeliveryTracking,
});

export function createDeliveryTracking(input) {
  return providers[config.deliveryTracking.provider](input);
}
