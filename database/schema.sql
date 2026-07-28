CREATE DATABASE IF NOT EXISTS project7
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE project7;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  customer_type ENUM('student', 'teacher') NULL,
  role ENUM('customer', 'vendor_manager', 'admin') NOT NULL DEFAULT 'customer',
  password_hash VARCHAR(255) NOT NULL,
  blocked_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_public_id UNIQUE (public_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_users_customer_type CHECK (
    (role = 'customer' AND customer_type IS NOT NULL)
    OR (role <> 'customer' AND customer_type IS NULL)
  ),
  INDEX idx_users_role_active (role, blocked_at, deleted_at),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS buildings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campus_code VARCHAR(20) NOT NULL,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(80) NOT NULL,
  description VARCHAR(500) NULL,
  delivery_hint VARCHAR(300) NULL,
  map_x DECIMAL(6,3) NULL,
  map_y DECIMAL(6,3) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_buildings_code UNIQUE (campus_code),
  CONSTRAINT chk_buildings_map_x CHECK (map_x IS NULL OR map_x BETWEEN 0 AND 100),
  CONSTRAINT chk_buildings_map_y CHECK (map_y IS NULL OR map_y BETWEEN 0 AND 100),
  INDEX idx_buildings_active_name (is_active, name)
) ENGINE=InnoDB;

-- Keeps an existing project7 database compatible when this schema is rerun
-- from MySQL Workbench with an administrator connection.
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS map_x DECIMAL(6,3) NULL AFTER delivery_hint,
  ADD COLUMN IF NOT EXISTS map_y DECIMAL(6,3) NULL AFTER map_x;

CREATE TABLE IF NOT EXISTS vendors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  building_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  vendor_type ENUM('food_court', 'campus_shop', 'vending_machine', 'print_center') NOT NULL,
  description VARCHAR(800) NOT NULL,
  contact_email VARCHAR(254) NOT NULL,
  contact_phone VARCHAR(30) NULL,
  pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  min_pickup_order_agorot INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_min_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  estimated_max_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 25,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendors_building
    FOREIGN KEY (building_id) REFERENCES buildings(id),
  CONSTRAINT uq_vendors_public_id UNIQUE (public_id),
  CONSTRAINT uq_vendors_slug UNIQUE (slug),
  CONSTRAINT chk_vendor_estimate CHECK (estimated_max_minutes >= estimated_min_minutes),
  INDEX idx_vendors_discovery (status, deleted_at, is_open, vendor_type, building_id),
  INDEX idx_vendors_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendor_memberships (
  user_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  membership_role ENUM('owner', 'manager') NOT NULL DEFAULT 'manager',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, vendor_id),
  CONSTRAINT fk_vendor_memberships_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_vendor_memberships_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_vendor_memberships_vendor (vendor_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendor_hours (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_id BIGINT UNSIGNED NOT NULL,
  weekday TINYINT UNSIGNED NOT NULL,
  opens_at TIME NULL,
  closes_at TIME NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_vendor_hours_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT uq_vendor_hours_day UNIQUE (vendor_id, weekday),
  CONSTRAINT chk_vendor_hours_weekday CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT chk_vendor_hours_times CHECK (
    is_closed = TRUE OR (opens_at IS NOT NULL AND closes_at IS NOT NULL AND closes_at > opens_at)
  )
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendor_delivery_zones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_id BIGINT UNSIGNED NOT NULL,
  building_id BIGINT UNSIGNED NOT NULL,
  fee_agorot INT UNSIGNED NOT NULL,
  minimum_order_agorot INT UNSIGNED NOT NULL DEFAULT 0,
  eta_min_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  eta_max_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 35,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_delivery_zones_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT fk_delivery_zones_building
    FOREIGN KEY (building_id) REFERENCES buildings(id),
  CONSTRAINT uq_delivery_zone UNIQUE (vendor_id, building_id),
  CONSTRAINT chk_delivery_fee CHECK (fee_agorot <= 5000),
  CONSTRAINT chk_delivery_minimum CHECK (minimum_order_agorot <= 50000),
  CONSTRAINT chk_delivery_eta CHECK (eta_max_minutes >= eta_min_minutes),
  INDEX idx_delivery_zones_building (building_id, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_name ENUM('eat', 'shop') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT uq_categories_slug UNIQUE (slug),
  INDEX idx_categories_group (group_name, is_active, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(80) NOT NULL,
  name VARCHAR(140) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  need_type ENUM('meal', 'snack', 'drink', 'study', 'technology', 'personal', 'dormitory') NOT NULL,
  price_agorot INT UNSIGNED NOT NULL,
  stock_quantity INT UNSIGNED NULL,
  dietary_tags JSON NOT NULL,
  allergen_text VARCHAR(500) NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT uq_products_public_id UNIQUE (public_id),
  CONSTRAINT uq_products_vendor_sku UNIQUE (vendor_id, sku),
  CONSTRAINT chk_product_price CHECK (price_agorot BETWEEN 100 AND 100000),
  CONSTRAINT chk_product_dietary_json CHECK (JSON_VALID(dietary_tags)),
  INDEX idx_products_catalog (vendor_id, category_id, is_available, deleted_at),
  INDEX idx_products_need_price (need_type, price_agorot),
  FULLTEXT INDEX ftx_products_search (name, description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(40) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  file_data MEDIUMBLOB NOT NULL,
  alt_text VARCHAR(180) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT uq_product_images_public_id UNIQUE (public_id),
  INDEX idx_product_images_product (product_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  order_number VARCHAR(24) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  fulfillment_type ENUM('pickup', 'delivery') NOT NULL,
  delivery_building_id BIGINT UNSIGNED NULL,
  delivery_location VARCHAR(180) NULL,
  subtotal_agorot INT UNSIGNED NOT NULL,
  delivery_fee_agorot INT UNSIGNED NOT NULL DEFAULT 0,
  total_agorot INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ILS',
  status ENUM(
    'pending_payment',
    'payment_processing',
    'placed',
    'accepted',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
    'cancellation_requested',
    'needs_attention'
  ) NOT NULL DEFAULT 'pending_payment',
  pickup_code VARCHAR(12) NOT NULL,
  reservation_expires_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT fk_orders_delivery_building
    FOREIGN KEY (delivery_building_id) REFERENCES buildings(id),
  CONSTRAINT uq_orders_public_id UNIQUE (public_id),
  CONSTRAINT uq_orders_number UNIQUE (order_number),
  CONSTRAINT chk_order_delivery CHECK (
    (fulfillment_type = 'pickup' AND delivery_building_id IS NULL AND delivery_location IS NULL)
    OR (fulfillment_type = 'delivery' AND delivery_building_id IS NOT NULL AND delivery_location IS NOT NULL)
  ),
  CONSTRAINT chk_order_total CHECK (
    subtotal_agorot + delivery_fee_agorot = total_agorot
  ),
  INDEX idx_orders_user_created (user_id, created_at),
  INDEX idx_orders_vendor_status (vendor_id, status, created_at),
  INDEX idx_orders_reservation (status, reservation_expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(140) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  unit_price_agorot INT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  line_total_agorot INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_order_item_quantity CHECK (quantity BETWEEN 1 AND 20),
  CONSTRAINT chk_order_item_total CHECK (unit_price_agorot * quantity = line_total_agorot),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_history_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_history_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_order_history_order (order_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  job_number VARCHAR(24) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  paper_size ENUM('A4', 'A3') NOT NULL,
  color_mode ENUM('black_white', 'color') NOT NULL,
  sides ENUM('single', 'double') NOT NULL,
  copies TINYINT UNSIGNED NOT NULL,
  stapled BOOLEAN NOT NULL DEFAULT FALSE,
  customer_note VARCHAR(500) NULL,
  quote_agorot INT UNSIGNED NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ILS',
  quote_expires_at DATETIME NULL,
  status ENUM(
    'submitted',
    'quoted',
    'pending_payment',
    'payment_processing',
    'paid',
    'printing',
    'ready',
    'completed',
    'rejected',
    'cancelled',
    'cancellation_requested',
    'needs_attention'
  ) NOT NULL DEFAULT 'submitted',
  pickup_code VARCHAR(12) NOT NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  retention_delete_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_print_jobs_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_print_jobs_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT uq_print_jobs_public_id UNIQUE (public_id),
  CONSTRAINT uq_print_jobs_number UNIQUE (job_number),
  CONSTRAINT chk_print_copies CHECK (copies BETWEEN 1 AND 20),
  CONSTRAINT chk_print_quote CHECK (quote_agorot IS NULL OR quote_agorot BETWEEN 100 AND 200000),
  INDEX idx_print_jobs_user_created (user_id, created_at),
  INDEX idx_print_jobs_vendor_status (vendor_id, status, created_at),
  INDEX idx_print_jobs_retention (retention_delete_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_files (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  print_job_id BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(40) NOT NULL DEFAULT 'application/pdf',
  size_bytes INT UNSIGNED NOT NULL,
  file_data MEDIUMBLOB NOT NULL,
  sha256 CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_print_files_job
    FOREIGN KEY (print_job_id) REFERENCES print_jobs(id),
  CONSTRAINT uq_print_files_public_id UNIQUE (public_id),
  CONSTRAINT uq_print_files_job UNIQUE (print_job_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_job_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  print_job_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_print_history_job
    FOREIGN KEY (print_job_id) REFERENCES print_jobs(id),
  CONSTRAINT fk_print_history_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_print_history_job (print_job_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  ticket_number VARCHAR(24) NOT NULL,
  reporter_user_id BIGINT UNSIGNED NOT NULL,
  assigned_admin_id BIGINT UNSIGNED NULL,
  building_id BIGINT UNSIGNED NOT NULL,
  location_text VARCHAR(180) NOT NULL,
  category ENUM(
    'electrical',
    'plumbing',
    'furniture',
    'cleaning',
    'safety',
    'it_equipment',
    'missing_supplies',
    'other'
  ) NOT NULL,
  title VARCHAR(140) NOT NULL,
  description VARCHAR(1500) NOT NULL,
  requested_priority ENUM('low', 'normal', 'urgent') NOT NULL DEFAULT 'normal',
  priority ENUM('low', 'normal', 'urgent') NOT NULL DEFAULT 'normal',
  status ENUM(
    'open',
    'acknowledged',
    'in_progress',
    'waiting_for_user',
    'resolved',
    'closed',
    'rejected'
  ) NOT NULL DEFAULT 'open',
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_reporter
    FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  CONSTRAINT fk_maintenance_admin
    FOREIGN KEY (assigned_admin_id) REFERENCES users(id),
  CONSTRAINT fk_maintenance_building
    FOREIGN KEY (building_id) REFERENCES buildings(id),
  CONSTRAINT uq_maintenance_public_id UNIQUE (public_id),
  CONSTRAINT uq_maintenance_number UNIQUE (ticket_number),
  INDEX idx_maintenance_reporter (reporter_user_id, created_at),
  INDEX idx_maintenance_queue (status, priority, created_at),
  INDEX idx_maintenance_building (building_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  maintenance_ticket_id BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(40) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  file_data MEDIUMBLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_attachments_ticket
    FOREIGN KEY (maintenance_ticket_id) REFERENCES maintenance_tickets(id),
  CONSTRAINT uq_maintenance_attachments_public_id UNIQUE (public_id),
  INDEX idx_maintenance_attachments_ticket (maintenance_ticket_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  maintenance_ticket_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  body VARCHAR(1000) NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_comments_ticket
    FOREIGN KEY (maintenance_ticket_id) REFERENCES maintenance_tickets(id),
  CONSTRAINT fk_maintenance_comments_author
    FOREIGN KEY (author_user_id) REFERENCES users(id),
  CONSTRAINT uq_maintenance_comments_public_id UNIQUE (public_id),
  INDEX idx_maintenance_comments_ticket (maintenance_ticket_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  maintenance_ticket_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(60) NOT NULL,
  from_value VARCHAR(100) NULL,
  to_value VARCHAR(100) NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_history_ticket
    FOREIGN KEY (maintenance_ticket_id) REFERENCES maintenance_tickets(id),
  CONSTRAINT fk_maintenance_history_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_maintenance_history_ticket (maintenance_ticket_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  print_job_id BIGINT UNSIGNED NULL,
  provider ENUM('paypal') NOT NULL DEFAULT 'paypal',
  provider_order_id VARCHAR(80) NULL,
  provider_capture_id VARCHAR(80) NULL,
  amount_agorot INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ILS',
  status ENUM('created', 'approved', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'created',
  failure_code VARCHAR(100) NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_payments_print_job
    FOREIGN KEY (print_job_id) REFERENCES print_jobs(id),
  CONSTRAINT uq_payments_public_id UNIQUE (public_id),
  CONSTRAINT uq_payments_provider_order UNIQUE (provider_order_id),
  CONSTRAINT uq_payments_provider_capture UNIQUE (provider_capture_id),
  CONSTRAINT chk_payment_target CHECK (
    (order_id IS NOT NULL AND print_job_id IS NULL)
    OR (order_id IS NULL AND print_job_id IS NOT NULL)
  ),
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_print_job (print_job_id),
  INDEX idx_payments_status (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cancellation_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  requester_user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  print_job_id BIGINT UNSIGNED NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('open', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
  resolution_note VARCHAR(500) NULL,
  resolved_by_user_id BIGINT UNSIGNED NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cancellation_requester
    FOREIGN KEY (requester_user_id) REFERENCES users(id),
  CONSTRAINT fk_cancellation_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_cancellation_print_job
    FOREIGN KEY (print_job_id) REFERENCES print_jobs(id),
  CONSTRAINT fk_cancellation_resolver
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id),
  CONSTRAINT uq_cancellation_public_id UNIQUE (public_id),
  CONSTRAINT chk_cancellation_target CHECK (
    (order_id IS NOT NULL AND print_job_id IS NULL)
    OR (order_id IS NULL AND print_job_id IS NOT NULL)
  ),
  INDEX idx_cancellation_open (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  resource_type VARCHAR(60) NOT NULL,
  resource_public_id VARCHAR(80) NULL,
  outcome ENUM('success', 'failure') NOT NULL,
  summary VARCHAR(500) NULL,
  request_id VARCHAR(80) NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id),
  CONSTRAINT uq_audit_public_id UNIQUE (public_id),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_actor (actor_user_id, created_at),
  INDEX idx_audit_resource (resource_type, resource_public_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recommendation_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  need_type VARCHAR(30) NOT NULL,
  budget_agorot INT UNSIGNED NOT NULL,
  provider_used ENUM('openai', 'fallback') NOT NULL,
  outcome ENUM('success', 'failure') NOT NULL,
  result_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendations_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uq_recommendations_public_id UNIQUE (public_id),
  INDEX idx_recommendations_user (user_id, created_at)
) ENGINE=InnoDB;
