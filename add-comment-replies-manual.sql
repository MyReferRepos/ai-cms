-- ================================================
-- 手动迁移脚本：添加评论回复功能
-- 可以直接在 Supabase SQL Editor 中执行
-- ================================================

-- 1. 添加 parentId 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Comment' AND column_name = 'parentId'
    ) THEN
        ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT;
        RAISE NOTICE '✓ 已添加 parentId 列';
    ELSE
        RAISE NOTICE '✓ parentId 列已存在，跳过';
    END IF;
END $$;

-- 2. 添加外键约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Comment_parentId_fkey'
    ) THEN
        ALTER TABLE "Comment"
        ADD CONSTRAINT "Comment_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "Comment"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已添加外键约束';
    ELSE
        RAISE NOTICE '✓ 外键约束已存在，跳过';
    END IF;
END $$;

-- 3. 添加索引（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'Comment_parentId_idx'
    ) THEN
        CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
        RAISE NOTICE '✓ 已添加 parentId 索引';
    ELSE
        RAISE NOTICE '✓ parentId 索引已存在，跳过';
    END IF;
END $$;

-- 4. 验证迁移结果
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Comment' AND column_name = 'parentId')
        THEN '✅ parentId 列存在'
        ELSE '❌ parentId 列不存在'
    END as column_check,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Comment_parentId_fkey')
        THEN '✅ 外键约束存在'
        ELSE '❌ 外键约束不存在'
    END as fkey_check,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Comment_parentId_idx')
        THEN '✅ 索引存在'
        ELSE '❌ 索引不存在'
    END as index_check;

-- ================================================
-- 迁移完成！
-- ================================================
