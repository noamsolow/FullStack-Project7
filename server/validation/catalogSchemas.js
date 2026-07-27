import Joi from "joi";
import { pagination } from "./common.js";

export const buildingsQuerySchema = Joi.object({
  ...pagination,
});

export const categoriesQuerySchema = Joi.object({
  group: Joi.string().valid("eat", "shop"),
});

export const vendorsQuerySchema = Joi.object({
  ...pagination,
  type: Joi.string().valid("food_court", "campus_shop", "vending_machine", "print_center"),
  group: Joi.string().valid("eat", "shop"),
  buildingId: Joi.number().integer().positive(),
  pickup: Joi.boolean(),
  delivery: Joi.boolean(),
  query: Joi.string().trim().max(80),
});

export const productsQuerySchema = Joi.object({
  ...pagination,
  category: Joi.string().pattern(/^[a-z0-9-]+$/).max(80),
  needType: Joi.string().valid(
    "meal", "snack", "drink", "study", "technology", "personal", "dormitory",
  ),
  maxPriceAgorot: Joi.number().integer().min(100).max(200000),
  dietary: Joi.string().valid("vegetarian", "vegan", "dairy", "meat", "dairy_free"),
  query: Joi.string().trim().max(80),
});

export const printCentersQuerySchema = Joi.object({
  ...pagination,
});
