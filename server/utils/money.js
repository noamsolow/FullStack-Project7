import { AppError } from "./AppError.js";

export function agorotToPayPal(agorot) {
  if (!Number.isInteger(agorot) || agorot < 0) {
    throw new AppError(500, "INVALID_MONEY", "Invalid stored monetary value");
  }
  return (agorot / 100).toFixed(2);
}

export function payPalToAgorot(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
    throw new AppError(502, "PAYMENT_INVALID_AMOUNT", "Payment provider returned an invalid amount");
  }
  return Math.round(Number(value) * 100);
}

