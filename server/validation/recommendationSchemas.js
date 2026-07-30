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

const chatMessageSchema = Joi.object({
  role: Joi.string().valid("user", "assistant").required(),
  content: Joi.string().trim().min(1).max(600).required(),
});

export const recommendationChatSchema = Joi.object({
  messages: Joi.array()
    .items(chatMessageSchema)
    .min(1)
    .max(12)
    .required()
    .custom((messages, helpers) => {
      if (messages.at(-1)?.role !== "user") {
        return helpers.message({ custom: "The last chat message must be from the user" });
      }
      return messages;
    }),
});
