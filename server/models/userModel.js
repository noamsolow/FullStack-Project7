import { connection } from "../db/connection.js";

const safeUserColumns = `
  id,
  public_id,
  email,
  display_name,
  phone,
  customer_type,
  role,
  vendor_id,
  blocked_at,
  deleted_at,
  created_at,
  updated_at
`;

export async function findUserByEmail(email, executor = connection) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}, password_hash
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findActiveUserById(id, executor = connection) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE id = ? AND blocked_at IS NULL AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findSafeUserByPublicId(publicId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE public_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function findActiveAdminByPublicId(publicId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE public_id = ? AND role = 'admin'
       AND blocked_at IS NULL AND deleted_at IS NULL
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function createUser(data, executor = connection) {
  const [result] = await executor.query(
    `INSERT INTO users (
      public_id, email, display_name, phone, customer_type, role, vendor_id, password_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.email,
      data.displayName,
      data.phone ?? null,
      data.customerType ?? null,
      data.role,
      data.vendorId ?? null,
      data.passwordHash,
    ],
  );
  return findActiveUserById(result.insertId, executor);
}

export async function updateOwnProfile(userId, data, executor = connection) {
  await executor.query(
    `UPDATE users
     SET display_name = ?, phone = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [data.displayName, data.phone ?? null, userId],
  );
  return findActiveUserById(userId, executor);
}

export async function findUserCompletedSpending(userId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT
       COALESCE((
         SELECT SUM(o.total_agorot)
         FROM orders o
         WHERE o.user_id = ? AND o.status = 'completed'
       ), 0)
       +
       COALESCE((
         SELECT SUM(pj.quote_agorot)
         FROM print_jobs pj
         WHERE pj.user_id = ? AND pj.status = 'completed'
       ), 0) AS total_spent_agorot`,
    [userId, userId],
  );
  return Number(rows[0]?.total_spent_agorot ?? 0);
}

export async function softDeleteOwnAccount(userId, executor = connection) {
  const [result] = await executor.query(
    `UPDATE users
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [userId],
  );
  return result.affectedRows > 0;
}

export async function createVendor(data, executor = connection) {
  const [result] = await executor.query(
    `INSERT INTO vendors (
      public_id, building_id, name, slug, vendor_type, description,
      contact_email, contact_phone, pickup_enabled, delivery_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
    [
      data.publicId,
      data.buildingId,
      data.name,
      data.slug,
      data.vendorType,
      data.description,
      data.contactEmail,
      data.contactPhone ?? null,
      data.vendorType !== "vending_machine" && data.vendorType !== "print_center",
    ],
  );
  return result.insertId;
}

export async function findUserVendor(userId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT
      v.id AS vendor_id,
      v.public_id AS vendor_public_id,
      v.name AS vendor_name,
      v.slug AS vendor_slug,
      v.vendor_type,
      v.status AS vendor_status
     FROM users u
     JOIN vendors v ON v.id = u.vendor_id
     WHERE u.id = ? AND u.role = 'vendor_manager'
       AND u.deleted_at IS NULL AND v.deleted_at IS NULL
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function listUsers({ fetchLimit, offset, role, status }, executor = connection) {
  const filters = ["deleted_at IS NULL"];
  const params = [];
  if (role) {
    filters.push("role = ?");
    params.push(role);
  }
  if (status === "blocked") filters.push("blocked_at IS NOT NULL");
  if (status === "active") filters.push("blocked_at IS NULL");
  params.push(fetchLimit, offset);

  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function setUserBlocked(publicId, blocked, executor = connection) {
  const [result] = await executor.query(
    `UPDATE users
     SET blocked_at = ${blocked ? "CURRENT_TIMESTAMP" : "NULL"}
     WHERE public_id = ? AND deleted_at IS NULL`,
    [publicId],
  );
  return result.affectedRows > 0;
}
