import Joi from "joi";
import { email, password } from "./common.js";

export const registerCustomerSchema = Joi.object({
  email,
  password,
  displayName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().pattern(/^[+0-9 ()-]{7,30}$/).allow("", null),
  customerType: Joi.string().valid("student", "teacher").required(),
});

export const registerPartnerSchema = Joi.object({
  email,
  password,
  displayName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().pattern(/^[+0-9 ()-]{7,30}$/).allow("", null),
  vendorName: Joi.string().trim().min(2).max(140).required(),
  vendorType: Joi.string()
    .valid("food_court", "campus_shop", "vending_machine", "print_center")
    .required(),
  buildingId: Joi.number().integer().positive().required(),
  description: Joi.string().trim().min(20).max(800).required(),
});

export const loginSchema = Joi.object({
  email,
  password: Joi.string().max(200).required(),
});

export const profileSchema = Joi.object({
  displayName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().pattern(/^[+0-9 ()-]{7,30}$/).allow("", null),
});

