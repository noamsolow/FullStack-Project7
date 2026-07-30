import { Router } from "express";
import {
  recommendHandler,
  recommendationChatHandler,
} from "../controllers/recommendationController.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  recommendationChatSchema,
  recommendationSchema,
} from "../validation/recommendationSchemas.js";

export const recommendationRouter = Router();

recommendationRouter.post(
  "/chat",
  authenticate,
  requireRole("customer"),
  rateLimit({
    windowMs: 60_000,
    maximum: 10,
    key: (request) => request.user.public_id,
  }),
  validate(recommendationChatSchema),
  asyncHandler(recommendationChatHandler),
);

recommendationRouter.post(
  "/",
  authenticate,
  requireRole("customer"),
  rateLimit({
    windowMs: 60_000,
    maximum: 5,
    key: (request) => request.user.public_id,
  }),
  validate(recommendationSchema),
  asyncHandler(recommendHandler),
);
