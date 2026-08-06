import crypto from "node:crypto";
// This middleware generates a unique request ID for the logs
export function requestContext(request, response, next) {
  request.id = crypto.randomUUID();
  response.setHeader("X-Request-Id", request.id);
  next();
}

