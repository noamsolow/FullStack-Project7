-- Run against the database selected by the connection (for example `levgo`
-- or `levgo`). This migration also bridges the earlier
-- `vendor_memberships` layout so the current seed can be applied safely.

SET @has_users_vendor_id = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'vendor_id'
);
SET @sql = IF(
  @has_users_vendor_id = 0,
  'ALTER TABLE users ADD COLUMN vendor_id BIGINT UNSIGNED NULL AFTER role',
  'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @has_vendor_memberships = (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'vendor_memberships'
);
SET @sql = IF(
  @has_vendor_memberships > 0,
  'UPDATE users u JOIN vendor_memberships vm ON vm.user_id = u.id SET u.vendor_id = vm.vendor_id WHERE u.role = ''vendor_manager'' AND u.vendor_id IS NULL',
  'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @has_users_vendor_index = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'idx_users_vendor'
);
SET @sql = IF(
  @has_users_vendor_index = 0,
  'ALTER TABLE users ADD INDEX idx_users_vendor (vendor_id)',
  'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @has_users_vendor_fk = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'users'
    AND constraint_name = 'fk_users_vendor'
);
SET @sql = IF(
  @has_users_vendor_fk = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)',
  'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @has_token_balance = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'token_balance'
);
SET @sql = IF(
  @has_token_balance = 0,
  'ALTER TABLE users ADD COLUMN token_balance INT UNSIGNED NOT NULL DEFAULT 0 AFTER vendor_id',
  'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @has_payment_method = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'payment_method'
);
SET @sql = IF(
  @has_payment_method = 0,
  'ALTER TABLE orders ADD COLUMN payment_method ENUM(''tokens'', ''paypal'', ''none'') NOT NULL DEFAULT ''none'' AFTER total_agorot',
  'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

CREATE TABLE IF NOT EXISTS token_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  amount_tokens INT NOT NULL,
  balance_after_tokens INT UNSIGNED NOT NULL,
  transaction_type ENUM('seed_credit', 'order_payment', 'refund', 'adjustment') NOT NULL,
  note VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_token_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_token_transactions_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT uq_token_transactions_public_id UNIQUE (public_id),
  CONSTRAINT uq_token_transactions_order_type UNIQUE (order_id, transaction_type),
  CONSTRAINT chk_token_transactions_amount CHECK (amount_tokens <> 0),
  INDEX idx_token_transactions_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS campus_route_edges (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_building_id BIGINT UNSIGNED NOT NULL,
  to_building_id BIGINT UNSIGNED NOT NULL,
  distance_meters DECIMAL(7,2) NOT NULL,
  stairs_distance_meters DECIMAL(7,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_route_edges_from_building
    FOREIGN KEY (from_building_id) REFERENCES buildings(id),
  CONSTRAINT fk_route_edges_to_building
    FOREIGN KEY (to_building_id) REFERENCES buildings(id),
  CONSTRAINT uq_route_edge UNIQUE (from_building_id, to_building_id),
  CONSTRAINT chk_route_edge_order CHECK (from_building_id < to_building_id),
  CONSTRAINT chk_route_edge_distance CHECK (distance_meters > 0),
  CONSTRAINT chk_route_edge_stairs CHECK (
    stairs_distance_meters >= 0
    AND stairs_distance_meters <= distance_meters
  ),
  INDEX idx_route_edges_to_building (to_building_id, is_active)
) ENGINE=InnoDB;
