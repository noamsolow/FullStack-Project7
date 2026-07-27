import { pool } from "../db/pool.js";

const safeUserColumns = `
  id,
  public_id,
  email,
  display_name,
  phone,
  customer_type,
  role,
  blocked_at,
  deleted_at,
  created_at,
  updated_at
`;

export async function findUserByEmail(email, executor = pool) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}, password_hash
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findActiveUserById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE id = ? AND blocked_at IS NULL AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findSafeUserByPublicId(publicId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE public_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function createUser(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO users (
      public_id, email, display_name, phone, customer_type, role, password_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.email,
      data.displayName,
      data.phone ?? null,
      data.customerType ?? null,
      data.role,
      data.passwordHash,
    ],
  );
  return findActiveUserById(result.insertId, executor);
}

export async function updateOwnProfile(userId, data, executor = pool) {
  await executor.query(
    `UPDATE users
     SET display_name = ?, phone = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [data.displayName, data.phone ?? null, userId],
  );
  return findActiveUserById(userId, executor);
}

export async function softDeleteOwnAccount(userId, executor = pool) {
  const [result] = await executor.query(
    `UPDATE users
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [userId],
  );
  return result.affectedRows > 0;
}

export async function createVendor(data, executor = pool) {
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

export async function addVendorMembership(userId, vendorId, membershipRole, executor = pool) {
  await executor.query(
    `INSERT INTO vendor_memberships (user_id, vendor_id, membership_role)
     VALUES (?, ?, ?)`,
    [userId, vendorId, membershipRole],
  );
}

export async function findVendorMembership(userId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      vm.membership_role,
      v.id AS vendor_id,
      v.public_id AS vendor_public_id,
      v.name AS vendor_name,
      v.slug AS vendor_slug,
      v.vendor_type,
      v.status AS vendor_status
     FROM vendor_memberships vm
     JOIN vendors v ON v.id = vm.vendor_id
     WHERE vm.user_id = ? AND v.deleted_at IS NULL
     ORDER BY vm.created_at
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function listUsers({ fetchLimit, offset, role, status }, executor = pool) {
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
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function setUserBlocked(publicId, blocked, executor = pool) {
  const [result] = await executor.query(
    `UPDATE users
     SET blocked_at = ${blocked ? "CURRENT_TIMESTAMP" : "NULL"}
     WHERE public_id = ? AND deleted_at IS NULL`,
    [publicId],
  );
  return result.affectedRows > 0;
}
