import { Router } from "express";
import * as controller from "../controllers/mediaController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicIdParam } from "../validation/common.js";

export const mediaRouter = Router();

mediaRouter.get(
  "/products/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.productImageHandler),
);
mediaRouter.get(
  "/print-files/:publicId",
  authenticate,
  validate(publicIdParam, "params"),
  asyncHandler(controller.printFileHandler),
);
mediaRouter.get(
  "/maintenance/:publicId",
  authenticate,
  validate(publicIdParam, "params"),
  asyncHandler(controller.maintenanceImageHandler),
);

