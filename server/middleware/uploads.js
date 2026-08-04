import multer from "multer";
import { AppError } from "../utils/AppError.js";

const memoryStorage = multer.memoryStorage();

const malformedMultipartMessages = new Set([
  "Malformed part header",
  "Unexpected end of file",
  "Unexpected end of form",
]);

function normalizeUploadError(expectedField) {
  return function uploadError(error, _request, _response, next) {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const tooLargeOrMany = error.code === "LIMIT_FILE_SIZE"
        || error.code === "LIMIT_FILE_COUNT"
        || (error.code === "LIMIT_UNEXPECTED_FILE" && error.field === expectedField);
      next(new AppError(
        tooLargeOrMany ? 413 : 400,
        tooLargeOrMany ? "UPLOAD_LIMIT_EXCEEDED" : "INVALID_UPLOAD",
        tooLargeOrMany
          ? "The uploaded file exceeds the size or count limit"
          : "The multipart upload is invalid",
      ));
      return;
    }

    if (malformedMultipartMessages.has(error.message)) {
      next(new AppError(400, "INVALID_UPLOAD", "The multipart upload is invalid"));
      return;
    }

    next(error);
  };
}

export const productImageUpload = [
  multer({ storage: memoryStorage, limits: { fileSize: 3 * 1024 * 1024, files: 1 } })
    .single("image"),
  normalizeUploadError("image"),
];

export const printPdfUpload = [
  multer({ storage: memoryStorage, limits: { fileSize: 15 * 1024 * 1024, files: 1 } })
    .single("document"),
  normalizeUploadError("document"),
];

export const maintenanceImagesUpload = [
  multer({ storage: memoryStorage, limits: { fileSize: 3 * 1024 * 1024, files: 3 } })
    .array("images", 3),
  normalizeUploadError("images"),
];

