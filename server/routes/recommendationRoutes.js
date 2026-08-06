import { Router } from "express";
import {
  recommendHandler,
  recommendationChatHandler,
} from "../controllers/recommendationController.js";
import { authenticate } from "../middleware/authenticate.js";
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
  validate(recommendationChatSchema),
  asyncHandler(recommendationChatHandler),
);

recommendationRouter.post(
  "/",
  authenticate,
  requireRole("customer"),
  validate(recommendationSchema),
  asyncHandler(recommendHandler),
);
