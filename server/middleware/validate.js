import { AppError } from "../utils/AppError.js";

export function validate(schema, source = "body") {
  return function validateRequest(request, _response, next) {
    const { value, error } = schema.validate(request[source], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
      convert: true,
    });

    if (error) {
      next(new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid request data",
        error.details.map((detail) => ({
          path: detail.path.join("."),
          message: detail.message,
        })),
      ));
      return;
    }

    request[source] = value;
    next();
  };
}

