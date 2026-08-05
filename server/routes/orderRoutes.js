import { Router } from "express";
import * as controller from "../controllers/orderController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicIdParam } from "../validation/common.js";
import {
  cancellationSchema,
  captureSchema,
  checkoutSchema,
  orderListQuerySchema,
  orderProgressQuerySchema,
} from "../validation/orderSchemas.js";

export const orderRouter = Router();

orderRouter.use(authenticate, requireRole("customer"));
orderRouter.get(
  "/checkout/options",
  asyncHandler(controller.checkoutOptionsHandler),
);
orderRouter.post(
  "/checkout",
  validate(checkoutSchema),
  asyncHandler(controller.checkoutHandler),
);
orderRouter.get(
  "/",
  validate(orderListQuerySchema, "query"),
  asyncHandler(controller.listHandler),
);
orderRouter.get(
  "/progress",
  validate(orderProgressQuerySchema, "query"),
  asyncHandler(controller.progressHandler),
);
orderRouter.get(
  "/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.detailsHandler),
);
orderRouter.post(
  "/:publicId/payment/capture",
  validate(publicIdParam, "params"),
  validate(captureSchema),
  asyncHandler(controller.captureHandler),
);
orderRouter.post(
  "/:publicId/cancellation-requests",
  validate(publicIdParam, "params"),
  validate(cancellationSchema),
  asyncHandler(controller.cancelHandler),
);
orderRouter.post(
  "/:publicId/completion",
  validate(publicIdParam, "params"),
  asyncHandler(controller.completeHandler),
);

