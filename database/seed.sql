USE project7;

INSERT INTO buildings
  (campus_code, name, short_name, description, delivery_hint, map_x, map_y)
VALUES
  ('1', 'Beit Midrash - Brause Building', 'Beit Midrash - Brause Building', 'Beit Midrash in the Brause Building.', 'Meet at the main entrance.', 23.3, 23.7),
  ('12', 'Sohachevsky Building', 'Sohachevsky Building', 'Cafeterias and dining hall.', 'Meet at the main entrance.', 35.7, 64.4),
  ('13', 'Israel Building', 'Israel Building', 'Student administration, fitness center, and preparatory program.', 'Meet at the main entrance.', 22.0, 64.7),
  ('22', 'Levi Building', 'Levi Building', 'Applied physics building.', 'Meet at the main entrance.', 46.6, 38.1),
  ('24', 'Hochstein Building', 'Hochstein Building', 'Faculty of Management and academic preparatory program.', 'Meet at the main entrance.', 26.2, 43.5),
  ('26', 'Weiler Building', 'Weiler Building', 'Faculty of Engineering.', 'Meet at the main entrance.', 11.0, 42.7),
  ('27', 'Open Amphitheater', 'Open Amphitheater', 'Open amphitheater and entrepreneurship center.', 'Meet at the amphitheater entrance.', 5.0, 44.2),
  ('36', 'Beren Building', 'Beren Building', 'Torah and Science Institute and Nursing Department.', 'Meet at the main entrance.', 13.2, 17.3),
  ('37', 'Administration Building', 'Administration Building', 'Campus administration.', 'Meet at reception.', 7.9, 26.9),
  ('41A', 'Amaraggi Dormitories', 'Amaraggi Dormitories', 'Dormitories and student club.', 'Include the room number in the delivery note.', 66.4, 25.6),
  ('41B', 'Glickman Dormitories', 'Glickman Dormitories', 'Dormitories, mikveh, and dormitory administration.', 'Include the room number in the delivery note.', 71.0, 24.9),
  ('42', 'Hochstein Dormitories', 'Hochstein Dormitories', 'On-campus student housing.', 'Include the room number in the delivery note.', 75.4, 19.9),
  ('43', 'Beren Dormitories', 'Beren Dormitories', 'Dormitories and laundry.', 'Include the room number in the delivery note.', 80.6, 17.9),
  ('44', 'Sherman Dormitories A', 'Sherman Dormitories A', 'On-campus student housing.', 'Include the room number in the delivery note.', 70.5, 40.5),
  ('45', 'Sherman Dormitories B', 'Sherman Dormitories B', 'On-campus student housing.', 'Include the room number in the delivery note.', 77.4, 37.2),
  ('46', 'Married Students Dormitories', 'Married Students Dormitories', 'On-campus housing for married students.', 'Include the apartment number in the delivery note.', 85.0, 29.3),
  ('47', 'Tennenbaum Building', 'Tennenbaum Building', 'Tennenbaum campus building.', 'Include the room number in the delivery note.', 88.8, 12.1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  short_name = VALUES(short_name),
  description = VALUES(description),
  delivery_hint = VALUES(delivery_hint),
  map_x = VALUES(map_x),
  map_y = VALUES(map_y),
  is_active = TRUE;

INSERT INTO categories (slug, name, group_name, sort_order)
VALUES
  ('meals', 'Meals', 'eat', 10),
  ('snacks', 'Snacks', 'eat', 20),
  ('drinks', 'Drinks', 'eat', 30),
  ('stationery', 'Stationery', 'shop', 40),
  ('paper-notebooks', 'Paper & Notebooks', 'shop', 50),
  ('technology', 'Technology', 'shop', 60),
  ('lab-study', 'Lab & Study', 'shop', 70),
  ('personal-care', 'Personal Care', 'shop', 80),
  ('dorm-essentials', 'Dorm Essentials', 'shop', 90)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  group_name = VALUES(group_name),
  sort_order = VALUES(sort_order),
  is_active = TRUE;

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Meat Cafeteria', 'meat-cafeteria', 'food_court',
  'Fresh meat meals, sandwiches, and drinks for the campus day.',
  'meat.cafeteria@example.com', TRUE, TRUE, TRUE, 0, 10, 25
FROM buildings b WHERE b.campus_code = '12'
ON DUPLICATE KEY UPDATE
  building_id = VALUES(building_id),
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Office Supplies Store', 'office-supplies', 'campus_shop',
  'Notebooks, writing tools, paper, and essential technology accessories.',
  'office.supplies@example.com', TRUE, TRUE, TRUE, 0, 8, 18
FROM buildings b WHERE b.campus_code = '22'
ON DUPLICATE KEY UPDATE
  building_id = VALUES(building_id),
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Dairy Cafeteria', 'dairy-cafeteria', 'food_court',
  'Fresh dairy meals, salads, pastries, and coffee.',
  'dairy.cafeteria@example.com', TRUE, TRUE, TRUE, 0, 8, 22
FROM buildings b WHERE b.campus_code = '12'
ON DUPLICATE KEY UPDATE
  building_id = VALUES(building_id),
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Print Center', 'print-center', 'print_center',
  'Printing, binding, lamination, and document services.',
  'print.center@example.com', TRUE, FALSE, TRUE, 0, 20, 60
FROM buildings b WHERE b.campus_code = '26'
ON DUPLICATE KEY UPDATE
  building_id = VALUES(building_id),
  name = VALUES(name),
  description = VALUES(description);

-- Classroom-only demo accounts. Passwords are bcrypt hashes; rerunning the
-- seed never overwrites an existing account with the same email or public ID.
INSERT IGNORE INTO users (
  public_id, email, display_name, phone, customer_type, role, password_hash
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'student@jct.ac.il',
    'Demo Student',
    NULL,
    'student',
    'customer',
    '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'partner@example.com',
    'Meat Cafeteria Manager',
    NULL,
    NULL,
    'vendor_manager',
    '$2b$12$wlsLhAI/bheSjc76KyiMFeO7Y/I.IEthdSHLAIyoZWFqz9PcN5GkC'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'print.partner@example.com',
    'Print Lab Manager',
    NULL,
    NULL,
    'vendor_manager',
    '$2b$12$p0YbsvO/Uq1VliziNMuKLezCIZGExTqr39SV63E9/5c8jhWVtzSaC'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'admin@jct.ac.il',
    'Demo Administrator',
    NULL,
    NULL,
    'admin',
    '$2b$12$W6navKNHBUXOfwQTla9Lw.7Wq3N8BO/yOrlYmyealM7Nmh/ffz2xS'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'dairy.partner@example.com',
    'Dairy Cafeteria Manager',
    NULL,
    NULL,
    'vendor_manager',
    '$2b$12$wlsLhAI/bheSjc76KyiMFeO7Y/I.IEthdSHLAIyoZWFqz9PcN5GkC'
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'office.partner@example.com',
    'Office Supplies Manager',
    NULL,
    NULL,
    'vendor_manager',
    '$2b$12$wlsLhAI/bheSjc76KyiMFeO7Y/I.IEthdSHLAIyoZWFqz9PcN5GkC'
  );

INSERT IGNORE INTO vendor_memberships (user_id, vendor_id, membership_role)
SELECT u.id, v.id, 'manager'
FROM users u
JOIN vendors v ON v.slug = 'meat-cafeteria'
WHERE u.email = 'partner@example.com'
  AND u.public_id = '10000000-0000-4000-8000-000000000002'
  AND u.role = 'vendor_manager';

INSERT IGNORE INTO vendor_memberships (user_id, vendor_id, membership_role)
SELECT u.id, v.id, 'manager'
FROM users u
JOIN vendors v ON v.slug = 'print-center'
WHERE u.email = 'print.partner@example.com'
  AND u.public_id = '10000000-0000-4000-8000-000000000003'
  AND u.role = 'vendor_manager';

INSERT IGNORE INTO vendor_memberships (user_id, vendor_id, membership_role)
SELECT u.id, v.id, 'manager'
FROM users u
JOIN vendors v ON v.slug = 'dairy-cafeteria'
WHERE u.email = 'dairy.partner@example.com'
  AND u.public_id = '10000000-0000-4000-8000-000000000005'
  AND u.role = 'vendor_manager';

INSERT IGNORE INTO vendor_memberships (user_id, vendor_id, membership_role)
SELECT u.id, v.id, 'manager'
FROM users u
JOIN vendors v ON v.slug = 'office-supplies'
WHERE u.email = 'office.partner@example.com'
  AND u.public_id = '10000000-0000-4000-8000-000000000006'
  AND u.role = 'vendor_manager';

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'MC-GRILL-01', 'Grilled Chicken Plate',
  'Grilled chicken served with rice, vegetables, and a fresh side salad.',
  'meal', 4200, NULL, JSON_ARRAY('meat', 'dairy_free'), NULL
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'meat-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'MC-BURGER-01', 'Beef Burger',
  'Beef burger with lettuce, tomato, pickles, and house sauce.',
  'meal', 3800, NULL, JSON_ARRAY('meat', 'dairy_free'), 'Contains gluten.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'meat-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'MC-SHAWARMA-01', 'Chicken Shawarma Pita',
  'Seasoned chicken shawarma with vegetables, pickles, and tahini.',
  'meal', 3600, NULL, JSON_ARRAY('meat', 'dairy_free'), 'Contains gluten and sesame.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'meat-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'MC-WATER-01', 'Mineral Water',
  'Cold 500 ml bottle of mineral water.',
  'drink', 600, 50, JSON_ARRAY('vegan', 'dairy_free'), NULL
FROM vendors v JOIN categories c ON c.slug = 'drinks'
WHERE v.slug = 'meat-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'OS-PEN-01', 'Ballpoint Pen Pack',
  'Four reliable blue and black ballpoint pens.',
  'study', 1200, 50, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'stationery'
WHERE v.slug = 'office-supplies'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'OS-NOTE-01', 'A4 Lined Notebook',
  'A4 lined notebook with 120 pages for lectures and assignments.',
  'study', 1800, 35, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'office-supplies'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'OS-USB-01', '32 GB USB Drive',
  'Compact USB drive for assignments, presentations, and lab files.',
  'technology', 3900, 20, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'technology'
WHERE v.slug = 'office-supplies'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'OS-HIGHLIGHT-01', 'Highlighter Set',
  'Set of four highlighters in clear study-friendly colors.',
  'study', 1600, 24, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'stationery'
WHERE v.slug = 'office-supplies'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'OS-PAPER-01', 'A4 Paper Pack',
  'Pack of 500 white A4 printer sheets.',
  'study', 2800, 18, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'office-supplies'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'DC-TOAST-01', 'Cheese Toast',
  'Toasted sandwich with cheese, tomato, and olives.',
  'meal', 2400, NULL, JSON_ARRAY('vegetarian', 'dairy'), 'Contains gluten and milk.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'dairy-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'DC-PASTA-01', 'Creamy Mushroom Pasta',
  'Pasta with mushrooms in a rich cream sauce.',
  'meal', 3200, NULL, JSON_ARRAY('vegetarian', 'dairy'), 'Contains gluten and milk.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'dairy-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'DC-SALAD-01', 'Greek Salad',
  'Fresh vegetables, feta cheese, olives, and house dressing.',
  'meal', 2800, NULL, JSON_ARRAY('vegetarian', 'dairy'), 'Contains milk.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'dairy-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'MC-SCHNITZEL-01', 'Chicken Schnitzel Baguette',
  'Crispy chicken schnitzel with vegetables and sauce in a fresh baguette.',
  'meal', 3400, NULL, JSON_ARRAY('meat', 'dairy_free'), 'Contains gluten.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'meat-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'DC-YOGURT-01', 'Yogurt and Granola',
  'Creamy yogurt with granola and seasonal fruit.',
  'snack', 1800, NULL, JSON_ARRAY('vegetarian', 'dairy'), 'Contains milk, gluten, and nuts.'
FROM vendors v JOIN categories c ON c.slug = 'snacks'
WHERE v.slug = 'dairy-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'DC-COFFEE-01', 'Cappuccino',
  'Fresh espresso with steamed milk.',
  'drink', 1200, NULL, JSON_ARRAY('vegetarian', 'dairy'), 'Contains milk.'
FROM vendors v JOIN categories c ON c.slug = 'drinks'
WHERE v.slug = 'dairy-cafeteria'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'PC-BW-10', 'Black & White Print Pack',
  'Black and white printing package for up to ten A4 pages.',
  'study', 500, NULL, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'print-center'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'PC-COLOR-05', 'Color Print Pack',
  'Color printing package for up to five A4 pages.',
  'study', 1500, NULL, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'print-center'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'PC-BIND-01', 'Spiral Binding',
  'Spiral binding service for one document.',
  'study', 1200, NULL, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'print-center'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'PC-LAM-A4', 'A4 Lamination',
  'Protective lamination service for one A4 sheet.',
  'study', 800, NULL, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'print-center'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'PC-SCAN-01', 'Document Scanning',
  'High-quality scanning service for up to ten pages.',
  'study', 500, NULL, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'technology'
WHERE v.slug = 'print-center'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO vendor_delivery_zones (
  vendor_id, building_id, fee_agorot, minimum_order_agorot,
  eta_min_minutes, eta_max_minutes, is_active
)
SELECT v.id, b.id,
  CASE WHEN b.campus_code IN ('12', '13') THEN 600 ELSE 900 END,
  0, 15, 35, TRUE
FROM vendors v
CROSS JOIN buildings b
WHERE v.slug = 'meat-cafeteria' AND b.is_active = TRUE
ON DUPLICATE KEY UPDATE
  fee_agorot = VALUES(fee_agorot),
  minimum_order_agorot = VALUES(minimum_order_agorot),
  is_active = TRUE;

INSERT INTO vendor_delivery_zones (
  vendor_id, building_id, fee_agorot, minimum_order_agorot,
  eta_min_minutes, eta_max_minutes, is_active
)
SELECT v.id, b.id,
  CASE WHEN b.campus_code IN ('12', '13') THEN 500 ELSE 800 END,
  0, 12, 30, TRUE
FROM vendors v
CROSS JOIN buildings b
WHERE v.slug = 'office-supplies' AND b.is_active = TRUE
ON DUPLICATE KEY UPDATE
  fee_agorot = VALUES(fee_agorot),
  minimum_order_agorot = VALUES(minimum_order_agorot),
  is_active = TRUE;

INSERT INTO vendor_delivery_zones (
  vendor_id, building_id, fee_agorot, minimum_order_agorot,
  eta_min_minutes, eta_max_minutes, is_active
)
SELECT v.id, b.id,
  CASE WHEN b.campus_code IN ('12', '13') THEN 500 ELSE 800 END,
  0, 12, 30, TRUE
FROM vendors v
CROSS JOIN buildings b
WHERE v.slug = 'dairy-cafeteria' AND b.is_active = TRUE
ON DUPLICATE KEY UPDATE
  fee_agorot = VALUES(fee_agorot),
  minimum_order_agorot = VALUES(minimum_order_agorot),
  is_active = TRUE;

