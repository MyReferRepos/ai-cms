# Facebook Feature Database Migration Guide

## Problem
The new Facebook management features require several database tables that don't exist yet in your database.

## Solution - Choose ONE of the following methods:

### Method 1: Using Prisma Migrate (Recommended)

This is the easiest and safest method if you have your database credentials.

```bash
# Make sure your .env file has DATABASE_URL set
# Then run:
npx prisma migrate deploy
```

If you haven't set up migrations before, you may need to initialize:

```bash
npx prisma migrate dev --name add_facebook_tables
```

### Method 2: Manual SQL Execution

If you prefer to run SQL directly or if you're using a managed database service:

⚠️ **Risks**:
- May cause constraint errors if executed multiple times
- Prisma won't track this migration
- Partial execution possible if errors occur

✅ **Recommended**: Use the safe version with transaction:

1. Connect to your PostgreSQL database using your preferred client (psql, pgAdmin, Supabase Dashboard, etc.)

2. Execute the **SAFE** SQL file (with transaction):
   ```bash
   psql $DATABASE_URL -f prisma/add_facebook_tables_migration_safe.sql
   ```

   Or copy and paste the contents of `prisma/add_facebook_tables_migration_safe.sql` into your database client.

   The safe version:
   - ✅ Wraps everything in a transaction (auto-rollback on error)
   - ✅ Checks if constraints exist before adding
   - ✅ Includes verification query at the end
   - ✅ Can be safely re-run

### Method 3: Using Supabase Dashboard (Recommended for Supabase users)

If you're using Supabase - **This is the safest and easiest method**:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `prisma/add_facebook_tables_migration_safe.sql`
5. Paste and run the query
6. Check the results - you should see a verification table showing:
   - facebook_accounts (11 columns)
   - facebook_groups (11 columns)
   - facebook_posts (13 columns)
   - facebook_best_times (9 columns)
7. Verify tables were created in the **Table Editor**

✅ **Advantages**:
- Supabase automatically wraps queries in transactions
- Visual feedback on success/failure
- Can easily rollback if needed
- No command-line tools required

## Tables Created

The migration will create 4 new tables:

1. **facebook_accounts** - Stores connected Facebook pages
2. **facebook_groups** - Stores connected Facebook groups
3. **facebook_posts** - Tracks published posts to Facebook
4. **facebook_best_times** - Caches analytics for best posting times

## Verification

After running the migration, verify the tables exist:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'facebook%';
```

You should see:
- facebook_accounts
- facebook_best_times
- facebook_groups
- facebook_posts

## Next Steps

After successfully running the migration:

1. Configure Facebook app credentials in your `.env` file:
   ```env
   FACEBOOK_APP_ID="your-facebook-app-id"
   FACEBOOK_APP_SECRET="your-facebook-app-secret"
   ```

2. Restart your application server

3. Navigate to `/admin/facebook` to start using the Facebook management features

## Troubleshooting

### Error: relation "users" does not exist
This means your base database setup hasn't been completed. Run:
```bash
npx prisma migrate deploy
```

### Error: permission denied
Make sure your database user has CREATE TABLE permissions.

### Error: DATABASE_URL not found
Create a `.env` file in the root directory with your database connection string:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Rollback (if needed)

If you need to remove the Facebook tables:

```sql
DROP TABLE IF EXISTS facebook_best_times CASCADE;
DROP TABLE IF EXISTS facebook_posts CASCADE;
DROP TABLE IF EXISTS facebook_groups CASCADE;
DROP TABLE IF EXISTS facebook_accounts CASCADE;
```

⚠️ **Warning**: This will delete all Facebook-related data!
