import Joi from "joi";

export const recommendationSchema = Joi.object({
  budgetAgorot: Joi.number().integer().min(500).max(200000).required(),
  needType: Joi.string().valid(
    "meal", "snack", "drink", "study", "technology", "personal", "dormitory",
  ).required(),
  category: Joi.string().pattern(/^[a-z0-9-]+$/).max(80).allow(null, ""),
  dietary: Joi.array().items(
    Joi.string().valid("vegetarian", "vegan", "dairy", "meat", "dairy_free"),
  ).unique().max(5).default([]),
});

