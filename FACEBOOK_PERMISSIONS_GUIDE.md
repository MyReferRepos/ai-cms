# Facebook Permissions Configuration Guide

## 权限错误说明

如果你看到这个错误：
```
Invalid Scopes: pages_read_engagement, pages_manage_posts, pages_manage_engagement,
read_insights, groups_access_member_info, publish_to_groups
```

这是正常的！这些是**高级权限**，在开发模式下需要特殊配置或审核。

## 权限分类

### ✅ 基础权限（无需审核，开发模式可用）

当前系统使用的基础权限：

```typescript
email                       // 用户邮箱
public_profile             // 用户公开资料
pages_show_list            // 查看页面列表
pages_read_user_content    // 读取页面内容
```

**功能支持：**
- ✅ OAuth 登录
- ✅ 查看已管理的 Facebook 页面列表
- ✅ 连接 Facebook 页面到系统
- ❌ 发布帖子（需要高级权限）
- ❌ 查看分析数据（需要高级权限）
- ❌ 管理群组（需要高级权限）

### ⚠️ 高级权限（需要审核）

以下权限需要 Facebook 应用审核：

```typescript
// 发布相关
pages_manage_posts         // 创建、编辑、删除帖子
pages_manage_engagement    // 管理评论、反应

// 分析相关
pages_read_engagement      // 读取互动数据（已弃用，使用 pages_read_user_content）
read_insights              // 读取页面洞察数据

// 群组相关
groups_access_member_info  // 访问群组成员信息
publish_to_groups          // 发布到群组
```

## 开发阶段配置

### 阶段 1：基础连接测试（当前阶段）

**权限配置：**
```typescript
// app/api/facebook/auth-url/route.ts
const scope = [
  'email',
  'public_profile',
  'pages_show_list',
  'pages_read_user_content',
].join(',')
```

**可以做什么：**
- ✅ 连接 Facebook OAuth
- ✅ 查看页面列表
- ✅ 选择要管理的页面
- ✅ 测试 OAuth 流程

**不能做什么：**
- ❌ 发布帖子到 Facebook
- ❌ 查看帖子分析数据
- ❌ 管理群组

### 阶段 2：完整功能（需要审核）

**申请步骤：**

1. **完成应用基础信息**
   - App Icon (1024x1024)
   - Privacy Policy URL
   - Terms of Service URL
   - App Description

2. **申请权限审核**
   - 进入 Facebook App Dashboard
   - App Review → Permissions and Features
   - 申请以下权限：
     - `pages_manage_posts`
     - `pages_read_engagement` 或 `pages_read_user_content`
     - `read_insights`
     - `publish_to_groups`
     - `groups_access_member_info`

3. **提供审核材料**
   - 录制使用视频演示
   - 说明为什么需要这些权限
   - 提供测试账号

4. **等待审核**
   - 通常需要 3-7 个工作日
   - 可能需要补充材料

5. **审核通过后更新代码**
   ```typescript
   const scope = [
     'email',
     'public_profile',
     'pages_show_list',
     'pages_read_user_content',
     'pages_manage_posts',        // 新增
     'read_insights',             // 新增
     'publish_to_groups',         // 新增
     'groups_access_member_info', // 新增
   ].join(',')
   ```

## 临时解决方案：使用测试用户

在申请权限审核期间，你可以使用测试用户：

### 创建测试用户

1. Facebook App Dashboard → Roles → Test Users
2. 点击 "Add" 创建测试用户
3. 勾选 "Automatically install and grant permissions"
4. 选择所有需要的权限

### 测试用户的优势

```
✅ 可以使用所有权限（无需审核）
✅ 可以创建测试页面和群组
✅ 完全隔离的测试环境
✅ 不影响真实 Facebook 账号
```

### 使用测试用户

1. 复制测试用户的登录信息
2. 在新的浏览器隐身窗口登录 Facebook
3. 使用测试账号访问你的应用
4. 测试完整的 OAuth 和发布流程

## 权限对照表

| 功能 | 基础权限 | 高级权限 | 需要审核 |
|------|---------|---------|---------|
| 查看页面列表 | `pages_show_list` | - | ❌ |
| 读取页面内容 | `pages_read_user_content` | - | ❌ |
| 发布帖子 | - | `pages_manage_posts` | ✅ |
| 管理评论 | - | `pages_manage_engagement` | ✅ |
| 查看分析数据 | - | `read_insights` | ✅ |
| 访问群组 | - | `groups_access_member_info` | ✅ |
| 发布到群组 | - | `publish_to_groups` | ✅ |

## 常见问题

### Q: 为什么我的权限请求被拒绝？

A: 常见原因：
- 缺少隐私政策 URL
- 应用描述不清楚
- 没有提供使用视频
- 请求的权限超出应用功能需求

### Q: 开发模式下可以测试发布功能吗？

A: 可以！使用以下方法之一：
1. 使用测试用户（推荐）
2. 将你的个人账号添加为应用开发者
3. 使用 Facebook 提供的测试页面

### Q: 审核需要多长时间？

A: 通常 3-7 个工作日，复杂的应用可能需要更长时间。

### Q: 审核被拒绝怎么办？

A:
1. 仔细阅读拒绝原因
2. 修改应用说明和视频
3. 补充缺失的材料
4. 重新提交审核

## 推荐开发流程

### 阶段 1：基础测试（当前）

```bash
✅ 使用基础权限
✅ 测试 OAuth 流程
✅ 验证页面连接功能
✅ 完善应用功能和 UI
```

### 阶段 2：功能开发

```bash
✅ 创建测试用户
✅ 在测试环境测试完整功能
✅ 开发发布、分析等高级功能
✅ 准备审核材料
```

### 阶段 3：申请审核

```bash
✅ 准备隐私政策和服务条款
✅ 录制功能演示视频
✅ 提交权限审核申请
✅ 等待审核结果
```

### 阶段 4：上线

```bash
✅ 审核通过后更新权限配置
✅ 切换到 Live 模式
✅ 测试真实用户场景
✅ 正式上线
```

## 当前状态

你的应用现在使用**基础权限**，可以：
- ✅ 正常完成 OAuth 授权
- ✅ 连接 Facebook 页面
- ✅ 查看页面信息

如需发布功能，请按照本文档申请高级权限或使用测试用户测试。

## 更新权限配置

如果审核通过，在 `app/api/facebook/auth-url/route.ts` 中更新：

```typescript
const scope = [
  'email',
  'public_profile',
  'pages_show_list',
  'pages_read_user_content',
  'pages_manage_posts',        // 审核通过后添加
  'read_insights',             // 审核通过后添加
  'publish_to_groups',         // 审核通过后添加
  'groups_access_member_info', // 审核通过后添加
].join(',')
```

然后部署更新。
