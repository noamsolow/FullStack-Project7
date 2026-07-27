import test from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema } from "../validation/orderSchemas.js";
import { registerCustomerSchema } from "../validation/authSchemas.js";

test("checkout accepts identifiers and quantities but no client price", () => {
  const valid = checkoutSchema.validate({
    items: [{ productId: "4afc427b-2c0e-4ef2-a261-157b5dc6ad12", quantity: 2 }],
    fulfillmentType: "pickup",
  });
  assert.equal(valid.error, undefined);

  const tampered = checkoutSchema.validate({
    items: [{ productId: "4afc427b-2c0e-4ef2-a261-157b5dc6ad12", quantity: 2 }],
    fulfillmentType: "pickup",
    totalAgorot: 1,
  });
  assert.ok(tampered.error);
});

test("customer password contract requires mixed characters", () => {
  const result = registerCustomerSchema.validate({
    email: "student@jct.ac.il",
    password: "onlylowercase",
    displayName: "Student",
    customerType: "student",
  });
  assert.ok(result.error);
});

