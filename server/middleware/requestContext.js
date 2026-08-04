import crypto from "node:crypto";

export function requestContext(request, response, next) {
  request.id = crypto.randomUUID();
  response.setHeader("X-Request-Id", request.id);
  next();
}

