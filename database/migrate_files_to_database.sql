-- One-time migration for an existing LevGo database created with filesystem storage.
-- Run this as a MySQL administrator. The application tables must not contain
-- existing uploaded-file rows. The current development database was verified empty.

USE levgo;

ALTER TABLE product_images
  DROP INDEX uq_product_images_storage,
  DROP COLUMN storage_name,
  ADD COLUMN file_data MEDIUMBLOB NOT NULL AFTER size_bytes;

ALTER TABLE print_files
  DROP INDEX uq_print_files_storage,
  DROP COLUMN storage_name,
  ADD COLUMN file_data MEDIUMBLOB NOT NULL AFTER size_bytes;

ALTER TABLE maintenance_attachments
  DROP INDEX uq_maintenance_attachments_storage,
  DROP COLUMN storage_name,
  ADD COLUMN file_data MEDIUMBLOB NOT NULL AFTER size_bytes;
