USE project7;
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;

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
  public_id, email, display_name, phone, customer_type, role, vendor_id, password_hash
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'student@jct.ac.il',
    'Demo Student',
    NULL,
    'student',
    'customer',
    NULL,
    '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'partner@example.com',
    'Meat Cafeteria Manager',
    NULL,
    NULL,
    'vendor_manager',
    (SELECT id FROM vendors WHERE slug = 'meat-cafeteria' LIMIT 1),
    '$2b$12$wlsLhAI/bheSjc76KyiMFeO7Y/I.IEthdSHLAIyoZWFqz9PcN5GkC'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'print.partner@example.com',
    'Print Lab Manager',
    NULL,
    NULL,
    'vendor_manager',
    (SELECT id FROM vendors WHERE slug = 'print-center' LIMIT 1),
    '$2b$12$p0YbsvO/Uq1VliziNMuKLezCIZGExTqr39SV63E9/5c8jhWVtzSaC'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'admin@jct.ac.il',
    'Demo Administrator',
    NULL,
    NULL,
    'admin',
    NULL,
    '$2b$12$W6navKNHBUXOfwQTla9Lw.7Wq3N8BO/yOrlYmyealM7Nmh/ffz2xS'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'dairy.partner@example.com',
    'Dairy Cafeteria Manager',
    NULL,
    NULL,
    'vendor_manager',
    (SELECT id FROM vendors WHERE slug = 'dairy-cafeteria' LIMIT 1),
    '$2b$12$wlsLhAI/bheSjc76KyiMFeO7Y/I.IEthdSHLAIyoZWFqz9PcN5GkC'
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'office.partner@example.com',
    'Office Supplies Manager',
    NULL,
    NULL,
    'vendor_manager',
    (SELECT id FROM vendors WHERE slug = 'office-supplies' LIMIT 1),
    '$2b$12$wlsLhAI/bheSjc76KyiMFeO7Y/I.IEthdSHLAIyoZWFqz9PcN5GkC'
  );

UPDATE users u
JOIN vendors v ON v.slug = 'meat-cafeteria'
SET u.vendor_id = v.id
WHERE u.email = 'partner@example.com' AND u.role = 'vendor_manager';

UPDATE users u
JOIN vendors v ON v.slug = 'print-center'
SET u.vendor_id = v.id
WHERE u.email = 'print.partner@example.com' AND u.role = 'vendor_manager';

UPDATE users u
JOIN vendors v ON v.slug = 'dairy-cafeteria'
SET u.vendor_id = v.id
WHERE u.email = 'dairy.partner@example.com' AND u.role = 'vendor_manager';

UPDATE users u
JOIN vendors v ON v.slug = 'office-supplies'
SET u.vendor_id = v.id
WHERE u.email = 'office.partner@example.com' AND u.role = 'vendor_manager';

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

-- Expanded cafeteria catalogs. Stable vendor-scoped SKUs make this block safe
-- to rerun without duplicating products.
INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT
  UUID(), v.id, c.id, item.sku, item.name, item.description, item.need_type,
  item.price_agorot, item.stock_quantity, item.dietary_tags, item.allergen_text
FROM vendors v
JOIN (
  SELECT 'MC-KEBAB-01' AS sku, 'Grilled Kebab Plate' AS name,
    'Two grilled beef kebabs with rice, roasted vegetables, and tahini.' AS description,
    'meal' AS need_type, 4400 AS price_agorot, NULL AS stock_quantity,
    JSON_ARRAY('meat', 'dairy_free') AS dietary_tags,
    'Contains sesame.' AS allergen_text, 'meals' AS category_slug
  UNION ALL SELECT 'MC-MEATBALL-01', 'Beef Meatballs and Rice',
    'Beef meatballs in tomato sauce served with rice and green beans.',
    'meal', 3900, NULL, JSON_ARRAY('meat', 'dairy_free'), NULL, 'meals'
  UNION ALL SELECT 'MC-TURKEY-01', 'Grilled Turkey Sandwich',
    'Grilled turkey breast with lettuce, tomato, pickles, and mustard in ciabatta.',
    'meal', 3300, NULL, JSON_ARRAY('meat', 'dairy_free'),
    'Contains gluten and mustard.', 'meals'
  UNION ALL SELECT 'MC-STIRFRY-01', 'Chicken Stir-Fry Bowl',
    'Chicken strips, vegetables, and rice in a savory soy and ginger sauce.',
    'meal', 4100, NULL, JSON_ARRAY('meat', 'dairy_free'),
    'Contains soy.', 'meals'
  UNION ALL SELECT 'MC-ROAST-01', 'Roast Beef Baguette',
    'Sliced roast beef with caramelized onion, lettuce, and mustard in a baguette.',
    'meal', 3700, NULL, JSON_ARRAY('meat', 'dairy_free'),
    'Contains gluten and mustard.', 'meals'
  UNION ALL SELECT 'MC-SOUP-01', 'Chicken Vegetable Soup',
    'A warm bowl of chicken broth with vegetables, herbs, and noodles.',
    'meal', 2200, NULL, JSON_ARRAY('meat', 'dairy_free'),
    'Contains gluten and egg.', 'meals'
  UNION ALL SELECT 'MC-FALAFEL-01', 'Falafel Plate',
    'Falafel, hummus, chopped salad, pickles, tahini, and warm pita.',
    'meal', 2900, NULL, JSON_ARRAY('vegan', 'dairy_free'),
    'Contains gluten and sesame.', 'meals'
  UNION ALL SELECT 'MC-HUMMUS-01', 'Hummus with Ground Beef',
    'Warm hummus topped with seasoned ground beef, herbs, and olive oil.',
    'meal', 3400, NULL, JSON_ARRAY('meat', 'dairy_free'),
    'Contains sesame.', 'meals'
  UNION ALL SELECT 'MC-FRIES-01', 'Seasoned French Fries',
    'Crispy fries seasoned with salt and paprika.',
    'snack', 1400, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'snacks'
  UNION ALL SELECT 'MC-RINGS-01', 'Crispy Onion Rings',
    'Golden onion rings served with tomato dipping sauce.',
    'snack', 1600, NULL, JSON_ARRAY('vegan', 'dairy_free'),
    'Contains gluten.', 'snacks'
  UNION ALL SELECT 'MC-SIDE-SALAD-01', 'Fresh Side Salad',
    'Tomato, cucumber, lettuce, red onion, herbs, and lemon dressing.',
    'snack', 1500, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'snacks'
  UNION ALL SELECT 'MC-COLA-01', 'Cola',
    'Cold 330 ml can of cola.',
    'drink', 800, 40, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'drinks'
  UNION ALL SELECT 'MC-ORANGE-01', 'Orange Juice',
    'Chilled 330 ml bottle of orange juice.',
    'drink', 1000, 30, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'drinks'
  UNION ALL SELECT 'MC-ICEDTEA-01', 'Peach Iced Tea',
    'Cold peach-flavored iced tea.',
    'drink', 900, 30, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'drinks'
  UNION ALL SELECT 'MC-BLACKCOFFEE-01', 'Black Coffee',
    'Freshly brewed black coffee served hot.',
    'drink', 700, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'drinks'
) AS item
JOIN categories c ON c.slug = item.category_slug
WHERE v.slug = 'meat-cafeteria'
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  description = VALUES(description),
  need_type = VALUES(need_type),
  price_agorot = VALUES(price_agorot),
  stock_quantity = VALUES(stock_quantity),
  dietary_tags = VALUES(dietary_tags),
  allergen_text = VALUES(allergen_text),
  is_available = TRUE,
  deleted_at = NULL;

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT
  UUID(), v.id, c.id, item.sku, item.name, item.description, item.need_type,
  item.price_agorot, item.stock_quantity, item.dietary_tags, item.allergen_text
FROM vendors v
JOIN (
  SELECT 'DC-PIZZA-01' AS sku, 'Margherita Pizza' AS name,
    'Personal pizza with tomato sauce, mozzarella, and oregano.' AS description,
    'meal' AS need_type, 3000 AS price_agorot, NULL AS stock_quantity,
    JSON_ARRAY('vegetarian', 'dairy') AS dietary_tags,
    'Contains gluten and milk.' AS allergen_text, 'meals' AS category_slug
  UNION ALL SELECT 'DC-ZITI-01', 'Baked Ziti',
    'Baked pasta with tomato sauce, mozzarella, ricotta, and herbs.',
    'meal', 3300, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains gluten and milk.', 'meals'
  UNION ALL SELECT 'DC-SHAKSHUKA-01', 'Shakshuka with Bread',
    'Eggs cooked in spiced tomato and pepper sauce with fresh bread.',
    'meal', 2900, NULL, JSON_ARRAY('vegetarian', 'dairy_free'),
    'Contains egg and gluten.', 'meals'
  UNION ALL SELECT 'DC-TUNA-01', 'Tuna Salad Sandwich',
    'Tuna salad, lettuce, tomato, and cucumber in whole-grain bread.',
    'meal', 2700, NULL, JSON_ARRAY('dairy_free'),
    'Contains fish, egg, and gluten.', 'meals'
  UNION ALL SELECT 'DC-OMELET-01', 'Omelet Bagel',
    'Fresh omelet with cream cheese, tomato, and lettuce in a toasted bagel.',
    'meal', 2600, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains egg, gluten, and milk.', 'meals'
  UNION ALL SELECT 'DC-QUINOA-01', 'Quinoa Vegetable Salad',
    'Quinoa, roasted vegetables, chickpeas, herbs, and lemon dressing.',
    'meal', 2900, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'meals'
  UNION ALL SELECT 'DC-TOMATO-SOUP-01', 'Creamy Tomato Soup',
    'Tomato and basil soup finished with a touch of cream.',
    'meal', 1900, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains milk.', 'meals'
  UNION ALL SELECT 'DC-QUICHE-01', 'Spinach and Feta Quiche',
    'Savory pastry filled with spinach, feta cheese, and herbs.',
    'meal', 2500, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains egg, gluten, and milk.', 'meals'
  UNION ALL SELECT 'DC-CHEESEPASTRY-01', 'Cheese Pastry',
    'Flaky baked pastry filled with a mild cheese blend.',
    'snack', 1200, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains gluten, egg, and milk.', 'snacks'
  UNION ALL SELECT 'DC-CROISSANT-01', 'Chocolate Croissant',
    'Buttery croissant filled with chocolate.',
    'snack', 1300, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains gluten, milk, and may contain nuts.', 'snacks'
  UNION ALL SELECT 'DC-FRUIT-01', 'Seasonal Fruit Cup',
    'A chilled cup of freshly cut seasonal fruit.',
    'snack', 1400, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'snacks'
  UNION ALL SELECT 'DC-ICEDCOFFEE-01', 'Iced Coffee',
    'Cold coffee blended with milk and lightly sweetened.',
    'drink', 1500, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains milk.', 'drinks'
  UNION ALL SELECT 'DC-CHOCOLATE-01', 'Hot Chocolate',
    'Hot cocoa prepared with steamed milk.',
    'drink', 1400, NULL, JSON_ARRAY('vegetarian', 'dairy'),
    'Contains milk.', 'drinks'
  UNION ALL SELECT 'DC-FRESHORANGE-01', 'Fresh Orange Juice',
    'Freshly squeezed orange juice served chilled.',
    'drink', 1600, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'drinks'
  UNION ALL SELECT 'DC-HERBALTEA-01', 'Herbal Tea',
    'Hot caffeine-free herbal infusion with lemon on the side.',
    'drink', 900, NULL, JSON_ARRAY('vegan', 'dairy_free'), NULL, 'drinks'
) AS item
JOIN categories c ON c.slug = item.category_slug
WHERE v.slug = 'dairy-cafeteria'
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  description = VALUES(description),
  need_type = VALUES(need_type),
  price_agorot = VALUES(price_agorot),
  stock_quantity = VALUES(stock_quantity),
  dietary_tags = VALUES(dietary_tags),
  allergen_text = VALUES(allergen_text),
  is_available = TRUE,
  deleted_at = NULL;

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

-- Rich demo activity. These rows use reserved public-ID prefixes and stable
-- reference numbers so rerunning the seed refreshes the demo instead of
-- creating duplicates. All demo customers use the configured classroom
-- customer password represented by the same bcrypt hash as Demo Student.
INSERT IGNORE INTO users (
  public_id, email, display_name, phone, customer_type, role, vendor_id, password_hash
)
VALUES
  ('10000000-0000-4000-8000-000000000011', 'noa.levi@jct.ac.il', 'Noa Levi', '050-555-0111', 'student', 'customer', NULL, '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm'),
  ('10000000-0000-4000-8000-000000000012', 'daniel.cohen@jct.ac.il', 'Daniel Cohen', '050-555-0112', 'teacher', 'customer', NULL, '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm'),
  ('10000000-0000-4000-8000-000000000013', 'yael.mizrahi@jct.ac.il', 'Yael Mizrahi', '050-555-0113', 'student', 'customer', NULL, '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm'),
  ('10000000-0000-4000-8000-000000000014', 'ariel.bendavid@jct.ac.il', 'Ariel Ben David', '050-555-0114', 'teacher', 'customer', NULL, '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm'),
  ('10000000-0000-4000-8000-000000000015', 'maya.azoulay@jct.ac.il', 'Maya Azoulay', '050-555-0115', 'student', 'customer', NULL, '$2b$12$ZMy91JwXmx8jB89U/xlSWu.htkePnBpvgKF5bt.XN7LeD40eMY1nm');

SET @seed_demo_orders = JSON_ARRAY(
  JSON_ARRAY(1,  '20000000-0000-4000-8000-000000000001', 'DEMO-ORD-001', 'student@jct.ac.il',         'meat-cafeteria',  'pickup',   NULL,  NULL,                     'placed',           2,   0,   'MC-BURGER-01',       1, 'MC-COLA-01',         1, '410001'),
  JSON_ARRAY(2,  '20000000-0000-4000-8000-000000000002', 'DEMO-ORD-002', 'student@jct.ac.il',         'dairy-cafeteria', 'delivery', '47',  'Room 204',               'preparing',        5,   800, 'DC-PASTA-01',        1, 'DC-ICEDCOFFEE-01',   1, '410002'),
  JSON_ARRAY(3,  '20000000-0000-4000-8000-000000000003', 'DEMO-ORD-003', 'student@jct.ac.il',         'office-supplies', 'delivery', '36',  'Nursing office, floor 2', 'completed',        72,   800, 'OS-NOTE-01',         2, 'OS-PEN-01',          1, '410003'),
  JSON_ARRAY(4,  '20000000-0000-4000-8000-000000000004', 'DEMO-ORD-004', 'noa.levi@jct.ac.il',        'meat-cafeteria',  'delivery', '45',  'Dorm B, room 118',        'out_for_delivery', 8,   900, 'MC-SHAWARMA-01',     1, 'MC-FRIES-01',        1, '410004'),
  JSON_ARRAY(5,  '20000000-0000-4000-8000-000000000005', 'DEMO-ORD-005', 'daniel.cohen@jct.ac.il',    'dairy-cafeteria', 'pickup',   NULL,  NULL,                     'ready',            10,   0,   'DC-TOAST-01',        2, 'DC-COFFEE-01',       2, '410005'),
  JSON_ARRAY(6,  '20000000-0000-4000-8000-000000000006', 'DEMO-ORD-006', 'yael.mizrahi@jct.ac.il',    'meat-cafeteria',  'pickup',   NULL,  NULL,                     'completed',        96,   0,   'MC-GRILL-01',        1, 'MC-SIDE-SALAD-01',   1, '410006'),
  JSON_ARRAY(7,  '20000000-0000-4000-8000-000000000007', 'DEMO-ORD-007', 'ariel.bendavid@jct.ac.il',  'office-supplies', 'delivery', '24',  'Faculty office 310',      'needs_attention',  13,   800, 'OS-USB-01',          1, 'OS-PAPER-01',        1, '410007'),
  JSON_ARRAY(8,  '20000000-0000-4000-8000-000000000008', 'DEMO-ORD-008', 'maya.azoulay@jct.ac.il',     'dairy-cafeteria', 'pickup',   NULL,  NULL,                     'placed',           15,   0,   'DC-PIZZA-01',        1, 'DC-CHOCOLATE-01',    1, '410008'),
  JSON_ARRAY(9,  '20000000-0000-4000-8000-000000000009', 'DEMO-ORD-009', 'student@jct.ac.il',         'meat-cafeteria',  'delivery', '47',  'Room 315',               'completed',       120,   900, 'MC-KEBAB-01',        1, 'MC-WATER-01',        2, '410009'),
  JSON_ARRAY(10, '20000000-0000-4000-8000-000000000010', 'DEMO-ORD-010', 'noa.levi@jct.ac.il',        'meat-cafeteria',  'pickup',   NULL,  NULL,                     'preparing',        18,   0,   'MC-SCHNITZEL-01',    1, 'MC-ORANGE-01',       1, '410010'),
  JSON_ARRAY(11, '20000000-0000-4000-8000-000000000011', 'DEMO-ORD-011', 'daniel.cohen@jct.ac.il',    'meat-cafeteria',  'pickup',   NULL,  NULL,                     'ready',            20,   0,   'MC-TURKEY-01',       2, 'MC-BLACKCOFFEE-01',  2, '410011'),
  JSON_ARRAY(12, '20000000-0000-4000-8000-000000000012', 'DEMO-ORD-012', 'yael.mizrahi@jct.ac.il',    'meat-cafeteria',  'delivery', '43',  'Laundry lobby',           'placed',           22,   900, 'MC-FALAFEL-01',      1, 'MC-ICEDTEA-01',      1, '410012'),
  JSON_ARRAY(13, '20000000-0000-4000-8000-000000000013', 'DEMO-ORD-013', 'ariel.bendavid@jct.ac.il',  'meat-cafeteria',  'pickup',   NULL,  NULL,                     'completed',       144,   0,   'MC-HUMMUS-01',       1, 'MC-RINGS-01',        1, '410013'),
  JSON_ARRAY(14, '20000000-0000-4000-8000-000000000014', 'DEMO-ORD-014', 'maya.azoulay@jct.ac.il',     'meat-cafeteria',  'pickup',   NULL,  NULL,                     'cancelled',        30,   0,   'MC-MEATBALL-01',     1, 'MC-COLA-01',         1, '410014'),
  JSON_ARRAY(15, '20000000-0000-4000-8000-000000000015', 'DEMO-ORD-015', 'noa.levi@jct.ac.il',        'meat-cafeteria',  'delivery', '41A', 'Student club entrance',  'out_for_delivery', 25,   900, 'MC-ROAST-01',        1, 'MC-FRIES-01',        2, '410015'),
  JSON_ARRAY(16, '20000000-0000-4000-8000-000000000016', 'DEMO-ORD-016', 'daniel.cohen@jct.ac.il',    'dairy-cafeteria', 'pickup',   NULL,  NULL,                     'completed',       168,   0,   'DC-SHAKSHUKA-01',    1, 'DC-HERBALTEA-01',    1, '410016'),
  JSON_ARRAY(17, '20000000-0000-4000-8000-000000000017', 'DEMO-ORD-017', 'student@jct.ac.il',         'dairy-cafeteria', 'pickup',   NULL,  NULL,                     'completed',       192,   0,   'DC-SALAD-01',        1, 'DC-FRUIT-01',        1, '410017'),
  JSON_ARRAY(18, '20000000-0000-4000-8000-000000000018', 'DEMO-ORD-018', 'student@jct.ac.il',         'office-supplies', 'pickup',   NULL,  NULL,                     'placed',           28,   0,   'OS-HIGHLIGHT-01',    1, 'OS-PEN-01',          1, '410018'),
  JSON_ARRAY(19, '20000000-0000-4000-8000-000000000019', 'DEMO-ORD-019', 'maya.azoulay@jct.ac.il',     'meat-cafeteria',  'pickup',   NULL,  NULL,                     'preparing',        32,   0,   'MC-STIRFRY-01',      1, 'MC-WATER-01',        1, '410019'),
  JSON_ARRAY(20, '20000000-0000-4000-8000-000000000020', 'DEMO-ORD-020', 'student@jct.ac.il',         'meat-cafeteria',  'pickup',   NULL,  NULL,                     'ready',            36,   0,   'MC-SOUP-01',         1, 'MC-SIDE-SALAD-01',   1, '410020')
);

INSERT INTO orders (
  public_id, order_number, user_id, vendor_id, fulfillment_type,
  delivery_building_id, delivery_location, subtotal_agorot,
  delivery_fee_agorot, total_agorot, currency, status, pickup_code,
  reservation_expires_at, completed_at, cancelled_at, created_at, updated_at
)
SELECT
  spec.public_id, spec.order_number, customer.id, vendor.id,
  spec.fulfillment_type, building.id, spec.delivery_location,
  product_1.price_agorot * spec.quantity_1
    + COALESCE(product_2.price_agorot * spec.quantity_2, 0),
  spec.delivery_fee_agorot,
  product_1.price_agorot * spec.quantity_1
    + COALESCE(product_2.price_agorot * spec.quantity_2, 0)
    + spec.delivery_fee_agorot,
  'ILS', spec.final_status, spec.pickup_code, NULL,
  CASE WHEN spec.final_status = 'completed'
    THEN DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 140 MINUTE)
    ELSE NULL END,
  CASE WHEN spec.final_status = 'cancelled'
    THEN DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 30 MINUTE)
    ELSE NULL END,
  DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR),
  CASE WHEN spec.final_status IN ('placed', 'cancelled')
    THEN DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 30 MINUTE)
    ELSE DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 140 MINUTE) END
FROM JSON_TABLE(@seed_demo_orders, '$[*]' COLUMNS(
  seed_no INT PATH '$[0]',
  public_id CHAR(36) PATH '$[1]',
  order_number VARCHAR(24) PATH '$[2]',
  customer_email VARCHAR(254) PATH '$[3]',
  vendor_slug VARCHAR(160) PATH '$[4]',
  fulfillment_type VARCHAR(20) PATH '$[5]',
  delivery_building_code VARCHAR(20) PATH '$[6]' NULL ON EMPTY,
  delivery_location VARCHAR(180) PATH '$[7]' NULL ON EMPTY,
  final_status VARCHAR(40) PATH '$[8]',
  hours_ago INT PATH '$[9]',
  delivery_fee_agorot INT PATH '$[10]',
  sku_1 VARCHAR(80) PATH '$[11]',
  quantity_1 INT PATH '$[12]',
  sku_2 VARCHAR(80) PATH '$[13]' NULL ON EMPTY,
  quantity_2 INT PATH '$[14]' NULL ON EMPTY,
  pickup_code VARCHAR(12) PATH '$[15]'
)) spec
JOIN users customer ON customer.email = spec.customer_email COLLATE utf8mb4_general_ci
JOIN vendors vendor ON vendor.slug = spec.vendor_slug COLLATE utf8mb4_general_ci
JOIN products product_1 ON product_1.vendor_id = vendor.id
  AND product_1.sku = spec.sku_1 COLLATE utf8mb4_general_ci
LEFT JOIN products product_2 ON product_2.vendor_id = vendor.id
  AND product_2.sku = spec.sku_2 COLLATE utf8mb4_general_ci
LEFT JOIN buildings building
  ON building.campus_code = spec.delivery_building_code COLLATE utf8mb4_general_ci
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id), vendor_id = VALUES(vendor_id),
  fulfillment_type = VALUES(fulfillment_type),
  delivery_building_id = VALUES(delivery_building_id),
  delivery_location = VALUES(delivery_location),
  subtotal_agorot = VALUES(subtotal_agorot),
  delivery_fee_agorot = VALUES(delivery_fee_agorot),
  total_agorot = VALUES(total_agorot), status = VALUES(status),
  pickup_code = VALUES(pickup_code), completed_at = VALUES(completed_at),
  cancelled_at = VALUES(cancelled_at), created_at = VALUES(created_at),
  updated_at = VALUES(updated_at);

DELETE item
FROM order_items item
JOIN orders seeded_order ON seeded_order.id = item.order_id
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%';

INSERT INTO order_items (
  order_id, product_id, product_name, sku, unit_price_agorot,
  quantity, line_total_agorot, created_at
)
SELECT seeded_order.id, product.id, product.name, product.sku,
  product.price_agorot, spec.quantity_1,
  product.price_agorot * spec.quantity_1, seeded_order.created_at
FROM JSON_TABLE(@seed_demo_orders, '$[*]' COLUMNS(
  seed_no INT PATH '$[0]',
  public_id CHAR(36) PATH '$[1]',
  order_number VARCHAR(24) PATH '$[2]',
  customer_email VARCHAR(254) PATH '$[3]',
  vendor_slug VARCHAR(160) PATH '$[4]',
  fulfillment_type VARCHAR(20) PATH '$[5]',
  delivery_building_code VARCHAR(20) PATH '$[6]' NULL ON EMPTY,
  delivery_location VARCHAR(180) PATH '$[7]' NULL ON EMPTY,
  final_status VARCHAR(40) PATH '$[8]',
  hours_ago INT PATH '$[9]',
  delivery_fee_agorot INT PATH '$[10]',
  sku_1 VARCHAR(80) PATH '$[11]',
  quantity_1 INT PATH '$[12]',
  sku_2 VARCHAR(80) PATH '$[13]' NULL ON EMPTY,
  quantity_2 INT PATH '$[14]' NULL ON EMPTY,
  pickup_code VARCHAR(12) PATH '$[15]'
)) spec
JOIN orders seeded_order
  ON seeded_order.public_id = spec.public_id COLLATE utf8mb4_general_ci
JOIN products product ON product.sku = spec.sku_1 COLLATE utf8mb4_general_ci
UNION ALL
SELECT seeded_order.id, product.id, product.name, product.sku,
  product.price_agorot, spec.quantity_2,
  product.price_agorot * spec.quantity_2, seeded_order.created_at
FROM JSON_TABLE(@seed_demo_orders, '$[*]' COLUMNS(
  seed_no INT PATH '$[0]',
  public_id CHAR(36) PATH '$[1]',
  order_number VARCHAR(24) PATH '$[2]',
  customer_email VARCHAR(254) PATH '$[3]',
  vendor_slug VARCHAR(160) PATH '$[4]',
  fulfillment_type VARCHAR(20) PATH '$[5]',
  delivery_building_code VARCHAR(20) PATH '$[6]' NULL ON EMPTY,
  delivery_location VARCHAR(180) PATH '$[7]' NULL ON EMPTY,
  final_status VARCHAR(40) PATH '$[8]',
  hours_ago INT PATH '$[9]',
  delivery_fee_agorot INT PATH '$[10]',
  sku_1 VARCHAR(80) PATH '$[11]',
  quantity_1 INT PATH '$[12]',
  sku_2 VARCHAR(80) PATH '$[13]' NULL ON EMPTY,
  quantity_2 INT PATH '$[14]' NULL ON EMPTY,
  pickup_code VARCHAR(12) PATH '$[15]'
)) spec
JOIN orders seeded_order
  ON seeded_order.public_id = spec.public_id COLLATE utf8mb4_general_ci
JOIN products product ON product.sku = spec.sku_2 COLLATE utf8mb4_general_ci
WHERE spec.sku_2 IS NOT NULL;

DELETE history
FROM order_status_history history
JOIN orders seeded_order ON seeded_order.id = history.order_id
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%';

INSERT INTO order_status_history (
  order_id, actor_user_id, from_status, to_status, note, created_at
)
SELECT seeded_order.id, seeded_order.user_id, NULL, 'placed',
  'Demo order submitted', seeded_order.created_at
FROM orders seeded_order
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
UNION ALL
SELECT seeded_order.id, manager.id, 'placed', 'preparing',
  'Vendor started preparing the order',
  DATE_ADD(seeded_order.created_at, INTERVAL 30 MINUTE)
FROM orders seeded_order
JOIN users manager ON manager.vendor_id = seeded_order.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
  AND seeded_order.status IN ('preparing', 'ready', 'out_for_delivery', 'completed')
UNION ALL
SELECT seeded_order.id, manager.id, 'preparing',
  CASE WHEN seeded_order.fulfillment_type = 'delivery'
    THEN 'out_for_delivery' ELSE 'ready' END,
  CASE WHEN seeded_order.fulfillment_type = 'delivery'
    THEN 'Courier left the vendor' ELSE 'Order is ready for pickup' END,
  DATE_ADD(seeded_order.created_at, INTERVAL 75 MINUTE)
FROM orders seeded_order
JOIN users manager ON manager.vendor_id = seeded_order.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
  AND seeded_order.status IN ('ready', 'out_for_delivery', 'completed')
UNION ALL
SELECT seeded_order.id, seeded_order.user_id,
  CASE WHEN seeded_order.fulfillment_type = 'delivery'
    THEN 'out_for_delivery' ELSE 'ready' END,
  'completed', 'Customer confirmed receipt',
  DATE_ADD(seeded_order.created_at, INTERVAL 140 MINUTE)
FROM orders seeded_order
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
  AND seeded_order.status = 'completed'
UNION ALL
SELECT seeded_order.id, manager.id, 'placed', 'needs_attention',
  'Vendor needs clarification from the customer',
  DATE_ADD(seeded_order.created_at, INTERVAL 25 MINUTE)
FROM orders seeded_order
JOIN users manager ON manager.vendor_id = seeded_order.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
  AND seeded_order.status = 'needs_attention'
UNION ALL
SELECT seeded_order.id, seeded_order.user_id, 'placed', 'cancelled',
  'Customer cancelled the demo order',
  DATE_ADD(seeded_order.created_at, INTERVAL 30 MINUTE)
FROM orders seeded_order
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
  AND seeded_order.status = 'cancelled';

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

SET @seed_demo_print_jobs = JSON_ARRAY(
  JSON_ARRAY(1,  '30000000-0000-4000-8000-000000000001', 'DEMO-PRN-001', 'student@jct.ac.il',        'A4', 'black_white', 'double', 1, FALSE, FALSE, FALSE, 24, 'Algorithms lecture notes',         'submitted',       1,   '510001'),
  JSON_ARRAY(2,  '30000000-0000-4000-8000-000000000002', 'DEMO-PRN-002', 'student@jct.ac.il',        'A4', 'color',       'single', 2, TRUE,  FALSE, TRUE,  8,  'Two bound project copies',         'printing',        4,   '510002'),
  JSON_ARRAY(3,  '30000000-0000-4000-8000-000000000003', 'DEMO-PRN-003', 'student@jct.ac.il',        'A4', 'black_white', 'double', 1, FALSE, FALSE, FALSE, 60, 'Exam preparation booklet',         'ready',           8,   '510003'),
  JSON_ARRAY(4,  '30000000-0000-4000-8000-000000000004', 'DEMO-PRN-004', 'noa.levi@jct.ac.il',       'A4', 'color',       'single', 1, FALSE, TRUE,  FALSE, 4,  'Laminate all presentation sheets', 'completed',       72,  '510004'),
  JSON_ARRAY(5,  '30000000-0000-4000-8000-000000000005', 'DEMO-PRN-005', 'daniel.cohen@jct.ac.il',   'A3', 'color',       'single', 3, FALSE, FALSE, FALSE, 2,  'Posters for the laboratory',       'needs_attention', 12,  '510005'),
  JSON_ARRAY(6,  '30000000-0000-4000-8000-000000000006', 'DEMO-PRN-006', 'yael.mizrahi@jct.ac.il',   'A4', 'black_white', 'single', 2, TRUE,  FALSE, TRUE,  35, 'Course reader',                    'printing',        18,  '510006'),
  JSON_ARRAY(7,  '30000000-0000-4000-8000-000000000007', 'DEMO-PRN-007', 'ariel.bendavid@jct.ac.il', 'A4', 'color',       'double', 1, FALSE, FALSE, TRUE,  16, 'Faculty workshop handout',         'ready',           26,  '510007'),
  JSON_ARRAY(8,  '30000000-0000-4000-8000-000000000008', 'DEMO-PRN-008', 'maya.azoulay@jct.ac.il',    'A4', 'black_white', 'double', 4, TRUE,  FALSE, FALSE, 10, 'Study group copies',               'completed',       96,  '510008'),
  JSON_ARRAY(9,  '30000000-0000-4000-8000-000000000009', 'DEMO-PRN-009', 'student@jct.ac.il',        'A4', 'color',       'single', 1, FALSE, TRUE,  FALSE, 6,  'Design portfolio pages',            'completed',       120, '510009'),
  JSON_ARRAY(10, '30000000-0000-4000-8000-000000000010', 'DEMO-PRN-010', 'student@jct.ac.il',        'A4', 'black_white', 'double', 2, FALSE, FALSE, TRUE,  80, 'Database course summary',          'completed',       144, '510010'),
  JSON_ARRAY(11, '30000000-0000-4000-8000-000000000011', 'DEMO-PRN-011', 'student@jct.ac.il',        'A4', 'color',       'double', 1, TRUE,  FALSE, FALSE, 18, 'Full-stack project documentation',  'ready',           30,  '510011'),
  JSON_ARRAY(12, '30000000-0000-4000-8000-000000000012', 'DEMO-PRN-012', 'student@jct.ac.il',        'A4', 'black_white', 'single', 1, FALSE, FALSE, FALSE, 12, 'Discrete mathematics exercise',     'rejected',        40,  '510012')
);

INSERT INTO print_jobs (
  public_id, job_number, user_id, vendor_id, paper_size, color_mode,
  sides, copies, stapled, laminated, spiral_bound, customer_note,
  quote_agorot, currency, quote_expires_at, status, pickup_code,
  completed_at, cancelled_at, retention_delete_at, created_at, updated_at
)
SELECT spec.public_id, spec.job_number, customer.id, vendor.id,
  spec.paper_size, spec.color_mode, spec.sides, spec.copies,
  spec.stapled, spec.laminated, spec.spiral_bound, spec.customer_note,
  spec.page_count * spec.copies
    * CASE WHEN spec.color_mode = 'color' THEN 50 ELSE 10 END
    + CASE WHEN spec.laminated
      THEN (CASE WHEN spec.sides = 'double' THEN CEIL(spec.page_count / 2) ELSE spec.page_count END)
        * spec.copies * 800 ELSE 0 END
    + CASE WHEN spec.spiral_bound THEN spec.copies * 1200 ELSE 0 END,
  'ILS', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), spec.final_status,
  spec.pickup_code,
  CASE WHEN spec.final_status = 'completed'
    THEN DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 150 MINUTE)
    ELSE NULL END,
  NULL, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY),
  DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR),
  DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 150 MINUTE)
FROM JSON_TABLE(@seed_demo_print_jobs, '$[*]' COLUMNS(
  seed_no INT PATH '$[0]',
  public_id CHAR(36) PATH '$[1]',
  job_number VARCHAR(24) PATH '$[2]',
  customer_email VARCHAR(254) PATH '$[3]',
  paper_size VARCHAR(10) PATH '$[4]',
  color_mode VARCHAR(20) PATH '$[5]',
  sides VARCHAR(10) PATH '$[6]',
  copies INT PATH '$[7]',
  stapled BOOLEAN PATH '$[8]',
  laminated BOOLEAN PATH '$[9]',
  spiral_bound BOOLEAN PATH '$[10]',
  page_count INT PATH '$[11]',
  customer_note VARCHAR(500) PATH '$[12]' NULL ON EMPTY,
  final_status VARCHAR(40) PATH '$[13]',
  hours_ago INT PATH '$[14]',
  pickup_code VARCHAR(12) PATH '$[15]'
)) spec
JOIN users customer ON customer.email = spec.customer_email COLLATE utf8mb4_general_ci
JOIN vendors vendor ON vendor.slug = 'print-center'
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id), vendor_id = VALUES(vendor_id),
  paper_size = VALUES(paper_size), color_mode = VALUES(color_mode),
  sides = VALUES(sides), copies = VALUES(copies), stapled = VALUES(stapled),
  laminated = VALUES(laminated), spiral_bound = VALUES(spiral_bound),
  customer_note = VALUES(customer_note), quote_agorot = VALUES(quote_agorot),
  quote_expires_at = VALUES(quote_expires_at), status = VALUES(status),
  pickup_code = VALUES(pickup_code), completed_at = VALUES(completed_at),
  retention_delete_at = VALUES(retention_delete_at),
  created_at = VALUES(created_at), updated_at = VALUES(updated_at);

SET @seed_demo_pdf = CONVERT('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF' USING binary);

DELETE file
FROM print_files file
JOIN print_jobs seeded_job ON seeded_job.id = file.print_job_id
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%';

INSERT INTO print_files (
  public_id, print_job_id, original_name, mime_type, size_bytes,
  file_data, sha256, created_at, deleted_at
)
SELECT
  CONCAT('31000000-0000-4000-8000-', LPAD(spec.seed_no, 12, '0')),
  seeded_job.id,
  CONCAT('demo-document-', LPAD(spec.seed_no, 2, '0'), '-', spec.page_count, '-pages.pdf'),
  'application/pdf', OCTET_LENGTH(@seed_demo_pdf), @seed_demo_pdf,
  SHA2(@seed_demo_pdf, 256), seeded_job.created_at, NULL
FROM JSON_TABLE(@seed_demo_print_jobs, '$[*]' COLUMNS(
  seed_no INT PATH '$[0]',
  public_id CHAR(36) PATH '$[1]',
  job_number VARCHAR(24) PATH '$[2]',
  customer_email VARCHAR(254) PATH '$[3]',
  paper_size VARCHAR(10) PATH '$[4]',
  color_mode VARCHAR(20) PATH '$[5]',
  sides VARCHAR(10) PATH '$[6]',
  copies INT PATH '$[7]',
  stapled BOOLEAN PATH '$[8]',
  laminated BOOLEAN PATH '$[9]',
  spiral_bound BOOLEAN PATH '$[10]',
  page_count INT PATH '$[11]',
  customer_note VARCHAR(500) PATH '$[12]' NULL ON EMPTY,
  final_status VARCHAR(40) PATH '$[13]',
  hours_ago INT PATH '$[14]',
  pickup_code VARCHAR(12) PATH '$[15]'
)) spec
JOIN print_jobs seeded_job
  ON seeded_job.public_id = spec.public_id COLLATE utf8mb4_general_ci;

DELETE history
FROM print_job_history history
JOIN print_jobs seeded_job ON seeded_job.id = history.print_job_id
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%';

INSERT INTO print_job_history (
  print_job_id, actor_user_id, from_status, to_status, note, created_at
)
SELECT seeded_job.id, seeded_job.user_id, NULL, 'submitted',
  'Demo PDF submitted with an automatic fixed price', seeded_job.created_at
FROM print_jobs seeded_job
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
UNION ALL
SELECT seeded_job.id, manager.id, 'submitted', 'printing',
  'Print center started preparing the document',
  DATE_ADD(seeded_job.created_at, INTERVAL 45 MINUTE)
FROM print_jobs seeded_job
JOIN users manager ON manager.vendor_id = seeded_job.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
  AND seeded_job.status IN ('printing', 'ready', 'completed')
UNION ALL
SELECT seeded_job.id, manager.id, 'printing', 'ready',
  'Printing completed and ready for collection',
  DATE_ADD(seeded_job.created_at, INTERVAL 105 MINUTE)
FROM print_jobs seeded_job
JOIN users manager ON manager.vendor_id = seeded_job.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
  AND seeded_job.status IN ('ready', 'completed')
UNION ALL
SELECT seeded_job.id, manager.id, 'ready', 'completed',
  'Document collected by the customer',
  DATE_ADD(seeded_job.created_at, INTERVAL 150 MINUTE)
FROM print_jobs seeded_job
JOIN users manager ON manager.vendor_id = seeded_job.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
  AND seeded_job.status = 'completed'
UNION ALL
SELECT seeded_job.id, manager.id, 'submitted', 'needs_attention',
  'Please confirm the requested paper layout',
  DATE_ADD(seeded_job.created_at, INTERVAL 35 MINUTE)
FROM print_jobs seeded_job
JOIN users manager ON manager.vendor_id = seeded_job.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
  AND seeded_job.status = 'needs_attention'
UNION ALL
SELECT seeded_job.id, manager.id, 'submitted', 'rejected',
  'The demo document requires a readable PDF',
  DATE_ADD(seeded_job.created_at, INTERVAL 30 MINUTE)
FROM print_jobs seeded_job
JOIN users manager ON manager.vendor_id = seeded_job.vendor_id
  AND manager.role = 'vendor_manager'
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
  AND seeded_job.status = 'rejected';

SET @seed_demo_tickets = JSON_ARRAY(
  JSON_ARRAY(1,  '40000000-0000-4000-8000-000000000001', 'DEMO-MNT-001', 'student@jct.ac.il',        '47',  'Room 204',               'electrical',       'Power outlet is sparking',          'The outlet beside the lecturer desk sparked when a charger was connected.', 'urgent', 'urgent', 'open',             2),
  JSON_ARRAY(2,  '40000000-0000-4000-8000-000000000002', 'DEMO-MNT-002', 'student@jct.ac.il',        '24',  'Third-floor study area',  'it_equipment',     'Wi-Fi disconnects repeatedly',      'The campus network disconnects every few minutes in the east study area.',   'normal', 'normal', 'in_progress',      6),
  JSON_ARRAY(3,  '40000000-0000-4000-8000-000000000003', 'DEMO-MNT-003', 'student@jct.ac.il',        '12',  'Cafeteria handwash area', 'plumbing',         'Sink is leaking',                   'Water is leaking below the left sink and making the floor slippery.',        'urgent', 'urgent', 'acknowledged',     9),
  JSON_ARRAY(4,  '40000000-0000-4000-8000-000000000004', 'DEMO-MNT-004', 'student@jct.ac.il',        '36',  'Second-floor restroom',   'missing_supplies', 'Paper towels are empty',            'Both paper towel dispensers were empty during the morning.',                 'low',    'low',    'resolved',         28),
  JSON_ARRAY(5,  '40000000-0000-4000-8000-000000000005', 'DEMO-MNT-005', 'student@jct.ac.il',        '26',  'Laboratory 312',          'furniture',        'Broken laboratory chair',           'The backrest is loose and the chair should not be used until repaired.',     'normal', 'normal', 'waiting_for_user', 15),
  JSON_ARRAY(6,  '40000000-0000-4000-8000-000000000006', 'DEMO-MNT-006', 'student@jct.ac.il',        '22',  'Ground-floor corridor',   'cleaning',         'Drink spilled near entrance',       'A sticky drink spill is making the entrance corridor slippery.',            'urgent', 'urgent', 'closed',           48),
  JSON_ARRAY(7,  '40000000-0000-4000-8000-000000000007', 'DEMO-MNT-007', 'student@jct.ac.il',        '13',  'West stairwell',          'electrical',       'Stairwell light is off',            'Two lights in the west stairwell are not working after sunset.',            'normal', 'normal', 'open',             19),
  JSON_ARRAY(8,  '40000000-0000-4000-8000-000000000008', 'DEMO-MNT-008', 'noa.levi@jct.ac.il',       '45',  'Dorm B, third floor',     'plumbing',         'Low water pressure in shower',      'The third-floor showers have had very low pressure since yesterday.',       'normal', 'normal', 'in_progress',      22),
  JSON_ARRAY(9,  '40000000-0000-4000-8000-000000000009', 'DEMO-MNT-009', 'daniel.cohen@jct.ac.il',   '36',  'Classroom 105',           'it_equipment',     'Projector does not detect HDMI',    'The projector powers on but does not detect either classroom HDMI cable.',  'normal', 'normal', 'resolved',         54),
  JSON_ARRAY(10, '40000000-0000-4000-8000-000000000010', 'DEMO-MNT-010', 'yael.mizrahi@jct.ac.il',   '41A', 'Student club exit',       'safety',           'Emergency exit sign is loose',      'The illuminated exit sign is hanging from one side above the rear door.',   'urgent', 'urgent', 'open',             4),
  JSON_ARRAY(11, '40000000-0000-4000-8000-000000000011', 'DEMO-MNT-011', 'ariel.bendavid@jct.ac.il', '24',  'Faculty office 310',      'furniture',        'Additional desk requested',         'A temporary desk was requested for a visiting lecturer.',                   'low',    'low',    'rejected',         70),
  JSON_ARRAY(12, '40000000-0000-4000-8000-000000000012', 'DEMO-MNT-012', 'maya.azoulay@jct.ac.il',    '43',  'Laundry room',            'cleaning',         'Lint bins need emptying',           'Both lint collection bins are full and blocking access to the dryers.',     'normal', 'normal', 'acknowledged',     12),
  JSON_ARRAY(13, '40000000-0000-4000-8000-000000000013', 'DEMO-MNT-013', 'student@jct.ac.il',        '47',  'Room 315',                'other',            'Air conditioner makes loud noise', 'The air conditioner vibrates loudly whenever cooling mode starts.',         'normal', 'normal', 'open',             7),
  JSON_ARRAY(14, '40000000-0000-4000-8000-000000000014', 'DEMO-MNT-014', 'student@jct.ac.il',        '12',  'Dairy cafeteria seating', 'missing_supplies', 'Reusable cutlery station is empty', 'The reusable cutlery station has been empty since the lunch break.',        'low',    'low',    'resolved',         36)
);

INSERT INTO maintenance_tickets (
  public_id, ticket_number, reporter_user_id, assigned_admin_id,
  building_id, location_text, category, title, description,
  requested_priority, priority, status, resolved_at, closed_at,
  created_at, updated_at
)
SELECT spec.public_id, spec.ticket_number, customer.id,
  CASE WHEN spec.final_status = 'open' THEN NULL ELSE administrator.id END,
  building.id, spec.location_text, spec.category, spec.title, spec.description,
  spec.requested_priority, spec.priority, spec.final_status,
  CASE WHEN spec.final_status IN ('resolved', 'closed')
    THEN DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 180 MINUTE)
    ELSE NULL END,
  CASE WHEN spec.final_status = 'closed'
    THEN DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 240 MINUTE)
    ELSE NULL END,
  DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR),
  DATE_ADD(DATE_SUB(CURRENT_TIMESTAMP, INTERVAL spec.hours_ago HOUR), INTERVAL 180 MINUTE)
FROM JSON_TABLE(@seed_demo_tickets, '$[*]' COLUMNS(
  seed_no INT PATH '$[0]',
  public_id CHAR(36) PATH '$[1]',
  ticket_number VARCHAR(24) PATH '$[2]',
  customer_email VARCHAR(254) PATH '$[3]',
  building_code VARCHAR(20) PATH '$[4]',
  location_text VARCHAR(180) PATH '$[5]',
  category VARCHAR(40) PATH '$[6]',
  title VARCHAR(140) PATH '$[7]',
  description VARCHAR(1500) PATH '$[8]',
  requested_priority VARCHAR(20) PATH '$[9]',
  priority VARCHAR(20) PATH '$[10]',
  final_status VARCHAR(40) PATH '$[11]',
  hours_ago INT PATH '$[12]'
)) spec
JOIN users customer ON customer.email = spec.customer_email COLLATE utf8mb4_general_ci
JOIN users administrator ON administrator.email = 'admin@jct.ac.il'
JOIN buildings building ON building.campus_code = spec.building_code COLLATE utf8mb4_general_ci
ON DUPLICATE KEY UPDATE
  reporter_user_id = VALUES(reporter_user_id),
  assigned_admin_id = VALUES(assigned_admin_id), building_id = VALUES(building_id),
  location_text = VALUES(location_text), category = VALUES(category),
  title = VALUES(title), description = VALUES(description),
  requested_priority = VALUES(requested_priority), priority = VALUES(priority),
  status = VALUES(status), resolved_at = VALUES(resolved_at),
  closed_at = VALUES(closed_at), created_at = VALUES(created_at),
  updated_at = VALUES(updated_at);

DELETE history
FROM maintenance_history history
JOIN maintenance_tickets seeded_ticket
  ON seeded_ticket.id = history.maintenance_ticket_id
WHERE seeded_ticket.public_id LIKE '40000000-0000-4000-8000-%';

INSERT INTO maintenance_history (
  maintenance_ticket_id, actor_user_id, event_type,
  from_value, to_value, note, created_at
)
SELECT ticket.id, ticket.reporter_user_id, 'status', NULL, 'open',
  'Demo maintenance report submitted', ticket.created_at
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
UNION ALL
SELECT ticket.id, ticket.assigned_admin_id, 'status', 'open', 'acknowledged',
  'Campus operations acknowledged the report',
  DATE_ADD(ticket.created_at, INTERVAL 35 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status IN ('acknowledged', 'in_progress', 'waiting_for_user', 'resolved', 'closed')
UNION ALL
SELECT ticket.id, ticket.assigned_admin_id, 'status', 'acknowledged', 'in_progress',
  'A campus team member started working on the issue',
  DATE_ADD(ticket.created_at, INTERVAL 75 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status IN ('in_progress', 'waiting_for_user', 'resolved', 'closed')
UNION ALL
SELECT ticket.id, ticket.assigned_admin_id, 'status', 'in_progress', 'waiting_for_user',
  'More location information was requested',
  DATE_ADD(ticket.created_at, INTERVAL 110 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status = 'waiting_for_user'
UNION ALL
SELECT ticket.id, ticket.assigned_admin_id, 'status', 'in_progress', 'resolved',
  'The reported issue was resolved',
  DATE_ADD(ticket.created_at, INTERVAL 180 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status IN ('resolved', 'closed')
UNION ALL
SELECT ticket.id, ticket.assigned_admin_id, 'status', 'resolved', 'closed',
  'Ticket closed after resolution',
  DATE_ADD(ticket.created_at, INTERVAL 240 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status = 'closed'
UNION ALL
SELECT ticket.id, ticket.assigned_admin_id, 'status', 'open', 'rejected',
  'The request is outside the maintenance workflow',
  DATE_ADD(ticket.created_at, INTERVAL 45 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status = 'rejected';

DELETE comment
FROM maintenance_comments comment
JOIN maintenance_tickets seeded_ticket
  ON seeded_ticket.id = comment.maintenance_ticket_id
WHERE seeded_ticket.public_id LIKE '40000000-0000-4000-8000-%';

INSERT INTO maintenance_comments (
  public_id, maintenance_ticket_id, author_user_id, body, is_internal, created_at
)
SELECT UUID(), ticket.id, ticket.assigned_admin_id,
  CASE ticket.status
    WHEN 'acknowledged' THEN 'Thank you. The report was received and added to the campus queue.'
    WHEN 'in_progress' THEN 'A team member is currently checking this issue.'
    WHEN 'waiting_for_user' THEN 'Could you confirm the exact workstation or chair number?'
    WHEN 'resolved' THEN 'The issue was handled. Please let us know if it returns.'
    WHEN 'closed' THEN 'The area was checked after the repair and the ticket is now closed.'
    WHEN 'rejected' THEN 'This request should be coordinated directly with the faculty office.'
  END,
  FALSE, DATE_ADD(ticket.created_at, INTERVAL 80 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id LIKE '40000000-0000-4000-8000-%'
  AND ticket.status <> 'open'
UNION ALL
SELECT UUID(), ticket.id, ticket.reporter_user_id,
  'It is the chair nearest the back window. Thank you.',
  FALSE, DATE_ADD(ticket.created_at, INTERVAL 140 MINUTE)
FROM maintenance_tickets ticket
WHERE ticket.public_id = '40000000-0000-4000-8000-000000000005';

-- Seed-owned audit rows make the administrator log useful immediately while
-- remaining safe to refresh independently of real audit history.
DELETE FROM audit_logs WHERE request_id = 'seed-demo';

INSERT INTO audit_logs (
  public_id, actor_user_id, action, resource_type, resource_public_id,
  outcome, summary, request_id, ip_hash, created_at
)
SELECT UUID(), customer.id, 'auth.login', 'user', customer.public_id,
  'success', 'Demo customer signed in', 'seed-demo', NULL,
  DATE_SUB(CURRENT_TIMESTAMP, INTERVAL (customer.id MOD 18) HOUR)
FROM users customer
WHERE customer.public_id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000011',
  '10000000-0000-4000-8000-000000000012',
  '10000000-0000-4000-8000-000000000013',
  '10000000-0000-4000-8000-000000000014',
  '10000000-0000-4000-8000-000000000015'
)
UNION ALL
SELECT UUID(), seeded_order.user_id, 'order.seed_demo', 'order',
  seeded_order.public_id, 'success',
  CONCAT('Demo order currently ', seeded_order.status), 'seed-demo', NULL,
  seeded_order.updated_at
FROM orders seeded_order
WHERE seeded_order.public_id LIKE '20000000-0000-4000-8000-%'
UNION ALL
SELECT UUID(), seeded_job.user_id, 'print.seed_demo', 'print_job',
  seeded_job.public_id, 'success',
  CONCAT('Demo print job currently ', seeded_job.status), 'seed-demo', NULL,
  seeded_job.updated_at
FROM print_jobs seeded_job
WHERE seeded_job.public_id LIKE '30000000-0000-4000-8000-%'
UNION ALL
SELECT UUID(), seeded_ticket.reporter_user_id, 'maintenance.seed_demo',
  'maintenance_ticket', seeded_ticket.public_id, 'success',
  CONCAT('Demo maintenance ticket currently ', seeded_ticket.status),
  'seed-demo', NULL, seeded_ticket.updated_at
FROM maintenance_tickets seeded_ticket
WHERE seeded_ticket.public_id LIKE '40000000-0000-4000-8000-%';

SET @seed_demo_orders = NULL;
SET @seed_demo_print_jobs = NULL;
SET @seed_demo_tickets = NULL;

