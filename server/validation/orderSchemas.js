import Joi from "joi";
import { pagination, publicId } from "./common.js";

export const checkoutSchema = Joi.object({
  paymentMethod: Joi.string().valid("tokens", "paypal").required(),
  items: Joi.array()
    .items(Joi.object({
      productId: publicId.required(),
      quantity: Joi.number().integer().min(1).max(20).required(),
    }))
    .min(1)
    .max(30)
    .required(),
  fulfillmentType: Joi.string().valid("pickup", "delivery").required(),
  deliveryBuildingId: Joi.when("fulfillmentType", {
    is: "delivery",
    then: Joi.number().integer().positive().required(),
    otherwise: Joi.forbidden(),
  }),
  deliveryLocation: Joi.when("fulfillmentType", {
    is: "delivery",
    then: Joi.string().trim().min(2).max(180).required(),
    otherwise: Joi.forbidden(),
  }),
});

export const captureSchema = Joi.object({
  providerOrderId: Joi.string().pattern(/^[A-Za-z0-9]+$/).max(80).required(),
});

export const orderListQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid(
    "pending_payment",
    "payment_processing",
    "placed",
    "accepted",
    "preparing",
    "ready",
    "out_for_delivery",
    "arrived",
    "completed",
    "cancelled",
    "cancellation_requested",
    "needs_attention",
  ),
});

export const orderProgressQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(3),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(
    "preparing",
    "ready",
    "out_for_delivery",
    "needs_attention",
  ).required(),
  note: Joi.string().trim().max(500).allow("", null),
});

export const cancellationSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required(),
});

