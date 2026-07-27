import Joi from "joi";
import { pagination } from "./common.js";

const status = Joi.string().valid(
  "open",
  "acknowledged",
  "in_progress",
  "waiting_for_user",
  "resolved",
  "closed",
  "rejected",
);

const priority = Joi.string().valid("low", "normal", "urgent");

const category = Joi.string().valid(
  "electrical",
  "plumbing",
  "furniture",
  "cleaning",
  "safety",
  "it_equipment",
  "missing_supplies",
  "other",
);

export const createMaintenanceSchema = Joi.object({
  buildingId: Joi.number().integer().positive().required(),
  locationText: Joi.string().trim().min(2).max(180).required(),
  category: category.required(),
  title: Joi.string().trim().min(5).max(140).required(),
  description: Joi.string().trim().min(10).max(1500).required(),
  requestedPriority: priority.required(),
});

export const maintenanceListQuerySchema = Joi.object({
  ...pagination,
  status,
});

export const adminMaintenanceQuerySchema = Joi.object({
  ...pagination,
  status,
  priority,
  category,
});

export const maintenanceCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(1000).required(),
  isInternal: Joi.boolean().default(false),
});

export const maintenanceUpdateSchema = Joi.object({
  status: status.required(),
  priority: priority.required(),
  assignedAdminPublicId: Joi.string().guid({ version: ["uuidv4"] }).allow(null, ""),
  note: Joi.string().trim().max(500).allow("", null),
});

