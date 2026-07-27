import { Router } from "express";
import * as controller from "../controllers/printController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { printPdfUpload } from "../middleware/uploads.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicIdParam } from "../validation/common.js";
import { cancellationSchema, captureSchema } from "../validation/orderSchemas.js";
import {
  printListQuerySchema,
  submitPrintSchema,
} from "../validation/printSchemas.js";

export const printRouter = Router();

printRouter.use(authenticate, requireRole("customer"));
printRouter.post(
  "/",
  ...printPdfUpload,
  validate(submitPrintSchema),
  asyncHandler(controller.submitHandler),
);
printRouter.get(
  "/",
  validate(printListQuerySchema, "query"),
  asyncHandler(controller.listHandler),
);
printRouter.get(
  "/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.detailsHandler),
);
printRouter.post(
  "/:publicId/payment",
  validate(publicIdParam, "params"),
  asyncHandler(controller.checkoutHandler),
);
printRouter.post(
  "/:publicId/payment/capture",
  validate(publicIdParam, "params"),
  validate(captureSchema),
  asyncHandler(controller.captureHandler),
);
printRouter.post(
  "/:publicId/cancellation-requests",
  validate(publicIdParam, "params"),
  validate(cancellationSchema),
  asyncHandler(controller.cancelHandler),
);

