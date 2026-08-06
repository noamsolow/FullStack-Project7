-- Remove the obsolete aggregate campus locations 23 and 41.
-- Buildings 41A and 41B are intentionally preserved.

START TRANSACTION;

DELETE zone
FROM vendor_delivery_zones zone
JOIN buildings building ON building.id = zone.building_id
WHERE building.campus_code IN ('23', '41');

DELETE edge
FROM campus_route_edges edge
JOIN buildings building
  ON building.id = edge.from_building_id OR building.id = edge.to_building_id
WHERE building.campus_code IN ('23', '41');

DELETE image
FROM product_images image
JOIN products product ON product.id = image.product_id
JOIN vendors vendor ON vendor.id = product.vendor_id
JOIN buildings building ON building.id = vendor.building_id
WHERE building.campus_code IN ('23', '41');

DELETE product
FROM products product
JOIN vendors vendor ON vendor.id = product.vendor_id
JOIN buildings building ON building.id = vendor.building_id
WHERE building.campus_code IN ('23', '41');

DELETE vendor
FROM vendors vendor
JOIN buildings building ON building.id = vendor.building_id
WHERE building.campus_code IN ('23', '41');

DELETE FROM buildings
WHERE campus_code IN ('23', '41');

COMMIT;
