import { pool } from "../db/pool.js";

function parseJson(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function mapProduct(row) {
  return {
    ...row,
    dietary_tags: parseJson(row.dietary_tags),
  };
}

export async function listBuildings({ fetchLimit, offset }, executor = pool) {
  const [rows] = await executor.query(
    `SELECT id, campus_code, name, short_name, description, delivery_hint
     FROM buildings
     WHERE is_active = TRUE
     ORDER BY CAST(campus_code AS UNSIGNED), name
     LIMIT ? OFFSET ?`,
    [fetchLimit, offset],
  );
  return rows;
}

export async function listBuildingRows(executor = pool) {
  const [rows] = await executor.query(
    `SELECT id, campus_code, name, short_name, description, delivery_hint, is_active
     FROM buildings
     ORDER BY CAST(campus_code AS UNSIGNED), name`,
  );
  return rows;
}

export async function buildingExists(id, executor = pool) {
  const [rows] = await executor.query(
    "SELECT id FROM buildings WHERE id = ? AND is_active = TRUE LIMIT 1",
    [id],
  );
  return Boolean(rows[0]);
}

export async function listCategories(group, executor = pool) {
  const filters = ["is_active = TRUE"];
  const params = [];
  if (group) {
    filters.push("group_name = ?");
    params.push(group);
  }
  const [rows] = await executor.query(
    `SELECT slug, name, group_name, sort_order
     FROM categories
     WHERE ${filters.join(" AND ")}
     ORDER BY sort_order, name`,
    params,
  );
  return rows;
}

export async function listVendors(filters, executor = pool) {
  const where = ["v.deleted_at IS NULL", "v.status = 'active'"];
  const params = [];
  if (filters.type) {
    where.push("v.vendor_type = ?");
    params.push(filters.type);
  }
  if (filters.buildingId) {
    where.push("v.building_id = ?");
    params.push(filters.buildingId);
  }
  if (filters.pickup === true) {
    where.push("v.pickup_enabled = TRUE");
  }
  if (filters.delivery === true) {
    where.push("v.delivery_enabled = TRUE");
  }
  if (filters.group === "eat") {
    where.push("v.vendor_type IN ('food_court', 'vending_machine')");
  }
  if (filters.group === "shop") {
    where.push("v.vendor_type IN ('campus_shop', 'vending_machine')");
  }
  if (filters.query) {
    where.push("(v.name LIKE ? OR v.description LIKE ?)");
    const search = `%${filters.query}%`;
    params.push(search, search);
  }
  params.push(filters.fetchLimit, filters.offset);

  const [rows] = await executor.query(
    `SELECT
      v.public_id, v.name, v.slug, v.vendor_type, v.description,
      v.pickup_enabled, v.delivery_enabled, v.is_open,
      v.estimated_min_minutes, v.estimated_max_minutes,
      b.id AS building_id, b.short_name AS building_name,
      (
        SELECT pi.public_id
        FROM products p
        JOIN product_images pi ON pi.product_id = p.id
        WHERE p.vendor_id = v.id AND p.deleted_at IS NULL
        ORDER BY pi.created_at
        LIMIT 1
      ) AS image_public_id
     FROM vendors v
     JOIN buildings b ON b.id = v.building_id
     WHERE ${where.join(" AND ")}
     ORDER BY v.is_open DESC, v.name
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function findVendorBySlug(slug, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      v.id, v.public_id, v.name, v.slug, v.vendor_type, v.description,
      v.contact_email, v.contact_phone, v.pickup_enabled, v.delivery_enabled,
      v.is_open, v.status, v.min_pickup_order_agorot,
      v.estimated_min_minutes, v.estimated_max_minutes,
      b.id AS building_id, b.campus_code, b.short_name AS building_name,
      b.delivery_hint
     FROM vendors v
     JOIN buildings b ON b.id = v.building_id
     WHERE v.slug = ? AND v.deleted_at IS NULL AND v.status = 'active'
     LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function findVendorByPublicId(publicId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      v.id, v.public_id, v.building_id, v.name, v.slug, v.vendor_type,
      v.description, v.contact_email, v.contact_phone,
      v.pickup_enabled, v.delivery_enabled, v.is_open, v.status,
      v.min_pickup_order_agorot, v.estimated_min_minutes,
      v.estimated_max_minutes, v.created_at, v.updated_at,
      b.short_name AS building_name
     FROM vendors v
     JOIN buildings b ON b.id = v.building_id
     WHERE v.public_id = ? AND v.deleted_at IS NULL
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function listProductsByVendor(vendorId, filters, executor = pool) {
  const where = [
    "p.vendor_id = ?",
    "p.deleted_at IS NULL",
    "p.is_available = TRUE",
    "(p.stock_quantity IS NULL OR p.stock_quantity > 0)",
  ];
  const params = [vendorId];
  if (filters.category) {
    where.push("c.slug = ?");
    params.push(filters.category);
  }
  if (filters.needType) {
    where.push("p.need_type = ?");
    params.push(filters.needType);
  }
  if (filters.maxPriceAgorot) {
    where.push("p.price_agorot <= ?");
    params.push(filters.maxPriceAgorot);
  }
  if (filters.query) {
    where.push("(p.name LIKE ? OR p.description LIKE ?)");
    const search = `%${filters.query}%`;
    params.push(search, search);
  }
  if (filters.dietary) {
    where.push("JSON_CONTAINS(p.dietary_tags, JSON_QUOTE(?))");
    params.push(filters.dietary);
  }
  params.push(filters.fetchLimit, filters.offset);

  const [rows] = await executor.query(
    `SELECT
      p.public_id, p.sku, p.name, p.description, p.need_type,
      p.price_agorot, p.stock_quantity, p.dietary_tags, p.allergen_text,
      c.slug AS category_slug, c.name AS category_name, c.group_name,
      (
        SELECT pi.public_id
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.created_at
        LIMIT 1
      ) AS image_public_id
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.name
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows.map(mapProduct);
}

export async function listRecommendationCandidates(
  { budgetAgorot, needType, category, dietary },
  executor = pool,
) {
  const where = [
    "p.deleted_at IS NULL",
    "p.is_available = TRUE",
    "(p.stock_quantity IS NULL OR p.stock_quantity > 0)",
    "p.price_agorot <= ?",
    "v.deleted_at IS NULL",
    "v.status = 'active'",
    "v.is_open = TRUE",
  ];
  const params = [budgetAgorot];
  if (needType) {
    where.push("p.need_type = ?");
    params.push(needType);
  }
  if (category) {
    where.push("c.slug = ?");
    params.push(category);
  }
  for (const tag of dietary ?? []) {
    where.push("JSON_CONTAINS(p.dietary_tags, JSON_QUOTE(?))");
    params.push(tag);
  }
  params.push(30);
  const [rows] = await executor.query(
    `SELECT
      p.public_id, p.name, p.description, p.need_type, p.price_agorot,
      p.dietary_tags, p.allergen_text, c.name AS category_name,
      v.name AS vendor_name, v.slug AS vendor_slug
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN vendors v ON v.id = p.vendor_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.price_agorot, p.name
     LIMIT ?`,
    params,
  );
  return rows.map(mapProduct);
}

export async function listDeliveryZones(vendorId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      dz.id, b.id AS building_id, b.campus_code, b.short_name AS building_name,
      dz.fee_agorot, dz.minimum_order_agorot,
      dz.eta_min_minutes, dz.eta_max_minutes, dz.is_active
     FROM vendor_delivery_zones dz
     JOIN buildings b ON b.id = dz.building_id
     WHERE dz.vendor_id = ? AND b.is_active = TRUE
     ORDER BY CAST(b.campus_code AS UNSIGNED)`,
    [vendorId],
  );
  return rows;
}

export async function findDeliveryZone(vendorId, buildingId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT dz.*, b.short_name AS building_name
     FROM vendor_delivery_zones dz
     JOIN buildings b ON b.id = dz.building_id
     WHERE dz.vendor_id = ? AND dz.building_id = ?
       AND dz.is_active = TRUE AND b.is_active = TRUE
     LIMIT 1`,
    [vendorId, buildingId],
  );
  return rows[0] ?? null;
}

export async function listPrintCenters({ fetchLimit, offset }, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      v.public_id, v.name, v.slug, v.description, v.is_open,
      v.estimated_min_minutes, v.estimated_max_minutes,
      b.short_name AS building_name
     FROM vendors v
     JOIN buildings b ON b.id = v.building_id
     WHERE v.vendor_type = 'print_center'
       AND v.status = 'active' AND v.deleted_at IS NULL
     ORDER BY v.is_open DESC, v.name
     LIMIT ? OFFSET ?`,
    [fetchLimit, offset],
  );
  return rows;
}
