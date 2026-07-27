USE levgo;

INSERT INTO buildings
  (campus_code, name, short_name, description, delivery_hint)
VALUES
  ('1', 'Beit Midrash Hechal Victoria and Canada Hall', 'Canada Hall', 'Brause Educational Center and Judaic Library.', 'Meet at the main Canada Hall entrance.'),
  ('12', 'Sohacheski Student Center and Glickman Dining Hall', 'Student Center', 'Main student center and dining hall.', 'Meet beside the Samson Gate entrance.'),
  ('13', 'Beren Preparatory Studies and Fitness Center', 'Fitness Center', 'Preparatory studies and campus fitness facilities.', 'Meet at the ground-floor reception.'),
  ('22', 'Low Applied Physics and Wohl Electro-optics Center', 'Low / Wohl', 'Applied physics, electro-optics, and auditorium.', 'Meet outside the main auditorium lobby.'),
  ('23', 'Editha and Heinz E. Samson Academic Center', 'Samson Academic', 'Central academic building.', 'Meet at the main lobby desk.'),
  ('24', 'Hochstein School of Industrial Management', 'Hochstein', 'Industrial management and nano-micro instrumentation.', 'Meet at the building entrance.'),
  ('26', 'Weiler School of Applied Sciences', 'Weiler Applied Sciences', 'Applied sciences and Myer Lewis Technological Library.', 'Meet near the technological library entrance.'),
  ('27', 'Wexler Amphitheater and Schuman Entrepreneurship Center', 'Wexler / Schuman', 'Campus amphitheater and entrepreneurship center.', 'Meet at the entrepreneurship center entrance.'),
  ('36', 'Beren Torah and Science Institute', 'Beren Institute', 'Torah and Science, Nursing, and Communications Engineering.', 'Meet at the central entrance.'),
  ('37', 'Offner-Jachzel Administration Building', 'Administration', 'Campus administration and conference rooms.', 'Meet at reception.'),
  ('41', 'Amaraggi and Glickman Dormitory Pavilions', 'Dormitories 41', 'On-campus student housing.', 'Meet outside the pavilion gate; include a room/building note.'),
  ('42', 'Meyer Rothstein Dormitory Pavilion', 'Dormitory 42', 'On-campus student housing.', 'Meet outside the pavilion gate; include a room note.'),
  ('43', 'Israel Henry Beren Dormitory Pavilion', 'Dormitory 43', 'On-campus student housing.', 'Meet outside the pavilion gate; include a room note.'),
  ('44', 'Harry and Abe Sherman Dormitory', 'Dormitory 44', 'On-campus student housing.', 'Meet outside the pavilion gate; include a room note.'),
  ('45', 'Brause Residence Hall', 'Residence Hall 45', 'On-campus residence hall.', 'Meet outside the hall entrance; include a room note.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  short_name = VALUES(short_name),
  description = VALUES(description),
  delivery_hint = VALUES(delivery_hint),
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
SELECT UUID(), b.id, 'Glickman Kitchen', 'glickman-kitchen', 'food_court',
  'Fresh campus meals, bowls, sandwiches, and drinks from the student center.',
  'kitchen@example.jct.ac.il', TRUE, TRUE, TRUE, 0, 10, 25
FROM buildings b WHERE b.campus_code = '12'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Lev Campus Store', 'lev-campus-store', 'campus_shop',
  'Stationery, study tools, technology accessories, and dorm essentials.',
  'store@example.jct.ac.il', TRUE, TRUE, TRUE, 0, 8, 18
FROM buildings b WHERE b.campus_code = '12'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Samson Smart Vend', 'samson-smart-vend', 'vending_machine',
  'Fast drinks, snacks, and study basics from a connected vending point.',
  'vend@example.jct.ac.il', TRUE, FALSE, TRUE, 0, 1, 5
FROM buildings b WHERE b.campus_code = '23'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO vendors (
  public_id, building_id, name, slug, vendor_type, description,
  contact_email, pickup_enabled, delivery_enabled, is_open,
  min_pickup_order_agorot, estimated_min_minutes, estimated_max_minutes
)
SELECT UUID(), b.id, 'Lev Print Lab', 'lev-print-lab', 'print_center',
  'Private reviewed printing for class notes, assignments, and presentations.',
  'print@example.jct.ac.il', TRUE, FALSE, TRUE, 0, 20, 60
FROM buildings b WHERE b.campus_code = '26'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'GK-BOWL-01', 'Jerusalem Grain Bowl',
  'Roasted vegetables, herbed grains, tahini, and a fresh chopped salad.',
  'meal', 3200, NULL, JSON_ARRAY('vegetarian', 'dairy_free'), 'Contains sesame.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'glickman-kitchen'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'GK-TOAST-01', 'Campus Toast',
  'Toasted bread with cheese, tomato, and olives, served with vegetables.',
  'meal', 2600, NULL, JSON_ARRAY('vegetarian', 'dairy'), 'Contains gluten and milk.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'glickman-kitchen'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'GK-WRAP-01', 'Chicken Study Wrap',
  'Grilled chicken, vegetables, pickles, and tahini in a soft wrap.',
  'meal', 3600, NULL, JSON_ARRAY('meat', 'dairy_free'), 'Contains gluten and sesame.'
FROM vendors v JOIN categories c ON c.slug = 'meals'
WHERE v.slug = 'glickman-kitchen'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'GK-COFFEE-01', 'Cold Brew',
  'Smooth chilled coffee for a long study session.',
  'drink', 1200, 30, JSON_ARRAY('vegetarian'), NULL
FROM vendors v JOIN categories c ON c.slug = 'drinks'
WHERE v.slug = 'glickman-kitchen'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'LS-PEN-01', 'Smooth Gel Pen Set',
  'Four quick-dry black and blue gel pens.',
  'study', 1600, 50, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'stationery'
WHERE v.slug = 'lev-campus-store'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'LS-NOTE-01', 'Engineering Grid Notebook',
  'A4 grid notebook with 120 perforated pages.',
  'study', 2400, 35, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'paper-notebooks'
WHERE v.slug = 'lev-campus-store'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'LS-USB-01', '32 GB USB Drive',
  'Compact USB drive for assignments, presentations, and lab files.',
  'technology', 3900, 20, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'technology'
WHERE v.slug = 'lev-campus-store'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'LS-CABLE-01', 'USB-C Charging Cable',
  'Durable one-meter charging and data cable.',
  'technology', 2900, 24, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'technology'
WHERE v.slug = 'lev-campus-store'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'LS-CARE-01', 'Campus Care Kit',
  'Pocket tissues, hand gel, and adhesive bandages.',
  'personal', 2200, 18, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'personal-care'
WHERE v.slug = 'lev-campus-store'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'SV-WATER-01', 'Mineral Water',
  'Cold 500 ml mineral water.',
  'drink', 600, 40, JSON_ARRAY('vegan'), NULL
FROM vendors v JOIN categories c ON c.slug = 'drinks'
WHERE v.slug = 'samson-smart-vend'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'SV-BAR-01', 'Date & Nut Energy Bar',
  'A compact snack for the gap between lectures.',
  'snack', 900, 26, JSON_ARRAY('vegan', 'dairy_free'), 'Contains tree nuts.'
FROM vendors v JOIN categories c ON c.slug = 'snacks'
WHERE v.slug = 'samson-smart-vend'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO products (
  public_id, vendor_id, category_id, sku, name, description, need_type,
  price_agorot, stock_quantity, dietary_tags, allergen_text
)
SELECT UUID(), v.id, c.id, 'SV-PEN-01', 'Emergency Pen Duo',
  'Two reliable blue pens when class is about to start.',
  'study', 800, 20, JSON_ARRAY(), NULL
FROM vendors v JOIN categories c ON c.slug = 'stationery'
WHERE v.slug = 'samson-smart-vend'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_agorot = VALUES(price_agorot);

INSERT INTO vendor_delivery_zones (
  vendor_id, building_id, fee_agorot, minimum_order_agorot,
  eta_min_minutes, eta_max_minutes, is_active
)
SELECT v.id, b.id,
  CASE WHEN b.campus_code IN ('1', '12', '13') THEN 600 ELSE 900 END,
  2500, 15, 35, TRUE
FROM vendors v
CROSS JOIN buildings b
WHERE v.slug = 'glickman-kitchen' AND b.is_active = TRUE
ON DUPLICATE KEY UPDATE
  fee_agorot = VALUES(fee_agorot),
  minimum_order_agorot = VALUES(minimum_order_agorot),
  is_active = TRUE;

INSERT INTO vendor_delivery_zones (
  vendor_id, building_id, fee_agorot, minimum_order_agorot,
  eta_min_minutes, eta_max_minutes, is_active
)
SELECT v.id, b.id,
  CASE WHEN b.campus_code IN ('1', '12', '13') THEN 500 ELSE 800 END,
  2000, 12, 30, TRUE
FROM vendors v
CROSS JOIN buildings b
WHERE v.slug = 'lev-campus-store' AND b.is_active = TRUE
ON DUPLICATE KEY UPDATE
  fee_agorot = VALUES(fee_agorot),
  minimum_order_agorot = VALUES(minimum_order_agorot),
  is_active = TRUE;

