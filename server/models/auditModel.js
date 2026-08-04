import { connection } from "../db/connection.js";
import { hashIp, publicId } from "../utils/identifiers.js";
import { config } from "../config/index.js";

export async function writeAudit({
  actorUserId = null,
  action,
  resourceType,
  resourcePublicId = null,
  outcome = "success",
  summary = null,
  requestId = null,
  ip = null,
}, executor = connection) {
  await executor.query(
    `INSERT INTO audit_logs (
      public_id, actor_user_id, action, resource_type, resource_public_id,
      outcome, summary, request_id, ip_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      publicId(),
      actorUserId,
      action,
      resourceType,
      resourcePublicId,
      outcome,
      summary,
      requestId,
      hashIp(ip, config.jwt.secret),
    ],
  );
}

export async function listAuditLogs({ fetchLimit, offset, query }, executor = connection) {
  const where = [];
  const params = [];
  if (query) {
    where.push(`(
      a.action LIKE ?
      OR a.resource_type LIKE ?
      OR a.resource_public_id LIKE ?
      OR a.summary LIKE ?
      OR u.display_name LIKE ?
    )`);
    const search = `%${query}%`;
    params.push(search, search, search, search, search);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      a.public_id, a.action, a.resource_type, a.resource_public_id,
      a.outcome, a.summary, a.request_id, a.created_at,
      u.public_id AS actor_public_id, u.display_name AS actor_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}
