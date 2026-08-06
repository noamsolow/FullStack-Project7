import { Router } from "express";
import * as controller from "../controllers/maintenanceController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { maintenanceImagesUpload } from "../middleware/uploads.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicIdParam } from "../validation/common.js";
import {
  createMaintenanceSchema,
  maintenanceActivityQuerySchema,
  maintenanceCommentSchema,
  maintenanceListQuerySchema,
} from "../validation/maintenanceSchemas.js";

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticate, requireRole("customer"));
maintenanceRouter.post(
  "/",
  ...maintenanceImagesUpload,
  validate(createMaintenanceSchema),
  asyncHandler(controller.createHandler),
);
maintenanceRouter.get(
  "/",
  validate(maintenanceListQuerySchema, "query"),
  asyncHandler(controller.listHandler),
);
maintenanceRouter.get(
  "/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.detailsHandler),
);
maintenanceRouter.get(
  "/:publicId/comments",
  validate(publicIdParam, "params"),
  validate(maintenanceActivityQuerySchema, "query"),
  asyncHandler(controller.commentsHandler),
);
maintenanceRouter.get(
  "/:publicId/history",
  validate(publicIdParam, "params"),
  validate(maintenanceActivityQuerySchema, "query"),
  asyncHandler(controller.historyHandler),
);
maintenanceRouter.post(
  "/:publicId/comments",
  validate(publicIdParam, "params"),
  validate(maintenanceCommentSchema),
  asyncHandler(controller.commentHandler),
);
