-- Change existing JCT accounts to the current Google Workspace campus domain.
-- The users.email unique constraint makes the migration fail atomically if a
-- conflicting @g.jct.ac.il account already exists, instead of merging users.

START TRANSACTION;

UPDATE users
SET email = CONCAT(SUBSTRING_INDEX(email, '@', 1), '@g.jct.ac.il')
WHERE email LIKE '%@jct.ac.il';

COMMIT;
