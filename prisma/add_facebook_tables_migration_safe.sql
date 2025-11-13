-- Facebook Tables Migration (Safe Version with Transaction)
-- This version wraps all operations in a transaction for atomicity
-- If any statement fails, all changes will be rolled back

BEGIN;

-- CreateTable
CREATE TABLE IF NOT EXISTS "facebook_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_name" TEXT NOT NULL,
    "page_access_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "facebook_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "group_description" TEXT,
    "member_count" INTEGER,
    "privacy" TEXT,
    "user_access_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_post_at" TIMESTAMP(3),
    "last_post_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "facebook_posts" (
    "id" TEXT NOT NULL,
    "post_id" TEXT,
    "facebook_account_id" TEXT,
    "facebook_group_id" TEXT,
    "facebook_post_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "link" TEXT,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "likes_count" INTEGER,
    "shares_count" INTEGER,
    "comments_count" INTEGER,
    "reach" INTEGER,
    "error_message" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "facebook_best_times" (
    "id" TEXT NOT NULL,
    "facebook_account_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "avg_engagement" DOUBLE PRECISION NOT NULL,
    "avg_reach" INTEGER NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "last_analyzed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_best_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_accounts_page_id_key" ON "facebook_accounts"("page_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_accounts_user_id_idx" ON "facebook_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_groups_group_id_key" ON "facebook_groups"("group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_groups_user_id_idx" ON "facebook_groups"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_groups_last_post_at_idx" ON "facebook_groups"("last_post_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_post_id_idx" ON "facebook_posts"("post_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_facebook_account_id_idx" ON "facebook_posts"("facebook_account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_facebook_group_id_idx" ON "facebook_posts"("facebook_group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_user_id_idx" ON "facebook_posts"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_status_idx" ON "facebook_posts"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_facebook_post_id_idx" ON "facebook_posts"("facebook_post_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_best_times_facebook_account_id_day_of_week_hour_key" ON "facebook_best_times"("facebook_account_id", "day_of_week", "hour");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_best_times_facebook_account_id_idx" ON "facebook_best_times"("facebook_account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_best_times_score_idx" ON "facebook_best_times"("score");

-- AddForeignKey (with error handling)
DO $$
BEGIN
    -- Check if foreign key already exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_accounts_user_id_fkey'
    ) THEN
        ALTER TABLE "facebook_accounts" ADD CONSTRAINT "facebook_accounts_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_groups_user_id_fkey'
    ) THEN
        ALTER TABLE "facebook_groups" ADD CONSTRAINT "facebook_groups_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_posts_post_id_fkey'
    ) THEN
        ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_post_id_fkey"
        FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_posts_facebook_account_id_fkey'
    ) THEN
        ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_facebook_account_id_fkey"
        FOREIGN KEY ("facebook_account_id") REFERENCES "facebook_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_posts_facebook_group_id_fkey'
    ) THEN
        ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_facebook_group_id_fkey"
        FOREIGN KEY ("facebook_group_id") REFERENCES "facebook_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_posts_user_id_fkey'
    ) THEN
        ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facebook_best_times_facebook_account_id_fkey'
    ) THEN
        ALTER TABLE "facebook_best_times" ADD CONSTRAINT "facebook_best_times_facebook_account_id_fkey"
        FOREIGN KEY ("facebook_account_id") REFERENCES "facebook_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;

-- Verification query
SELECT
    'facebook_accounts' as table_name,
    COUNT(*) as columns
FROM information_schema.columns
WHERE table_name = 'facebook_accounts'
UNION ALL
SELECT
    'facebook_groups',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'facebook_groups'
UNION ALL
SELECT
    'facebook_posts',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'facebook_posts'
UNION ALL
SELECT
    'facebook_best_times',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'facebook_best_times';
