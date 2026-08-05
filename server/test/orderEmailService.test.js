import assert from "node:assert/strict";
import test from "node:test";
import { buildOrderEmail } from "../services/orderEmailService.js";

const order = {
  public_id: "00000000-0000-4000-8000-000000000001",
  order_number: "LG-EMAIL-001",
  customer_name: "Demo Student",
  vendor_name: "Meat Cafeteria",
  fulfillment_type: "delivery",
  delivery_building_name: "Lev Building",
  delivery_location: "Room 315",
  payment_method: "tokens",
  subtotal_agorot: 7200,
  delivery_fee_agorot: 800,
  total_agorot: 8000,
  currency: "ILS",
  pickup_code: "123456",
  created_at: "2026-08-05T12:00:00.000Z",
};

const items = [{
  product_public_id: "10000000-0000-4000-8000-000000000001",
  product_name: "Chicken & chips",
  sku: "MEAL-01",
  unit_price_agorot: 3600,
  quantity: 2,
  line_total_agorot: 7200,
}];

test("confirmed email includes full item, fulfillment, payment, and total details", () => {
  const email = buildOrderEmail("confirmed", order, items);

  assert.match(email.text, /2 × Chicken & chips/);
  assert.match(email.text, /Location: Lev Building · Room 315/);
  assert.match(email.text, /Payment: Tokens/);
  assert.match(email.text, /Subtotal:/);
  assert.match(email.text, /Delivery:/);
  assert.match(email.text, /Total:/);
  assert.match(email.html, /MEAL-01/);
  assert.match(email.html, /Chicken &amp; chips/);
});

test("completed pickup email is a full pickup receipt", () => {
  const email = buildOrderEmail("completed", {
    ...order,
    fulfillment_type: "pickup",
    delivery_building_name: null,
    delivery_location: null,
    delivery_fee_agorot: 0,
  }, items);

  assert.match(email.subject, /Collection confirmed/);
  assert.match(email.text, /Location: Pickup from Meat Cafeteria/);
  assert.match(email.text, /Delivery: Free/);
  assert.match(email.text, /2 × Chicken & chips/);
});
