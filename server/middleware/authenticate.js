import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { findSafeUserByPublicId } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(request, _response, next) {
  try {
    const authorization = request.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      throw new AppError(401, "AUTH_REQUIRED", "Sign in to continue");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    if (!payload.sub || typeof payload.sub !== "string") {
      throw new AppError(401, "INVALID_TOKEN", "Your session is invalid");
    }

    const user = await findSafeUserByPublicId(payload.sub);
    if (!user || user.blocked_at || user.deleted_at) {
      throw new AppError(401, "ACCOUNT_UNAVAILABLE", "This account is unavailable");
    }

    request.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "INVALID_TOKEN", "Your session has expired or is invalid"));
  }
}

