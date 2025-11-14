# Facebook OAuth 配置检查清单

## 问题：URL blocked - redirect URI not whitelisted

### 第1步：确认 Facebook Login 产品已启用

进入 Facebook App Dashboard：
- [ ] 左侧菜单中有 "Facebook Login"
- [ ] 如果没有，点击 "Add Product" 添加 "Facebook Login"

### 第2步：检查 Facebook Login 设置

进入 **Facebook Login → Settings**：

#### Client OAuth Settings (必须启用)
- [ ] Client OAuth Login: **YES** (开启)
- [ ] Web OAuth Login: **YES** (开启)

#### Valid OAuth Redirect URIs (添加完整 URL)
- [ ] 已添加：`https://your-app.vercel.app/admin/facebook/callback`
- [ ] 本地测试：`http://localhost:3000/admin/facebook/callback`
- [ ] 点击了 **Save Changes** 按钮

### 第3步：检查 App Domains

进入 **Settings → Basic**：

- [ ] App Domains: `your-app.vercel.app` (不含 https://)

### 第4步：验证 URL

使用 Facebook 提供的测试工具（在 Facebook Login → Settings 底部）：

**Redirect URI to check:**
```
https://your-app.vercel.app/admin/facebook/callback
```
- [ ] 点击 "Check"
- [ ] 结果显示：✅ This redirect URI is whitelisted

### 第5步：检查环境变量

在 Vercel 项目设置中：

- [ ] `NEXTAUTH_URL=https://your-app.vercel.app`
- [ ] `FACEBOOK_APP_ID=你的App ID`
- [ ] `FACEBOOK_APP_SECRET=你的App Secret`

### 第6步：检查实际回调 URL

访问：`https://your-app.vercel.app/api/facebook/auth-url`

从返回的 JSON 中找到 `redirect_uri` 参数，确认它与 Facebook 配置的完全一致。

### 第7步：清除缓存并测试

- [ ] 清除浏览器缓存
- [ ] 或使用无痕模式
- [ ] 重新尝试连接 Facebook

---

## 常见错误

### 错误 1：忘记保存
**症状**：配置了 URL 但测试失败
**解决**：点击 "Save Changes" 按钮

### 错误 2：Client OAuth Login 未启用
**症状**：提示 "Client OAuth Login" 未开启
**解决**：在 Facebook Login Settings 中启用

### 错误 3：URL 不完整
**症状**：只添加了域名
**解决**：必须包含完整路径 `/admin/facebook/callback`

### 错误 4：协议错误
**症状**：使用了 http 而不是 https
**解决**：Vercel 部署默认是 https，确保使用 https://

### 错误 5：多余的斜杠
**症状**：URL 末尾有多余的 /
**解决**：移除末尾斜杠，保持 `.../callback` 格式

---

## 截图示例

### Facebook Login → Settings 应该看起来像这样：

```
┌─────────────────────────────────────────────────┐
│ Client OAuth Settings                           │
│                                                 │
│ Client OAuth Login:  ● YES  ○ NO              │
│ Web OAuth Login:     ● YES  ○ NO              │
│                                                 │
├─────────────────────────────────────────────────┤
│ Valid OAuth Redirect URIs                      │
│                                                 │
│ https://your-app.vercel.app/admin/facebook/callback │
│ http://localhost:3000/admin/facebook/callback  │
│                                                 │
│ [Save Changes]                                  │
└─────────────────────────────────────────────────┘
```

---

## 仍然失败？

如果完成所有步骤后仍然失败，请提供：

1. 你的 Vercel 应用域名（去掉 https://）
2. Facebook App ID（不是 Secret）
3. 从 `https://your-app.vercel.app/api/facebook/auth-url` 返回的完整 `redirect_uri` 值
4. "Redirect URI to check" 工具的测试结果截图
