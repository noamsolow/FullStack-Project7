import crypto from "node:crypto";

export function publicId() {
  return crypto.randomUUID();
}

export function shortCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export function referenceNumber(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${suffix}`.slice(0, 24);
}

export function hashIp(ip, secret) {
  if (!ip) return null;
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

