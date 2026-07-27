import test from "node:test";
import assert from "node:assert/strict";
import { agorotToPayPal, payPalToAgorot } from "../utils/money.js";

test("converts agorot to exact two-decimal PayPal values", () => {
  assert.equal(agorotToPayPal(1234), "12.34");
  assert.equal(agorotToPayPal(600), "6.00");
});

test("converts provider decimal strings back to agorot", () => {
  assert.equal(payPalToAgorot("12.34"), 1234);
  assert.equal(payPalToAgorot("6"), 600);
});

test("rejects malformed provider money", () => {
  assert.throws(() => payPalToAgorot("12.345"));
  assert.throws(() => payPalToAgorot("-1.00"));
});

