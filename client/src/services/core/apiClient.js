import { clearSession, token } from "../../utils/session.js";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const cache = new Map();
const inFlight = new Map();

export class ApiError extends Error {
  constructor(status, code, message, details = [], requestId = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

function urlFor(path) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const result = search.toString();
  return result ? `?${result}` : "";
}

export function invalidate(prefix = "") {
  for (const key of cache.keys()) {
    if (key.includes(prefix)) cache.delete(key);
  }
}

async function execute(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);
  const sessionToken = token();
  const headers = new Headers(options.headers);
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(urlFor(path), {
      method: options.method ?? "GET",
      headers,
      body,
      signal: controller.signal,
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;
    if (!response.ok) {
      const error = payload?.error ?? {};
      if (response.status === 401 && sessionToken) {
        clearSession();
        window.dispatchEvent(new Event("levgo:session-expired"));
      }
      throw new ApiError(
        response.status,
        error.code ?? "REQUEST_FAILED",
        error.message ?? "The request could not be completed",
        error.details ?? [],
        error.requestId ?? response.headers.get("X-Request-Id"),
      );
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(0, "NETWORK_TIMEOUT", "The request timed out. Please try again.");
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach LevGo. Check the server and try again.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiRequest(path, options = {}) {
  const method = options.method ?? "GET";
  const fullPath = `${path}${queryString(options.query)}`;
  const key = `${method}:${fullPath}:${token() ?? "public"}`;

  if (method === "GET" && options.cache !== false) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = execute(fullPath, options)
      .then((value) => {
        cache.set(key, {
          value,
          expiresAt: Date.now() + (options.cacheMs ?? 30_000),
        });
        return value;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  const result = await execute(fullPath, options);
  if (method !== "GET") invalidate(options.invalidate ?? "");
  return result;
}

export function apiMediaUrl(path) {
  return urlFor(path);
}

export async function downloadPrivateFile(path, suggestedName = "download") {
  const response = await fetch(urlFor(path), {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      payload.error?.code ?? "DOWNLOAD_FAILED",
      payload.error?.message ?? "The file could not be downloaded",
    );
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = suggestedName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
