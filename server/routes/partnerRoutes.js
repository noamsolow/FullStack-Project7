import { Router } from "express";
import * as controller from "../controllers/partnerController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { productImageUpload } from "../middleware/uploads.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicIdParam } from "../validation/common.js";
import { orderListQuerySchema, updateOrderStatusSchema } from "../validation/orderSchemas.js";
import {
  deliveryZoneSchema,
  imageMetadataSchema,
  partnerListQuerySchema,
  productParamSchema,
  productSchema,
  vendorProfileSchema,
} from "../validation/partnerSchemas.js";
import {
  printListQuerySchema,
  quotePrintSchema,
  updatePrintStatusSchema,
} from "../validation/printSchemas.js";

export const partnerRouter = Router();

partnerRouter.use(authenticate, requireRole("vendor_manager"));

partnerRouter.get("/vendor", asyncHandler(controller.vendorHandler));
partnerRouter.patch(
  "/vendor",
  validate(vendorProfileSchema),
  asyncHandler(controller.updateVendorHandler),
);

partnerRouter.get(
  "/products",
  validate(partnerListQuerySchema, "query"),
  asyncHandler(controller.productsHandler),
);
partnerRouter.post(
  "/products",
  validate(productSchema),
  asyncHandler(controller.createProductHandler),
);
partnerRouter.put(
  "/products/:productPublicId",
  validate(productParamSchema, "params"),
  validate(productSchema),
  asyncHandler(controller.updateProductHandler),
);
partnerRouter.delete(
  "/products/:productPublicId",
  validate(productParamSchema, "params"),
  asyncHandler(controller.deleteProductHandler),
);
partnerRouter.post(
  "/products/:productPublicId/images",
  validate(productParamSchema, "params"),
  ...productImageUpload,
  validate(imageMetadataSchema),
  asyncHandler(controller.uploadProductImageHandler),
);

partnerRouter.get("/delivery-zones", asyncHandler(controller.zonesHandler));
partnerRouter.put(
  "/delivery-zones",
  validate(deliveryZoneSchema),
  asyncHandler(controller.saveZoneHandler),
);

partnerRouter.get(
  "/orders",
  validate(orderListQuerySchema, "query"),
  asyncHandler(controller.ordersHandler),
);
partnerRouter.get(
  "/orders/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.orderDetailsHandler),
);
partnerRouter.patch(
  "/orders/:publicId/status",
  validate(publicIdParam, "params"),
  validate(updateOrderStatusSchema),
  asyncHandler(controller.updateOrderHandler),
);

partnerRouter.get(
  "/print-jobs",
  validate(printListQuerySchema, "query"),
  asyncHandler(controller.printJobsHandler),
);
partnerRouter.get(
  "/print-jobs/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.printJobDetailsHandler),
);
partnerRouter.patch(
  "/print-jobs/:publicId/quote",
  validate(publicIdParam, "params"),
  validate(quotePrintSchema),
  asyncHandler(controller.quotePrintHandler),
);
partnerRouter.patch(
  "/print-jobs/:publicId/status",
  validate(publicIdParam, "params"),
  validate(updatePrintStatusSchema),
  asyncHandler(controller.updatePrintHandler),
);

