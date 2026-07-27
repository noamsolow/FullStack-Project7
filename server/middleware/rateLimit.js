import { AppError } from "../utils/AppError.js";

const stores = new Set();

export function rateLimit({ windowMs, maximum, key = (request) => request.ip }) {
  const entries = new Map();
  stores.add(entries);

  return function limitRequests(request, _response, next) {
    const now = Date.now();
    const identifier = key(request);
    const current = entries.get(identifier);

    if (!current || current.resetAt <= now) {
      entries.set(identifier, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maximum) {
      next(new AppError(
        429,
        "RATE_LIMITED",
        "Too many requests. Please wait and try again.",
      ));
      return;
    }

    current.count += 1;
    next();
  };
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const entries of stores) {
    for (const [identifier, value] of entries) {
      if (value.resetAt <= now) entries.delete(identifier);
    }
  }
}, 60_000);
cleanupTimer.unref();

