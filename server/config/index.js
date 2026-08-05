function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function integer(name, fallback, minimum = 0) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`Environment variable ${name} must be an integer >= ${minimum}`);
  }
  return value;
}

function boolean(name, fallback = false) {
  return (process.env[name] ?? String(fallback)).toLowerCase() === "true";
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = required("JWT_SECRET", nodeEnv === "test"
  ? "test-only-secret-that-is-at-least-32-characters"
  : undefined);
const smtpEnabled = boolean("SMTP_ENABLED");
const deliveryTrackingProvider = required("DELIVERY_TRACKING_PROVIDER", "demo");

if (deliveryTrackingProvider !== "demo") {
  throw new Error(`Unsupported DELIVERY_TRACKING_PROVIDER: ${deliveryTrackingProvider}`);
}

if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

export const config = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: integer("PORT", 3000, 1),
  clientOrigin: required("CLIENT_ORIGIN", "http://localhost:5173"),
  serverPublicUrl: required("SERVER_PUBLIC_URL", "http://localhost:3000"),
  jwt: {
    secret: jwtSecret,
    issuer: required("JWT_ISSUER", "levgo-api"),
    audience: required("JWT_AUDIENCE", "levgo-client"),
    expiresIn: required("JWT_EXPIRES_IN", "1h"),
  },
  allowedCustomerEmailDomains: required(
    "ALLOWED_CUSTOMER_EMAIL_DOMAINS",
    "g.jct.ac.il",
  )
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
  emergencyContactMessage: required(
    "EMERGENCY_CONTACT_MESSAGE",
    "For an immediate safety risk, contact campus security directly.",
  ),
  db: {
    host: required("DB_HOST", "127.0.0.1"),
    port: integer("DB_PORT", 3306, 1),
    database: required("DB_NAME", "project7"),
    user: required("DB_USER", "levgo_app"),
    password: required("DB_PASSWORD", nodeEnv === "test" ? "test" : undefined),
  },
  paypal: {
    enabled: (process.env.PAYMENTS_ENABLED ?? "false").toLowerCase() === "true",
    environment: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    clientId: process.env.PAYPAL_CLIENT_ID ?? "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
    returnUrl: required(
      "PAYPAL_RETURN_URL",
      "http://localhost:5173/payment/return",
    ),
    cancelUrl: required(
      "PAYPAL_CANCEL_URL",
      "http://localhost:5173/payment/cancel",
    ),
  },
  smtp: {
    enabled: smtpEnabled,
    host: smtpEnabled ? required("SMTP_HOST") : process.env.SMTP_HOST ?? "",
    port: integer("SMTP_PORT", 587, 1),
    secure: boolean("SMTP_SECURE"),
    user: smtpEnabled ? required("SMTP_USER") : process.env.SMTP_USER ?? "",
    password: smtpEnabled ? required("SMTP_PASS") : process.env.SMTP_PASS ?? "",
    from: smtpEnabled ? required("SMTP_FROM") : process.env.SMTP_FROM ?? "",
    replyTo: process.env.SMTP_REPLY_TO ?? "",
    timeoutMs: integer("SMTP_TIMEOUT_MS", 10_000, 1000),
  },
  deliveryTracking: {
    provider: deliveryTrackingProvider,
    demoMinSeconds: integer("DEMO_DELIVERY_MIN_SECONDS", 30, 1),
    demoMaxSeconds: integer("DEMO_DELIVERY_MAX_SECONDS", 60, 1),
    reconcileIntervalMs: integer("DELIVERY_TRACKING_INTERVAL_MS", 2_000, 500),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: required("GEMINI_MODEL", "gemini-flash-lite-latest"),
    timeoutMs: integer("GEMINI_TIMEOUT_MS", 12000, 1000),
  },
});
