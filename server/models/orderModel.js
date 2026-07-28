import { pool } from "../db/pool.js";

export async function lockProductsByPublicIds(publicIds, executor) {
  const placeholders = publicIds.map(() => "?").join(", ");
  const [rows] = await executor.query(
    `SELECT
      p.id, p.public_id, p.vendor_id, p.sku, p.name, p.price_agorot,
      p.stock_quantity, p.is_available, p.deleted_at,
      v.public_id AS vendor_public_id, v.name AS vendor_name,
      v.vendor_type, v.pickup_enabled, v.delivery_enabled,
      v.status AS vendor_status, v.deleted_at AS vendor_deleted_at
     FROM products p
     JOIN vendors v ON v.id = p.vendor_id
     WHERE p.public_id IN (${placeholders})
     FOR UPDATE`,
    publicIds,
  );
  return rows;
}

export async function decrementStock(productId, quantity, executor) {
  const [result] = await executor.query(
    `UPDATE products
     SET stock_quantity = stock_quantity - ?
     WHERE id = ? AND stock_quantity IS NOT NULL AND stock_quantity >= ?`,
    [quantity, productId, quantity],
  );
  return result.affectedRows > 0;
}

export async function restoreOrderStock(orderId, executor) {
  await executor.query(
    `UPDATE products p
     JOIN order_items oi ON oi.product_id = p.id
     SET p.stock_quantity = p.stock_quantity + oi.quantity
     WHERE oi.order_id = ? AND p.stock_quantity IS NOT NULL`,
    [orderId],
  );
}

export async function createOrder(data, executor) {
  const [result] = await executor.query(
    `INSERT INTO orders (
      public_id, order_number, user_id, vendor_id, fulfillment_type,
      delivery_building_id, delivery_location, subtotal_agorot,
      delivery_fee_agorot, total_agorot, status, pickup_code,
      reservation_expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.publicId,
      data.orderNumber,
      data.userId,
      data.vendorId,
      data.fulfillmentType,
      data.deliveryBuildingId ?? null,
      data.deliveryLocation ?? null,
      data.subtotalAgorot,
      data.deliveryFeeAgorot,
      data.totalAgorot,
      data.status,
      data.pickupCode,
      data.reservationExpiresAt ?? null,
    ],
  );
  return result.insertId;
}

export async function insertOrderItems(orderId, items, executor) {
  for (const item of items) {
    await executor.query(
      `INSERT INTO order_items (
        order_id, product_id, product_name, sku, unit_price_agorot,
        quantity, line_total_agorot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.productId,
        item.name,
        item.sku,
        item.priceAgorot,
        item.quantity,
        item.lineTotalAgorot,
      ],
    );
  }
}

export async function addOrderHistory(
  { orderId, actorUserId = null, fromStatus = null, toStatus, note = null },
  executor = pool,
) {
  await executor.query(
    `INSERT INTO order_status_history (
      order_id, actor_user_id, from_status, to_status, note
    ) VALUES (?, ?, ?, ?, ?)`,
    [orderId, actorUserId, fromStatus, toStatus, note],
  );
}

export async function createOrderPayment(data, executor) {
  const [result] = await executor.query(
    `INSERT INTO payments (
      public_id, order_id, amount_agorot, currency, status
    ) VALUES (?, ?, ?, 'ILS', 'created')`,
    [data.publicId, data.orderId, data.amountAgorot],
  );
  return result.insertId;
}

export async function attachProviderOrder(paymentId, providerOrderId, executor = pool) {
  await executor.query(
    `UPDATE payments SET provider_order_id = ? WHERE id = ?`,
    [providerOrderId, paymentId],
  );
}

export async function findOrderByPublicId(publicId, executor = pool, lock = false) {
  const [rows] = await executor.query(
    `SELECT
      o.*, u.public_id AS user_public_id, u.display_name AS customer_name,
      v.public_id AS vendor_public_id, v.name AS vendor_name, v.slug AS vendor_slug,
      v.vendor_type, b.short_name AS delivery_building_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN vendors v ON v.id = o.vendor_id
     LEFT JOIN buildings b ON b.id = o.delivery_building_id
     WHERE o.public_id = ?
     LIMIT 1
     ${lock ? "FOR UPDATE" : ""}`,
    [publicId],
  );
  return rows[0] ?? null;
}

export async function findPaymentForOrder(orderId, executor = pool, lock = false) {
  const [rows] = await executor.query(
    `SELECT
       id, public_id, order_id, provider, provider_order_id,
       provider_capture_id, amount_agorot, currency, status,
       failure_code, completed_at, created_at, updated_at
     FROM payments
     WHERE order_id = ?
     ORDER BY created_at DESC
     LIMIT 1
     ${lock ? "FOR UPDATE" : ""}`,
    [orderId],
  );
  return rows[0] ?? null;
}

export async function listOrderItems(orderId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      p.public_id AS product_public_id, oi.product_name, oi.sku,
      oi.unit_price_agorot, oi.quantity, oi.line_total_agorot
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId],
  );
  return rows;
}

export async function listOrderHistory(orderId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      h.from_status, h.to_status, h.note, h.created_at,
      u.display_name AS actor_name
     FROM order_status_history h
     LEFT JOIN users u ON u.id = h.actor_user_id
     WHERE h.order_id = ?
     ORDER BY h.created_at`,
    [orderId],
  );
  return rows;
}

export async function listCustomerOrders(userId, { fetchLimit, offset, status }, executor = pool) {
  const where = ["o.user_id = ?"];
  const params = [userId];
  if (status) {
    where.push("o.status = ?");
    params.push(status);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      o.public_id, o.order_number, o.fulfillment_type, o.total_agorot,
      o.currency, o.status, o.pickup_code, o.created_at, o.updated_at,
      v.name AS vendor_name, v.slug AS vendor_slug
     FROM orders o
     JOIN vendors v ON v.id = o.vendor_id
     WHERE ${where.join(" AND ")}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listVendorOrders(vendorId, { fetchLimit, offset, status }, executor = pool) {
  const where = ["o.vendor_id = ?"];
  const params = [vendorId];
  if (status) {
    where.push("o.status = ?");
    params.push(status);
  } else {
    where.push("o.status <> 'pending_payment'");
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      o.public_id, o.order_number, o.fulfillment_type, o.delivery_location,
      o.total_agorot, o.currency, o.status, o.pickup_code,
      o.created_at, o.updated_at, u.display_name AS customer_name,
      b.short_name AS delivery_building_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN buildings b ON b.id = o.delivery_building_id
     WHERE ${where.join(" AND ")}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listAdminOrders(
  { fetchLimit, offset, status, search },
  executor = pool,
) {
  const where = [];
  const params = [];
  if (status) {
    where.push("o.status = ?");
    params.push(status);
  }
  if (search) {
    where.push(`(
      o.order_number LIKE ?
      OR u.display_name LIKE ?
      OR u.email LIKE ?
      OR v.name LIKE ?
    )`);
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  params.push(fetchLimit, offset);
  const [rows] = await executor.query(
    `SELECT
      o.id, o.public_id, o.order_number, o.fulfillment_type,
      o.delivery_location, o.subtotal_agorot, o.delivery_fee_agorot,
      o.total_agorot, o.currency, o.status, o.pickup_code,
      o.completed_at, o.cancelled_at, o.created_at, o.updated_at,
      u.public_id AS customer_public_id, u.display_name AS customer_name,
      u.email AS customer_email,
      v.public_id AS vendor_public_id, v.name AS vendor_name,
      v.vendor_type, b.short_name AS delivery_building_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN vendors v ON v.id = o.vendor_id
     LEFT JOIN buildings b ON b.id = o.delivery_building_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  );
  return rows;
}

export async function listOrderHistoriesByOrderIds(orderIds, executor = pool) {
  if (!orderIds.length) return [];
  const placeholders = orderIds.map(() => "?").join(", ");
  const [rows] = await executor.query(
    `SELECT
      h.order_id, h.from_status, h.to_status, h.note, h.created_at,
      u.display_name AS actor_name
     FROM order_status_history h
     LEFT JOIN users u ON u.id = h.actor_user_id
     WHERE h.order_id IN (${placeholders})
     ORDER BY h.order_id, h.created_at`,
    orderIds,
  );
  return rows;
}

export async function setOrderStatus(orderId, status, executor = pool) {
  await executor.query(
    `UPDATE orders
     SET status = ?,
       completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
       cancelled_at = CASE WHEN ? = 'cancelled' THEN CURRENT_TIMESTAMP ELSE cancelled_at END
     WHERE id = ?`,
    [status, status, status, orderId],
  );
}

export async function setPaymentProcessing(paymentId, executor) {
  await executor.query(
    "UPDATE payments SET status = 'processing' WHERE id = ?",
    [paymentId],
  );
}

export async function completeOrderPayment(
  { paymentId, providerCaptureId, orderId },
  executor,
) {
  await executor.query(
    `UPDATE payments
     SET status = 'completed', provider_capture_id = ?, completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [providerCaptureId, paymentId],
  );
  await executor.query(
    `UPDATE orders
     SET status = 'placed', reservation_expires_at = NULL
     WHERE id = ?`,
    [orderId],
  );
}

export async function markPaymentFailed(paymentId, failureCode, executor = pool) {
  await executor.query(
    `UPDATE payments SET status = 'failed', failure_code = ? WHERE id = ?`,
    [failureCode, paymentId],
  );
}

export async function createOrderCancellationRequest(data, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO cancellation_requests (
      public_id, requester_user_id, order_id, reason
    ) VALUES (?, ?, ?, ?)`,
    [data.publicId, data.userId, data.orderId, data.reason],
  );
  return result.insertId;
}

export async function findOpenOrderCancellation(orderId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT public_id, status, reason, created_at
     FROM cancellation_requests
     WHERE order_id = ? AND status = 'open'
     LIMIT 1`,
    [orderId],
  );
  return rows[0] ?? null;
}

export async function findExpiredReservations(limit = 50, executor = pool) {
  const [rows] = await executor.query(
    `SELECT id, public_id
     FROM orders
     WHERE status = 'pending_payment'
       AND reservation_expires_at IS NOT NULL
       AND reservation_expires_at < CURRENT_TIMESTAMP
     ORDER BY reservation_expires_at
     LIMIT ?`,
    [limit],
  );
  return rows;
}
