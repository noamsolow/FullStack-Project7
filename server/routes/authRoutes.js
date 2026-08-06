import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  loginSchema,
  profileSchema,
  registerCustomerSchema,
  registerPartnerSchema,
} from "../validation/authSchemas.js";

export const authRouter = Router();

authRouter.post(
  "/customer/register",
  validate(registerCustomerSchema),
  asyncHandler(controller.registerCustomerHandler),
);
authRouter.post(
  "/partner/register",
  validate(registerPartnerSchema),
  asyncHandler(controller.registerPartnerHandler),
);
authRouter.post(
  "/customer/login",
  validate(loginSchema),
  asyncHandler(controller.customerLoginHandler),
);
authRouter.post(
  "/partner/login",
  validate(loginSchema),
  asyncHandler(controller.partnerLoginHandler),
);
authRouter.post(
  "/admin/login",
  validate(loginSchema),
  asyncHandler(controller.adminLoginHandler),
);
authRouter.get("/me", authenticate, asyncHandler(controller.meHandler));
authRouter.get(
  "/me/spending",
  authenticate,
  asyncHandler(controller.spendingHandler),
);
authRouter.post("/logout", authenticate, asyncHandler(controller.logoutHandler));
authRouter.patch(
  "/me",
  authenticate,
  validate(profileSchema),
  asyncHandler(controller.updateMeHandler),
);
authRouter.delete("/me", authenticate, asyncHandler(controller.deleteMeHandler));

