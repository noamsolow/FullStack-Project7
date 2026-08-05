import { connection } from "../db/connection.js";

export async function createOrderDeliveryTracking(data, executor = connection) {
  await executor.query(
    `INSERT INTO order_delivery_tracking (
      order_id, provider, provider_reference, status, started_at, eta_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE order_id = VALUES(order_id)`,
    [
      data.orderId,
      data.provider,
      data.providerReference,
      data.status,
      data.startedAt,
      data.etaAt,
    ],
  );
}

export async function findOrderDeliveryTracking(orderId, executor = connection, lock = false) {
  const [rows] = await executor.query(
    `SELECT id, order_id, provider, provider_reference, status,
       started_at, eta_at, arrived_at, created_at, updated_at
     FROM order_delivery_tracking
     WHERE order_id = ?
     LIMIT 1
     ${lock ? "FOR UPDATE" : ""}`,
    [orderId],
  );
  return rows[0] ?? null;
}

export async function listUntrackedDeliveries(limit = 50, executor = connection) {
  const [rows] = await executor.query(
    `SELECT o.id, o.public_id
     FROM orders o
     LEFT JOIN order_delivery_tracking tracking ON tracking.order_id = o.id
     WHERE o.status = 'out_for_delivery'
       AND o.fulfillment_type = 'delivery'
       AND tracking.id IS NULL
     ORDER BY o.updated_at, o.id
     LIMIT ?`,
    [limit],
  );
  return rows;
}

export async function listDueDeliveries(limit = 50, executor = connection) {
  const [rows] = await executor.query(
    `SELECT o.public_id
     FROM order_delivery_tracking tracking
     JOIN orders o ON o.id = tracking.order_id
     WHERE tracking.status = 'in_transit'
       AND tracking.eta_at <= UTC_TIMESTAMP
       AND o.status = 'out_for_delivery'
     ORDER BY tracking.eta_at, tracking.id
     LIMIT ?`,
    [limit],
  );
  return rows;
}

export async function markDeliveryTrackingArrived(trackingId, executor = connection) {
  const [result] = await executor.query(
    `UPDATE order_delivery_tracking
     SET status = 'arrived', arrived_at = UTC_TIMESTAMP(3)
     WHERE id = ?
       AND status = 'in_transit'
       AND eta_at <= UTC_TIMESTAMP(3)`,
    [trackingId],
  );
  return result.affectedRows > 0;
}

export async function listCustomerOrderProgress(
  userId,
  { fetchLimit, offset },
  executor = connection,
) {
  const [rows] = await executor.query(
    `SELECT
      o.public_id, o.order_number, o.fulfillment_type, o.status,
      o.pickup_code, o.created_at, o.updated_at,
      v.name AS vendor_name, v.slug AS vendor_slug,
      tracking.provider AS tracking_provider,
      tracking.status AS tracking_status,
      tracking.started_at AS tracking_started_at,
      tracking.eta_at AS tracking_eta_at,
      tracking.arrived_at AS tracking_arrived_at
     FROM orders o
     JOIN vendors v ON v.id = o.vendor_id
     LEFT JOIN order_delivery_tracking tracking ON tracking.order_id = o.id
     WHERE o.user_id = ?
       AND o.status IN (
         'placed', 'accepted', 'preparing', 'ready',
         'out_for_delivery', 'arrived'
       )
     ORDER BY
       CASE o.status
         WHEN 'arrived' THEN 0
         WHEN 'ready' THEN 1
         WHEN 'out_for_delivery' THEN 2
         WHEN 'preparing' THEN 3
         WHEN 'accepted' THEN 4
         ELSE 5
       END,
       o.created_at,
       o.id
     LIMIT ? OFFSET ?`,
    [userId, fetchLimit, offset],
  );
  return rows;
}
