# 🔒 安全检查清单

本文档帮助你确认 Supabase Storage 配置的安全性。

## ✅ 必须完成的安全检查

### 1. 环境变量安全 ⭐⭐⭐⭐⭐

- [ ] **`.env` 文件在 `.gitignore` 中**
  ```bash
  # 检查命令
  grep -E "\.env" .gitignore

  # 应该看到：
  # .env*.local
  # .env
  ```

- [ ] **没有提交密钥到 Git**
  ```bash
  # 检查 git 历史中是否有密钥
  git log --all --full-history --source -- .env

  # 应该返回空（或只有 .env.example）
  ```

- [ ] **Vercel 环境变量已设置**
  - 进入 Vercel 项目 → Settings → Environment Variables
  - 确认 `SUPABASE_SERVICE_ROLE_KEY` 存在
  - **不要**在 Vercel 构建日志中打印此变量

### 2. 代码安全检查 ⭐⭐⭐⭐

- [ ] **service_role key 仅在服务端使用**
  ```bash
  # 检查客户端代码中是否有 service_role
  grep -r "SUPABASE_SERVICE_ROLE_KEY" components/ app/

  # 应该返回空！只能在 lib/ 和 app/api/ 中使用
  ```

- [ ] **没有在客户端代码中硬编码密钥**
  ```bash
  # 检查是否有硬编码的密钥
  grep -r "eyJhbGciOiJIUzI1NiIs" .

  # 应该只在 .env 中出现
  ```

- [ ] **API 路由有权限验证**
  - 打开 `app/api/media/route.ts`
  - 确认有 `getServerSession(authOptions)` 检查
  - 确认有角色验证：`['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)`

### 3. Supabase 配置检查 ⭐⭐⭐

- [ ] **Bucket 设置为 Public**
  - Supabase Dashboard → Storage → `cms-media`
  - 确认 "Public" 开关是 **ON**

- [ ] **RLS 策略已配置**
  - Supabase Dashboard → Storage → `cms-media` → Policies
  - 至少有一个 "Public read access" 策略

- [ ] **项目 RLS 启用**
  - Supabase Dashboard → Settings → API
  - 确认 "Row Level Security" 是启用状态

### 4. 生产环境检查 ⭐⭐⭐⭐

- [ ] **Vercel 环境变量作用域正确**
  - Production: ✅ 勾选
  - Preview: ✅ 勾选（可选）
  - Development: ❌ 不勾选（使用本地 .env）

- [ ] **没有在 README 或文档中暴露真实密钥**
  ```bash
  # 检查文档中是否有真实密钥
  grep -r "eyJhbGciOiJIUzI1NiIs" docs/ README.md

  # 应该只有示例，不是真实密钥
  ```

---

## 🛡️ 高级安全措施（推荐）

### 5. 密钥轮换 ⭐⭐⭐

- [ ] **定期轮换 service_role key**（建议每 90 天）
  1. Supabase Dashboard → Settings → API
  2. 点击 "Generate new key" 旁的 **⋯**
  3. 选择 "Generate new key"
  4. 更新 Vercel 环境变量
  5. 重新部署

### 6. 访问日志监控 ⭐⭐

- [ ] **启用 Supabase 日志**
  - Supabase Dashboard → Logs
  - 监控异常的上传/删除活动

- [ ] **设置使用量告警**
  - Supabase Dashboard → Settings → Billing
  - 设置存储和带宽告警

### 7. 网络安全 ⭐⭐⭐

- [ ] **使用 HTTPS**
  - 确认 Vercel 自动启用 HTTPS
  - 检查 `NEXT_PUBLIC_SUPABASE_URL` 使用 `https://`

- [ ] **配置 Content Security Policy (可选)**
  - 在 `next.config.js` 中添加 CSP 头
  - 限制可以加载资源的域名

---

## 🚨 安全事件响应计划

### 如果密钥泄露了怎么办？

**立即执行（5分钟内）**：

1. **生成新的 JWT secret**
   ```bash
   # Supabase Dashboard → Settings → API
   # 点击 "Reset JWT secret"
   ```

2. **重新生成 service_role key**
   - 在 Supabase Dashboard 生成新 key
   - 立即更新 Vercel 环境变量

3. **检查异常活动**
   ```bash
   # 查看 Supabase Logs
   # 检查是否有未授权的上传/删除
   ```

4. **通知团队**
   - 告知所有开发者密钥已轮换
   - 更新本地 `.env` 文件

**后续措施（1小时内）**：

5. **审计所有文件**
   - 检查 Storage 中是否有可疑文件
   - 删除未授权上传的内容

6. **审查访问日志**
   - Supabase Dashboard → Logs
   - 查找泄露来源

7. **加强措施**
   - 审查代码，确保没有其他泄露点
   - 考虑添加额外的访问控制

---

## ✅ 快速安全检查脚本

创建这个脚本并定期运行：

```bash
#!/bin/bash
# security-check.sh

echo "🔒 Security Checklist for AI CMS"
echo "================================"

# Check 1: .env in .gitignore
echo -n "1. .env in .gitignore: "
if grep -q "\.env" .gitignore; then
    echo "✅ PASS"
else
    echo "❌ FAIL - Add .env to .gitignore!"
fi

# Check 2: No service_role in client code
echo -n "2. No service_role in client code: "
if grep -r "SUPABASE_SERVICE_ROLE_KEY" components/ app/ 2>/dev/null | grep -v "api/" | grep -q .; then
    echo "❌ FAIL - service_role found in client code!"
else
    echo "✅ PASS"
fi

# Check 3: API routes have auth
echo -n "3. API routes have auth: "
if grep -q "getServerSession" app/api/media/route.ts; then
    echo "✅ PASS"
else
    echo "⚠️  WARNING - Check auth in API routes"
fi

# Check 4: No hardcoded keys
echo -n "4. No hardcoded keys: "
if grep -r "eyJhbGciOiJIUzI1NiIs" --exclude-dir=node_modules --exclude=".env*" . | grep -v ".env.example" | grep -q .; then
    echo "❌ FAIL - Hardcoded key found!"
else
    echo "✅ PASS"
fi

echo ""
echo "Security check complete!"
```

运行方法：
```bash
chmod +x security-check.sh
./security-check.sh
```

---

## 📚 相关资源

- [Supabase 安全最佳实践](https://supabase.com/docs/guides/platform/going-into-prod)
- [NextAuth 安全指南](https://next-auth.js.org/security/overview)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 总结

**使用 service_role key 是安全的，只要**：
1. ✅ 只在服务端使用
2. ✅ 存储在环境变量中
3. ✅ 不提交到 Git
4. ✅ 有应用层权限验证
5. ✅ 定期轮换密钥

**你的架构已经满足所有条件**，可以安心使用！🎉
