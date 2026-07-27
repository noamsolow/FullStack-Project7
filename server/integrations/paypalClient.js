import { config } from "../config/index.js";
import { AppError } from "../utils/AppError.js";
import { agorotToPayPal } from "../utils/money.js";

let cachedToken = null;
let tokenExpiresAt = 0;

function baseUrl() {
  return config.paypal.environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function assertConfigured() {
  if (!config.paypal.clientId || !config.paypal.clientSecret) {
    throw new AppError(
      503,
      "PAYMENT_NOT_CONFIGURED",
      "Payment checkout is not configured yet",
    );
  }
}

async function fetchWithTimeout(url, options, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError(504, "PAYMENT_TIMEOUT", "The payment provider took too long to respond");
    }
    throw new AppError(502, "PAYMENT_UNAVAILABLE", "The payment provider is unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

async function accessToken() {
  assertConfigured();
  if (cachedToken && tokenExpiresAt > Date.now() + 60_000) {
    return cachedToken;
  }

  const basic = Buffer.from(
    `${config.paypal.clientId}:${config.paypal.clientSecret}`,
  ).toString("base64");
  const response = await fetchWithTimeout(
    `${baseUrl()}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
    },
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new AppError(
      502,
      "PAYMENT_AUTH_FAILED",
      "The payment provider could not authenticate this checkout",
    );
  }

  cachedToken = body.access_token;
  tokenExpiresAt = Date.now() + Number(body.expires_in ?? 300) * 1000;
  return cachedToken;
}

async function paypalRequest(path, options = {}) {
  const token = await accessToken();
  const response = await fetchWithTimeout(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "PayPal-Request-Id": options.requestId,
      Prefer: "return=representation",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerCode = body.name ?? "PAYPAL_ERROR";
    throw new AppError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      "The payment provider could not complete the request",
      [{ providerCode }],
    );
  }
  return body;
}

export async function createPayPalOrder({
  referenceId,
  description,
  amountAgorot,
}) {
  const body = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    requestId: `levgo-create-${referenceId}`,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          custom_id: referenceId,
          description: description.slice(0, 127),
          amount: {
            currency_code: "ILS",
            value: agorotToPayPal(amountAgorot),
          },
        },
      ],
      application_context: {
        brand_name: "LevGo",
        landing_page: "LOGIN",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: config.paypal.returnUrl,
        cancel_url: config.paypal.cancelUrl,
      },
    }),
  });

  const approvalUrl = body.links?.find((link) => link.rel === "approve")?.href;
  if (!body.id || !approvalUrl) {
    throw new AppError(
      502,
      "PAYMENT_INVALID_RESPONSE",
      "The payment provider returned an incomplete checkout",
    );
  }
  return { providerOrderId: body.id, approvalUrl };
}

export async function capturePayPalOrder(providerOrderId, referenceId) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`, {
    method: "POST",
    requestId: `levgo-capture-${referenceId}`,
    body: "{}",
  });
}

export async function getPayPalOrder(providerOrderId) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(providerOrderId)}`, {
    method: "GET",
    requestId: `levgo-show-${providerOrderId}`,
  });
}

export function captureSummary(response) {
  const purchaseUnit = response.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  return {
    providerOrderId: response.id,
    orderStatus: response.status,
    providerCaptureId: capture?.id,
    captureStatus: capture?.status,
    amountValue: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
  };
}
