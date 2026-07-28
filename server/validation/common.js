import Joi from "joi";

export const publicId = Joi.string().guid({ version: ["uuidv1", "uuidv4"] });

export const publicIdParam = Joi.object({
  publicId: publicId.required(),
});

export const slugParam = Joi.object({
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160).required(),
});

export const numericIdParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
};

export const password = Joi.string()
  .min(10)
  .max(72)
  .pattern(/[a-z]/, "lowercase letter")
  .pattern(/[A-Z]/, "uppercase letter")
  .pattern(/[0-9]/, "number")
  .pattern(/[^A-Za-z0-9]/, "symbol")
  .required();

export const email = Joi.string().email({ tlds: { allow: false } }).max(254).required();

export const shortText = Joi.string().trim().min(1).max(180);

