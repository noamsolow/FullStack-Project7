import multer from "multer";
import { AppError } from "../utils/AppError.js";

const memoryStorage = multer.memoryStorage();

function normalizeUploadError(error, _request, _response, next) {
  if (error instanceof multer.MulterError) {
    const code = error.code === "LIMIT_FILE_SIZE"
      ? "FILE_TOO_LARGE"
      : "INVALID_UPLOAD";
    next(new AppError(413, code, "The uploaded file does not meet the size or count limit"));
    return;
  }
  next(error);
}

export const productImageUpload = [
  multer({ storage: memoryStorage, limits: { fileSize: 3 * 1024 * 1024, files: 1 } })
    .single("image"),
  normalizeUploadError,
];

export const printPdfUpload = [
  multer({ storage: memoryStorage, limits: { fileSize: 15 * 1024 * 1024, files: 1 } })
    .single("document"),
  normalizeUploadError,
];

export const maintenanceImagesUpload = [
  multer({ storage: memoryStorage, limits: { fileSize: 3 * 1024 * 1024, files: 3 } })
    .array("images", 3),
  normalizeUploadError,
];

