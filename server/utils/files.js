import crypto from "node:crypto";
import path from "node:path";
import { AppError } from "./AppError.js";

const imageTypes = Object.freeze({
  "image/jpeg": { extension: ".jpg", matches: isJpeg },
  "image/png": { extension: ".png", matches: isPng },
  "image/webp": { extension: ".webp", matches: isWebp },
});

function isJpeg(buffer) {
  return buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff;
}

function isPng(buffer) {
  const signature = "89504e470d0a1a0a";
  return buffer.length >= 8 && buffer.subarray(0, 8).toString("hex") === signature;
}

function isWebp(buffer) {
  return buffer.length >= 12
    && buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

export function validateImage(file) {
  const definition = imageTypes[file.mimetype];
  if (!definition || !definition.matches(file.buffer)) {
    throw new AppError(
      415,
      "INVALID_IMAGE",
      "Upload a valid JPEG, PNG, or WebP image",
    );
  }
  return definition.extension;
}

export function validatePdf(file) {
  const isPdf = file.mimetype === "application/pdf"
    && file.buffer.length >= 5
    && file.buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (!isPdf) {
    throw new AppError(415, "INVALID_PDF", "Upload a valid PDF document");
  }
  return ".pdf";
}

export function storageName(extension) {
  return `${crypto.randomUUID()}${extension}`;
}

export function safeOriginalName(name) {
  return path.basename(name).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255);
}

export function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

