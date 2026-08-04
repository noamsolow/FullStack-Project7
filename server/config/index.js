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

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = required("JWT_SECRET", nodeEnv === "test"
  ? "test-only-secret-that-is-at-least-32-characters"
  : undefined);
const emailEnabled = (process.env.EMAIL_ENABLED ?? "false").toLowerCase() === "true";

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
    "jct.ac.il",
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
  email: {
    enabled: emailEnabled,
    apiKey: emailEnabled
      ? required("RESEND_API_KEY")
      : process.env.RESEND_API_KEY ?? "",
    from: emailEnabled
      ? required("EMAIL_FROM")
      : process.env.EMAIL_FROM ?? "LevGo <onboarding@resend.dev>",
    replyTo: process.env.EMAIL_REPLY_TO ?? "",
    timeoutMs: integer("EMAIL_TIMEOUT_MS", 10_000, 1000),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: required("GEMINI_MODEL", "gemini-flash-lite-latest"),
    timeoutMs: integer("GEMINI_TIMEOUT_MS", 12000, 1000),
  },
});
