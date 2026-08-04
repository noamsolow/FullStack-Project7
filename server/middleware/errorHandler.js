import multer from "multer";
import { AppError } from "../utils/AppError.js";

export function notFoundHandler(request, _response, next) {
  next(new AppError(404, "ROUTE_NOT_FOUND", `No route for ${request.method} ${request.path}`));
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  let normalized = error;
  if (error instanceof multer.MulterError) {
    normalized = new AppError(400, "INVALID_UPLOAD", "The uploaded file is invalid");
  }
  if (error?.code === "ER_DUP_ENTRY") {
    normalized = new AppError(409, "DUPLICATE_RESOURCE", "That value is already in use");
  }

  const isOperational = normalized instanceof AppError || normalized.isOperational;
  const status = isOperational ? normalized.status : 500;
  const code = isOperational ? normalized.code : "INTERNAL_ERROR";
  const message = isOperational
    ? normalized.message
    : "The server could not complete the request";

  const logPayload = {
    level: status >= 500 ? "error" : "warn",
    requestId: request.id,
    method: request.method,
    path: request.originalUrl,
    status,
    code,
    ...(status >= 500 && !isOperational
      ? { errorName: normalized.name ?? "Error" }
      : {}),
  };
  console.error(JSON.stringify(logPayload));

  response.status(status).json({
    error: {
      code,
      message,
      details: isOperational ? normalized.details ?? [] : [],
      requestId: request.id,
    },
  });
}
