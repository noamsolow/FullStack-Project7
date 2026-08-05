-- Adds persisted, provider-neutral delivery tracking and the customer-visible
-- arrived order state. Safe to run after the canonical schema or the token migration.

ALTER TABLE orders MODIFY COLUMN status ENUM(
  'pending_payment',
  'payment_processing',
  'placed',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'arrived',
  'completed',
  'cancelled',
  'cancellation_requested',
  'needs_attention'
) NOT NULL DEFAULT 'pending_payment';

CREATE TABLE IF NOT EXISTS order_delivery_tracking (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(40) NOT NULL,
  provider_reference VARCHAR(160) NULL,
  status ENUM('in_transit', 'arrived') NOT NULL DEFAULT 'in_transit',
  started_at DATETIME(3) NOT NULL,
  eta_at DATETIME(3) NOT NULL,
  arrived_at DATETIME(3) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_delivery_tracking_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT uq_order_delivery_tracking_order UNIQUE (order_id),
  INDEX idx_order_delivery_tracking_due (status, eta_at)
) ENGINE=InnoDB;
