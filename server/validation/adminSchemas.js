import Joi from "joi";
import { pagination } from "./common.js";

export const adminUsersQuerySchema = Joi.object({
  ...pagination,
  role: Joi.string().valid("customer", "vendor_manager", "admin"),
  status: Joi.string().valid("active", "blocked"),
});

export const blockUserSchema = Joi.object({
  blocked: Joi.boolean().required(),
});

export const adminVendorsQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid("active", "suspended"),
  type: Joi.string().valid("food_court", "campus_shop", "vending_machine", "print_center"),
});

export const vendorStatusSchema = Joi.object({
  status: Joi.string().valid("active", "suspended").required(),
});

export const buildingSchema = Joi.object({
  campusCode: Joi.string().trim().min(1).max(20).required(),
  name: Joi.string().trim().min(3).max(160).required(),
  shortName: Joi.string().trim().min(2).max(80).required(),
  description: Joi.string().trim().max(500).allow("", null),
  deliveryHint: Joi.string().trim().max(300).allow("", null),
  isActive: Joi.boolean().required(),
});

export const auditQuerySchema = Joi.object({
  ...pagination,
  query: Joi.string().trim().max(160),
});

export const adminOrdersQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid(
    "pending_payment",
    "payment_processing",
    "placed",
    "accepted",
    "preparing",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
    "cancellation_requested",
    "needs_attention",
  ),
  search: Joi.string().trim().max(160),
});

