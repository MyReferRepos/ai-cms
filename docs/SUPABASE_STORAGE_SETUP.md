# Supabase Storage Setup Guide

本指南将帮助你配置 Supabase Storage 用于媒体文件管理。

## 为什么选择 Supabase Storage？

如果你已经在使用 Supabase 作为数据库，使用 Supabase Storage 是最佳选择：

- ✅ **免费额度充足**: 1GB 存储 + 2GB 带宽/月
- ✅ **同一平台管理**: 数据库和存储在同一个项目中
- ✅ **自动优化**: 内置图像转换和 CDN
- ✅ **简单配置**: 只需 3 个环境变量
- ✅ **适合 Vercel**: 完美支持 serverless 部署

---

## 📋 前提条件

1. 已有 Supabase 项目（或创建新项目）
2. Supabase 项目已启用 Storage 功能

---

## 🚀 快速配置步骤

### 第 1 步：创建 Storage Bucket

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 左侧菜单 → **Storage**
4. 点击 **New bucket** 按钮
5. 配置 bucket：
   ```
   Name: cms-media
   Public bucket: ✅ 勾选（允许公开访问文件）
   File size limit: 10MB（可选，根据需要调整）
   Allowed MIME types: 留空（允许所有类型）
   ```
6. 点击 **Create bucket**

### 第 2 步：配置 Bucket 策略（重要！）

为了让上传的文件可以公开访问，需要设置正确的 RLS 策略：

1. 在 Storage 页面，找到刚创建的 `cms-media` bucket
2. 点击 bucket 名称旁的 **⋮** 菜单
3. 选择 **Policies**
4. 点击 **New Policy**

**创建读取策略（Public Read）：**
```sql
-- Policy Name: Public read access
-- Operation: SELECT
-- Target roles: public

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cms-media');
```

**创建上传策略（Authenticated Upload）：**
```sql
-- Policy Name: Authenticated users can upload
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cms-media');
```

**创建删除策略（Authenticated Delete）：**
```sql
-- Policy Name: Authenticated users can delete
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cms-media');
```

或者，使用 **Quick Policy Template**：
1. 选择 **Policy Templates**
2. 选择 **Allow public read access**
3. 选择 bucket: `cms-media`
4. 点击 **Review**
5. 点击 **Save policy**

### 第 3 步：获取 API 密钥

1. 左侧菜单 → **Settings** (齿轮图标)
2. 选择 **API**
3. 找到以下信息：

**Project URL:**
```
https://your-project-id.supabase.co
```

**API Keys - service_role (secret):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **关于 service_role key 的安全说明**：

**为什么使用 service_role key？**
- 上传是在**服务端 API** 完成的（不是客户端）
- 需要在服务端使用 Sharp 库进行图像优化和缩略图生成
- 权限验证由 **NextAuth** 在应用层完成（已验证用户角色）

**这样使用是安全的吗？**
✅ **是的，只要遵循以下规则**：
1. ✅ **仅在服务端使用**：密钥存储在环境变量中，不暴露给客户端
2. ✅ **不提交到 Git**：`.env` 已在 `.gitignore` 中
3. ✅ **Vercel 加密存储**：在 Vercel 环境变量中安全存储
4. ✅ **应用层权限控制**：NextAuth 已验证 ADMIN/EDITOR/AUTHOR 角色

**Supabase 的警告主要针对**：
- ❌ 在客户端 JavaScript 中使用 service_role key
- ❌ 提交到公开的 Git 仓库
- ❌ 没有应用层的权限验证

**你的架构是安全的**：
```
用户 → NextAuth 验证 → API (/api/media) → Supabase Storage
         ✅ 权限检查          ✅ service_role       ✅ 上传
```

**业界标准**：在服务端 API 中使用 service_role key 进行操作是**常见且被接受的做法**，前提是有严格的应用层权限控制（你已经有了）。

### 第 4 步：配置环境变量

在你的 `.env` 文件中添加（**本地开发**）：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_STORAGE_BUCKET="cms-media"
```

在 **Vercel** 中配置（**生产环境**）：

1. 打开 Vercel 项目
2. 进入 **Settings** → **Environment Variables**
3. 添加以下变量：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...（你的 service_role key）` |
| `SUPABASE_STORAGE_BUCKET` | `cms-media` |

4. 点击 **Save**
5. 重新部署项目

---

## ✅ 验证配置

### 本地测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 登录 CMS 后台：`http://localhost:3000/admin`

3. 进入 **Media Library**

4. 上传测试图片

5. 检查上传结果：
   - ✅ 文件成功上传
   - ✅ 显示缩略图
   - ✅ URL 格式：`https://your-project.supabase.co/storage/v1/object/public/cms-media/media/...`

6. 在 Supabase Dashboard → Storage → `cms-media` 中查看文件

### 在 Vercel 上测试

1. 部署到 Vercel 后访问你的域名
2. 重复上述上传测试
3. 确认文件可以正常上传和访问

---

## 🔧 常见问题排查

### 问题 1: 上传返回 "Storage is not configured" 错误

**原因**：环境变量未设置或设置错误

**解决方案**：
1. 检查 `.env` 文件中的变量名是否正确
2. 确认 `NEXT_PUBLIC_SUPABASE_URL` 以 `NEXT_PUBLIC_` 开头
3. 重启开发服务器：`npm run dev`
4. 在 Vercel 中，重新部署项目

### 问题 2: 上传成功但无法访问文件（403 Forbidden）

**原因**：Bucket 不是 public 或 RLS 策略未设置

**解决方案**：
1. 确认 bucket 设置为 **Public**
2. 检查 RLS 策略是否正确配置
3. 或在 Supabase Dashboard → Storage → `cms-media` → Settings 中启用 **Public access**

### 问题 3: 删除文件失败

**原因**：缺少删除权限的 RLS 策略

**解决方案**：
添加删除策略（见第 2 步）

### 问题 4: 图片上传后不显示

**原因**：可能是 CORS 配置问题

**解决方案**：
Supabase Storage 默认已配置 CORS，但如果有问题：
1. 联系 Supabase 支持
2. 或在 Supabase Dashboard → Storage → Settings 中检查 CORS 设置

---

## 💰 费用和限制

### Supabase 免费版限制

| 项目 | 免费额度 | 超出后 |
|------|---------|--------|
| **存储空间** | 1 GB | $0.021/GB/月 |
| **带宽** | 2 GB/月 | $0.09/GB |
| **API 请求** | 无限制 | 无限制 |

### 成本优化建议

1. **启用图像优化**：CMS 已自动使用 Sharp 库压缩图片
2. **设置缩略图**：系统自动生成缩略图，减少大图加载
3. **定期清理**：删除不再使用的文件
4. **监控使用量**：在 Supabase Dashboard → Settings → Usage 查看用量

---

## 🔄 从 S3 迁移到 Supabase

如果你之前使用 S3 存储，迁移很简单：

1. **配置 Supabase 环境变量**（见第 4 步）
2. **移除或注释掉 S3 环境变量**：
   ```env
   # 注释掉这些变量
   # S3_ACCESS_KEY_ID="..."
   # S3_SECRET_ACCESS_KEY="..."
   # S3_BUCKET_NAME="..."
   ```
3. **重新部署应用**

系统会自动检测并使用 Supabase Storage！

### 迁移现有文件（可选）

如果需要迁移 S3 中的现有文件：

1. 从 S3 下载所有文件
2. 在 Supabase Dashboard → Storage → `cms-media` 中手动上传
3. 或使用 Supabase CLI 批量上传：
   ```bash
   supabase storage cp ./local-files/* supabase://cms-media/media/
   ```

---

## 🌟 高级功能

### 自定义文件变换（可选）

Supabase Storage 支持实时图像变换：

```
https://your-project.supabase.co/storage/v1/render/image/public/cms-media/media/image.jpg?width=300&height=200
```

参数：
- `width`: 宽度
- `height`: 高度
- `resize`: `contain` | `cover` | `fill`
- `quality`: 1-100

### CDN 加速

Supabase Storage 已默认使用 Cloudflare CDN，无需额外配置。

---

## 📚 相关链接

- [Supabase Storage 官方文档](https://supabase.com/docs/guides/storage)
- [Supabase RLS 策略文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage API 参考](https://supabase.com/docs/reference/javascript/storage)

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [常见问题排查](#常见问题排查) 部分
2. 检查 Supabase Dashboard 中的日志
3. 查看浏览器控制台错误信息
4. 联系 Supabase 支持：https://supabase.com/support

---

**推荐配置**：如果你已经在使用 Supabase 数据库，强烈推荐使用 Supabase Storage，配置简单且免费额度充足！
