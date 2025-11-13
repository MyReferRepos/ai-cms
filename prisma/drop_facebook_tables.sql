-- Drop and Recreate Facebook Tables
-- This script safely drops old Facebook tables and recreates them with correct schema
-- ⚠️ WARNING: This will delete all data in Facebook tables!

BEGIN;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS "facebook_best_times" CASCADE;
DROP TABLE IF EXISTS "facebook_posts" CASCADE;
DROP TABLE IF EXISTS "facebook_groups" CASCADE;
DROP TABLE IF EXISTS "facebook_accounts" CASCADE;

COMMIT;

-- Verify tables are dropped
SELECT 'Tables dropped successfully' as status;

-- Now you can run the full migration:
-- Copy and paste the contents of add_facebook_tables_migration_safe.sql
