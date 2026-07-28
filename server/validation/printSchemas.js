import Joi from "joi";
import { pagination, publicId } from "./common.js";

export const submitPrintSchema = Joi.object({
  vendorPublicId: publicId.required(),
  paperSize: Joi.string().valid("A4", "A3").required(),
  colorMode: Joi.string().valid("black_white", "color").required(),
  sides: Joi.string().valid("single", "double").required(),
  copies: Joi.number().integer().min(1).max(20).required(),
  stapled: Joi.boolean().required(),
  laminated: Joi.boolean().required(),
  spiralBound: Joi.boolean().required(),
  customerNote: Joi.string().trim().max(500).allow("", null),
});

export const printListQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid(
    "submitted",
    "quoted",
    "pending_payment",
    "payment_processing",
    "paid",
    "printing",
    "ready",
    "completed",
    "rejected",
    "cancelled",
    "cancellation_requested",
    "needs_attention",
  ),
});

export const quotePrintSchema = Joi.object({
  note: Joi.string().trim().max(500).allow("", null),
});

export const updatePrintStatusSchema = Joi.object({
  status: Joi.string().valid(
    "printing",
    "ready",
    "completed",
    "rejected",
    "needs_attention",
  ).required(),
  note: Joi.string().trim().max(500).allow("", null),
});

