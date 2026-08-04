import { connection } from "../db/connection.js";

export async function listCustomerShoppingHistory(userId, executor = connection) {
  const [rows] = await executor.query(
    `SELECT
      p.public_id AS product_public_id,
      oi.product_name,
      p.need_type,
      c.name AS category_name,
      v.name AS vendor_name,
      SUM(oi.quantity) AS quantity_ordered,
      COUNT(DISTINCT o.id) AS times_ordered,
      MAX(o.created_at) AS last_ordered_at
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     JOIN categories c ON c.id = p.category_id
     JOIN vendors v ON v.id = o.vendor_id
     WHERE o.user_id = ?
       AND o.status IN (
         'placed', 'accepted', 'preparing', 'ready',
         'out_for_delivery', 'completed'
       )
     GROUP BY
       p.id, p.public_id, oi.product_name, p.need_type,
       c.name, v.name
     ORDER BY times_ordered DESC, last_ordered_at DESC
     LIMIT 12`,
    [userId],
  );
  return rows;
}
