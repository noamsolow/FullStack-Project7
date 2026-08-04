import { connection } from "../db/connection.js";

export async function listAdminVendors(
  { fetchLimit, offset, status, type },
  executor = connection,
) {
  const where = ["v.deleted_at IS NULL"];
  const params = [];
  if (status) {
    where.push("v.status = ?");
    params.push(status);
  }
  if (type) {
    where.push("v.vendor_type = ?");
    params.push(type);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      v.public_id, v.name, v.slug, v.vendor_type, v.status,
      v.is_open, v.pickup_enabled, v.delivery_enabled,
      v.contact_email, v.created_at, b.short_name AS building_name
     FROM vendors v
     JOIN buildings b ON b.id = v.building_id
     WHERE ${where.join(" AND ")}
     ORDER BY v.created_at DESC, v.id DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function setVendorStatus(publicId, status, executor = connection) {
  const [result] = await executor.query(
    `UPDATE vendors SET status = ?
     WHERE public_id = ? AND deleted_at IS NULL`,
    [status, publicId],
  );
  return result.affectedRows > 0;
}

export async function createBuilding(data, executor = connection) {
  const [result] = await executor.query(
    `INSERT INTO buildings (
      campus_code, name, short_name, description, delivery_hint, is_active
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.campusCode,
      data.name,
      data.shortName,
      data.description ?? null,
      data.deliveryHint ?? null,
      data.isActive,
    ],
  );
  return result.insertId;
}

export async function updateBuilding(id, data, executor = connection) {
  const [result] = await executor.query(
    `UPDATE buildings SET
      campus_code = ?, name = ?, short_name = ?, description = ?,
      delivery_hint = ?, is_active = ?
     WHERE id = ?`,
    [
      data.campusCode,
      data.name,
      data.shortName,
      data.description ?? null,
      data.deliveryHint ?? null,
      data.isActive,
      id,
    ],
  );
  return result.affectedRows > 0;
}
