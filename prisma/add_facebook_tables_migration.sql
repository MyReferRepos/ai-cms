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
    "privacy" TEXT NOT NULL,
    "member_count" INTEGER,
    "last_post_at" TIMESTAMP(3),
    "last_post_checked_at" TIMESTAMP(3),
    "user_access_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "facebook_posts" (
    "id" TEXT NOT NULL,
    "facebook_account_id" TEXT,
    "facebook_group_id" TEXT,
    "post_id" TEXT,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "image_url" TEXT,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CREATE INDEX IF NOT EXISTS "facebook_posts_facebook_account_id_idx" ON "facebook_posts"("facebook_account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_facebook_group_id_idx" ON "facebook_posts"("facebook_group_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_posts_user_id_idx" ON "facebook_posts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_best_times_facebook_account_id_day_of_week_hour_key" ON "facebook_best_times"("facebook_account_id", "day_of_week", "hour");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "facebook_best_times_facebook_account_id_idx" ON "facebook_best_times"("facebook_account_id");

-- AddForeignKey
ALTER TABLE "facebook_accounts" ADD CONSTRAINT "facebook_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_groups" ADD CONSTRAINT "facebook_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_facebook_account_id_fkey" FOREIGN KEY ("facebook_account_id") REFERENCES "facebook_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_facebook_group_id_fkey" FOREIGN KEY ("facebook_group_id") REFERENCES "facebook_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_posts" ADD CONSTRAINT "facebook_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_best_times" ADD CONSTRAINT "facebook_best_times_facebook_account_id_fkey" FOREIGN KEY ("facebook_account_id") REFERENCES "facebook_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
