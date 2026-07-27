import Joi from "joi";
import { pagination, publicIdParam } from "./common.js";

const dietaryTag = Joi.string().valid(
  "vegetarian",
  "vegan",
  "dairy",
  "meat",
  "dairy_free",
);

export const partnerListQuerySchema = Joi.object({
  ...pagination,
});

export const productSchema = Joi.object({
  categorySlug: Joi.string().pattern(/^[a-z0-9-]+$/).max(80).required(),
  sku: Joi.string().trim().pattern(/^[A-Za-z0-9_-]+$/).min(2).max(80).required(),
  name: Joi.string().trim().min(2).max(140).required(),
  description: Joi.string().trim().min(10).max(1000).required(),
  needType: Joi.string().valid(
    "meal", "snack", "drink", "study", "technology", "personal", "dormitory",
  ).required(),
  priceAgorot: Joi.number().integer().min(100).max(100000).required(),
  stockQuantity: Joi.number().integer().min(0).max(100000).allow(null).required(),
  dietaryTags: Joi.array().items(dietaryTag).unique().max(8).default([]),
  allergenText: Joi.string().trim().max(500).allow("", null),
  isAvailable: Joi.boolean().required(),
});

export const productParamSchema = Joi.object({
  productPublicId: publicIdParam.extract("publicId"),
});

export const imageMetadataSchema = Joi.object({
  altText: Joi.string().trim().min(2).max(180).required(),
});

export const vendorProfileSchema = Joi.object({
  description: Joi.string().trim().min(20).max(800).required(),
  contactEmail: Joi.string().email({ tlds: { allow: false } }).max(254).required(),
  contactPhone: Joi.string().trim().pattern(/^[+0-9 ()-]{7,30}$/).allow("", null),
  pickupEnabled: Joi.boolean().required(),
  deliveryEnabled: Joi.boolean().required(),
  isOpen: Joi.boolean().required(),
  estimatedMinMinutes: Joi.number().integer().min(1).max(240).required(),
  estimatedMaxMinutes: Joi.number()
    .integer()
    .min(Joi.ref("estimatedMinMinutes"))
    .max(360)
    .required(),
});

export const deliveryZoneSchema = Joi.object({
  buildingId: Joi.number().integer().positive().required(),
  feeAgorot: Joi.number().integer().min(0).max(5000).required(),
  minimumOrderAgorot: Joi.number().integer().min(0).max(50000).required(),
  etaMinMinutes: Joi.number().integer().min(1).max(240).required(),
  etaMaxMinutes: Joi.number().integer().min(Joi.ref("etaMinMinutes")).max(360).required(),
  isActive: Joi.boolean().required(),
});

