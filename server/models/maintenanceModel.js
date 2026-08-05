import { connection } from "../db/connection.js";

export async function createMaintenanceTicket(data, executor) {
  const [result] = await executor.query(
    `INSERT INTO maintenance_tickets (
      public_id, ticket_number, reporter_user_id, building_id, location_text,
      category, title, description, requested_priority, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.ticketNumber,
      data.userId,
      data.buildingId,
      data.locationText,
      data.category,
      data.title,
      data.description,
      data.requestedPriority,
      data.requestedPriority,
    ],
  );
  return result.insertId;
}

export async function insertMaintenanceAttachment(data, executor) {
  await executor.query(
    `INSERT INTO maintenance_attachments (
      public_id, maintenance_ticket_id, original_name,
      mime_type, size_bytes, file_data
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.maintenanceTicketId,
      data.originalName,
      data.mimeType,
      data.sizeBytes,
      data.fileData,
    ],
  );
}

export async function addMaintenanceHistory(data, executor = connection) {
  await executor.query(
    `INSERT INTO maintenance_history (
      maintenance_ticket_id, actor_user_id, event_type,
      from_value, to_value, note
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.maintenanceTicketId,
      data.actorUserId ?? null,
      data.eventType,
      data.fromValue ?? null,
      data.toValue ?? null,
      data.note ?? null,
    ],
  );
}

export async function findMaintenanceTicket(publicId, executor = connection, lock = false) {
  const [rows] = await executor.query(
    `SELECT
      mt.*, reporter.public_id AS reporter_public_id,
      reporter.display_name AS reporter_name,
      admin.public_id AS assigned_admin_public_id,
      admin.display_name AS assigned_admin_name,
      b.short_name AS building_name, b.campus_code
     FROM maintenance_tickets mt
     JOIN users reporter ON reporter.id = mt.reporter_user_id
     LEFT JOIN users admin ON admin.id = mt.assigned_admin_id
     JOIN buildings b ON b.id = mt.building_id
     WHERE mt.public_id = ?
     LIMIT 1
     ${lock ? "FOR UPDATE" : ""}`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function listCustomerTickets(
  userId,
  { fetchLimit, offset, status },
  executor = connection,
) {
  const where = ["mt.reporter_user_id = ?"];
  const params = [userId];
  if (status) {
    where.push("mt.status = ?");
    params.push(status);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      mt.public_id, mt.ticket_number, mt.title, mt.category,
      mt.requested_priority, mt.priority, mt.status, mt.location_text,
      mt.created_at, mt.updated_at, b.short_name AS building_name
     FROM maintenance_tickets mt
     JOIN buildings b ON b.id = mt.building_id
     WHERE ${where.join(" AND ")}
     ORDER BY mt.created_at DESC, mt.id DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listAdminTickets(
  { fetchLimit, offset, status, priority, category },
  executor = connection,
) {
  const where = [];
  const params = [];
  if (status) {
    where.push("mt.status = ?");
    params.push(status);
  }
  if (priority) {
    where.push("mt.priority = ?");
    params.push(priority);
  }
  if (category) {
    where.push("mt.category = ?");
    params.push(category);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      mt.public_id, mt.ticket_number, mt.title, mt.category,
      mt.requested_priority, mt.priority, mt.status, mt.location_text,
      mt.created_at, mt.updated_at, b.short_name AS building_name,
      u.display_name AS reporter_name
     FROM maintenance_tickets mt
     JOIN buildings b ON b.id = mt.building_id
     JOIN users u ON u.id = mt.reporter_user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY
       FIELD(mt.priority, 'urgent', 'normal', 'low'),
       mt.created_at,
       mt.id
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listMaintenanceTicketsForRoute(
  statuses,
  executor = connection,
) {
  if (!Array.isArray(statuses) || statuses.length === 0) return [];

  const placeholders = statuses.map(() => "?").join(", ");
  const [rows] = await executor.query(
    `SELECT
      mt.public_id, mt.ticket_number, mt.title, mt.category,
      mt.priority, mt.status, mt.location_text, mt.created_at,
      b.campus_code, b.short_name AS building_name
     FROM maintenance_tickets mt
     JOIN buildings b ON b.id = mt.building_id
     WHERE mt.status IN (${placeholders})
       AND b.is_active = TRUE
     ORDER BY
       FIELD(mt.priority, 'urgent', 'normal', 'low'),
       mt.created_at,
       mt.id`,
    statuses,
  );
  return rows;
}

export async function listMaintenanceAttachments(ticketId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT public_id, original_name, mime_type, size_bytes, created_at
     FROM maintenance_attachments
     WHERE maintenance_ticket_id = ?
     ORDER BY created_at`,
    [ticketId],
  );
  return rows;
}

export async function findMaintenanceAttachment(publicId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT
      ma.*, mt.reporter_user_id, mt.public_id AS ticket_public_id
     FROM maintenance_attachments ma
     JOIN maintenance_tickets mt ON mt.id = ma.maintenance_ticket_id
     WHERE ma.public_id = ?
     LIMIT 1`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function listMaintenanceComments(ticketId, includeInternal, executor = connection) {
  const [rows] = await executor.query(
    `SELECT
      mc.public_id, mc.body, mc.is_internal, mc.created_at,
      u.public_id AS author_public_id, u.display_name AS author_name,
      u.role AS author_role
     FROM maintenance_comments mc
     JOIN users u ON u.id = mc.author_user_id
     WHERE mc.maintenance_ticket_id = ?
       ${includeInternal ? "" : "AND mc.is_internal = FALSE"}
     ORDER BY mc.created_at`,
    [ticketId],
  );
  return rows;
}

export async function listMaintenanceHistory(ticketId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT
      mh.event_type, mh.from_value, mh.to_value, mh.note, mh.created_at,
      u.display_name AS actor_name
     FROM maintenance_history mh
     LEFT JOIN users u ON u.id = mh.actor_user_id
     WHERE mh.maintenance_ticket_id = ?
     ORDER BY mh.created_at`,
    [ticketId],
  );
  return rows;
}

export async function insertMaintenanceComment(data, executor = connection) {
  const [result] = await executor.query(
    `INSERT INTO maintenance_comments (
      public_id, maintenance_ticket_id, author_user_id, body, is_internal
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.maintenanceTicketId,
      data.authorUserId,
      data.body,
      data.isInternal,
    ],
  );
  return result.insertId;
}

export async function updateMaintenanceTicket(ticketId, data, executor = connection) {
  await executor.query(
    `UPDATE maintenance_tickets SET
      status = ?,
      priority = ?,
      assigned_admin_id = ?,
      resolved_at = CASE WHEN ? = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
      closed_at = CASE WHEN ? = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END
     WHERE id = ?`,
    [
      data.status,
      data.priority,
      data.assignedAdminId ?? null,
      data.status,
      data.status,
      ticketId,
    ],
  );
}
