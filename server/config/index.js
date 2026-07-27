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
    database: required("DB_NAME", "levgo"),
    user: required("DB_USER", "levgo_app"),
    password: required("DB_PASSWORD", nodeEnv === "test" ? "test" : undefined),
    connectionLimit: integer("DB_CONNECTION_LIMIT", 10, 1),
  },
  paypal: {
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
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: required("OPENAI_MODEL", "gpt-5.6-luna"),
    timeoutMs: integer("OPENAI_TIMEOUT_MS", 12000, 1000),
  },
});
