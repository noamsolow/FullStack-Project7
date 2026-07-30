import { config } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

function assertConfigured() {
  if (!config.email.apiKey || !config.email.from) {
    throw new AppError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Order email notifications are not configured",
    );
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
  tags = [],
}) {
  if (!config.email.enabled) return { skipped: true };
  assertConfigured();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.email.timeoutMs);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.email.apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: config.email.from,
        to: [to],
        subject,
        html,
        text,
        ...(config.email.replyTo ? { reply_to: config.email.replyTo } : {}),
        ...(tags.length ? { tags } : {}),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.id) {
      throw new AppError(
        502,
        "EMAIL_PROVIDER_ERROR",
        "The email provider could not send this notification",
        [{ providerCode: body.name ?? `HTTP_${response.status}` }],
      );
    }
    return { id: body.id, skipped: false };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError(
        504,
        "EMAIL_TIMEOUT",
        "The email provider took too long to respond",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
