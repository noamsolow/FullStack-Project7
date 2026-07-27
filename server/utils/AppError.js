export class AppError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function notFound(message = "The requested resource was not found") {
  return new AppError(404, "NOT_FOUND", message);
}

export function forbidden(message = "You do not have permission for this action") {
  return new AppError(403, "FORBIDDEN", message);
}

export function conflict(message, code = "CONFLICT") {
  return new AppError(409, code, message);
}

