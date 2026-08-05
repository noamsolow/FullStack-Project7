-- Run as a MySQL administrator after replacing the placeholder password.
-- Use a host other than localhost if the API runs on another machine.

CREATE USER IF NOT EXISTS 'levgo_app'@'localhost'
  IDENTIFIED BY 'maoz3242';

ALTER USER 'levgo_app'@'localhost'
  IDENTIFIED BY 'maoz3242';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON levgo.*
  TO 'levgo_app'@'localhost';

FLUSH PRIVILEGES;

