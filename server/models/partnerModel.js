import { pool } from "../db/pool.js";

export async function listPartnerProducts(vendorId, { fetchLimit, offset }, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      p.public_id, p.sku, p.name, p.description, p.need_type,
      p.price_agorot, p.stock_quantity, p.dietary_tags, p.allergen_text,
      p.is_available, p.deleted_at, p.created_at, p.updated_at,
      c.slug AS category_slug, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.vendor_id = ? AND p.deleted_at IS NULL
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [vendorId, fetchLimit, offset],
  );
  return rows.map((row) => ({
    ...row,
    dietary_tags: typeof row.dietary_tags === "string"
      ? JSON.parse(row.dietary_tags)
      : row.dietary_tags,
  }));
}

export async function findCategoryBySlug(slug, executor = pool) {
  const [rows] = await executor.query(
    "SELECT id, slug, group_name FROM categories WHERE slug = ? AND is_active = TRUE LIMIT 1",
    [slug],
  );
  return rows[0] ?? null;
}

export async function createProduct(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO products (
      public_id, vendor_id, category_id, sku, name, description, need_type,
      price_agorot, stock_quantity, dietary_tags, allergen_text, is_available
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.vendorId,
      data.categoryId,
      data.sku,
      data.name,
      data.description,
      data.needType,
      data.priceAgorot,
      data.stockQuantity ?? null,
      JSON.stringify(data.dietaryTags),
      data.allergenText ?? null,
      data.isAvailable,
    ],
  );
  return result.insertId;
}

export async function findPartnerProduct(publicId, vendorId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.public_id = ? AND p.vendor_id = ? AND p.deleted_at IS NULL
     LIMIT 1`,
    [publicId, vendorId],
  );
  return rows[0] ?? null;
}

export async function updateProduct(productId, data, executor = pool) {
  await executor.query(
    `UPDATE products SET
      category_id = ?, sku = ?, name = ?, description = ?, need_type = ?,
      price_agorot = ?, stock_quantity = ?, dietary_tags = ?,
      allergen_text = ?, is_available = ?
     WHERE id = ?`,
    [
      data.categoryId,
      data.sku,
      data.name,
      data.description,
      data.needType,
      data.priceAgorot,
      data.stockQuantity ?? null,
      JSON.stringify(data.dietaryTags),
      data.allergenText ?? null,
      data.isAvailable,
      productId,
    ],
  );
}

export async function softDeleteProduct(productId, executor = pool) {
  await executor.query(
    `UPDATE products SET deleted_at = CURRENT_TIMESTAMP, is_available = FALSE WHERE id = ?`,
    [productId],
  );
}

export async function insertProductImage(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO product_images (
      public_id, product_id, original_name, mime_type,
      size_bytes, file_data, alt_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.productId,
      data.originalName,
      data.mimeType,
      data.sizeBytes,
      data.fileData,
      data.altText,
    ],
  );
  return result.insertId;
}

export async function findProductImage(publicId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT pi.*, p.vendor_id
     FROM product_images pi
     JOIN products p ON p.id = pi.product_id
     WHERE pi.public_id = ? AND p.deleted_at IS NULL
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function upsertDeliveryZone(vendorId, data, executor = pool) {
  await executor.query(
    `INSERT INTO vendor_delivery_zones (
      vendor_id, building_id, fee_agorot, minimum_order_agorot,
      eta_min_minutes, eta_max_minutes, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      fee_agorot = VALUES(fee_agorot),
      minimum_order_agorot = VALUES(minimum_order_agorot),
      eta_min_minutes = VALUES(eta_min_minutes),
      eta_max_minutes = VALUES(eta_max_minutes),
      is_active = VALUES(is_active)`,
    [
      vendorId,
      data.buildingId,
      data.feeAgorot,
      data.minimumOrderAgorot,
      data.etaMinMinutes,
      data.etaMaxMinutes,
      data.isActive,
    ],
  );
}

export async function updateVendorProfile(vendorId, data, executor = pool) {
  await executor.query(
    `UPDATE vendors SET
      description = ?, contact_email = ?, contact_phone = ?,
      pickup_enabled = ?, delivery_enabled = ?, is_open = ?,
      estimated_min_minutes = ?, estimated_max_minutes = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [
      data.description,
      data.contactEmail,
      data.contactPhone ?? null,
      data.pickupEnabled,
      data.deliveryEnabled,
      data.isOpen,
      data.estimatedMinMinutes,
      data.estimatedMaxMinutes,
      vendorId,
    ],
  );
}
