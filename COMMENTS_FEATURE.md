# 评论功能和反垃圾保护

本文档说明如何使用新增的评论功能和反垃圾评论保护机制。

## 功能概述

### 已实现的功能

1. **评论API** - 完整的CRUD操作
   - POST `/api/comments` - 创建评论（带反垃圾保护）
   - GET `/api/comments?postId=xxx` - 获取评论列表
   - GET `/api/comments/[id]` - 获取单个评论
   - PATCH `/api/comments/[id]` - 更新评论（审核）
   - DELETE `/api/comments/[id]` - 删除评论

2. **评论管理界面** (`/admin/comments`)
   - 查看待审核评论
   - 批准/拒绝评论
   - 删除评论
   - 评论统计（待审核、已批准、总数）

3. **反垃圾评论保护** (`lib/anti-spam.ts`)
   - 速率限制（Rate Limiting）
   - Honeypot字段验证
   - 时间戳验证（防止表单重放攻击）
   - 内容验证（链接数量、重复字符、垃圾关键词等）
   - IP封禁机制

4. **前端评论组件** (`components/comments/comment-section.tsx`)
   - 评论展示
   - 评论提交表单
   - 反垃圾字段集成

## API 使用指南

### 1. 创建评论

```typescript
POST /api/comments
Content-Type: application/json

{
  "postId": "post_id_here",
  "content": "这是一条评论",
  "timestamp": 1699999999999,  // 可选：表单生成时间
  "honeypot": ""                // 可选：反垃圾字段（应为空）
}
```

**响应：**

```json
{
  "comment": {
    "id": "comment_id",
    "content": "这是一条评论",
    "approved": false,
    "createdAt": "2025-11-16T...",
    "author": { ... }
  },
  "message": "Comment submitted and pending approval"
}
```

**错误响应：**

```json
// 速率限制
{
  "error": "Comment rejected",
  "reason": "Rate limit exceeded",
  "retryAfter": 45
}

// 垃圾评论
{
  "error": "Comment rejected",
  "reason": "Too many links in comment"
}
```

### 2. 获取评论列表

```typescript
GET /api/comments?postId=xxx&includeUnapproved=false
```

**参数：**
- `postId` - 文章ID（可选，不提供则获取所有评论）
- `includeUnapproved` - 是否包含未审核的评论（需要管理员权限）

**响应：**

```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "评论内容",
      "approved": true,
      "createdAt": "2025-11-16T...",
      "author": {
        "id": "user_id",
        "name": "用户名",
        "image": "avatar_url"
      },
      "post": {
        "id": "post_id",
        "title": "文章标题",
        "slug": "post-slug"
      }
    }
  ],
  "total": 10
}
```

### 3. 审核评论

```typescript
PATCH /api/comments/[id]
Content-Type: application/json

{
  "approved": true  // 或 false
}
```

**权限要求：** ADMIN 或 EDITOR

### 4. 删除评论

```typescript
DELETE /api/comments/[id]
```

**权限要求：** ADMIN、EDITOR 或评论作者

## 反垃圾保护机制

### 1. 速率限制（Rate Limiting）

**配置：** `lib/anti-spam.ts` 中的 `RATE_LIMIT_CONFIG`

```typescript
{
  WINDOW_MS: 60 * 1000,        // 时间窗口：1分钟
  MAX_REQUESTS: 3,              // 1分钟内最多3条评论
  STRICT_WINDOW_MS: 10 * 1000, // 严格模式：10秒
  STRICT_MAX_REQUESTS: 1,       // 10秒内最多1条
  BLOCK_DURATION_MS: 3600000,   // IP封禁时长：1小时
  VIOLATIONS_TO_BLOCK: 5        // 5次违规后封禁
}
```

**特性：**
- 基于 IP + 用户ID 的组合标识
- 双层限制：普通模式（1分钟3次）+ 严格模式（10秒1次）
- 自动清理过期记录
- 违规累计到5次自动封禁IP

### 2. Honeypot 字段

在评论表单中添加隐藏字段：

```html
<input
  type="text"
  name="website"
  value={honeypot}
  onChange={(e) => setHoneypot(e.target.value)}
  style={{ display: 'none' }}
  tabIndex={-1}
  autoComplete="off"
/>
```

- 正常用户看不到此字段
- 机器人会自动填充
- API检测到非空值即拒绝

### 3. 时间戳验证

```typescript
{
  "timestamp": Date.now()  // 表单生成时的时间戳
}
```

**验证规则：**
- 提交时间 < 3秒：拒绝（太快，可能是机器人）
- 提交时间 > 1小时：拒绝（表单过期）

### 4. 内容验证

**检查项目：**

1. **长度限制**
   - 最小：2字符
   - 最大：5000字符

2. **链接数量**
   - 最多3个链接
   - 超过则拒绝

3. **重复字符**
   - 检测超过10个连续相同字符
   - 例：`aaaaaaaaaaaaa`

4. **大写字母比例**
   - 长度>20且大写字母>70%
   - 垃圾评论常见特征

5. **垃圾关键词**
   - viagra, casino, poker, lottery
   - click here, buy now, limited offer
   - 100% free, make money fast
   - 等...

## 使用评论组件

### 在文章页面中集成

```tsx
import CommentSection from '@/components/comments/comment-section';

export default function PostPage({ post }) {
  return (
    <div>
      {/* 文章内容 */}
      <article>
        <h1>{post.title}</h1>
        <div>{post.content}</div>
      </article>

      {/* 评论区 */}
      <CommentSection postId={post.id} />
    </div>
  );
}
```

## 管理评论

### 访问管理界面

1. 登录管理后台
2. 导航到 **Comments** 菜单（仅 ADMIN/EDITOR 可见）
3. 查看待审核评论

### 审核流程

1. **待审核** (Pending)
   - 所有新评论默认状态
   - 管理员评论自动批准

2. **批准** (Approved)
   - 点击 "Approve" 按钮
   - 评论将显示在前端

3. **拒绝** (Reject)
   - 已批准的评论可以取消批准
   - 变回待审核状态

4. **删除** (Delete)
   - 永久删除评论
   - 不可恢复

## 数据库结构

```sql
CREATE TABLE "comments" (
    "id" TEXT PRIMARY KEY,
    "content" TEXT NOT NULL,
    "approved" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE,
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "comments_postId_idx" ON "comments"("postId");
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");
```

## 权限矩阵

| 操作 | ADMIN | EDITOR | AUTHOR | VIEWER | 匿名用户 |
|------|-------|--------|--------|--------|----------|
| 创建评论（已发布文章） | ✓ | ✓ | ✓ | ✓ | ✗ |
| 查看已批准评论 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 查看未批准评论 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 批准/拒绝评论 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑自己的评论 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 删除自己的评论 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 删除他人的评论 | ✓ | ✓ | ✗ | ✗ | ✗ |

## 安全注意事项

1. **XSS 防护**
   - 评论内容在前端使用 `whitespace-pre-wrap` 显示
   - 不直接渲染HTML
   - 考虑添加内容过滤库（如 DOMPurify）

2. **速率限制**
   - 当前使用内存存储
   - 生产环境建议使用 Redis
   - 防止服务器重启后限制丢失

3. **IP 获取**
   - 支持多种代理头（X-Forwarded-For, X-Real-IP, CF-Connecting-IP）
   - 注意验证代理头的可信度

4. **审核机制**
   - 默认所有评论需要审核
   - 管理员评论自动批准
   - 避免垃圾内容直接显示

## 测试建议

### 1. 功能测试

```bash
# 创建评论
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "postId": "post_id",
    "content": "测试评论",
    "timestamp": 1699999999999
  }'

# 获取评论
curl http://localhost:3000/api/comments?postId=post_id

# 审核评论
curl -X PATCH http://localhost:3000/api/comments/comment_id \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"approved": true}'
```

### 2. 反垃圾测试

```bash
# 测试速率限制（连续提交）
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/comments \
    -H "Content-Type: application/json" \
    -H "Cookie: ..." \
    -d '{"postId":"xxx","content":"Test '$i'"}'
  echo ""
done

# 测试Honeypot
curl -X POST http://localhost:3000/api/comments \
  -d '{"postId":"xxx","content":"Test","honeypot":"filled"}'

# 测试垃圾关键词
curl -X POST http://localhost:3000/api/comments \
  -d '{"postId":"xxx","content":"Click here to buy viagra"}'
```

## 未来改进建议

1. **嵌套回复**
   - 添加 `parentId` 字段支持评论回复
   - 实现评论树结构

2. **邮件通知**
   - 新评论通知作者
   - 回复通知评论者

3. **高级反垃圾**
   - 集成 Akismet API
   - 机器学习垃圾分类

4. **评论点赞**
   - 用户可以给评论点赞
   - 按热度排序

5. **Markdown 支持**
   - 允许评论使用简单的Markdown
   - 预览功能

6. **评论导出**
   - 导出为CSV/JSON
   - 数据备份

## 故障排查

### 问题：评论提交后提示 429 错误

**原因：** 触发速率限制

**解决：**
- 等待指定的 `retryAfter` 秒数
- 调整 `RATE_LIMIT_CONFIG` 配置
- 检查是否有多个用户共享同一IP

### 问题：评论提交后提示 "Spam detected"

**原因：** 触发反垃圾检测

**可能的触发点：**
1. Honeypot 字段非空
2. 时间戳无效（提交太快或表单过期）
3. 内容包含过多链接
4. 内容包含垃圾关键词

**解决：**
- 检查评论内容
- 确保 honeypot 字段为空
- 表单生成后等待至少3秒再提交

### 问题：无法访问 /admin/comments

**原因：** 权限不足

**解决：**
- 确保用户角色为 ADMIN 或 EDITOR
- 检查数据库中的用户角色

## 技术栈

- **后端：** Next.js 14 App Router、Prisma ORM
- **数据库：** PostgreSQL (Supabase)
- **认证：** NextAuth.js
- **验证：** Zod
- **UI：** React、Tailwind CSS

## 相关文件

```
lib/
  anti-spam.ts              # 反垃圾工具库

app/api/comments/
  route.ts                  # 评论列表和创建
  [id]/route.ts            # 评论详情、更新、删除

app/admin/comments/
  page.tsx                  # 评论管理页面

components/
  admin/
    admin-nav.tsx           # 导航菜单（已添加Comments链接）
    comments-table.tsx      # 评论表格组件
  comments/
    comment-section.tsx     # 前端评论组件

prisma/
  schema.prisma            # 数据库模型（Comment）
```

## 联系与支持

如有问题或建议，请联系开发团队。
