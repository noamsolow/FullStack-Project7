import { Router } from "express";
import * as controller from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { numericIdParam, publicIdParam } from "../validation/common.js";
import {
  adminOrdersQuerySchema,
  adminUsersQuerySchema,
  adminVendorsQuerySchema,
  auditQuerySchema,
  blockUserSchema,
  buildingSchema,
  vendorStatusSchema,
} from "../validation/adminSchemas.js";
import {
  adminMaintenanceQuerySchema,
  maintenanceCommentSchema,
  maintenanceUpdateSchema,
} from "../validation/maintenanceSchemas.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole("admin"));

adminRouter.get(
  "/users",
  validate(adminUsersQuerySchema, "query"),
  asyncHandler(controller.usersHandler),
);
adminRouter.patch(
  "/users/:publicId/status",
  validate(publicIdParam, "params"),
  validate(blockUserSchema),
  asyncHandler(controller.blockUserHandler),
);
adminRouter.get(
  "/vendors",
  validate(adminVendorsQuerySchema, "query"),
  asyncHandler(controller.vendorsHandler),
);
adminRouter.patch(
  "/vendors/:publicId/status",
  validate(publicIdParam, "params"),
  validate(vendorStatusSchema),
  asyncHandler(controller.vendorStatusHandler),
);
adminRouter.get("/buildings", asyncHandler(controller.buildingsHandler));
adminRouter.post(
  "/buildings",
  validate(buildingSchema),
  asyncHandler(controller.createBuildingHandler),
);
adminRouter.put(
  "/buildings/:id",
  validate(numericIdParam, "params"),
  validate(buildingSchema),
  asyncHandler(controller.updateBuildingHandler),
);
adminRouter.get(
  "/audit",
  validate(auditQuerySchema, "query"),
  asyncHandler(controller.auditHandler),
);
adminRouter.get(
  "/orders",
  validate(adminOrdersQuerySchema, "query"),
  asyncHandler(controller.ordersHandler),
);
adminRouter.get(
  "/orders/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.orderDetailsHandler),
);
adminRouter.get(
  "/maintenance-tickets",
  validate(adminMaintenanceQuerySchema, "query"),
  asyncHandler(controller.maintenanceHandler),
);
adminRouter.get(
  "/maintenance-route",
  asyncHandler(controller.maintenanceRouteHandler),
);
adminRouter.get(
  "/maintenance-tickets/:publicId",
  validate(publicIdParam, "params"),
  asyncHandler(controller.maintenanceDetailsHandler),
);
adminRouter.patch(
  "/maintenance-tickets/:publicId",
  validate(publicIdParam, "params"),
  validate(maintenanceUpdateSchema),
  asyncHandler(controller.updateMaintenanceHandler),
);
adminRouter.post(
  "/maintenance-tickets/:publicId/comments",
  validate(publicIdParam, "params"),
  validate(maintenanceCommentSchema),
  asyncHandler(controller.commentMaintenanceHandler),
);

