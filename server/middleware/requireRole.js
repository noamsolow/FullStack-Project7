import { forbidden } from "../utils/AppError.js";

export function requireRole(...roles) {
  return function roleGuard(request, _response, next) {
    if (!roles.includes(request.user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}

