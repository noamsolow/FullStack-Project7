import { Router } from "express";
import * as controller from "../controllers/catalogController.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugParam } from "../validation/common.js";
import {
  buildingsQuerySchema,
  categoriesQuerySchema,
  printCentersQuerySchema,
  productsQuerySchema,
  vendorsQuerySchema,
} from "../validation/catalogSchemas.js";

export const catalogRouter = Router();

catalogRouter.get(
  "/buildings",
  validate(buildingsQuerySchema, "query"),
  asyncHandler(controller.buildingsHandler),
);
catalogRouter.get(
  "/categories",
  validate(categoriesQuerySchema, "query"),
  asyncHandler(controller.categoriesHandler),
);
catalogRouter.get(
  "/vendors",
  validate(vendorsQuerySchema, "query"),
  asyncHandler(controller.vendorsHandler),
);
catalogRouter.get(
  "/vendors/:slug",
  validate(slugParam, "params"),
  asyncHandler(controller.vendorHandler),
);
catalogRouter.get(
  "/vendors/:slug/products",
  validate(slugParam, "params"),
  validate(productsQuerySchema, "query"),
  asyncHandler(controller.productsHandler),
);
catalogRouter.get(
  "/print-centers",
  validate(printCentersQuerySchema, "query"),
  asyncHandler(controller.printCentersHandler),
);

