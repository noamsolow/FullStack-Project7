import path from "node:path";
import { config } from "../config/index.js";
import { findProductImage } from "../repositories/partnerRepository.js";
import { findPrintFile } from "../repositories/printRepository.js";
import { findMaintenanceAttachment } from "../repositories/maintenanceRepository.js";
import { forbidden, notFound } from "../utils/AppError.js";
import { requireMembership } from "./partnerService.js";

export async function productImage(publicIdValue) {
  const image = await findProductImage(publicIdValue);
  if (!image) throw notFound("Image not found");
  return {
    path: path.join(config.storage.products, image.storage_name),
    mimeType: image.mime_type,
    downloadName: image.original_name,
    isPrivate: false,
  };
}

export async function printFile(user, publicIdValue) {
  const file = await findPrintFile(publicIdValue);
  if (!file) throw notFound("Print file not found");
  const membership = user.role === "vendor_manager"
    ? await requireMembership(user.id)
    : null;
  const allowed = user.role === "admin"
    || file.user_id === user.id
    || membership?.vendor_id === file.vendor_id;
  if (!allowed) throw forbidden();
  return {
    path: path.join(config.storage.printFiles, file.storage_name),
    mimeType: "application/pdf",
    downloadName: file.original_name,
    isPrivate: true,
  };
}

export async function maintenanceImage(user, publicIdValue) {
  const file = await findMaintenanceAttachment(publicIdValue);
  if (!file) throw notFound("Maintenance image not found");
  if (user.role !== "admin" && file.reporter_user_id !== user.id) {
    throw forbidden();
  }
  return {
    path: path.join(config.storage.maintenance, file.storage_name),
    mimeType: file.mime_type,
    downloadName: file.original_name,
    isPrivate: true,
  };
}

