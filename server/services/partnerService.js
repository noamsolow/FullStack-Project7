import {
  findActiveAdminByPublicId,
  findUserVendor,
} from "../models/userModel.js";
import {
  createProduct,
  findCategoryBySlug,
  findPartnerProduct,
  insertProductImage,
  listPartnerProducts,
  softDeleteProduct,
  updateProduct,
  updateVendorProfile,
  upsertDeliveryZone,
} from "../models/partnerModel.js";
import {
  buildingExists,
  findVendorByPublicId,
  listDeliveryZones,
} from "../models/catalogModel.js";
import { writeAudit } from "../models/auditModel.js";
import { AppError, notFound } from "../utils/AppError.js";
import {
  publicId,
} from "../utils/identifiers.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import {
  safeOriginalName,
  validateImage,
} from "../utils/files.js";

export async function requireMembership(userId) {
  const membership = await findUserVendor(userId);
  if (!membership || membership.vendor_status !== "active") {
    throw new AppError(403, "VENDOR_ACCESS_REQUIRED", "An active vendor account is required");
  }
  return membership;
}

export async function partnerVendor(user) {
  const membership = await requireMembership(user.id);
  const vendor = await findVendorByPublicId(membership.vendor_public_id);
  const zones = await listDeliveryZones(membership.vendor_id);
  return { ...vendor, deliveryZones: zones };
}

export async function editPartnerVendor(user, input, context) {
  const membership = await requireMembership(user.id);
  await updateVendorProfile(membership.vendor_id, input);
  await writeAudit({
    actorUserId: user.id,
    action: "vendor.update",
    resourceType: "vendor",
    resourcePublicId: membership.vendor_public_id,
    requestId: context.requestId,
  });
  return partnerVendor(user);
}

export async function partnerProducts(user, query) {
  const membership = await requireMembership(user.id);
  const paging = paginationFrom(query);
  const rows = await listPartnerProducts(membership.vendor_id, paging);
  return paginated(rows, paging.page, paging.limit);
}

async function productPayload(input) {
  const category = await findCategoryBySlug(input.categorySlug);
  if (!category) throw new AppError(400, "INVALID_CATEGORY", "Select an active category");
  return {
    categoryId: category.id,
    sku: input.sku.trim().toUpperCase(),
    name: input.name,
    description: input.description,
    needType: input.needType,
    priceAgorot: input.priceAgorot,
    stockQuantity: input.stockQuantity,
    dietaryTags: input.dietaryTags,
    allergenText: input.allergenText,
    isAvailable: input.isAvailable,
  };
}

export async function addProduct(user, input, context) {
  const membership = await requireMembership(user.id);
  const data = await productPayload(input);
  const productPublicId = publicId();
  await createProduct({
    ...data,
    publicId: productPublicId,
    vendorId: membership.vendor_id,
  });
  await writeAudit({
    actorUserId: user.id,
    action: "product.create",
    resourceType: "product",
    resourcePublicId: productPublicId,
    requestId: context.requestId,
  });
  return findPartnerProduct(productPublicId, membership.vendor_id);
}

export async function editProduct(user, productPublicId, input, context) {
  const membership = await requireMembership(user.id);
  const product = await findPartnerProduct(productPublicId, membership.vendor_id);
  if (!product) throw notFound("Product not found");
  await updateProduct(product.id, await productPayload(input));
  await writeAudit({
    actorUserId: user.id,
    action: "product.update",
    resourceType: "product",
    resourcePublicId: productPublicId,
    requestId: context.requestId,
  });
  return findPartnerProduct(productPublicId, membership.vendor_id);
}

export async function removeProduct(user, productPublicId, context) {
  const membership = await requireMembership(user.id);
  const product = await findPartnerProduct(productPublicId, membership.vendor_id);
  if (!product) throw notFound("Product not found");
  await softDeleteProduct(product.id);
  await writeAudit({
    actorUserId: user.id,
    action: "product.delete",
    resourceType: "product",
    resourcePublicId: productPublicId,
    requestId: context.requestId,
  });
}

export async function uploadProductImage(user, productPublicId, file, input, context) {
  if (!file) throw new AppError(400, "FILE_REQUIRED", "Choose an image to upload");
  const membership = await requireMembership(user.id);
  const product = await findPartnerProduct(productPublicId, membership.vendor_id);
  if (!product) throw notFound("Product not found");

  validateImage(file);
  const imagePublicId = publicId();
  await insertProductImage({
    publicId: imagePublicId,
    productId: product.id,
    originalName: safeOriginalName(file.originalname),
    mimeType: file.mimetype,
    sizeBytes: file.size,
    fileData: file.buffer,
    altText: input.altText,
  });

  await writeAudit({
    actorUserId: user.id,
    action: "product.image_upload",
    resourceType: "product",
    resourcePublicId: productPublicId,
    requestId: context.requestId,
  });
  return { publicId: imagePublicId, altText: input.altText };
}

export async function partnerDeliveryZones(user) {
  const membership = await requireMembership(user.id);
  return listDeliveryZones(membership.vendor_id);
}

export async function saveDeliveryZone(user, input, context) {
  const membership = await requireMembership(user.id);
  if (!(await buildingExists(input.buildingId))) {
    throw new AppError(400, "INVALID_BUILDING", "Select an active campus building");
  }
  await upsertDeliveryZone(membership.vendor_id, input);
  await writeAudit({
    actorUserId: user.id,
    action: "delivery_zone.update",
    resourceType: "vendor",
    resourcePublicId: membership.vendor_public_id,
    requestId: context.requestId,
  });
  return partnerDeliveryZones(user);
}

export async function ensureAdminUser(publicIdValue) {
  const admin = await findActiveAdminByPublicId(publicIdValue);
  if (!admin) throw new AppError(400, "INVALID_ADMIN", "Select an active administrator");
  return admin;
}
