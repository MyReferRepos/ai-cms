#!/bin/bash
# Facebook OAuth 配置验证脚本

echo "=== Facebook OAuth 配置诊断 ==="
echo ""

# 1. 检查环境变量
echo "1. 检查 Vercel 环境变量："
echo "   访问: https://vercel.com/你的项目/settings/environment-variables"
echo "   确认 NEXTAUTH_URL 设置正确"
echo ""

# 2. 获取实际回调 URL
echo "2. 获取实际回调 URL："
echo "   访问: https://你的域名.vercel.app/api/facebook/auth-url"
echo "   查看返回的 redirect_uri 值"
echo ""

# 3. Facebook 配置检查
echo "3. Facebook Login 配置检查："
echo "   ✓ 进入 Facebook App Dashboard"
echo "   ✓ Products → Facebook Login → Settings"
echo "   ✓ Client OAuth Login: YES"
echo "   ✓ Web OAuth Login: YES"
echo "   ✓ Valid OAuth Redirect URIs 包含完整 URL"
echo "   ✓ 点击 Save Changes"
echo ""

# 4. 测试工具
echo "4. 使用 Facebook 测试工具："
echo "   在 Facebook Login → Settings 底部"
echo "   找到 'Redirect URI to check'"
echo "   粘贴你的回调 URL 并点击 Check"
echo "   必须显示: ✅ This redirect URI is whitelisted"
echo ""

# 5. 清除缓存
echo "5. 清除缓存："
echo "   - 等待 2-3 分钟让 Facebook 同步配置"
echo "   - 使用浏览器无痕模式测试"
echo "   - 清除浏览器所有 Cookie"
echo ""

# 6. 常见错误
echo "6. 检查常见错误："
echo "   ❌ URL 末尾有空格"
echo "   ❌ 使用了 http 而不是 https"
echo "   ❌ 拼写错误（facebok vs facebook）"
echo "   ❌ 遗漏了路径（只有域名）"
echo "   ❌ 配置了但忘记保存"
echo ""

echo "=== 完成检查后重新测试 ==="
