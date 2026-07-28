import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  loginSchema,
  profileSchema,
  registerCustomerSchema,
  registerPartnerSchema,
} from "../validation/authSchemas.js";

export const authRouter = Router();

const authLimit = rateLimit({ windowMs: 15 * 60_000, maximum: 10 });

authRouter.post(
  "/customer/register",
  authLimit,
  validate(registerCustomerSchema),
  asyncHandler(controller.registerCustomerHandler),
);
authRouter.post(
  "/partner/register",
  authLimit,
  validate(registerPartnerSchema),
  asyncHandler(controller.registerPartnerHandler),
);
authRouter.post(
  "/customer/login",
  authLimit,
  validate(loginSchema),
  asyncHandler(controller.customerLoginHandler),
);
authRouter.post(
  "/partner/login",
  authLimit,
  validate(loginSchema),
  asyncHandler(controller.partnerLoginHandler),
);
authRouter.post(
  "/admin/login",
  authLimit,
  validate(loginSchema),
  asyncHandler(controller.adminLoginHandler),
);
authRouter.get("/me", authenticate, asyncHandler(controller.meHandler));
authRouter.post("/logout", authenticate, asyncHandler(controller.logoutHandler));
authRouter.patch(
  "/me",
  authenticate,
  validate(profileSchema),
  asyncHandler(controller.updateMeHandler),
);
authRouter.delete("/me", authenticate, asyncHandler(controller.deleteMeHandler));

